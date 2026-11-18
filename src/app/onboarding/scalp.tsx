import { Text, View } from 'react-native';
import { StepScreen } from '../../components/onboarding';
import { Chip } from '../../components/ui';
import { useStore } from '../../state/store';
import { C, F } from '../../theme';

const GROUPS = [
  { key: 'scalpFeel', label: 'SCALP BY DAY 2', options: [['Dry or tight', 'dry'], ['Balanced', 'normal'], ['Oily', 'oily']] },
  { key: 'flakes', label: 'ANY FLAKES OR ITCH?', options: [['Never', 'never'], ['Sometimes', 'sometimes'], ['Often', 'often']] },
] as const;

/** Figma 11 · Strands & scalp. Strand thickness is measured by the first scan instead of asked. */
export default function Scalp() {
  const { answers, setAnswer } = useStore();
  const done = GROUPS.every(g => answers[g.key]);
  return (
    <StepScreen step="scalp" title="Your scalp" sub="This will be used to calibrate your custom plan." disabled={!done}>
      <View style={{ flex: 1, justifyContent: 'center', gap: 26 }}>
        {GROUPS.map(g => (
          <View key={g.key} style={{ gap: 10 }}>
            <Text style={{ fontFamily: F.semibold, fontSize: 11, letterSpacing: 1.3, color: C.gray2 }}>{g.label}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {g.options.map(([label, value]) => <Chip key={value} label={label} on={answers[g.key] === value} onPress={() => setAnswer(g.key, value)} />)}
            </View>
          </View>
        ))}
      </View>
    </StepScreen>
  );
}
