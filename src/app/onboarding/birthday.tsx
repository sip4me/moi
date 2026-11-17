import { View } from 'react-native';
import { StepScreen, Wheel } from '../../components/onboarding';
import { useStore } from '../../state/store';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 90 }, (_, i) => String(THIS_YEAR - 13 - i)).reverse(); // 13+ only
const daysIn = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

export default function Birthday() {
  const { answers, setAnswer } = useStore();
  const [y, m, d] = String(answers.birthDate ?? `${THIS_YEAR - 28}-03-14`).split('-').map(Number);
  const yi = Math.max(0, YEARS.indexOf(String(y)));
  const days = Array.from({ length: daysIn(y, m - 1) }, (_, i) => String(i + 1));
  const set = (yy: number, mm: number, dd: number) =>
    setAnswer('birthDate', `${yy}-${String(mm).padStart(2, '0')}-${String(Math.min(dd, daysIn(yy, mm - 1))).padStart(2, '0')}`);
  return (
    <StepScreen step="birthday" title="When were you born?" sub="This will be used to calibrate your custom plan." beforeNext={() => set(y, m, d)}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Wheel items={MONTHS} value={m - 1} onChange={i => set(y, i + 1, d)} width={150} />
        <Wheel items={days} value={Math.min(d, days.length) - 1} onChange={i => set(y, m, i + 1)} />
        <Wheel items={YEARS} value={yi} onChange={i => set(Number(YEARS[i]), m, d)} />
      </View>
    </StepScreen>
  );
}
