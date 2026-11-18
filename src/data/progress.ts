import type { ScanRecord } from '../state/store';

const WEEK = 7 * 86400000;

/** Consecutive weeks (counting back from this week) with at least one scan. */
export function scanStreakWeeks(scans: ScanRecord[], now = Date.now()): number {
  const weeks = new Set(scans.map(s => Math.floor((now - new Date(s.at).getTime()) / WEEK)));
  let n = 0;
  while (weeks.has(n)) n++;
  return n;
}

/** A 0–100 hair health score from scan metrics; higher is healthier. Used for the trend chart. */
export function healthScore(m: ScanRecord['metrics']): number {
  const level = (v: string, good: string[], ok: string[]) => (good.includes(v) ? 1 : ok.includes(v) ? 0.6 : 0.25);
  const parts = [
    Math.min(1, m.density / 85),
    1 - (m.frizz - 1) / 9,
    level(m.oiliness, ['Low', 'Medium'], ['High']),
    level(m.buildup, ['None'], ['Mild']),
    level(m.porosity, ['Normal'], ['Low', 'High']),
  ];
  return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100);
}
