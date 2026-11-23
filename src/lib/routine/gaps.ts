import { allSteps, AREA_OF, CATEGORY_LABEL, pref, type Catalog, type Item, type RoutineState } from './model';
import { planFor, planMatch, planSteps } from './plan';

export type GapKind = 'step' | 'clash' | 'tool' | 'budget';
export type Gap = {
  id: string;
  kind: GapKind;
  title: string;
  why: string;
  /** What fills it: product categories or tool kinds. */
  fills: string[];
  /** For clashes and swaps: the item to replace. */
  replace?: Item;
  /** Picks must carry this tag (e.g. a gentler shampoo must be sulfate_free). */
  needTag?: string;
  weight: number;
};
export const KIND_LABEL: Record<GapKind, string> = { step: 'Missing step', clash: 'Ingredient clash', tool: 'Tool', budget: 'Budget swap' };
export const KIND_COLOR: Record<GapKind, { bg: string; fg: string }> = {
  step: { bg: '#FDF0D9', fg: '#9A6400' }, clash: { bg: '#FDECEC', fg: '#C2383D' }, tool: { bg: '#EEF3FD', fg: '#3F6FD8' }, budget: { bg: '#E5F4EA', fg: '#1E7B45' },
};

const BUDGET_MAX: Record<string, number> = { 'Under $25': 15, '$25–60': 32, '$60–120': 60, 'No limit': 9999 };

export function profileOf(s: RoutineState) {
  const g = new Set(s.goals);
  const texture = (s.hair.texture ?? '').toLowerCase();
  const treated = !!s.hair.treated && s.hair.treated !== 'No';
  const fine = s.hair.strands === 'Fine';
  const curly = texture === 'curly' || texture === 'coily';
  return { g, texture, treated, fine, curly, budgetMax: BUDGET_MAX[s.hair.budget ?? ''] ?? 9999 };
}

