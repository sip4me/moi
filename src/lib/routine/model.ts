import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from '../supabase';

// ── Types ─────────────────────────────────────────────────────────────────────
export type Item = {
  kind: 'product' | 'tool' | 'custom';
  id?: string;
  brand: string;
  name: string;
  category: string; // product step category or tool kind
  tags: string[];
  price?: number | null;
  /** Barcode (UPC/EAN), so store links land on this exact product. */
  code?: string | null;
  hairTypes?: string[];
  /** Ingredient label, when we have one. Used to match the tracker plan's look-for and avoid groups. */
  ingredients?: string;
  /** rules.json ingredient groups found in the label, computed in the database (kb_ing_groups). */
  ingGroups?: string[];
  /** Moi Routine goals this product serves, tagged in the database (kb_goal_tags). */
  goals?: string[];
  /** Set when the person logs it themselves. Only these get a checkmark. */
  addedAt?: number;
};
export type Step = { id: string; label: string; hint: string; item?: Item; when?: string; skipped?: boolean };
export type Hair = { texture?: string; strands?: string; heat?: string; treated?: string; budget?: string; scalp?: string };
export type RoutineState = {
  mode: 'check' | 'new';
  goals: string[];
  hair: Hair;
  washDays: number[];
  wash: Step[];
  every: Step[];
  occasions: string[];
  occ: Record<string, Step[]>;
  bag: string[]; // item keys: p:<id> / t:<id>
  qty?: Record<string, number>; // how many of each bag item (default 1)
  built: boolean; // a "new" routine has been generated
  welcomed?: boolean; // has seen the Moi welcome screen
  menuSeen?: boolean; // has opened the menu once (stops the tap hint)
  started?: boolean; // tapped Continue on the start page
  v?: number; // saved-state version
  /** Routines the person has submitted: 'wash', 'every', 'occ:<name>'. Editing one reopens it. */
  submitted?: Record<string, boolean>;
  /** Test build only (Stripe not switched on): the plan tapped on the paywall, unlocking access on this device. */
  testUnlock?: string;
  /** True once the person has saved (made an account or has a plan). Until then nothing survives a refresh. */
  saved?: boolean;
  /** Which routines the person wants: hair, skin, makeup, body. */
  areas: Area[];
  /** Answers to the skin, makeup and body questions, by question key (single answers are one-item lists). */
  prefs: Record<string, string[]>;
  /** Skin, makeup and body routines, by routine key (see BEAUTY_ROUTINES). */
  beauty: Record<string, Step[]>;
};

