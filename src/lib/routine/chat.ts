/**
 * Moi chat: sends the conversation and what Moi knows to the moi-chat function (Claude), and turns its
 * answer into chat messages with tap-to-answer questions and product cards.
 */
import { ensureUser, supabase } from '../supabase';
import { answered, type Question } from './questions';
import { allSteps, type Item, type RoutineState } from './model';

export type MoiCard =
  | { source: 'moi'; why: string; step?: string | null; item: Item }
  | { source: 'web'; why: string; step?: string | null; brand: string; name: string; url: string; category: string | null; shade_hex: string | null; amazon?: boolean };
export type ChatMsg = { id: string; role: 'user' | 'moi'; text: string; ask?: Question | null; cards?: MoiCard[]; local?: 'area' | 'photo'; photo?: string };
export type ChatResult = { ok: true; text: string; ask: Question | null; cards: MoiCard[]; save: { key: string; value: string }[]; left: number } | { ok: false; why: 'limit' | 'off' | 'error'; limit?: number };

/** A database row as one of Moi's products. */
export const rowToItem = (r: any): Item => ({
  kind: 'product', id: r.id, code: r.code ?? null, brand: r.brand, name: r.name, category: r.step_cat, tags: r.tags ?? [], price: r.price_usd, asin: r.asin ?? null,
  ...(r.lab_l != null ? { lab: [r.lab_l, r.lab_a, r.lab_b] as [number, number, number], shadeName: r.shade_name, shadeConf: r.shade_conf ?? 0.5 } : {}), finish: r.finish ?? undefined,
} as Item);

/** What Moi tells Claude about the person: answers, routine areas, budget and what they already use. No personal details. */
export function chatContext(s: RoutineState) {
  return {
    areas: s.areas ?? [],
    answered: answered(s),
    look: s.lookRead?.name ?? s.lookText ?? null,
    owned: allSteps(s).filter(x => x.step.item).slice(0, 24).map(x => `${x.step.label}: ${x.step.item!.brand} ${x.step.item!.name}`),
  };
}

export async function sendChat(history: { role: 'user' | 'assistant'; text: string }[], s: RoutineState, image?: string | null): Promise<ChatResult> {
  const sb = supabase();
  if (!sb) return { ok: false, why: 'off' };
  await ensureUser();
  const { data, error } = await sb.functions.invoke<any>('moi-chat', { body: { history, context: chatContext(s), ...(image ? { image } : {}) } });
  if (error || !data) return { ok: false, why: 'error' };
  if (data.configured === false) return { ok: false, why: 'off' };
  if (data.limited) return { ok: false, why: 'limit', limit: data.limit };
  if (data.error) return { ok: false, why: 'error' };
  const cards: MoiCard[] = (data.cards ?? []).map((c: any) => (c.source === 'moi' ? { source: 'moi', why: c.why, step: c.step, item: rowToItem(c.product) } : c));
  return { ok: true, text: data.text ?? '', ask: data.ask ?? null, cards, save: data.save ?? [], left: data.left ?? 0 };
}