/** The gaps in a routine, judged against the person's goals and hair, plus a 0–100 routine fit. */
export function analyze(s: RoutineState, cat: Catalog, extra: Item[] = []): { score: number; gaps: Gap[] } {
  const p = profileOf(s);
  const items = [...allSteps(s).map(x => x.step.item).filter((i): i is Item => !!i), ...extra];
  const has = (...c: string[]) => items.some(i => c.includes(i.category));
  const hasTag = (t: string) => items.some(i => i.tags.includes(t));
  const heatTools = items.some(i => ['flat_iron', 'curling_iron', 'blow_dryer'].includes(i.category));
  const heatUse = s.hair.heat === '3+ a week' || s.hair.heat === '1–2× a week' || heatTools;
  const gaps: Gap[] = [];
  const add = (g: Omit<Gap, 'weight'>, weight: number) => gaps.push({ ...g, weight });

  const areas = s.areas ?? ['hair'];
  if (areas.includes('hair')) {
  if (!has('shampoo', 'clarifying', 'anti_dandruff')) add({ id: 'cleanser', kind: 'step', title: 'Shampoo', why: 'Nothing in your routine washes your hair or scalp.', fills: ['shampoo'] }, 12);
  if (!has('conditioner')) add({ id: 'conditioner', kind: 'step', title: 'Conditioner', why: 'Conditioner seals the cuticle after washing. Without it, strands tangle and snap.', fills: ['conditioner'] }, 12);
  if (heatUse && !hasTag('heat_protect')) add({ id: 'heat', kind: 'step', title: 'Heat protectant', why: `You heat style${s.hair.heat ? ` ${s.hair.heat.toLowerCase()}` : ''} and nothing in your routine protects against heat.`, fills: ['heat_protectant'] }, 12);
  if ((p.treated || p.g.has('Repair damage')) && !hasTag('bond_builder') && !has('deep_conditioner')) add({ id: 'repair', kind: 'step', title: 'Bond repair', why: `${p.treated ? `${s.hair.treated} breaks` : 'Damage breaks'} the bonds inside each strand. A bond builder or mask rebuilds them.`, fills: ['bond_builder', 'deep_conditioner'] }, 12);
  if ((p.g.has('Grow length') || p.g.has('Less frizz') || p.g.has('Define curls') || p.curly) && !has('leave_in')) add({ id: 'leave_in', kind: 'step', title: 'Leave-in', why: 'Length and frizz goals need moisture that stays in after you rinse.', fills: ['leave_in'] }, 10);
  if ((p.curly || p.g.has('Define curls')) && !has('styler')) add({ id: 'styler', kind: 'step', title: 'Curl styler', why: 'A gel or cream holds your curl pattern and keeps frizz down.', fills: ['styler'] }, 8);
  if (s.hair.scalp === 'Flaky' && !has('anti_dandruff')) add({ id: 'flakes', kind: 'step', title: 'Anti-dandruff wash', why: 'Flakes usually need an active like ketoconazole or zinc pyrithione.', fills: ['anti_dandruff'] }, 10);
  if ((p.g.has('Calm scalp') || p.g.has('Less shedding') || p.g.has('Thicker look')) && !has('scalp_treatment')) add({ id: 'scalp', kind: 'step', title: 'Scalp treatment', why: 'Your goals start at the scalp, and nothing in your routine treats it.', fills: ['scalp_treatment'] }, 8);
  if (s.occasions.includes('Swimming') && !has('swim', 'clarifying')) add({ id: 'swim', kind: 'step', title: 'After-swim wash', why: 'Chlorine and minerals build up and dry hair out. Rinse them off after swimming.', fills: ['swim'] }, 8);

  // Steps the tracker's wash-routine rules call for (rules.json via the plan engine), if not already covered.
  const plan = planFor(s);
  for (const st of areas.includes('hair') ? planSteps(plan) : []) {
    if (gaps.some(g => g.id === st.id) || has(...st.fills) || (st.id === 'repair' && has('deep_conditioner'))) continue;
    add({ id: st.id, kind: 'step', title: st.title, why: st.why, fills: st.fills, needTag: st.needTag }, st.weight);
  }

  // Clashes
  const harsh = items.filter(i => i.tags.includes('sulfate_strong'));
  if (harsh.length >= 2 && (p.treated || p.g.has('Repair damage'))) add({ id: 'two_harsh', kind: 'clash', title: 'Two harsh shampoos', why: `${harsh.slice(0, 2).map(i => i.brand).join(' and ')} both use strong sulfates. Together they strip ${p.treated ? 'treated' : 'damaged'} hair. Swap one for a gentle shampoo.`, fills: ['shampoo'], replace: harsh[0], needTag: 'sulfate_free' }, 9);
  else if (harsh.length === 1 && p.treated && harsh[0].category === 'shampoo') add({ id: 'harsh', kind: 'clash', title: 'A harsh everyday shampoo', why: `${harsh[0].brand} ${harsh[0].name} uses strong sulfates, which fade color and dry out ${s.hair.treated?.toLowerCase()}ed hair.`, fills: ['shampoo'], replace: harsh[0], needTag: 'sulfate_free' }, 9);
  if (p.fine && (p.g.has('More volume') || p.g.has('Thicker look'))) { const heavy = items.find(i => i.tags.includes('heavy_oil')); if (heavy) add({ id: 'heavy', kind: 'clash', title: 'Too heavy for fine hair', why: `${heavy.brand} ${heavy.name} has rich oils and butters that flatten fine strands and work against volume.`, fills: [heavy.category], replace: heavy, needTag: 'light' }, 6); }

  // Tools
  const fineComb = items.find(i => i.category === 'fine_comb');
  if (fineComb && (p.g.has('Grow length') || p.g.has('Repair damage') || p.treated || p.curly)) add({ id: 'comb', kind: 'tool', title: 'Swap the fine-tooth comb', why: 'Fine teeth snap wet, fragile strands. A wide-tooth comb or wet brush keeps your length.', fills: ['wet_brush', 'wide_tooth_comb'], replace: fineComb }, 6);
  if ((p.g.has('Grow length') || p.g.has('Less frizz') || s.occasions.includes('Sleep')) && !has('satin_pillowcase', 'bonnet')) add({ id: 'satin', kind: 'tool', title: 'Satin for sleep', why: 'Cotton pulls on hair all night. Satin cuts friction, breakage and frizz.', fills: p.curly ? ['bonnet', 'satin_pillowcase'] : ['satin_pillowcase', 'bonnet'] }, 6);
  if (s.occasions.includes('Swimming') && !has('swim_cap')) add({ id: 'swim_cap', kind: 'tool', title: 'Swim cap', why: 'A cap keeps most chlorine off your hair while you swim.', fills: ['swim_cap'] }, 4);

  }

  // ── Skin ──────────────────────────────────────────────────────────────────
  const pv = (k: string) => pref(s, k);
  const concern = (c: string) => pv('skin_concerns').includes(c);
  const pregnant = pv('skin_flags').some(f => f.startsWith('Retinoids'));
  const skinType = pv('skin_type')[0];
  if (areas.includes('skin')) {
    if (!has('cleanser')) add({ id: 'sk_cleanser', kind: 'step', title: 'Face cleanser', why: skinType === 'Dry' || skinType === 'Sensitive' ? 'A gentle cream or gel cleanser clears the day without stripping.' : 'Washing morning or night keeps pores clear and lets everything else work.', fills: ['cleanser'] }, 10);
    if (!has('moisturizer')) add({ id: 'sk_moist', kind: 'step', title: 'Moisturizer', why: skinType === 'Oily' ? 'Oily skin still needs water. A light gel keeps oil in check.' : 'Moisturizer holds water in your skin barrier.', fills: ['moisturizer'] }, 10);
    if (!has('spf')) add({ id: 'sk_spf', kind: 'step', title: 'Daily SPF', why: 'Sun causes most dark spots and fine lines. SPF 30 every morning.', fills: ['spf'] }, 14);
    if (concern('Breakouts') && !has('acne', 'exfoliant')) add({ id: 'sk_acne', kind: 'step', title: 'Breakout treatment', why: 'Salicylic acid or benzoyl peroxide clears pores.', fills: ['acne', 'exfoliant'] }, 10);
    if (concern('Dark spots') && !has('serum')) add({ id: 'sk_spots', kind: 'step', title: 'Brightening serum', why: 'Vitamin C or niacinamide fades dark spots over 8 to 12 weeks.', fills: ['serum'] }, 8);
    if (concern('Fine lines') && !pregnant && !has('retinoid')) add({ id: 'sk_retinoid', kind: 'step', title: 'Night retinoid', why: 'A retinoid at night is the best-studied ingredient for fine lines.', fills: ['retinoid'] }, 8);
    if (concern('Fine lines') && pregnant && !has('serum')) add({ id: 'sk_peptide', kind: 'step', title: 'Peptide serum', why: 'Peptides or bakuchiol help fine lines without retinoids.', fills: ['serum'] }, 6);
    if ((concern('Dullness') || concern('Large pores')) && !has('exfoliant', 'retinoid')) add({ id: 'sk_exfoliant', kind: 'step', title: 'Weekly exfoliant', why: 'A gentle acid once or twice a week clears dull, clogged skin.', fills: ['exfoliant'] }, 6);
    if (concern('Dehydration') && !has('serum', 'toner')) add({ id: 'sk_hydrate', kind: 'step', title: 'Hydrating serum', why: 'Hyaluronic acid or glycerin pulls water into tight, dehydrated skin.', fills: ['serum', 'toner'] }, 6);
    const pm = (s.beauty?.skinPM ?? []).map(x => x.item).filter((i): i is Item => !!i);
    if (pm.some(i => i.category === 'retinoid') && pm.some(i => i.category === 'exfoliant')) add({ id: 'sk_clash', kind: 'clash', title: 'Retinoid and acid together', why: 'Both in one evening can irritate. Use them on different nights.', fills: [] }, 8);
    if (pregnant && has('retinoid')) add({ id: 'sk_preg', kind: 'clash', title: 'Retinoid while pregnant or nursing', why: 'Retinoids aren\u2019t advised now. Swap for azelaic acid or peptides.', fills: ['serum'] }, 14);
    if (pv('skin_flags').includes('Fragrance')) { const f = items.find(i => AREA_OF[i.category] === 'skin' && /parfum|fragrance/i.test(i.ingredients ?? '')); if (f) add({ id: 'sk_frag', kind: 'clash', title: 'Fragrance in your skin care', why: `${f.brand} ${f.name} lists fragrance.`, fills: [f.category], replace: f }, 6); }
  }

  // ── Makeup ────────────────────────────────────────────────────────────────
  if (areas.includes('makeup')) {
    const wearsBase = has('foundation', 'concealer', 'mascara', 'eyeliner', 'eyeshadow');
    if (wearsBase && !has('makeup_remover')) add({ id: 'mk_remover', kind: 'step', title: 'Makeup remover', why: 'Sleeping in makeup clogs pores. Remove it before you cleanse.', fills: ['makeup_remover'] }, 10);
    if ((skinType === 'Oily' || pv('mk_finish').includes('Matte') || pv('mk_musts').includes('Long-wear')) && has('foundation') && !has('primer', 'powder')) add({ id: 'mk_set', kind: 'step', title: 'Primer or powder', why: 'Oily skin moves makeup. A primer or powder keeps it in place.', fills: ['primer', 'powder'] }, 6);
    if (pv('mk_musts').includes('SPF in base') && !has('spf')) add({ id: 'mk_spf', kind: 'step', title: 'SPF under makeup', why: 'Most bases hold too little SPF alone. Add a sunscreen first.', fills: ['spf'] }, 10);
    if ((pv('mk_look').includes('Full glam') || has('eyeshadow')) && !has('setting_spray')) add({ id: 'mk_spray', kind: 'step', title: 'Setting spray', why: 'Locks a full look in place for hours.', fills: ['setting_spray'] }, 4);
    if (has('foundation') && !has('concealer') && pv('mk_coverage').includes('Full')) add({ id: 'mk_conceal', kind: 'step', title: 'Concealer', why: 'Full coverage looks lighter with a thin base and concealer where needed.', fills: ['concealer'] }, 4);
  }

  // ── Body ──────────────────────────────────────────────────────────────────
  if (areas.includes('body')) {
    const bc = (c: string) => pv('body_concerns').includes(c);
    if (!has('body_wash')) add({ id: 'bd_wash', kind: 'step', title: 'Body wash', why: 'A gentle wash keeps skin clean without drying it out.', fills: ['body_wash'] }, 8);
    if ((bc('Dryness') || pv('body_feel').includes('Dry')) && !has('body_lotion', 'body_oil')) add({ id: 'bd_moist', kind: 'step', title: 'Body lotion', why: 'Lotion on damp skin locks in moisture.', fills: ['body_lotion', 'body_oil'] }, 8);
    if ((bc('Bumps') || bc('Body breakouts')) && !has('body_scrub')) add({ id: 'bd_scrub', kind: 'step', title: 'Exfoliating scrub', why: 'Bumps and breakouts clear faster with gentle exfoliation twice a week.', fills: ['body_scrub'] }, 6);
    if (bc('Odor') && !has('deodorant')) add({ id: 'bd_deo', kind: 'step', title: 'Deodorant', why: 'Keeps odor down all day.', fills: ['deodorant'] }, 8);
    if (bc('Uneven tone') && !has('body_spf', 'spf')) add({ id: 'bd_spf', kind: 'step', title: 'Body SPF', why: 'Sun darkens uneven patches. SPF on exposed skin.', fills: ['body_spf', 'spf'] }, 6);
  }

  // Budget swaps: same job and same key tag at roughly half the price
  const seen = new Set<string>();
  for (const it of items) {
    if (it.kind !== 'product' || !it.price || seen.has(it.category)) continue;
    const key = ['bond_builder', 'heat_protect', 'sulfate_free'].find(t => it.tags.includes(t));
    const alt = cat.products.filter(c => c.category === it.category && c.id !== it.id && c.price && c.price <= it.price! * 0.6 && (!key || c.tags.includes(key)))
      .sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0];
    if (alt) { seen.add(it.category); add({ id: `budget_${it.category}`, kind: 'budget', title: `Same ${CATEGORY_LABEL[it.category]?.toLowerCase() ?? 'job'} for less`, why: `${it.brand} ${it.name} costs about $${Math.round(it.price)}. ${alt.brand} does the same job${key ? ` with the same ${key.replace('_', ' ')}` : ''} for about $${Math.round(alt.price ?? 0)}.`, fills: [it.category], replace: it, needTag: key }, 3); }
  }

  const score = Math.max(15, 100 - gaps.reduce((a, g) => a + g.weight, 0));
  return { score, gaps };
}