export type Area = 'hair' | 'skin' | 'makeup' | 'body';
export const AREAS: { key: Area; label: string; icon: string }[] = [
  { key: 'hair', label: 'Hair', icon: 'style_curls' },
  { key: 'skin', label: 'Skin', icon: 'drop' },
  { key: 'makeup', label: 'Makeup', icon: 'mirror' },
  { key: 'body', label: 'Body', icon: 'care_shower' },
];
/** Quick questions per area. `max` > 1 allows several answers. */
export const AREA_Q: { area: Area; key: string; label: string; options: string[]; max?: number }[] = [
  { area: 'skin', key: 'skin_type', label: 'Skin type', options: ['Dry', 'Normal', 'Oily', 'Combination', 'Sensitive'] },
  { area: 'skin', key: 'skin_concerns', label: 'Concerns · up to 3', options: ['Breakouts', 'Dark spots', 'Fine lines', 'Redness', 'Dullness', 'Large pores', 'Dehydration'], max: 3 },
  { area: 'skin', key: 'skin_flags', label: 'Avoid', options: ['Nothing', 'Fragrance', 'Retinoids (pregnant or nursing)'], max: 2 },
  { area: 'makeup', key: 'mk_tone', label: 'Skin tone', options: ['Fair', 'Light', 'Medium', 'Tan', 'Deep', 'Rich'] },
  { area: 'makeup', key: 'mk_undertone', label: 'Undertone', options: ['Cool', 'Warm', 'Neutral', 'Olive', 'Not sure'] },
  { area: 'makeup', key: 'mk_coverage', label: 'Coverage', options: ['Sheer', 'Medium', 'Full'] },
  { area: 'makeup', key: 'mk_finish', label: 'Finish', options: ['Matte', 'Natural', 'Dewy'] },
  { area: 'makeup', key: 'mk_look', label: 'Your look', options: ['Minimal', 'Everyday', 'Full glam'] },
  { area: 'makeup', key: 'mk_musts', label: 'Must-haves', options: ['Nothing', 'Long-wear', 'Waterproof', 'SPF in base', 'Clean or vegan'], max: 4 },
  { area: 'body', key: 'body_feel', label: 'Body skin', options: ['Dry', 'Normal', 'Oily'] },
  { area: 'body', key: 'body_concerns', label: 'Concerns', options: ['Dryness', 'Bumps', 'Body breakouts', 'Uneven tone', 'Odor'], max: 3 },
];
/** Skin, makeup and body routines: key, tab label, area. */
export const BEAUTY_ROUTINES: { key: string; area: Area; label: string }[] = [
  { key: 'skinAM', area: 'skin', label: 'Morning' }, { key: 'skinPM', area: 'skin', label: 'Evening' }, { key: 'skinWeekly', area: 'skin', label: 'Weekly' },
  { key: 'makeupDay', area: 'makeup', label: 'Everyday' }, { key: 'makeupEvent', area: 'makeup', label: 'Events' },
  { key: 'body', area: 'body', label: 'Body' },
];
export const pref = (s: RoutineState, key: string) => s.prefs?.[key] ?? [];
export const prefHas = (s: RoutineState, key: string, v: string) => pref(s, key).includes(v);

