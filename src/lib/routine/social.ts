/**
 * Shared routines: a person's routine page (usemoi.com/u/<handle>), following other people's routines,
 * trending routines, and Moi's own curated routines.
 * A page shares only the routine itself (look, steps, product names and shades), never email or answers.
 */
import { ensureUser, supabase } from '../supabase';
import { allSteps, BEAUTY_ROUTINES, type RoutineState } from './model';

export type SharedStep = { label: string; brand: string; name: string; category: string; id?: string; code?: string | null; asin?: string | null; lab?: [number, number, number] };
export type Snapshot = { look?: { name: string; summary?: string }; areas: string[]; groups: { where: string; steps: SharedStep[] }[] };
export type Page = { user_id: string; handle: string; name: string | null; bio: string | null; is_public: boolean; routine: Snapshot; followers?: number; week?: number };

export const HANDLE_RE = /^[a-z0-9_]{3,20}$/;
export const pageUrl = (handle: string) => `https://usemoi.com/u/${handle}`;

/** Share a link: the phone's share sheet where there is one, otherwise copy it. */
export async function shareLink(url: string, title: string): Promise<'shared' | 'copied' | 'closed' | 'failed'> {
  try {
    const nav: any = typeof navigator !== 'undefined' ? navigator : null;
    if (nav?.share) { await nav.share({ title: 'Moi', text: title, url }); return 'shared'; }
    if (nav?.clipboard) { await nav.clipboard.writeText(`${title} ${url}`); return 'copied'; }
    return 'failed';
  } catch (e: any) { return e?.name === 'AbortError' ? 'closed' : 'failed'; }
}

/** A link name from a display name or email: lowercase letters, numbers and underscores. */
export const suggestHandle = (from?: string | null) => {
  const base = (from ?? '').split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 16);
  return base.length >= 3 ? base : '';
};

const WHERE: Record<string, string> = Object.fromEntries(BEAUTY_ROUTINES.map(r => [r.key, `${r.area === 'makeup' ? 'Makeup' : r.area === 'skin' ? 'Skin' : 'Body'} · ${r.label}`]));

/** The routine as it is now, with products only (skipped and empty steps left out). */
export function snapshot(s: RoutineState): Snapshot {
  const groups: Snapshot['groups'] = [];
  for (const { where, step } of allSteps(s)) {
    const i = step.item;
    if (!i || step.skipped) continue;
    const w = WHERE[where] ?? where;
    let g = groups.find(x => x.where === w);
    if (!g) { g = { where: w, steps: [] }; groups.push(g); }
    g.steps.push({ label: step.label, brand: i.brand, name: i.name, category: i.category, id: i.id, code: i.code ?? null, asin: i.asin ?? null, lab: (i as { lab?: [number, number, number] }).lab });
  }
  return { look: s.lookRead ? { name: s.lookRead.name, summary: s.lookRead.summary } : undefined, areas: s.areas ?? [], groups };
}

export const stepCount = (r?: Snapshot) => (r?.groups ?? []).reduce((a, g) => a + g.steps.length, 0);

// Share copy, in Moi's voice: whose routine, its style or category, and how many picks.
const AREA_WORDS: Record<string, [string, string]> = {
  makeup: ['makeup', '💄'], skin: ['skincare', '🧴'], hair: ['hair', '💇‍♀️'], body: ['bath & body', '🛁'], fragrance: ['fragrance', '🌸'],
};
/** e.g. "Sipara’s 90s brown lip makeup routine 💄✨ Peek at my 7 picks on Moi". No em dashes, short and sweet. */
export function shareText(name: string | null | undefined, r: Snapshot | undefined, mine: boolean): string {
  const who = name?.trim() ? `${name.trim().split(/\s+/)[0]}’s` : mine ? 'My' : 'A';
  const areas = (r?.areas ?? []).filter(a => AREA_WORDS[a]);
  const [word, emoji] = AREA_WORDS[areas[0]] ?? ['beauty', '💖'];
  const raw = r?.look?.name?.trim().replace(/\s*(look|routine)$/i, '');
  const style = raw ? raw[0].toLowerCase() + raw.slice(1) : raw;
  const what = `${style ? `${style} ` : ''}${style && style.toLowerCase().includes(word) ? '' : `${word} `}routine`;
  const n = stepCount(r);
  const tail = n ? (mine ? `Peek at my ${n} pick${n === 1 ? '' : 's'} on Moi` : `${n} pick${n === 1 ? '' : 's'} to try on Moi`) : (mine ? 'Come build yours with me on Moi' : 'Take a peek on Moi');
  return `${who} ${what} ${emoji}✨ ${tail}`;
}

export async function myPage(): Promise<Page | null> {
  const sb = supabase(); if (!sb) return null;
  const uid = await ensureUser(); if (!uid) return null;
  const { data } = await sb.from('routine_pages').select('*').eq('user_id', uid).maybeSingle();
  return (data as Page) ?? null;
}

