import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ScanCamera } from '../components/ScanCamera';
import { useStore } from '../state/store';

/** AI photo scans need an active subscription (free during the 3-day trial); otherwise the paywall opens. */
export default function Scan() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { subscribed, hydrated } = useStore();
  if (hydrated && !subscribed) return <Redirect href={{ pathname: '/onboarding/paywall', params: { from: 'home' } }} />;
  return (
    <ScanCamera
      startFromLibrary={from === 'library'}
      onDone={taken => router.replace({ pathname: '/scan-result', params: { taken: String(taken) } })}
      onClose={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
    />
  );
}