// ── Vocabulary ────────────────────────────────────────────────────────────────
export const GOALS = ['Grow length', 'Less frizz', 'Repair damage', 'Calm scalp', 'More volume', 'Define curls', 'Thicker look', 'Less shedding'];
export const HAIR_Q: { key: keyof Hair; label: string; options: string[] }[] = [
  { key: 'texture', label: 'Texture', options: ['Straight', 'Wavy', 'Curly', 'Coily'] },
  { key: 'strands', label: 'Strands', options: ['Fine', 'Medium', 'Thick'] },
  { key: 'heat', label: 'Heat styling', options: ['Never', '1–2× a week', '3+ a week'] },
  { key: 'treated', label: 'Color or chemical treated', options: ['No', 'Color', 'Bleach', 'Relaxer', 'Perm'] },
  { key: 'scalp', label: 'Scalp', options: ['Dry', 'Balanced', 'Oily', 'Flaky'] },
  { key: 'budget', label: 'Monthly budget', options: ['Under $25', '$25–60', '$60–120', 'No limit'] },
];
export const OCCASIONS = ['Swimming', 'Gym', 'Sleep', 'Event', 'Travel', 'Beach', 'Protective style'];
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CATEGORY_LABEL: Record<string, string> = {
  shampoo: 'Shampoo', clarifying: 'Clarifying shampoo', conditioner: 'Conditioner', deep_conditioner: 'Deep conditioner',
  leave_in: 'Leave-in', heat_protectant: 'Heat protectant', styler: 'Styler', oil: 'Hair oil', scalp_treatment: 'Scalp treatment',
  bond_builder: 'Bond repair', color: 'Hair color', relaxer: 'Relaxer or perm', dry_shampoo: 'Dry shampoo', swim: 'Swim care', anti_dandruff: 'Anti-dandruff shampoo', pre_wash: 'Pre-poo oil',
  flat_iron: 'Flat iron', blow_dryer: 'Blow dryer', diffuser: 'Diffuser', curling_iron: 'Curling iron', fine_comb: 'Fine-tooth comb',
  wide_tooth_comb: 'Wide-tooth comb', wet_brush: 'Wet brush', satin_pillowcase: 'Satin pillowcase', bonnet: 'Bonnet',
  microfiber_towel: 'Microfiber towel', swim_cap: 'Swim cap', scrunchie_soft: 'Soft scrunchies', scalp_massager: 'Scalp massager',
  // Skin
  cleanser: 'Cleanser', toner: 'Toner', serum: 'Serum', moisturizer: 'Moisturizer', spf: 'SPF', retinoid: 'Retinoid', exfoliant: 'Exfoliant',
  acne: 'Acne treatment', eye_cream: 'Eye cream', face_mask: 'Face mask', lip_balm: 'Lip balm',
  // Makeup
  makeup_remover: 'Makeup remover', primer: 'Primer', foundation: 'Foundation', concealer: 'Concealer', powder: 'Powder', blush: 'Blush',
  bronzer: 'Bronzer', highlighter: 'Highlighter', brows: 'Brows', mascara: 'Mascara', eyeliner: 'Eyeliner', eyeshadow: 'Eyeshadow',
  lips: 'Lipstick', lip_gloss: 'Lip gloss', setting_spray: 'Setting spray', nails: 'Nail polish',
  // Body
  body_wash: 'Body wash', body_scrub: 'Body scrub', body_lotion: 'Body lotion', body_oil: 'Body oil', deodorant: 'Deodorant',
  body_spf: 'Body SPF', hand_cream: 'Hand cream', foot_care: 'Foot care',
};
/** Which routine area a product category belongs to (hair when not listed). */
export const AREA_OF: Record<string, Area> = Object.fromEntries([
  ...['cleanser', 'toner', 'serum', 'moisturizer', 'spf', 'retinoid', 'exfoliant', 'acne', 'eye_cream', 'face_mask', 'lip_balm'].map(c => [c, 'skin']),
  ...['makeup_remover', 'primer', 'foundation', 'concealer', 'powder', 'blush', 'bronzer', 'highlighter', 'brows', 'mascara', 'eyeliner', 'eyeshadow', 'lips', 'lip_gloss', 'setting_spray', 'nails'].map(c => [c, 'makeup']),
  ...['body_wash', 'body_scrub', 'body_lotion', 'body_oil', 'deodorant', 'body_spf', 'hand_cream', 'foot_care'].map(c => [c, 'body']),
]) as Record<string, Area>;
export const areaOf = (category?: string): Area => (category && AREA_OF[category]) || 'hair';
export const CATEGORY_ICON: Record<string, string> = {
  shampoo: 'gentle_wash', clarifying: 'cover_clarify', conditioner: 'conditioner', deep_conditioner: 'deep_condition', leave_in: 'leave_in',
  heat_protectant: 'heat_protect', styler: 'flax_gel', oil: 'ends_oil', scalp_treatment: 'rosemary', bond_builder: 'bond_repair',
  color: 'cover_heatless', relaxer: 'style_glass', dry_shampoo: 'dry_shampoo', swim: 'swim_prep', anti_dandruff: 'anti_dandruff', pre_wash: 'pre_wash_oil',
  flat_iron: 'style_tools', blow_dryer: 'style_tools', diffuser: 'style_tools', curling_iron: 'style_tools', fine_comb: 'detangle',
  wide_tooth_comb: 'detangle', wet_brush: 'detangle', satin_pillowcase: 'pillowcase', bonnet: 'satin', microfiber_towel: 'rinse',
  swim_cap: 'swim_prep', scrunchie_soft: 'soft_ties', scalp_massager: 'scalp_massage',
  cleanser: 'gentle_wash', toner: 'drop', serum: 'drop', moisturizer: 'leave_in', spf: 'sun_cover', retinoid: 'wind_down', exfoliant: 'scalp_scrub',
  acne: 'tea_tree', eye_cream: 'calm', face_mask: 'deep_condition', lip_balm: 'calm',
  makeup_remover: 'rinse', primer: 'mirror', foundation: 'mirror', concealer: 'mirror', powder: 'mirror', blush: 'style_glass', bronzer: 'style_glass',
  highlighter: 'style_glass', brows: 'cat_style', mascara: 'cat_style', eyeliner: 'cat_style', eyeshadow: 'cat_style', lips: 'cat_style', lip_gloss: 'cat_style',
  setting_spray: 'drop', nails: 'cat_style',
  body_wash: 'care_shower', body_scrub: 'scalp_scrub', body_lotion: 'leave_in', body_oil: 'ends_oil', deodorant: 'cat_care', body_spf: 'sun_cover',
  hand_cream: 'leave_in', foot_care: 'cat_care',
};
export const OCCASION_ICON: Record<string, string> = { Swimming: 'swim_prep', Gym: 'dry_shampoo', Sleep: 'pillowcase', Event: 'style_blowout', Travel: 'drop', Beach: 'sun_cover', 'Protective style': 'style_braids' };
export const TOOL_KINDS = new Set(['flat_iron', 'blow_dryer', 'diffuser', 'curling_iron', 'fine_comb', 'wide_tooth_comb', 'wet_brush', 'satin_pillowcase', 'bonnet', 'microfiber_towel', 'swim_cap', 'scrunchie_soft', 'scalp_massager']);

