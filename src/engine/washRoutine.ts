// Wash-day routine: the ordered steps for one wash, built from the person's goals and hair.
// Pure and data-only, like the plan engine, so it runs on device or on a server.
//
// Each goal has a recipe (which steps, in which order). Hair details then adjust it:
// texture, porosity, scalp, chemical treatments, heat, swimming and the time someone has.
// Several goals merge into one routine, ordered by phase, with conflicts settled for the scalp's sake
// (an oily or flaky scalp never gets oil on the roots, whatever the other goal wants).

import type { Evidence, Goal, Profile } from './planEngine';

export type Phase = 'before' | 'cleanse' | 'treat' | 'condition' | 'finish';
export const PHASE_LABEL: Record<Phase, string> = {
  before: 'Before you wash', cleanse: 'Cleanse', treat: 'Treat', condition: 'Condition', finish: 'Finish',
};
const PHASE_ORDER: Phase[] = ['before', 'cleanse', 'treat', 'condition', 'finish'];

export interface WashStep {
  id: string;
  /** 3D icon id (see data/icons3d.ts). */
  icon: string;
  phase: Phase;
  title: string;
  /** What to do, in one or two plain sentences. */
  how: string;
  why: string;
  evidence: Evidence;
  /** Hands-on minutes. Waiting time is in `waitMinutes` and isn't counted against the time budget. */
  minutes: number;
  waitMinutes?: number;
  /** Not every wash: e.g. 1 = once a week. Omitted = every wash. */
  perWeek?: number;
}

export interface WashRoutine {
  /** The goals this routine serves, primary first. */
  goals: Goal[];
  headline: string;
  summary: string;
  steps: WashStep[];
  /** Short safety notes, e.g. when to see a dermatologist. */
  notes: string[];
  minutes: number;
}

type Draft = Omit<WashStep, 'id'>;
type Library = Record<string, (p: Profile, ctx: Ctx) => Draft | null>;
type Ctx = { scalpCare: boolean; curly: boolean; short: boolean };

/** Every step Moi knows, written once. Returning null means "not for this person". */
/** Plan levers that are wash-day steps: they live in the routine, not in the daily cards. */
export const WASH_LEVERS = new Set(['leave_in', 'conditioner', 'gentle_wash', 'detangle', 'rinse', 'pre_wash_oil', 'tea_tree', 'flax_gel',
  'deep_condition', 'anti_dandruff', 'keto_wash', 'bond_repair', 'scalp_scrub', 'heat_protect']);

