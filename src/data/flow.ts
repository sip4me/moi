import { router } from 'expo-router';
import { questionById } from './questions';

/**
 * The onboarding, in Figma order. `q:<id>` steps render on the shared question screen;
 * every other key is its own route under /onboarding (or a shared screen like sign-in).
 * Reorder the flow by reordering this list; screens never hard-code what comes next.
 */
export const FLOW = [
  // 2 · easy questions
  'q:gender', 'q:washNow', 'q:hearAbout', 'q:triedApps',
  // 3 · build the profile
  'results', 'length-color', 'birthday', 'q:texture', 'q:scalp', 'q:chemical', 'q:heatUse', 'q:hairstyles', 'q:lifestyle', 'q:noticed', 'q:goal',
  // 4 · goals + motivation
  'target', 'affirmation', 'q:porosity', 'routine-time', 'comparison', 'q:stopping', 'q:prefersNatural', 'q:accomplish', 'potential',
  // 5 · trust + permissions
  'thanks', 'camera', 'photo-guide',
  // 6 · first scan + plan
  'scan', 'analyzing', 'plan',
  // 7 · conversion
  'notifications', 'rescan', 'rating', 'account', 'paywall', 'home-screen',
] as const;

export type StepKey = (typeof FLOW)[number];

/** Steps before the plan show a progress bar; it fills across the questions. */
const PROGRESS_END = FLOW.indexOf('scan');

export function routeFor(key: StepKey | undefined): any {
  if (!key) return '/(tabs)';
  if (key.startsWith('q:')) return `/onboarding/q/${key.slice(2)}`;
  if (key === 'account') return { pathname: '/sign-in', params: { mode: 'signup', next: '/onboarding/paywall' } };
  return `/onboarding/${key}`;
}

export function progressOf(key: StepKey) {
  const i = FLOW.indexOf(key);
  return Math.min(1, (i + 1) / PROGRESS_END);
}

const primaryGoal = (answers: Record<string, any>) => (Array.isArray(answers.goal) ? answers.goal[0] : answers.goal) ?? 'repair';

/** Steps that don't apply to this person, e.g. there's no score to pick when the goal is holding density. */
function skips(key: StepKey, answers: Record<string, any>) {
  if (key === 'target') return primaryGoal(answers) === 'keep';
  return false;
}

/** Go to the step after `key`, skipping any that don't apply. */
export function goNext(key: StepKey, answers: Record<string, any>) {
  let i = FLOW.indexOf(key) + 1;
  while (i < FLOW.length && skips(FLOW[i], answers)) i++;
  router.push(routeFor(FLOW[i]));
}

export const firstStep = () => routeFor(FLOW[0]);

/** Every question id used by the flow must exist; fail loudly in development if one is renamed. */
if (__DEV__) for (const k of FLOW) if (k.startsWith('q:') && !questionById(k.slice(2))) console.warn(`[moi] flow step ${k} has no question`);