let n = 0;
const sid = () => `s${Date.now().toString(36)}${(n++).toString(36)}`;
// Steps are empty input boxes: no example products or preset timings, only what the person enters.
const step = (label: string, hint: string, _when?: string): Step => ({ id: sid(), label, hint });

export const defaultWash = () => [step('Pre-poo oil', 'pre_wash', 'Before washing'), step('Shampoo', 'shampoo', 'Every wash'), step('Condition', 'conditioner', '3 min'), step('Oil after conditioner', 'oil', 'Damp ends'), step('Leave-in', 'leave_in'), step('Detangle', 'wide_tooth_comb', 'Wet'), step('Style', 'styler')];

/** Older saved routines get the pre-poo and after-conditioner oil spots too. */
function withOilSteps(wash: Step[]): Step[] {
  let out = [...wash];
  if (!out.some(x => x.hint === 'pre_wash')) out = [step('Pre-poo oil', 'pre_wash', 'Before washing'), ...out];
  if (!out.some(x => x.hint === 'oil')) {
    const i = out.findIndex(x => x.hint === 'conditioner');
    out.splice(i >= 0 ? i + 1 : out.length, 0, step('Oil after conditioner', 'oil', 'Damp ends'));
  }
  return out;
}
export const defaultEvery = () => [step('Morning refresh', 'leave_in', 'Morning'), step('Style', 'styler'), step('Night', 'satin_pillowcase', 'Night')];
export const defaultOccasion = (o: string): Step[] => ({
  Swimming: [step('Before', 'leave_in', 'Pool'), step('Protect', 'swim_cap'), step('After', 'swim', 'Rinse')],
  Gym: [step('After', 'dry_shampoo')],
  Sleep: [step('Protect', 'satin_pillowcase', 'Night')],
  Event: [step('Protect', 'heat_protectant'), step('Style', 'flat_iron')],
  Travel: [step('Pack', 'leave_in')],
  Beach: [step('Protect', 'heat_protectant', 'UV'), step('After', 'clarifying')],
  'Protective style': [step('Scalp', 'scalp_treatment'), step('Edges', 'oil')],
} as Record<string, Step[]>)[o] ?? [step('Step', 'leave_in')];

