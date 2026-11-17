import { router } from 'expo-router';
import { ScanCamera } from '../../components/ScanCamera';
import { useStore } from '../../state/store';
import { useStep } from '../../state/useStep';

export default function FirstScan() {
  const { next } = useStep('scan');
  const { setAnswer } = useStore();
  return (
    <ScanCamera
      onDone={taken => { setAnswer('firstScan', { at: new Date().toISOString(), photos: taken }); next(); }}
      onClose={() => router.back()}
      onSkip={next}
    />
  );
}