/** How well one item suits this person, 50–98. */
export function fitOf(i: Item, s: RoutineState): number {
  const p = profileOf(s);
  let f = 72;
  if (p.texture && i.hairTypes?.includes(p.texture)) f += 9;
  if (p.fine && i.hairTypes?.includes('fine')) f += 5;
  if (p.fine && i.tags.includes('heavy_oil')) f -= 12;
  if (p.treated) { if (i.hairTypes?.includes('color_treated')) f += 6; if (i.tags.includes('sulfate_strong')) f -= 18; if (i.tags.includes('bond_builder')) f += 5; }
  if (i.price != null) f += i.price <= p.budgetMax ? 6 : -10;
  if (p.g.has('Grow length') && i.tags.includes('grow_length')) f += 6;
  // The tracker plan's ingredient rules: +4 per group it looks for (up to 3), -12 per group to avoid.
  const m = planMatch(i, planFor(s));
  f += 4 * Math.min(3, m.good.length) - 12 * m.watch.length;
  // Products the database tags for the person's own goals.
  f += 7 * Math.min(2, goalHits(i, s).length);
  // Skin, makeup and body: match the quick answers by label and name.
  if (AREA_OF[i.category]) {
    const n = `${i.name} ${i.brand}`.toLowerCase();
    const pv = (k: string) => pref(s, k);
    if (pv('skin_flags').includes('Fragrance')) f += /fragrance[- ]free|sans parfum|unscented|parfum/.test(n) ? (/(free|sans|unscented)/.test(n) ? 8 : -12) : 0;
    const type = (pv('skin_type')[0] ?? '').toLowerCase();
    if (type && (n.includes(type) || (type === 'oily' && /(oil[- ]free|matt|gel)/.test(n)) || (type === 'dry' && /(rich|nourish|hydrat|cream)/.test(n)) || (type === 'sensitive' && /(sensitiv|gentle|calm|tolér|toler)/.test(n)))) f += 8;
    if (pv('mk_musts').includes('Waterproof') && /waterproof|water ?resistant|wasserfest|résistant/.test(n)) f += 8;
    if (pv('mk_musts').includes('Long-wear') && /(long|24h|16h|wear|lasting|tenue)/.test(n)) f += 6;
    if (pv('mk_musts').includes('SPF in base') && /spf/.test(n) && ['foundation', 'primer', 'powder'].includes(i.category)) f += 6;
    if (pv('mk_musts').includes('Clean or vegan') && /(vegan|clean|organic|bio|natural)/.test(n)) f += 6;
    const finish = (pv('mk_finish')[0] ?? '').toLowerCase();
    if (finish && ['foundation', 'powder', 'primer', 'lips'].includes(i.category) && (n.includes(finish) || (finish === 'dewy' && /(glow|lumin|radian)/.test(n)) || (finish === 'matte' && /matt/.test(n)))) f += 6;
    const cov = (pv('mk_coverage')[0] ?? '').toLowerCase();
    if (cov && i.category === 'foundation' && (n.includes(cov) || (cov === 'sheer' && /(tint|bb|cc|skin)/.test(n)))) f += 6;
  }
  return Math.max(50, Math.min(98, Math.round(f)));
}