/** Empty boxes for each skin, makeup and body routine (no products, only the steps). */
export const defaultBeauty = (key: string): Step[] => ({
  skinAM: [step('Cleanser', 'cleanser'), step('Toner', 'toner'), step('Serum', 'serum'), step('Moisturizer', 'moisturizer'), step('SPF', 'spf')],
  skinPM: [step('Makeup remover', 'makeup_remover'), step('Cleanser', 'cleanser'), step('Treatment', 'retinoid'), step('Moisturizer', 'moisturizer')],
  skinWeekly: [step('Exfoliant', 'exfoliant'), step('Face mask', 'face_mask')],
  makeupDay: [step('Primer', 'primer'), step('Base', 'foundation'), step('Concealer', 'concealer'), step('Powder', 'powder'), step('Brows', 'brows'), step('Mascara', 'mascara'), step('Lips', 'lips')],
  makeupEvent: [step('Eyeshadow', 'eyeshadow'), step('Eyeliner', 'eyeliner'), step('Blush', 'blush'), step('Highlighter', 'highlighter'), step('Setting spray', 'setting_spray')],
  body: [step('Body wash', 'body_wash'), step('Scrub', 'body_scrub'), step('Lotion', 'body_lotion'), step('Body oil', 'body_oil'), step('Deodorant', 'deodorant'), step('Body SPF', 'body_spf')],
} as Record<string, Step[]>)[key] ?? [];
const initialBeauty = () => Object.fromEntries(BEAUTY_ROUTINES.map(r => [r.key, defaultBeauty(r.key)]));
const initial = (): RoutineState => ({ v: 2, mode: 'check', goals: [], hair: {}, washDays: [0, 3], wash: defaultWash(), every: defaultEvery(), occasions: [], occ: {}, bag: [], built: false, areas: [], prefs: {}, beauty: initialBeauty() });

// ── Store (persisted) ─────────────────────────────────────────────────────────
const KEY = 'moi-routine-v1';
let state: RoutineState = initial();
let hydrated = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach(f => f());
let saveT: ReturnType<typeof setTimeout> | null = null;
AsyncStorage.getItem(KEY).then(v => { if (v) { try { const raw0 = JSON.parse(v);
      // Not saved yet: leaving or refreshing starts fresh. Only the 'seen it' flags carry over.
      const raw = raw0.saved || raw0.testUnlock ? raw0 : { v: 2, welcomed: raw0.welcomed, menuSeen: raw0.menuSeen }; const saved = { ...initial(), ...raw }; const clean = (st: Step[] = []) => st.map(x => ({ ...x, when: undefined, label: x.label === 'Cleanse' ? 'Shampoo' : x.label }));
      // Before v2, "Build me a new one" pre-filled steps with products nobody logged: clear those so
      // checkmarks only ever mean "I added this".
      const autoFilled = !raw.v && !!raw.built;
      const strip = (st: Step[]) => (autoFilled ? st.map(x => ({ ...x, item: undefined })) : st.map(x => (x.item && !x.item.addedAt ? { ...x, item: { ...x.item, addedAt: 1 } } : x)));
      state = { ...saved, v: 2, areas: (raw.areas ?? (raw.goals ? ['hair'] : [])).slice(0, 1), prefs: raw.prefs ?? {}, beauty: { ...initialBeauty(), ...(raw.beauty ?? {}) }, wash: withOilSteps(strip(clean(saved.wash))), every: strip(clean(saved.every)), occ: Object.fromEntries(Object.entries(saved.occ ?? {}).map(([k, v]) => [k, strip(clean(v as Step[]))])) }; } catch {} } else state = { ...state }; hydrated = true; emit(); }).catch(() => { state = { ...state }; hydrated = true; emit(); });

export function setRoutine(fn: (s: RoutineState) => RoutineState) {
  state = fn(state);
  emit();
  if (saveT) clearTimeout(saveT);
  // Unsaved work stays in memory only; just the 'seen it' flags are written.
  saveT = setTimeout(() => { AsyncStorage.setItem(KEY, JSON.stringify(state.saved || state.testUnlock ? state : { v: 2, welcomed: state.welcomed, menuSeen: state.menuSeen })).catch(() => {}); }, 250);
}
export const resetRoutine = () => setRoutine(() => initial());
export function useRoutine() {
  return useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f); }; }, () => state, () => state);
}
export const isHydrated = () => hydrated;
export { sid as newStepId };

