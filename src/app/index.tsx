import { Redirect } from 'expo-router';
import { useStore } from '../state/store';

export default function Index() {
  const { hydrated, onboarded } = useStore();
  if (!hydrated) return null;
  return <Redirect href={onboarded ? '/(tabs)' : '/onboarding'} />;
}
