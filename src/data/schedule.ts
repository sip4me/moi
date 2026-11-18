import type { Card, Plan } from '../engine/planEngine';
import { stepsForWash, type WashStep } from '../engine/washRoutine';
import { ironDay } from './ironRecipes';
import { localKey } from '../lib/dates';

/**
 * Turns the plan into the next seven days, so the calendar shows what's coming and
 * reshuffles itself whenever something changes: logging a wash moves every wash day,
 * editing a card's amount changes how often it appears, and new plans re-plan the week.
 */

/** Steps that belong to wash day (old plans saved before the wash routine existed still carry these as cards). */
const WASH_DAY = new Set(['leave_in', 'conditioner', 'gentle_wash', 'detangle', 'rinse', 'pre_wash_oil', 'tea_tree', 'flax_gel', 'deep_condition', 'anti_dandruff', 'keto_wash', 'bond_repair', 'scalp_scrub']);
/** Steps for the days in between washes. */
const BETWEEN_WASHES = new Set(['dry_shampoo']);
/** Things to do on a cycle rather than on a weekday. */
const EVERY_N_DAYS: Record<string, (v: number) => number> = { pillowcase: v => v, trim: v => v * 7 };

/** `wash`: that day's wash routine (weekly treatments included only on the washes they fall on). */
export type Day = { key: string; date: Date; isToday: boolean; isWash: boolean; items: Card[]; wash: WashStep[] };

const DAY_MS = 86400000;
const keyOf = localKey;
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY_MS);
const mod = (a: number, n: number) => ((a % n) + n) % n;
const daysBetween = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY_MS);

export function washInterval(plan: Plan) {
  const card = plan.cards.find(c => c.id === 'wash_interval') ?? plan.extras.find(c => c.id === 'wash_interval');
  const v = Number(card?.value);
  return Number.isFinite(v) && v > 0 ? v : 3;
}

/** Days until the next wash: counts from the last logged wash, or from today if none yet. */
export function daysUntilWash(plan: Plan, lastWash: string | null, todayKey: string) {
  const every = washInterval(plan);
  if (!lastWash) return every;
  return Math.max(0, every - daysBetween(lastWash, todayKey));
}

/** How many times a "×/wk" or "×/mo" step happens per week. */
function perWeek(card: Card): number | null {
  const v = Number(card.value);
  if (!Number.isFinite(v)) return null;
  if (card.unit.includes('/wk')) return v;
  if (card.unit.includes('/mo')) return v / 4.3;
  return null;
}

/** Seven days starting `start` days from today (negative = the past). */
export function week(plan: Plan, lastWash: string | null, todayKey: string, paused = false, start = 0): Day[] {
  const today = new Date(todayKey + 'T12:00:00');
  const every = washInterval(plan);
  const firstWash = daysUntilWash(plan, lastWash, todayKey);
  const days: Day[] = Array.from({ length: 7 }, (_, i) => {
    const o = start + i;
    const date = addDays(today, o);
    const key = keyOf(date);
    // The past follows the last logged wash; the future follows the plan from today.
    const isWash = paused ? false : o >= 0 ? o >= firstWash && (o - firstWash) % every === 0
      : !!lastWash && key <= lastWash && mod(daysBetween(key, lastWash), every) === 0;
    return { key, date, isToday: o === 0, isWash, items: [], wash: [] };
  });
  const washDays = days.filter(d => d.isWash);
  if (plan.washRoutine) washDays.forEach((d, i) => { d.wash = stepsForWash(plan.washRoutine, i, washDays.length); });

  for (const card of plan.cards) {
    if (card.id === 'wash_interval') { washDays.forEach(d => d.items.push(card)); continue; }

    const cycle = EVERY_N_DAYS[card.id];
    if (cycle && Number.isFinite(Number(card.value))) {
      const n = Math.max(1, Math.round(cycle(Number(card.value))));
      days.forEach((d, i) => { if (mod(start + i, n) === 0) d.items.push(card); });
      continue;
    }

    const times = perWeek(card);
    if (times !== null) {
      // Spread across the week, wash days first, so a 2×/wk mask lands on two different washes.
      const count = Math.max(0, Math.min(7, Math.round(times)));
      // Wash-day steps go on wash days when there are enough of them; otherwise spread across the week.
      const pool = WASH_DAY.has(card.id) && washDays.length >= count ? washDays : days;
      const step = pool.length / Math.max(count, 1);
      for (let k = 0; k < count; k++) pool[Math.floor(k * step)]?.items.push(card);
      continue;
    }

    if (WASH_DAY.has(card.id)) washDays.forEach(d => d.items.push(card));
    else if (BETWEEN_WASHES.has(card.id)) days.filter(d => !d.isWash).forEach(d => d.items.push(card));
    else days.forEach(d => d.items.push(card)); // daily habits
  }
  // Iron-maxxing: each day's card shows that day's meal plan total and its lunch icon.
  for (const d of days) d.items = d.items.map(c => {
    if (c.id !== 'iron_food') return c;
    const day = ironDay(d.key);
    return { ...c, label: 'Iron-maxxing', value: `≈${day.mg}`, unit: 'mg', icon: day.meals[1].icon };
  });
  // A habit that's also a wash step (scalp massage) shows once on wash day: inside the routine.
  for (const d of days) if (d.wash.length) d.items = d.items.filter(c => !d.wash.some(w => w.id === c.id));
  return days;
}

/** A scrolling calendar: `back` days of history through `ahead` days to come, built a week at a time. */
export function calendar(plan: Plan, lastWash: string | null, todayKey: string, paused = false, back = 28, ahead = 63): Day[] {
  const out: Day[] = [];
  for (let s = -back; s < ahead; s += 7) out.push(...week(plan, lastWash, todayKey, paused, s));
  return out;
}

/** Evening habits the 8 PM reminder can mention. */
const NIGHT = new Set(['satin', 'scalp_massage', 'wind_down', 'ends_oil', 'loose_styles']);

/** What the server-side reminder sender needs, saved with the profile whenever the plan changes. */
export function planSummary(plan: Plan) {
  return {
    washEvery: washInterval(plan),
    washSteps: plan.washRoutine?.steps.filter(s => !s.perWeek).map(s => s.title) ?? plan.cards.filter(c => WASH_DAY.has(c.id)).map(c => c.label),
    nightSteps: plan.cards.filter(c => NIGHT.has(c.id)).map(c => c.label),
  };
}