/** All steps across routines, tagged with where they live. */
export function allSteps(s: RoutineState): { where: string; step: Step }[] {
  const areas = s.areas ?? ['hair'];
  const hair = areas.includes('hair') ? [
    ...s.wash.map(step => ({ where: 'Wash day', step })),
    ...s.every.map(step => ({ where: 'Everyday', step })),
    ...s.occasions.flatMap(o => (s.occ[o] ?? []).map(step => ({ where: o, step }))),
  ] : [];
  return [...hair, ...BEAUTY_ROUTINES.filter(r => areas.includes(r.area)).flatMap(r => (s.beauty?.[r.key] ?? []).map(step => ({ where: r.key, step })))];
}

// ── Catalog ───────────────────────────────────────────────────────────────────
export type Catalog = { products: Item[]; tools: Item[] };
// Labels stay on the server: ing_groups carries just which rules.json ingredient groups each label contains.
const PRODUCT_COLS = 'id,code,brand,name,category,price_usd,tags,hair_types,ing_groups,goals';
const AREA_COLS = 'id,code,brand,name,step_cat,price_usd,tags,ing_groups';
const toProduct = (r: any): Item => ({ kind: 'product' as const, id: r.id, code: r.code ?? null, brand: r.brand, name: r.name, category: r.category, tags: r.tags ?? [], price: r.price_usd, hairTypes: r.hair_types ?? [], ingGroups: r.ing_groups ?? [], goals: r.goals ?? [] });
const mergeProducts = (a: Item[], b: Item[]) => { const m = new Map(a.map(i => [i.id, i])); b.forEach(i => m.set(i.id, i)); return [...m.values()]; };
const areaLoads = new Map<string, Promise<void>>();
/** Skin, makeup and body products, sorted into steps in the database (kb_step_cat), loaded once per area. */
export function ensureAreaProducts(areas: string[]) {
  const sb = supabase();
  if (!sb) return;
  for (const a of areas) {
    if (a === 'hair' || areaLoads.has(a)) continue;
    areaLoads.set(a, (async () => {
      const { data } = await sb.from('kb_products').select(AREA_COLS).eq('area', a).not('step_cat', 'is', null).order('popularity', { ascending: false }).limit(2500);
      const items: Item[] = (data ?? []).map((r: any) => ({ kind: 'product' as const, id: r.id, code: r.code ?? null, brand: r.brand, name: r.name, category: r.step_cat, tags: r.tags ?? [], price: r.price_usd, ingGroups: r.ing_groups ?? [] }));
      catalog = { ...catalog, products: mergeProducts(catalog.products, items) };
      csubs.forEach(f => f());
    })().catch(() => { areaLoads.delete(a); }));
  }
}
const goalLoads = new Map<string, Promise<void>>();
/** Pulls in the database's products for these goals (beyond the 2,000 most popular), once per goal. */
export function ensureGoalProducts(goals: string[]) {
  const sb = supabase();
  if (!sb) return;
  for (const g of goals) {
    if (goalLoads.has(g)) continue;
    goalLoads.set(g, (async () => {
      const { data } = await sb.from('kb_products').select(PRODUCT_COLS).eq('hair', true).contains('goals', [g]).order('popularity', { ascending: false }).limit(600);
      catalog = { ...catalog, products: mergeProducts(catalog.products, (data ?? []).map(toProduct)) };
      csubs.forEach(f => f());
    })().catch(() => { goalLoads.delete(g); }));
  }
}
let countsP: Promise<Record<string, number>> | null = null;
/** How many products in the database serve each goal. */
export function goalCounts(): Promise<Record<string, number>> {
  countsP ??= (async () => {
    const sb = supabase();
    if (!sb) return {};
    const { data } = await sb.rpc('kb_goal_counts');
    return Object.fromEntries((data ?? []).map((r: any) => [r.goal, Number(r.n)]));
  })().catch(() => { countsP = null; return {}; });
  return countsP;
}
let catalog: Catalog = { products: [], tools: [] };
let catalogP: Promise<Catalog> | null = null;
const csubs = new Set<() => void>();
export function loadCatalog(): Promise<Catalog> {
  catalogP ??= (async () => {
    const sb = supabase();
    if (!sb) return catalog;
    const [p, t] = await Promise.all([
      sb.from('kb_products').select(PRODUCT_COLS).eq('hair', true).order('popularity', { ascending: false }).limit(2000),
      sb.from('kb_tools').select('id,brand,name,kind,price_usd,helps,hair_types').limit(1000),
    ]);
    catalog = {
      products: mergeProducts(catalog.products, (p.data ?? []).map(toProduct)),
      tools: (t.data ?? []).map((r: any) => ({ kind: 'tool', id: r.id, brand: r.brand ?? '', name: r.name, category: r.kind, tags: r.helps ?? [], price: r.price_usd, hairTypes: r.hair_types ?? [] })),
    };
    csubs.forEach(f => f());
    return catalog;
  })().catch(() => { catalogP = null; return catalog; });
  return catalogP;
}
export function useCatalog(): Catalog {
  const c = useSyncExternalStore(f => { csubs.add(f); return () => { csubs.delete(f); }; }, () => catalog, () => catalog);
  if (!catalogP) loadCatalog();
  const { goals, areas } = useRoutine();
  useEffect(() => { ensureGoalProducts(goals); }, [goals]);
  useEffect(() => { ensureAreaProducts(areas ?? []); }, [areas]);
  return c;
}
export const itemKey = (i: Item) => `${i.kind === 'tool' ? 't' : 'p'}:${i.id ?? i.name}`;
export function findByKey(c: Catalog, key: string): Item | undefined {
  const [k, id] = [key.slice(0, 1), key.slice(2)];
  return (k === 't' ? c.tools : c.products).find(i => i.id === id);
}

