import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
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
  hairTypes?: string[];
};
export type Step = { id: string; label: string; hint: string; item?: Item; when?: string };
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
  built: boolean; // a "new" routine has been generated
  welcomed?: boolean; // has seen the Moi welcome screen
};

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
};
export const CATEGORY_ICON: Record<string, string> = {
  shampoo: 'gentle_wash', clarifying: 'cover_clarify', conditioner: 'conditioner', deep_conditioner: 'deep_condition', leave_in: 'leave_in',
  heat_protectant: 'heat_protect', styler: 'flax_gel', oil: 'ends_oil', scalp_treatment: 'rosemary', bond_builder: 'bond_repair',
  color: 'cover_heatless', relaxer: 'style_glass', dry_shampoo: 'dry_shampoo', swim: 'swim_prep', anti_dandruff: 'anti_dandruff', pre_wash: 'pre_wash_oil',
  flat_iron: 'style_tools', blow_dryer: 'style_tools', diffuser: 'style_tools', curling_iron: 'style_tools', fine_comb: 'detangle',
  wide_tooth_comb: 'detangle', wet_brush: 'detangle', satin_pillowcase: 'pillowcase', bonnet: 'satin', microfiber_towel: 'rinse',
  swim_cap: 'swim_prep', scrunchie_soft: 'soft_ties', scalp_massager: 'scalp_massage',
};
export const OCCASION_ICON: Record<string, string> = { Swimming: 'swim_prep', Gym: 'dry_shampoo', Sleep: 'pillowcase', Event: 'style_blowout', Travel: 'drop', Beach: 'sun_cover', 'Protective style': 'style_braids' };
export const TOOL_KINDS = new Set(['flat_iron', 'blow_dryer', 'diffuser', 'curling_iron', 'fine_comb', 'wide_tooth_comb', 'wet_brush', 'satin_pillowcase', 'bonnet', 'microfiber_towel', 'swim_cap', 'scrunchie_soft', 'scalp_massager']);

let n = 0;
const sid = () => `s${Date.now().toString(36)}${(n++).toString(36)}`;
const step = (label: string, hint: string, when?: string): Step => ({ id: sid(), label, hint, when });

export const defaultWash = () => [step('Pre-poo oil', 'pre_wash', 'Before washing'), step('Cleanse', 'shampoo', 'Every wash'), step('Condition', 'conditioner', '3 min'), step('Oil after conditioner', 'oil', 'Damp ends'), step('Leave-in', 'leave_in'), step('Detangle', 'wide_tooth_comb', 'Wet'), step('Style', 'styler')];

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

const initial = (): RoutineState => ({ mode: 'check', goals: [], hair: {}, washDays: [0, 3], wash: defaultWash(), every: defaultEvery(), occasions: [], occ: {}, bag: [], built: false });

// ── Store (persisted) ─────────────────────────────────────────────────────────
const KEY = 'moi-routine-v1';
let state: RoutineState = initial();
let hydrated = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach(f => f());
let saveT: ReturnType<typeof setTimeout> | null = null;
AsyncStorage.getItem(KEY).then(v => { if (v) { try { const saved = { ...initial(), ...JSON.parse(v) }; state = { ...saved, wash: withOilSteps(saved.wash) }; } catch {} } hydrated = true; emit(); }).catch(() => { hydrated = true; emit(); });

export function setRoutine(fn: (s: RoutineState) => RoutineState) {
  state = fn(state);
  emit();
  if (saveT) clearTimeout(saveT);
  saveT = setTimeout(() => { AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {}); }, 250);
}
export const resetRoutine = () => setRoutine(() => initial());
export function useRoutine() {
  return useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f); }; }, () => state, () => state);
}
export const isHydrated = () => hydrated;
export { sid as newStepId };

/** All steps across routines, tagged with where they live. */
export function allSteps(s: RoutineState): { where: string; step: Step }[] {
  return [
    ...s.wash.map(step => ({ where: 'Wash day', step })),
    ...s.every.map(step => ({ where: 'Everyday', step })),
    ...s.occasions.flatMap(o => (s.occ[o] ?? []).map(step => ({ where: o, step }))),
  ];
}

// ── Catalog ───────────────────────────────────────────────────────────────────
export type Catalog = { products: Item[]; tools: Item[] };
let catalog: Catalog = { products: [], tools: [] };
let catalogP: Promise<Catalog> | null = null;
const csubs = new Set<() => void>();
export function loadCatalog(): Promise<Catalog> {
  catalogP ??= (async () => {
    const sb = supabase();
    if (!sb) return catalog;
    const [p, t] = await Promise.all([
      sb.from('kb_products').select('id,brand,name,category,price_usd,tags,hair_types').eq('hair', true).order('popularity', { ascending: false }).limit(2000),
      sb.from('kb_tools').select('id,brand,name,kind,price_usd,helps,hair_types').limit(1000),
    ]);
    catalog = {
      products: (p.data ?? []).map((r: any) => ({ kind: 'product', id: r.id, brand: r.brand, name: r.name, category: r.category, tags: r.tags ?? [], price: r.price_usd, hairTypes: r.hair_types ?? [] })),
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
export async function searchRemote(q: string): Promise<Item[]> {
  const sb = supabase();
  const term = q.trim().toLowerCase().replace(/[%_,()]/g, ' ');
  if (!sb || term.length < 2) return [];
  const words = term.split(/\s+/).filter(Boolean).slice(0, 4);
  let query = sb.from('kb_products').select('id,brand,name,category,price_usd,tags,hair_types').eq('hair', true);
  for (const w of words) query = query.ilike('search', `%${w}%`);
  const { data } = await query.order('popularity', { ascending: false }).limit(25);
  return (data ?? []).map((r: any) => ({ kind: 'product' as const, id: r.id, brand: r.brand, name: r.name, category: r.category, tags: r.tags ?? [], price: r.price_usd, hairTypes: r.hair_types ?? [] }));
}

/** True once the person has told us enough to judge: goals, plus a routine (entered or built). */
export const hasInfo = (s: RoutineState) => s.goals.length > 0 && (s.mode === 'new' ? s.built : allSteps(s).some(x => !!x.step.item));
