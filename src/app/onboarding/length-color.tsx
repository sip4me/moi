import { View } from 'react-native';
import { StepScreen, Wheel } from '../../components/onboarding';
import { useStore } from '../../state/store';

const LENGTHS: [string, string][] = [['Buzzed', 'buzzed'], ['Short', 'short'], ['Chin', 'chin'], ['Shoulder', 'shoulder'], ['Mid-back', 'mid-back'], ['Waist', 'waist'], ['Longer', 'longer']];
const COLORS: [string, string][] = [['Black', 'black'], ['Dark brown', 'dark_brown'], ['Brown', 'brown'], ['Light brown', 'light_brown'], ['Blonde', 'blonde'], ['Red', 'red'], ['Gray', 'gray']];

export default function LengthColor() {
  const { answers, setAnswer } = useStore();
  const li = Math.max(0, LENGTHS.findIndex(([, v]) => v === (answers.length ?? 'shoulder')));
  const ci = Math.max(0, COLORS.findIndex(([, v]) => v === (answers.color ?? 'brown')));
  // Defaults are a real answer too, so save them if the person continues without scrolling.
  const save = () => { setAnswer('length', LENGTHS[li][1]); setAnswer('color', COLORS[ci][1]); };
  return (
    <StepScreen step="length-color" title="Hair length & color" sub="This will be used to calibrate your custom plan." beforeNext={save}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Wheel label="Length" items={LENGTHS.map(([t]) => t)} value={li} onChange={i => setAnswer('length', LENGTHS[i][1])} />
        <Wheel label="Color" items={COLORS.map(([t]) => t)} value={ci} onChange={i => setAnswer('color', COLORS[i][1])} />
      </View>
    </StepScreen>
  );
}
