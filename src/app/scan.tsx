import { router, useLocalSearchParams } from 'expo-router';
import { ScanCamera } from '../components/ScanCamera';

export default function Scan() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  return (
    <ScanCamera
      startFromLibrary={from === 'library'}
      onDone={taken => router.replace({ pathname: '/scan-result', params: { taken: String(taken) } })}
      onClose={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
    />
  );
}