const STEPS: Library = {
  pre_wash_oil: (p, c) => ({
    icon: 'pre_wash_oil', phase: 'before', title: 'Pre-wash oil',
    how: c.scalpCare
      ? 'Work 1–2 tsp of coconut oil through your lengths and ends only — keep it off your scalp. Leave it 20 minutes, then wash.'
      : `Work 1–2 tsp of coconut oil through mid-lengths and ends${p.porosity === 'low' ? ' (warm it in your palms first; low-porosity hair takes oil in slowly)' : ''}. Leave it 20 minutes, then wash.`,
    why: 'Coconut oil soaks into the strand and cuts how much protein hair loses when it swells with water — that swelling is what roughs up the cuticle and causes frizz and breakage.',
    evidence: 'lab', minutes: 2, waitMinutes: 20,
  }),
  scalp_massage: () => ({
    icon: 'scalp_massage', phase: 'before', title: 'Scalp massage',
    how: 'Before you wet your hair, press your fingertips into your scalp and move the skin in small circles for 4 minutes. Pads, not nails.',
    why: 'Small studies found daily scalp massage linked to thicker strands over 24 weeks. It costs nothing and is gentle on hair that’s shedding.',
    evidence: 'early', minutes: 4,
  }),
  finger_detangle: () => ({
    icon: 'detangle', phase: 'before', title: 'Loosen knots first',
    how: 'Gently separate big knots with your fingers before water goes on — tightly curled hair knots more once it’s wet.',
    why: 'Coily and curly strands snap most at the bends. Fewer knots in the shower means less pulling and less breakage.',
    evidence: 'expert', minutes: 3,
  }),
  gentle_wash: (p, c) => ({
    icon: 'gentle_wash', phase: 'cleanse', title: 'Gentle shampoo',
    how: c.scalpCare
      ? 'Shampoo twice: the first wash lifts oil, the second actually cleans the scalp. Massage the roots, then rinse for a full minute so nothing is left behind.'
      : 'Shampoo your scalp only with a gentle, sulfate-free shampoo. Let the suds run through your lengths as you rinse — that’s enough to clean them.',
    why: c.scalpCare
      ? 'Oil and flakes build up at the root, not the ends. A second lather reaches the skin once the first has cut through the oil.'
      : 'Lengths are the oldest, driest part of your hair. Scrubbing them strips the oils that keep frizz and breakage down.',
    evidence: 'expert', minutes: 3,
  }),
  anti_flake: () => ({
    icon: 'keto_wash', phase: 'treat', title: 'Anti-flake shampoo',
    how: 'Lather an anti-dandruff shampoo (zinc pyrithione or ketoconazole) into your scalp and leave it on 3–5 minutes before rinsing.',
    why: 'Flakes and itch are usually driven by a yeast that feeds on scalp oil. These ingredients calm it, but only with a few minutes of contact.',
    evidence: 'strong', minutes: 1, waitMinutes: 4, perWeek: 2,
  }),
  tea_tree: () => ({
    icon: 'tea_tree', phase: 'treat', title: 'Tea tree shampoo',
    how: 'On the other washes, use a 5% tea tree oil shampoo and leave it on your scalp for 3 minutes before rinsing.',
    why: 'In a controlled trial, 5% tea tree shampoo eased dandruff and itch over four weeks — a plant-based option alongside the anti-flake wash.',
    evidence: 'moderate', minutes: 1, waitMinutes: 3, perWeek: 1,
  }),
  scalp_scrub: () => ({
    icon: 'scalp_scrub', phase: 'before', title: 'Scalp exfoliation',
    how: 'Once a week, before shampoo, work a gentle scalp scrub or soft scalp brush over damp roots for a minute. No pressure needed.',
    why: 'Loosens buildup and flakes so shampoo and treatments can reach the skin.',
    evidence: 'early', minutes: 2, perWeek: 1,
  }),
  clarify: () => ({
    icon: 'rinse', phase: 'cleanse', title: 'Clarifying wash',
    how: 'Once a week, use a clarifying or chelating shampoo to lift chlorine and hard-water minerals. Follow with conditioner.',
    why: 'Minerals and chlorine coat the strand, making it rough, dull and prone to snapping. A weekly reset clears them.',
    evidence: 'expert', minutes: 2, perWeek: 1,
  }),
  bond_repair: () => ({
    icon: 'bond_repair', phase: 'treat', title: 'Bond repair',
    how: 'Once a week, apply a bond-repair treatment to damp, clean hair and leave it on as directed before conditioning.',
    why: 'Bleach, color and relaxers break the bonds that hold the strand together. Bond builders help reconnect some of them.',
    evidence: 'lab', minutes: 2, waitMinutes: 10, perWeek: 1,
  }),
  deep_condition: p => ({
    icon: 'deep_condition', phase: 'condition', title: 'Deep-conditioning mask',
    how: `Once a week, swap your conditioner for a mask. Leave it ${p.porosity === 'low' ? '15–20 minutes under a warm towel' : '10–15 minutes'}, then rinse.`,
    why: 'A mask stays on long enough to smooth the cuticle and fill weak spots, so hair holds moisture and frizzes less between washes.',
    evidence: 'expert', minutes: 2, waitMinutes: 15, perWeek: 1,
  }),
  conditioner: (_p, c) => ({
    icon: 'conditioner', phase: 'condition', title: 'Conditioner',
    how: c.scalpCare
      ? 'Use a lightweight conditioner on your ends only, keeping it a hand’s width away from your scalp.'
      : 'Condition mid-lengths to ends every wash. Leave it on while you detangle.',
    why: c.scalpCare
      ? 'Your ends still need slip, but conditioner on the roots weighs them down and feeds oil and flakes.'
      : 'Conditioner flattens the cuticle and adds slip, which is the single biggest cut to friction, frizz and breakage.',
    evidence: 'strong', minutes: 2,
  }),
  detangle: (p) => ({
    icon: 'detangle', phase: 'condition', title: 'Detangle in conditioner',
    how: 'With conditioner still in, comb with a wide-tooth comb, starting at the ends and working up. Hold the hair above any knot.',
    why: p.goals?.includes('keep') || p.goal === 'keep'
      ? 'Wet hair stretches and snaps easily, so slip matters. The hair you see in the comb had already shed — 50 to 100 a day is normal.'
      : 'Wet hair stretches and snaps easily. Working up from the ends with slip means no knot ever gets dragged down.',
    evidence: 'expert', minutes: 3,
  }),
  leave_in: (p) => ({
    icon: 'leave_in', phase: 'finish', title: 'Leave-in',
    how: `On soaking-wet hair, smooth in a ${p.texture === 'straight' || p.thickness === 'fine' ? 'light, spray-in' : 'creamy'} leave-in from mid-lengths to ends.`,
    why: 'Applied while hair is wet, a leave-in locks water in and blocks humidity from swelling the strand — the main cause of frizz.',
    evidence: 'expert', minutes: 1,
  }),
  hold: (p) => ({
    icon: 'flax_gel', phase: 'finish', title: p.prefersNatural ? 'Flax gel to hold' : 'Gel to hold',
    how: `Scrunch in ${p.prefersNatural ? 'flax gel' : 'a curl gel'} while hair is still wet, then don’t touch it until it’s fully dry. Scrunch out the crunch at the end.`,
    why: 'Gel holds curls together in clumps as they dry, so strands don’t separate into frizz.',
    evidence: 'expert', minutes: 2,
  }),
  seal_ends: () => ({
    icon: 'ends_oil', phase: 'finish', title: 'Seal your ends',
    how: 'Rub 2–3 drops of oil between your palms and press it onto the last few inches.',
    why: 'Ends are the oldest hair you have. Sealing them slows the splitting that eats into length you’ve grown.',
    evidence: 'expert', minutes: 1,
  }),
  blot: () => ({
    icon: 'drop', phase: 'finish', title: 'Blot, don’t rub',
    how: 'Squeeze water out with a microfiber towel or cotton T-shirt. Press and lift — never rub back and forth.',
    why: 'Rubbing wet hair roughs up the cuticle. Blotting removes water without the friction.',
    evidence: 'expert', minutes: 1,
  }),
  heat_protect: () => ({
    icon: 'heat_protect', phase: 'finish', title: 'Heat protectant',
    how: 'Mist a heat protectant through damp hair before any blow-dry, and keep the dryer on medium heat, moving.',
    why: 'Heat above about 150 °C cracks the cuticle. A protectant plus lower heat cuts that damage a lot.',
    evidence: 'lab', minutes: 1,
  }),
  dry_roots: () => ({
    icon: 'heat_cap', phase: 'finish', title: 'Dry your roots',
    how: 'Dry your scalp fully — a cool blow-dry at the roots is fine. Don’t go to bed or tie hair up with a damp scalp.',
    why: 'A scalp that stays damp for hours lets the flake-causing yeast thrive.',
    evidence: 'expert', minutes: 3,
  }),
  dry_loose: () => ({
    icon: 'loose_styles', phase: 'finish', title: 'Dry it loose',
    how: 'Let hair dry down or in a loose clip. Skip tight buns, ponytails and elastics on wet hair.',
    why: 'Wet hair stretches; tension on it pulls at the root. Over time constant pulling can thin the hairline.',
    evidence: 'strong', minutes: 0,
  }),
};

