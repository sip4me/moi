// Moi plan engine — turns onboarding answers + first-scan metrics into a goal,
// a target line ("Frizz 6 → 3 by Feb 8") and up to 4 daily recommendation cards.
// Pure function, no network: works in React Native / Expo, a server, or a Supabase Edge Function.
import { buildWashRoutine, WASH_LEVERS, type WashRoutine } from './washRoutine';

// The rules live in rules.json (exported from the "Moi plan rules" Sheet), so they can change without code changes.

export type Goal = 'repair' | 'grow' | 'keep' | 'balance';

export interface Profile {
  goal: Goal;              // primary goal: the first one picked; sets the target
  goals?: Goal[];          // every goal picked, primary first
  texture: 'straight' | 'wavy' | 'curly' | 'coily';
  thickness: 'fine' | 'medium' | 'coarse'; // measured by the first scan; 'medium' until then
  porosity: 'low' | 'normal' | 'high';
  scalp: 'normal' | 'oily' | 'dry' | 'flaky';
  chemical: 'none' | 'color' | 'bleach' | 'relaxer';
  heatUse: 'none' | 'weekly' | 'daily';
  length: 'buzzed' | 'short' | 'chin' | 'shoulder' | 'mid-back' | 'waist' | 'longer';
  tightStyles: boolean;
  swims: boolean;          // swimming or hard water, from the treatments screen
  lifestyle: string[];     // 'sports' | 'demanding_job' | 'student' | 'pregnant' | 'caregiver'
  busy: boolean;           // demanding job, student or caring for a child
  timeBudget: number;      // minutes/day from "Routine time" (5 / 15 / 30)
  washNow?: number;        // current wash interval in days from "Wash frequency"
  noticed?: string[];      // e.g. ['sudden_shedding', 'patches', 'frizz']
  prefersNatural?: boolean; // from 21 · Hair care method
  humidity?: number;       // % from weather, optional
  coldDry?: boolean;       // from weather, optional
  targetValue?: number;    // the score (or cm for length) the person picked on the target screen
  baseline: { frizz?: number; oiliness?: number; buildup?: number; density?: number; lengthCm?: number };
}

type Val = number | string;
interface Lever {
  id: string; label: string; value: Val; unit: string; min?: number; max?: number;
  minutes: number; relevance: Record<Goal, number>; why: string; eligible?: boolean;
  kind?: 'daily' | 'learn'; evidence?: Evidence; ingredients?: string[];
}
export type Evidence = 'strong' | 'moderate' | 'expert' | 'lab' | 'early'; // expert = dermatologist / trichologist guidance
type Cond = [string, 'eq' | 'in' | 'gte' | 'lte' | 'has', unknown];
type Action = [string, 'need' | 'add' | 'set' | 'atLeast' | 'atMost' | 'exclude' | 'eligible' | 'flag' | 'lookFor' | 'avoid' | 'skip', unknown];
export interface Rules {
  version: string; planWeeks: number; maxCards: number;
  levers: Lever[];
  rules: { id: string; when: Cond[]; then: Action[]; reason: string }[];
  targets: Record<Goal, { metric: string; label: string; perFourWeeks: number; floor?: number; format: string }>;
  washStepLimit?: { daysPerTwoWeeks: number };
  evidenceWeight?: Record<Evidence, number>;
  ingredientGroups?: Record<string, string[]>; // friendly name shown to users → label terms used for matching
  targetOverrides?: { goal: Goal; when: Cond[]; target: Rules['targets'][Goal] }[];
}

export interface Card { id: string; label: string; value: Val; unit: string; why: string; evidence?: Evidence; ingredients?: string[]; target?: Val; score: number; minutes: number }
export interface LearnCard { id: string; label: string; why: string; evidence?: Evidence }
export interface Plan {
  goal: Goal; target: string; targetDate: string;
  cards: Card[];            // up to 4 daily rings
  extras: Card[];           // up to 3 next-best options for a "More you can try" list
  learn: LearnCard[];       // 'ask a dermatologist' / 'get tested' notes — never a dose
  ingredients: { lookFor: string[]; avoid: string[] }; // plain-language ingredient groups, no brands; also feeds Product fit
  flags: string[]; appliedRules: string[]; rulesVersion: string;
  washRoutine: WashRoutine; // the ordered wash-day steps for this person's goals and hair
}

function matches(p: Profile, [field, op, v]: Cond): boolean {
  // A goal rule fires for any goal the person picked, not just the primary one.
  if (field === 'goal' && p.goals?.length) {
    if (op === 'eq') return p.goals.includes(v as Goal);
    if (op === 'in') return Array.isArray(v) && p.goals.some(g => v.includes(g));
  }
  const x = (p as any)[field];
  switch (op) {
    case 'eq': return x === v;
    case 'in': return Array.isArray(v) && v.includes(x);
    case 'gte': return typeof x === 'number' && x >= (v as number);
    case 'lte': return typeof x === 'number' && x <= (v as number);
    case 'has': return Array.isArray(x) && x.includes(v);
  }
}