export function searchCatalogLocal(c: Catalog, q: string, hint?: string): Item[] {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const all = [...c.products, ...c.tools];
  const scored = all.map(i => {
    const hay = `${i.brand} ${i.name} ${CATEGORY_LABEL[i.category] ?? i.category}`.toLowerCase();
    const hit = words.every(w => hay.includes(w));
    return { i, s: (hit ? 10 : 0) + (hint && (i.category === hint || (hint === 'pre_wash' && i.category === 'oil')) ? 5 : 0) };
  }).filter(x => (words.length ? x.s >= 10 : x.s > 0));
  return scored.sort((a, b) => b.s - a.s).slice(0, 30).map(x => x.i);
}

// ── Reading a product we only have a label for (barcode lookups, typed entries) ─
export function classify(name: string, ingredients = ''): { category: string; tags: string[] } {
  const n = name.toLowerCase();
  const ing = ingredients.toLowerCase();
  const rules: [RegExp, string][] = [
    [/dandruff|ketoconazole|zinc pyrithione/, 'anti_dandruff'], [/clarif|detox|residue/, 'clarifying'], [/dry shampoo/, 'dry_shampoo'],
    [/heat|thermal|protect/, 'heat_protectant'], [/bond|plex|repair treatment|k18/, 'bond_builder'], [/leave[- ]?in|detangl/, 'leave_in'],
    [/mask|masque|deep/, 'deep_conditioner'], [/conditioner/, 'conditioner'], [/shampoo|wash|cleans/, 'shampoo'],
    [/gel|custard|cream|mousse|curl|spray|styl/, 'styler'], [/scalp|serum|growth|density/, 'scalp_treatment'], [/oil/, 'oil'],
  ];
  const category = rules.find(([r]) => r.test(n))?.[1] ?? 'styler';
  const tags: string[] = [];
  if (/sodium (lauryl|laureth|coco) sulfate|ammonium (lauryl|laureth) sulfate/.test(ing)) tags.push('sulfate_strong');
  else if (ing && /shampoo|wash/.test(n)) tags.push('sulfate_free');
  if (/dimethicone|amodimethicone|cyclopentasiloxane|siloxane/.test(ing)) tags.push('silicone');
  if (/maleate|bis-aminopropyl diglycol dimaleate|bond/.test(ing)) tags.push('bond_builder');
  if (/hydrolyzed (keratin|wheat|silk|rice|quinoa)|protein/.test(ing)) tags.push('protein');
  if (/glycerin|honey|aloe|panthenol/.test(ing)) tags.push('humectant');
  if (category === 'heat_protectant') tags.push('heat_protect');
  if (/shea butter|castor oil|coconut oil/.test(ing)) tags.push('heavy_oil');
  return { category, tags };
}