/** The order steps happen in on the day, within each phase. */
const ORDER = ['finger_detangle', 'scalp_massage', 'pre_wash_oil', 'scalp_scrub', 'gentle_wash', 'clarify', 'anti_flake', 'tea_tree', 'bond_repair',
  'conditioner', 'deep_condition', 'detangle', 'leave_in', 'hold', 'blot', 'heat_protect', 'dry_roots', 'dry_loose', 'seal_ends'];

/** Each goal's recipe: step ids, most important first (used to trim when time is short). */
const RECIPES: Record<Goal, { steps: string[]; headline: string; summary: string; notes?: string[] }> = {
  repair: {
    headline: 'Your wash day for less frizz',
    summary: 'Protect the strand before water hits it, clean only the scalp, and lock moisture in before it dries.',
    steps: ['pre_wash_oil', 'conditioner', 'leave_in', 'gentle_wash', 'detangle', 'blot', 'deep_condition'],
  },
  keep: {
    headline: 'Your wash day for less shedding',
    summary: 'Wash on schedule, treat the scalp kindly, and take tension off your roots. Skipping washes doesn’t save hair.',
    steps: ['scalp_massage', 'gentle_wash', 'conditioner', 'detangle', 'dry_loose'],
    notes: ['Shedding clumps, a widening part or patches are worth a dermatologist visit — ask about iron (ferritin), thyroid and vitamin D.'],
  },
  grow: {
    headline: 'Your wash day for more length',
    summary: 'Length is kept, not grown faster: guard the ends and avoid snapping while hair is wet.',
    steps: ['pre_wash_oil', 'conditioner', 'detangle', 'gentle_wash', 'leave_in', 'seal_ends', 'scalp_massage', 'deep_condition'],
  },
  balance: {
    headline: 'Your wash day for a calmer scalp',
    summary: 'Clean the scalp thoroughly, give treatments contact time, and keep heavy products to your ends.',
    steps: ['gentle_wash', 'anti_flake', 'conditioner', 'dry_roots', 'detangle'],
    notes: ['If flakes or itch don’t ease after 4 weeks of anti-dandruff shampoo, or the scalp is red and sore, see a dermatologist.'],
  },
};