const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

export function buildPlan(p: Profile, R: Rules, start = new Date()): Plan {
  const levers = new Map(R.levers.map(l => [l.id, { ...l, need: 0, excluded: false }]));
  const flags: string[] = [];
  const lookFor = new Set<string>(), avoid = new Set<string>(), skip = new Set<string>();
  const applied: string[] = [];

  for (const rule of R.rules) {
    if (!rule.when.every(c => matches(p, c))) continue;
    applied.push(rule.id);
    for (const [id, op, arg] of rule.then) {
      if (id === '_plan') { if (op === 'flag') flags.push(String(arg)); if (op === 'lookFor') lookFor.add(String(arg)); if (op === 'avoid') avoid.add(String(arg)); if (op === 'skip') skip.add(String(arg)); continue; }
      const l = levers.get(id); if (!l) continue;
      const n = typeof l.value === 'number' ? l.value : NaN;
      switch (op) {
        case 'need': l.need += arg as number; break;
        case 'add': if (!isNaN(n)) l.value = n + (arg as number); break;
        case 'set': l.value = arg as Val; break;
        case 'atLeast': if (!isNaN(n)) l.value = Math.max(n, arg as number); break;
        case 'atMost': if (!isNaN(n)) l.value = Math.min(n, arg as number); break;
        case 'exclude': l.excluded = Boolean(arg); break;
        case 'eligible': l.eligible = Boolean(arg); break;
      }
    }
  }

  // clamp numbers to each lever's safe range
  for (const l of levers.values()) if (typeof l.value === 'number') {
    if (l.min !== undefined) l.value = Math.max(l.min, l.value);
    if (l.max !== undefined) l.value = Math.min(l.max, l.value);
  }

  // change wash habits gradually: today's card shows the next step, the target is kept
  const wash = levers.get('wash_interval');
  let washTarget: Val | undefined;
  if (wash && p.washNow && R.washStepLimit && typeof wash.value === 'number' && wash.value !== p.washNow) {
    washTarget = wash.value;
    const step = R.washStepLimit.daysPerTwoWeeks;
    wash.value = p.washNow + Math.sign(wash.value - p.washNow) * Math.min(step, Math.abs(wash.value - p.washNow));
  }

  // score, filter, fit the time budget, take the top cards
  const W = R.evidenceWeight ?? { strong: 1, moderate: 1, expert: 1, lab: 1, early: 1 };
  // Secondary goals count, slightly less than the primary one, so the plan leads with what matters most.
  const goals = p.goals?.length ? p.goals : [p.goal];
  const rel = (l: Lever) => Math.max(...goals.map((g, i) => l.relevance[g] * (i === 0 ? 1 : 0.85)));
  const usable = [...levers.values()].filter(l => l.eligible !== false && !l.excluded && rel(l) > 0);
  const learn: LearnCard[] = usable.filter(l => l.kind === 'learn').map(l => ({ id: l.id, label: l.label, why: l.why, evidence: l.evidence }));
  const ranked = usable.filter(l => l.kind !== 'learn')
    .map((l, i) => ({ l, i, score: rel(l) * (1 + 0.5 * l.need) * (W[l.evidence ?? 'early'] ?? 1) }))
    .sort((a, b) => b.score - a.score || a.i - b.i);

  // Wash-day steps live in the wash routine, so the daily cards are things to do between washes too.
  const washRoutine = buildWashRoutine(p, new Set(ranked.map(r => r.l.id)));
  const daily = ranked.filter(({ l }) => !WASH_LEVERS.has(l.id));

  // Three daily actions; one more for every extra half hour past 30 minutes (up to six).
  // The wash cadence card rides along and doesn't take one of those slots.
  const actions = dailyActionCount(p.timeBudget);
  const toCard = (l: typeof ranked[number]['l'], score: number): Card => ({ id: l.id, label: l.label, value: l.value, unit: l.unit, why: l.why, evidence: l.evidence, ...(l.ingredients?.length ? { ingredients: l.ingredients } : {}), score: +score.toFixed(2), minutes: l.minutes,
    ...(l.id === 'wash_interval' && washTarget !== undefined && washTarget !== l.value ? { target: washTarget } : {}) });
  const cards: Card[] = [];
  const count = () => cards.filter(c => c.id !== 'wash_interval').length;
  let minutes = 0;
  for (const { l, score } of daily) {
    if (l.id === 'wash_interval') { cards.push(toCard(l, score)); continue; }
    if (count() < actions && minutes + l.minutes <= p.timeBudget) { minutes += l.minutes; cards.push(toCard(l, score)); }
  }
  // Short on time still gets three: fill with the quickest remaining habits, best first.
  for (const { l, score } of [...daily].sort((a, b) => a.l.minutes - b.l.minutes || b.score - a.score)) {
    if (count() >= Math.min(3, actions)) break;
    if (!cards.some(c => c.id === l.id)) cards.push(toCard(l, score));
  }
  cards.sort((a, b) => b.score - a.score);
  const extras = daily.filter(({ l }) => !cards.some(c => c.id === l.id)).slice(0, 3).map(({ l, score }) => toCard(l, score));

  // target line
  const t = R.targetOverrides?.find(o => o.goal === p.goal && o.when.every(c => matches(p, c)))?.target ?? R.targets[p.goal];
  const date = new Date(start); date.setDate(date.getDate() + R.planWeeks * 7);
  const from = (p.baseline as any)[t.metric];
  const periods = R.planWeeks / 4;
  let to = from;
  let delta = t.perFourWeeks * periods;
  if (typeof from === 'number') {
    to = +(from + delta).toFixed(1);
    if (t.floor !== undefined) to = Math.max(t.floor, to);
    // A target the person picked wins, kept within what's realistic (never past the floor or above today).
    if (p.targetValue !== undefined) {
      if (t.perFourWeeks < 0) to = Math.min(from, Math.max(t.floor ?? 0, p.targetValue));
      else if (t.metric === 'lengthCm') { delta = Math.max(0, p.targetValue); to = from + delta; }
    }
  }
  const target = t.format
    .replace('{label}', t.label).replace('{from}', String(from ?? '—')).replace('{to}', String(to ?? '—'))
    .replace('{delta}', delta.toFixed(1)).replace('{date}', fmtDate(date));

  for (const c of cards) for (const ing of c.ingredients ?? []) lookFor.add(ing);
  for (const s of skip) lookFor.delete(s); // e.g. natural-leaning users don't get silicones suggested
  return { goal: p.goal, target, targetDate: date.toISOString().slice(0, 10), cards, extras, learn, ingredients: { lookFor: [...lookFor], avoid: [...avoid] }, flags, appliedRules: applied, rulesVersion: R.version, washRoutine };
}