/** Which of the person's goals this product is tagged for in the database. */
export const goalHits = (i: Item, s: RoutineState) => s.goals.filter(g => i.goals?.includes(g));

/** Ranked picks that fill a gap. */
/** Hides rows whose names are too thin to recommend (e.g. brand repeated as the name). */
export const goodName = (i: Item) => !!i.name && !!i.brand && i.name.trim().length >= 6 && i.name.trim().toLowerCase() !== i.brand.trim().toLowerCase();

export function picksFor(g: Gap, s: RoutineState, cat: Catalog, n = 3): { item: Item; fit: number; why?: string }[] {
  const pool = (g.kind === 'tool' ? cat.tools : cat.products).filter(i => g.fills.includes(i.category) && i.id !== g.replace?.id && (!g.needTag || i.tags.includes(g.needTag)) && (i.kind === 'tool' || goodName(i)));
  const cheaper = g.kind === 'budget' && g.replace?.price ? pool.filter(i => (i.price ?? 999) <= g.replace!.price! * 0.6) : pool;
  // Products we can price and link come first, then best fit.
  const plan = planFor(s);
  const reason = (i: Item) => {
    const m = planMatch(i, plan); const hit = goalHits(i, s);
    if (m.watch.length) return `Has ${m.watch[0]}`;
    const parts = [hit.length ? `Made for ${hit.slice(0, 2).join(' and ').toLowerCase()}` : '', m.good.length ? `has ${m.good[0]}` : ''].filter(Boolean);
    return parts.length ? parts.join(', ').replace(/^h/, 'H') : undefined;
  };
  return cheaper.filter(item => !planMatch(item, plan).watch.length || pool.length <= n).map(item => ({ item, fit: fitOf(item, s), why: reason(item), hits: goalHits(item, s).length })).sort((a, b) => b.hits - a.hits || Number(b.item.price != null) - Number(a.item.price != null) || b.fit - a.fit || (a.item.price ?? 0) - (b.item.price ?? 0)).slice(0, n);
}

/** For "Build me a new one": the steps a routine for these goals should have, each filled with the best pick. */
export function buildNew(s: RoutineState, cat: Catalog) {
  const blank: RoutineState = { ...s, wash: [], every: [], occ: {} };
  const { gaps } = analyze(blank, cat);
  const pick = (g: Gap) => picksFor(g, s, cat, 1)[0]?.item;
  return gaps.filter(g => g.kind === 'step' || g.kind === 'tool').map(g => ({ g, item: pick(g) }));
}

export const retailerLinks = (i: Item) => {
  const q = encodeURIComponent(`${i.brand} ${i.name}`.trim());
  return [
    { name: 'Amazon', url: `https://www.amazon.com/s?k=${q}` },
    { name: 'Ulta Beauty', url: `https://www.ulta.com/search?search=${q}` },
    { name: 'Target', url: `https://www.target.com/s?searchTerm=${q}` },
    { name: 'Sephora', url: `https://www.sephora.com/search?keyword=${q}` },
  ];
};
