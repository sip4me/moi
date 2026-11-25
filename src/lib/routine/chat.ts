/**
 * Moi chat: sends the conversation and what Moi knows to the moi-chat function (Claude), and turns its
 * answer into chat messages with tap-to-answer questions and product cards.
 */
import { ensureUser, supabase } from '../supabase';
import { answered, type Question } from './questions';
import { labToHex } from './color';
import { analyze, tailoredBeauty } from './gaps';
import { lookTargets } from './looks';
import { allSteps, BEAUTY_ROUTINES, getCatalog, hasInfo, type Item, type RoutineState } from './model';

export type MoiCard =
  | { source: 'moi'; why: string; step?: string | null; shadeMatch?: string | null; item: Item }
  | { source: 'web'; why: string; step?: string | null; shadeMatch?: string | null; brand: string; name: string; url: string; category: string | null; shade_hex: string | null; amazon?: boolean; official?: boolean };
export type ChatMsg = { id: string; role: 'user' | 'moi'; text: string; ask?: Question | null; cards?: MoiCard[]; local?: 'area' | 'photo'; photo?: string };
export type ChatResult = { ok: true; text: string; ask: Question | null; cards: MoiCard[]; save: { key: string; value: string }[]; left: number } | { ok: false; why: 'limit' | 'off' | 'error'; limit?: number };

/** A database row as one of Moi's products. */
export const rowToItem = (r: any): Item => ({
  kind: 'product', id: r.id, code: r.code ?? null, brand: r.brand, name: r.name, category: r.step_cat, tags: r.tags ?? [], price: r.price_usd, asin: r.asin ?? null,
  ...(r.lab_l != null ? { lab: [r.lab_l, r.lab_a, r.lab_b] as [number, number, number], shadeName: r.shade_name, shadeConf: r.shade_conf ?? 0.5 } : {}), finish: r.finish ?? undefined,
} as Item);

/**
 * What Moi tells Claude about the person: answers, what they already own, and the steps the look they want
 * still needs (with the shade and finish that look calls for). No personal details.
 */
export function chatContext(s: RoutineState) {
  const owned = allSteps(s).filter(x => x.step.item);
  const have = new Set(owned.map(x => x.step.item!.category));
  // The look's colours and finishes, per product type.
  const targets = Object.fromEntries(Object.entries(lookTargets(s)).map(([c, t]) => [c, { shade_hex: labToHex(t.lab), ...(t.finish ? { finish: t.finish } : {}) }]));
  // Steps their routine type (and chosen looks) call for that they don't own yet.
  const keys = BEAUTY_ROUTINES.filter(r => (s.areas ?? []).includes(r.area)).map(r => r.key);
  const fromLook = keys.flatMap(k => tailoredBeauty(s, k)).filter(st => st.hint && !have.has(st.hint)).map(st => ({ step: st.label, category: st.hint, ...(targets[st.hint] ?? {}) }));
  let fromGaps: { step: string; category: string }[] = [];
  try { if (hasInfo(s)) fromGaps = analyze(s, getCatalog()).gaps.filter(g => g.kind === 'step').flatMap(g => g.fills.filter(c => !have.has(c)).slice(0, 1).map(c => ({ step: g.title, category: c, ...(targets[c] ?? {}) }))); } catch { /* catalogue not loaded yet */ }
  const seen = new Set<string>();
  const missing = [...fromLook, ...fromGaps].filter(m => (seen.has(m.category) ? false : (seen.add(m.category), true))).slice(0, 10);
  return {
    areas: s.areas ?? [],
    answered: answered(s),
    look: s.lookRead ? { name: s.lookRead.name, summary: s.lookRead.summary } : s.lookText ?? null,
    owned: owned.slice(0, 24).map(x => `${x.step.label}: ${x.step.item!.brand} ${x.step.item!.name}`),
    missing,
    look_targets: targets,
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
  const cards: MoiCard[] = (data.cards ?? []).map((c: any) => (c.source === 'moi' ? { source: 'moi', why: c.why, step: c.step, shadeMatch: c.shade_match, item: rowToItem(c.product) } : { ...c, shadeMatch: c.shade_match }));
  return { ok: true, text: data.text ?? '', ask: data.ask ?? null, cards, save: data.save ?? [], left: data.left ?? 0 };
}
