import { goNext, progressOf, type StepKey } from '../data/flow';
import { useStore } from './store';

/** What every onboarding screen needs: its progress-bar value and a way to move on. */
export function useStep(key: StepKey) {
  const { answers } = useStore();
  return { progress: progressOf(key), next: () => goNext(key, answers) };
}