// Product fit helper: checks a scanned ingredient label against the plan's plain-language lists.
// Users only ever see the friendly group names; the technical label terms stay in rules.json.
export function checkLabel(labelText: string, plan: Plan, R: Rules) {
  const items = labelText.toLowerCase().split(/[,\n]/).map(x => x.trim()).filter(Boolean);
  const has = (group: string, topOnly = false) => {
    const terms = (R.ingredientGroups?.[group] ?? [group]).map(t => t.toLowerCase());
    const pool = topOnly ? items.slice(0, 5) : items;
    return pool.some(i => terms.some(t => i.includes(t)));
  };
  return {
    good: plan.ingredients.lookFor.filter(g => has(g)),
    watchOut: plan.ingredients.avoid.filter(g => has(g, g.includes('near the top'))),
  };
}

export type FitIngredient = { name: string; status: 'good' | 'watch'; why: string };
export type Fit = { score: number; verdict: 'Great fit' | 'Good fit' | 'Use with care' | 'Not for you'; summary: string; ingredients: FitIngredient[] };

/**
 * Scores a label 1–10 for this plan and explains it ingredient by ingredient, in plain words.
 * Each listed ingredient is matched against the plan's look-for and avoid groups.
 */
export function fitLabel(labelText: string, plan: Plan, R: Rules): Fit {
  const items = labelText.split(/[,\n]/).map(x => x.trim()).filter(Boolean);
  const groupOf = (item: string, groups: string[]) =>
    groups.find(g => (R.ingredientGroups?.[g] ?? [g]).some(t => item.toLowerCase().includes(t.toLowerCase())));
  const ingredients: FitIngredient[] = [];
  items.forEach((item, i) => {
    const bad = groupOf(item, plan.ingredients.avoid);
    // "near the top" groups only count in the first five ingredients, where concentrations are highest.
    if (bad && (!bad.includes('near the top') || i < 5)) return ingredients.push({ name: item, status: 'watch', why: `Counts as ${bad}` });
    const good = groupOf(item, plan.ingredients.lookFor);
    if (good) ingredients.push({ name: item, status: 'good', why: `One of the ${good} your plan looks for` });
  });
  const good = ingredients.filter(x => x.status === 'good').length;
  const watch = ingredients.length - good;
  const score = Math.max(1, Math.min(10, 6 + Math.min(good, 3) - 2 * watch));
  const verdict = score >= 8 ? 'Great fit' : score >= 6 && !watch ? 'Good fit' : score >= 4 ? 'Use with care' : 'Not for you';
  const n = (k: number, one: string, many: string) => `${k} ingredient${k > 1 ? 's' : ''} ${k > 1 ? many : one}`;
  const summary = watch
    ? `${n(watch, 'works', 'work')} against your plan${good ? `; ${good} ${good > 1 ? 'help' : 'helps'}` : ''}.`
    : good ? `${good} ingredient${good > 1 ? 's' : ''} your plan looks for, nothing to avoid.` : 'Nothing in this label stands out for your plan, good or bad.';
  return { score, verdict, summary, ingredients };
}

/** 3 a day up to 30 minutes; +1 per extra half hour after that, capped at 6. */
export function dailyActionCount(timeBudget: number) {
  return timeBudget > 30 ? Math.min(6, 3 + Math.ceil((timeBudget - 30) / 30)) : 3;
}
