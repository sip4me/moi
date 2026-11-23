// Bridges Moi Routine to the Routine tracker's plan engine (src/engine), so both use one set of rules.
// The person's goal and hair picks become a tracker Profile; buildPlan + rules.json then decide
// which ingredients to look for or avoid and which wash-day steps their routine needs.
import { buildPlan, type Goal, type Plan, type Profile, type Rules } from '../../engine/planEngine';
import rulesJson from '../../engine/rules.json';
import type { Item, RoutineState } from './model';

const R = rulesJson as unknown as Rules;

/** Routine goal pills → tracker goals (primary first, no repeats). */
const GOAL_MAP: Record<string, Goal> = {
  'Grow length': 'grow', 'Less frizz': 'repair', 'Repair damage': 'repair', 'Define curls': 'repair',
  'Calm scalp': 'balance', 'More volume': 'keep', 'Thicker look': 'keep', 'Less shedding': 'keep',
};

export function profileFromRoutine(s: RoutineState): Profile {
  const goals = [...new Set(s.goals.map(g => GOAL_MAP[g]).filter(Boolean))] as Goal[];
  const h = s.hair;
  const texture = (h.texture?.toLowerCase() ?? 'wavy') as Profile['texture'];
  const thickness: Profile['thickness'] = h.strands === 'Fine' ? 'fine' : h.strands === 'Thick' ? 'coarse' : 'medium';
  const scalp: Profile['scalp'] = h.scalp === 'Dry' ? 'dry' : h.scalp === 'Oily' ? 'oily' : h.scalp === 'Flaky' ? 'flaky' : 'normal';
  const chemical: Profile['chemical'] = h.treated === 'Bleach' ? 'bleach' : h.treated === 'Relaxer' || h.treated === 'Perm' ? 'relaxer' : h.treated === 'Color' ? 'color' : 'none';
  const heatUse: Profile['heatUse'] = h.heat === '3+ a week' ? 'daily' : h.heat === '1–2× a week' ? 'weekly' : 'none';
  const noticed = [
    ...(s.goals.includes('Less frizz') ? ['frizz'] : []),
    ...(s.goals.includes('Repair damage') ? ['damaged'] : []),
    ...(s.goals.includes('Less shedding') ? ['sudden_shedding'] : []),
    ...(scalp === 'flaky' ? ['flakes'] : []), ...(scalp === 'oily' ? ['oily_roots'] : []),
  ];
  const harsh = chemical === 'bleach' || chemical === 'relaxer' || heatUse === 'daily';
  const damage: 0 | 1 | 2 = noticed.includes('damaged') ? 2 : harsh || chemical === 'color' ? 1 : 0;
  return {
    goal: goals[0] ?? 'repair', goals: goals.length ? goals : ['repair'],
    texture, thickness, porosity: 'normal', scalp, chemical, heatUse, length: 'shoulder',
    tightStyles: s.occasions.includes('Protective style'), swims: s.occasions.includes('Swimming'),
    lifestyle: s.occasions.includes('Gym') ? ['sports'] : [], busy: false, timeBudget: 15, noticed, damage,
    baseline: { frizz: noticed.includes('frizz') ? 7 : 6, oiliness: scalp === 'oily' ? 7 : 5, buildup: scalp === 'flaky' ? 6 : 4, density: 65, lengthCm: 35 },
  };
}

let memo: { key: string; plan: Plan } | null = null;
/** The tracker's plan for this person, recomputed only when their goals, hair or occasions change. */
export function planFor(s: RoutineState): Plan {
  const key = JSON.stringify([s.goals, s.hair, s.occasions]);
  if (memo?.key !== key) memo = { key, plan: buildPlan(profileFromRoutine(s), R) };
  return memo.plan;
}

/** Catalog tags that stand for a rules.json ingredient group when we don't have the full label. */
const TAG_GROUP: Record<string, string> = { silicone: 'smoothing silicones', protein: 'protein', anti_dandruff: 'anti-dandruff ingredients', heavy_oil: 'heavy oils on the scalp' };
/** Products that sit on the scalp; "heavy oils on the scalp" only counts against these. */
const SCALP_CATS = new Set(['shampoo', 'clarifying', 'anti_dandruff', 'scalp_treatment', 'dry_shampoo']);

/** Which of the plan's look-for and avoid groups this product has, from its label or its tags. */
export function planMatch(i: Item, plan: Plan): { good: string[]; watch: string[] } {
  const items = (i.ingredients ?? '').toLowerCase().split(/[,\n]/).map(x => x.trim()).filter(Boolean);
  const has = (group: string) => {
    const terms = (R.ingredientGroups?.[group] ?? [group]).map(t => t.toLowerCase());
    const pool = group.includes('near the top') ? items.slice(0, 5) : items;
    return pool.some(x => terms.some(t => x.includes(t))) || i.tags.some(t => TAG_GROUP[t] === group);
  };
  const good = plan.ingredients.lookFor.filter(has);
  const watch = plan.ingredients.avoid.filter(g => (g !== 'heavy oils on the scalp' || SCALP_CATS.has(i.category)) && has(g));
  return { good, watch };
}

/** Wash-day steps from the tracker's routine builder → Routine product categories. */
const STEP_FILL: Record<string, { id: string; title: string; fills: string[]; needTag?: string; weight: number }> = {
  pre_wash_oil: { id: 'prewash', title: 'Pre-poo oil', fills: ['pre_wash', 'oil'], weight: 6 },
  anti_flake: { id: 'flakes', title: 'Anti-dandruff wash', fills: ['anti_dandruff'], weight: 10 },
  clarify: { id: 'clarify', title: 'Clarifying wash', fills: ['clarifying'], weight: 5 },
  bond_repair: { id: 'repair', title: 'Bond repair', fills: ['bond_builder', 'deep_conditioner'], weight: 12 },
  deep_condition: { id: 'mask', title: 'Deep-conditioning mask', fills: ['deep_conditioner'], weight: 7 },
  leave_in: { id: 'leave_in', title: 'Leave-in', fills: ['leave_in'], weight: 10 },
  hold: { id: 'styler', title: 'Curl styler', fills: ['styler'], weight: 8 },
  seal_ends: { id: 'ends_oil', title: 'Oil for your ends', fills: ['oil'], weight: 5 },
  heat_protect: { id: 'heat', title: 'Heat protectant', fills: ['heat_protectant'], weight: 12 },
};

/** The product steps the tracker's wash routine calls for, with its own plain-language reason. */
export function planSteps(plan: Plan) {
  return plan.washRoutine.steps.flatMap(st => {
    const f = STEP_FILL[st.id];
    return f ? [{ ...f, why: st.why.split(/(?<=\.)\s/)[0] }] : [];
  });
}
