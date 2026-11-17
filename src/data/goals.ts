import type { Goal } from '../engine/planEngine';

/** Copy and target ranges for each goal, used by the target and affirmation screens. */
export const GOAL_COPY: Record<Goal, {
  short: string;
  affirmation: string;
  target?: { label: string; metric: 'frizz' | 'oiliness' | 'lengthCm'; min: number; max: number; unit: string; scoreLabel?: string };
}> = {
  repair: { short: 'Less frizz', affirmation: 'Less frizz is a realistic target. It’s not hard at all!', target: { label: 'Less frizz', metric: 'frizz', min: 1, max: 10, unit: '/ 10', scoreLabel: 'Frizz score' } },
  grow: { short: 'More length', affirmation: 'Longer hair is a realistic target. It’s not hard at all!', target: { label: 'More length', metric: 'lengthCm', min: 1, max: 6, unit: 'cm' } },
  keep: { short: 'Keep your density', affirmation: 'Holding on to your density is a realistic target. Small habits add up.' },
  balance: { short: 'Less oil', affirmation: 'A calmer scalp is a realistic target. It’s not hard at all!', target: { label: 'Less oil', metric: 'oiliness', min: 1, max: 10, unit: '/ 10', scoreLabel: 'Oiliness score' } },
};

export const primaryGoal = (answers: Record<string, any>): Goal =>
  (Array.isArray(answers.goal) ? answers.goal[0] : answers.goal) ?? 'repair';
