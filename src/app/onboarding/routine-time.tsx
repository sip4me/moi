import { Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { StepScreen } from '../../components/onboarding';
import { useStore } from '../../state/store';
import { C, F } from '../../theme';

const STOPS = [5, 15, 30] as const;

/** One, three and nine dots: more time, more steps. */
const Dots = ({ n }: { n: 1 | 3 | 9 }) => {
  const pts = n === 1 ? [[9, 9]] : n === 3 ? [[9, 5], [5, 12], [13, 12]] : [0, 1, 2].flatMap(r => [0, 1, 2].map(c => [4 + c * 5, 4 + r * 5]));
  return <Svg width={18} height={18} viewBox="0 0 18 18">{pts.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={1.8} fill={C.ink} />)}</Svg>;
};

export default function RoutineTime() {
  const { answers, setAnswer } = useStore();
  const value: number = answers.timeBudget ?? 15;
  const i = STOPS.indexOf(value as 5 | 15 | 30);
  return (
    <StepScreen step="routine-time" title="How much time can you give your hair?" beforeNext={() => setAnswer('timeBudget', value)}>
      <View style={{ flex: 1, justifyContent: 'center', gap: 18 }}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.gray2 }}>Time per day</Text>
          <Text style={{ fontFamily: F.bold, fontSize: 40, color: C.ink, letterSpacing: -1 }}>{value} min</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {([1, 3, 9] as const).map(n => <View key={n} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 }}><Dots n={n} /></View>)}
        </View>
        <View style={{ height: 32, justifyContent: 'center' }}>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: '#E3E3E6' }} />
          <View style={{ position: 'absolute', left: 0, width: `${i * 50}%`, height: 4, borderRadius: 2, backgroundColor: C.ink }} />
          <View style={{ position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between' }}>
            {STOPS.map((s, k) => (
              <Pressable key={s} onPress={() => setAnswer('timeBudget', s)} hitSlop={16} accessibilityRole="adjustable" accessibilityLabel={`${s} minutes`}
                style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                <View style={k === i
                  ? { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink }
                  : { width: 8, height: 8, borderRadius: 4, backgroundColor: k < i ? C.ink : '#CFCFD4' }} />
              </Pressable>
            ))}
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {STOPS.map(s => <Text key={s} style={{ fontFamily: F.regular, fontSize: 12, color: C.gray2, width: 50, textAlign: s === 5 ? 'left' : s === 30 ? 'right' : 'center' }}>{s} min</Text>)}
        </View>
        <View style={{ alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: value === 15 ? C.option : 'transparent' }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 12, color: value === 15 ? C.ink : 'transparent' }}>Recommended</Text>
        </View>
      </View>
    </StepScreen>
  );
}