/** Adds or removes steps for this person's hair, on top of their goal recipes. */
function adjust(p: Profile, ids: string[], c: Ctx, wanted: Set<string>): string[] {
  const out = [...ids];
  const add = (id: string, after?: string) => { if (!out.includes(id)) after && out.includes(after) ? out.splice(out.indexOf(after) + 1, 0, id) : out.push(id); };
  const drop = (id: string) => { const i = out.indexOf(id); if (i >= 0) out.splice(i, 1); };

  // The plan rules decide some treatments (e.g. ketoconazole for thinning); honour them here.
  if (p.scalp === 'flaky' || p.noticed?.includes('flakes') || wanted.has('anti_dandruff') || wanted.has('keto_wash')) add('anti_flake', 'gentle_wash');
  if (wanted.has('tea_tree')) add('tea_tree', 'anti_flake');
  if (wanted.has('scalp_scrub')) add('scalp_scrub');
  if (wanted.has('flax_gel') && p.texture !== 'straight') add('hold');
  if (c.curly) { add('finger_detangle'); add('leave_in'); add('hold', 'leave_in'); }
  if (p.chemical !== 'none') { add('bond_repair'); add('deep_condition'); }
  if (p.porosity === 'high') add('deep_condition');
  if (p.heatUse !== 'none') add('heat_protect');
  if (p.swims) add('clarify');
  if (p.tightStyles) add('dry_loose');
  // An oily scalp that only wants less frizz still shouldn't get heavy oil on the roots — the step text handles that.
  // Low-porosity, fine hair gets weighed down by masks every week; keep them only when hair is damaged.
  if (p.porosity === 'low' && p.thickness === 'fine' && p.chemical === 'none') drop('deep_condition');
  if (p.length === 'buzzed') ['pre_wash_oil', 'conditioner', 'detangle', 'leave_in', 'seal_ends', 'deep_condition', 'hold', 'finger_detangle'].forEach(drop);
  return out;
}

/** `wanted`: plan levers the rules switched on for this person, so the routine and plan agree. */
export function buildWashRoutine(p: Profile, wanted: Set<string> = new Set()): WashRoutine {
  const goals = p.goals?.length ? p.goals : [p.goal];
  const c: Ctx = {
    scalpCare: goals.includes('balance') || p.scalp === 'oily' || p.scalp === 'flaky',
    curly: p.texture === 'curly' || p.texture === 'coily',
    short: p.timeBudget <= 10,
  };

  // Merge recipes: primary goal's steps first, then each other goal's, de-duplicated.
  const merged: string[] = [];
  for (const g of goals) for (const id of RECIPES[g].steps) if (!merged.includes(id)) merged.push(id);
  let ids = adjust(p, merged, c, wanted);

  // Short on time: keep the essentials (the first four by priority, plus anything treating a scalp problem).
  if (c.short) ids = ids.filter((id, i) => i < 4 || id === 'anti_flake');

  const steps = ids
    .map(id => { const d = STEPS[id]?.(p, c); return d ? { id, ...d } : null; })
    .filter((s): s is WashStep => !!s)
    .sort((a, b) => PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase) || ORDER.indexOf(a.id) - ORDER.indexOf(b.id));

  const primary = RECIPES[goals[0]];
  return {
    goals,
    headline: primary.headline,
    summary: primary.summary,
    steps,
    notes: [...new Set(goals.flatMap(g => RECIPES[g].notes ?? []))],
    minutes: steps.filter(s => !s.perWeek).reduce((m, s) => m + s.minutes, 0),
  };
}

/** Steps for one particular wash: weekly treatments land on the first wash(es) of the week. */
export function stepsForWash(r: WashRoutine, washIndexThisWeek: number, washesThisWeek: number) {
  const steps = r.steps.filter(s => {
    if (!s.perWeek) return true;
    const n = Math.min(s.perWeek, washesThisWeek);
    // Spread n treatments across this week's washes.
    return Array.from({ length: n }, (_, k) => Math.floor((k * washesThisWeek) / n)).includes(washIndexThisWeek);
  });
  // A mask replaces conditioner on the day it's used.
  return steps.some(s => s.id === 'deep_condition') ? steps.filter(s => s.id !== 'conditioner') : steps;
}
