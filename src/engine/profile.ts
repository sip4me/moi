import type { Goal, Profile } from './planEngine';

const LENGTH_CM: Record<string, number> = { buzzed: 1, short: 8, chin: 20, shoulder: 35, 'mid-back': 50, waist: 70 };

const TIGHT_STYLES = ['braids', 'locs', 'twists', 'ponytail', 'wigs', 'slick_back'];
const THINNING_SIGNS = ['receding', 'thinning_crown', 'wider_part'];
const list = (v: unknown): string[] => (Array.isArray(v) ? v.filter(x => x !== 'none') : []);

/** Turns raw onboarding answers into the engine's Profile. Every derived field is spelled out here. */
export function profileFromAnswers(a: Record<string, any>): Profile {
  const picked: Goal[] = Array.isArray(a.goal) ? a.goal : a.goal ? [a.goal] : [];
  const goals: Goal[] = picked.length ? picked : ['repair'];
  const lifestyle = list(a.lifestyle);
  const styles = list(a.hairstyles);
  const treated = list(a.treatments);
  const raw = list(a.noticed);
  // The engine's thinning rules key off one signal; the screen asks about three specific signs.
  const noticed = raw.some(x => THINNING_SIGNS.includes(x)) ? [...raw, 'pattern_thinning'] : raw;
  // Scalp comes from "how it feels by day 2" plus "any flakes or itch": frequent flakes win.
  const scalp = a.flakes === 'often' ? 'flaky' : a.scalpFeel ?? a.scalp ?? 'normal';
  const oily = scalp === 'oily' || raw.includes('oily_roots');
  const flaky = scalp === 'flaky' || a.flakes === 'sometimes' || raw.includes('flakes') || raw.includes('buildup');
  const chemical = treated.includes('bleach') ? 'bleach' : treated.includes('relaxer') || treated.includes('keratin') ? 'relaxer' : treated.includes('color') ? 'color' : a.chemical ?? 'none';
  const heatUse = treated.includes('heat') ? 'daily' : styles.includes('heat_styled') ? 'weekly' : a.heatUse ?? 'none';
  return {
    goal: goals[0],
    goals,
    texture: a.texture ?? 'wavy',
    thickness: a.thickness ?? 'medium',
    porosity: a.porosity ?? 'normal',
    scalp,
    chemical,
    heatUse,
    length: a.length ?? 'shoulder',
    tightStyles: styles.some(x => TIGHT_STYLES.includes(x)) || treated.includes('braids'),
    swims: treated.includes('swim'),
    lifestyle,
    busy: lifestyle.some(x => x === 'demanding_job' || x === 'student' || x === 'caregiver'),
    timeBudget: a.timeBudget ?? 15,
    washNow: a.washNow,
    noticed,
    prefersNatural: !!a.prefersNatural,
    targetValue: typeof a.target === 'number' ? a.target : undefined,
    // Estimated baseline until the first real scan
    baseline: { frizz: noticed.includes('frizz') ? 7 : 6, oiliness: oily ? 7 : 5, buildup: flaky ? 6 : 4, density: 65, lengthCm: LENGTH_CM[a.length] ?? 35 },
  };
}