/** Searches the whole database (local results only cover the most popular products). */
/** Full database search (kb_search): every word matched, typos tolerated, the step's category ranked first. Throws on network errors. */
/** Full database search (kb_search): every word matched, typos tolerated, the step's category ranked first. Throws on network errors. */
export async function searchRemote(q: string, hint?: string, areaOverride?: Area): Promise<Item[]> {
  const sb = supabase();
  const term = q.trim();
  if (!sb || term.length < 2) return [];
  const area = areaOverride ?? areaOf(hint);
  const { data, error } = area === 'hair' ? await sb.rpc('kb_search', { q: term, hint: hint ?? null, lim: 30 }) : await sb.rpc('kb_search_area', { q: term, hint: hint ?? null, lim: 30, area });
  if (error) throw error;
  return (data ?? []).map((r: any) => (r.kind === 'tool'
    ? { kind: 'tool' as const, id: r.id, brand: r.brand ?? '', name: r.name, category: r.category, tags: r.tags ?? [], price: r.price_usd, hairTypes: r.hair_types ?? [] }
    : { kind: 'product' as const, id: r.id, brand: r.brand, name: r.name, category: r.category, tags: r.tags ?? [], price: r.price_usd, hairTypes: r.hair_types ?? [], ingGroups: r.ing_groups ?? [], goals: r.goals ?? [] }));
}

/** Per app-open flags (reset on every load): the start choice and the goals page open empty the first time through. */
export const session = { started: false, chose: false };

/** True once the person has told us enough to judge: goals, plus a routine (entered or built). */
/** Puts bag items into the person's routines: an empty matching step first, else a new step in the right routine. */
export function placeItems(r: RoutineState, items: Item[]): RoutineState {
  const have = new Set(allSteps(r).map(x => x.step.item && itemKey(x.step.item)));
  let next = { ...r, beauty: { ...(r.beauty ?? {}) } };
  const put = (steps: Step[], it: Item): Step[] => {
    const mine = { ...it, addedAt: Date.now() };
    const empty = steps.find(x => !x.item && x.hint === it.category);
    return empty ? steps.map(x => (x === empty ? { ...x, item: mine, skipped: false } : x)) : [...steps, { id: sid(), label: CATEGORY_LABEL[it.category] ?? 'Step', hint: it.category, item: mine }];
  };
  for (const it of items) {
    if (have.has(itemKey(it))) continue;
    const area = areaOf(it.category);
    if (area === 'hair') {
      if (['satin_pillowcase', 'bonnet'].includes(it.category)) next = { ...next, every: put(next.every, it) };
      else next = { ...next, wash: put(next.wash, it) };
    } else {
      const routines = BEAUTY_ROUTINES.filter(b => b.area === area);
      const home = routines.find(b => (next.beauty[b.key] ?? []).some(x => x.hint === it.category && !x.item)) ?? routines.find(b => (next.beauty[b.key] ?? []).some(x => x.hint === it.category)) ?? routines[0];
      next.beauty[home.key] = put(next.beauty[home.key] ?? defaultBeauty(home.key), it);
    }
  }
  return next;
}

export const hasInfo = (s: RoutineState) => {
  const areas = s.areas ?? ['hair'];
  if (!areas.length || (areas.includes('hair') && !s.goals.length)) return false;
  if (s.mode === 'new') return areas.includes('hair') ? s.built : true;
  return allSteps(s).some(x => !!x.step.item);
};