export async function savePage(p: { handle: string; name?: string; bio?: string; is_public: boolean }, s: RoutineState): Promise<{ ok: true } | { ok: false; why: string }> {
  const sb = supabase(); if (!sb) return { ok: false, why: 'Sharing isn’t available right now.' };
  const uid = await ensureUser(); if (!uid) return { ok: false, why: 'Sign in first.' };
  const handle = p.handle.trim().toLowerCase();
  if (!HANDLE_RE.test(handle)) return { ok: false, why: 'Use 3 to 20 letters, numbers or underscores.' };
  const { error } = await sb.from('routine_pages').upsert({ user_id: uid, handle, name: p.name?.trim().slice(0, 40) || null, bio: p.bio?.trim().slice(0, 140) || null, is_public: p.is_public, routine: snapshot(s), updated_at: new Date().toISOString() });
  if (error) return { ok: false, why: /duplicate|unique/i.test(error.message) ? 'That name is taken. Try another.' : /row-level|policy/i.test(error.message) ? 'Create your account first to share your routine.' : 'Couldn’t save. Try again.' };
  return { ok: true };
}

export async function getPage(handle: string): Promise<Page | null> {
  const sb = supabase(); if (!sb) return null;
  const { data } = await sb.from('routine_pages').select('user_id,handle,name,bio,is_public,routine').eq('handle', handle.toLowerCase()).maybeSingle();
  if (!data) return null;
  const { data: st } = await sb.rpc('routine_stats', { p_owners: [data.user_id] });
  const row = (st as { followers: number; week: number }[] | null)?.[0];
  return { ...(data as Page), followers: Number(row?.followers ?? 0), week: Number(row?.week ?? 0) };
}

export async function following(): Promise<Page[]> {
  const sb = supabase(); if (!sb) return [];
  const uid = await ensureUser(); if (!uid) return [];
  const { data } = await sb.from('routine_follows').select('owner, routine_pages(user_id,handle,name,bio,is_public,routine)').eq('follower', uid).order('created_at', { ascending: false });
  return ((data ?? []) as unknown as { routine_pages: Page | null }[]).map(r => r.routine_pages).filter((p): p is Page => !!p && p.is_public);
}

export async function isFollowing(owner: string): Promise<boolean> {
  const sb = supabase(); if (!sb) return false;
  const uid = await ensureUser(); if (!uid) return false;
  const { data } = await sb.from('routine_follows').select('owner').eq('follower', uid).eq('owner', owner).maybeSingle();
  return !!data;
}

export async function setFollow(owner: string, on: boolean): Promise<boolean> {
  const sb = supabase(); if (!sb) return false;
  const uid = await ensureUser(); if (!uid || uid === owner) return false;
  const { error } = on ? await sb.from('routine_follows').insert({ follower: uid, owner }) : await sb.from('routine_follows').delete().eq('follower', uid).eq('owner', owner);
  return !error || /duplicate/i.test(error.message);
}

export async function trending(limit = 20): Promise<Page[]> {
  const sb = supabase(); if (!sb) return [];
  const { data } = await sb.rpc('trending_routines', { p_limit: limit });
  return ((data ?? []) as Page[]).map(p => ({ ...p, is_public: true, followers: Number(p.followers ?? 0), week: Number(p.week ?? 0) }));
}

/** Moi's own routines: trending looks, built from Moi's database for whoever opens them. */
export const MOI_ROUTINES: { key: string; name: string; blurb: string; text: string; prefs: Record<string, string[]> }[] = [
  { key: 'clean', name: 'Clean girl', blurb: 'Skin first, brushed brows, a glossy lip.', text: 'clean girl makeup, glossy lip', prefs: { mk_face_look: ['Skin first'], mk_eye_look: ['Barely there'], mk_lip_look: ['Glossy'] } },
  { key: '90s', name: '90s brown lip', blurb: 'Brown liner, clear gloss, bronzed cheeks.', text: '90s brown lip liner with clear gloss and bronzer', prefs: { mk_face_look: ['Toasty'], mk_eye_look: ['Smudged kohl'], mk_lip_look: ['Lip contour'] } },
  { key: 'siren', name: 'Siren eyes', blurb: 'Lifted liner, soft sculpt, a blurred lip.', text: 'siren eyes with a blurred lip', prefs: { mk_face_look: ['Soft sculpt'], mk_eye_look: ['Siren eyes'], mk_lip_look: ['Blurred lip'] } },
  { key: 'cloud', name: 'Cloud skin', blurb: 'Soft-matte skin and a petal flush.', text: 'cloud skin, soft matte, blurred lip', prefs: { mk_face_look: ['Cloud skin'], mk_eye_look: ['Barely there'], mk_lip_look: ['Blurred lip'] } },
  { key: 'red', name: 'Classic red lip', blurb: 'A true red, a micro wing, fresh skin.', text: 'classic red lip with a micro wing', prefs: { mk_face_look: ['Skin first'], mk_eye_look: ['Micro wing'], mk_lip_look: ['Bold lip'] } },
  { key: 'glam', name: 'Soft metallic glam', blurb: 'Shimmer lids, sculpted glow, gloss.', text: 'full glam with soft metallic eyes and gloss', prefs: { mk_face_look: ['Full glam'], mk_eye_look: ['Soft metallic'], mk_lip_look: ['Glossy'] } },
];
