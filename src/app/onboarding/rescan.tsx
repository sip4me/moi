import { Pressable, Text, View } from 'react-native';
import { StepScreen } from '../../components/onboarding';
import { useStore } from '../../state/store';
import { useStep } from '../../state/useStep';
import { C, F } from '../../theme';

const MILESTONES = [['Today', 'Baseline'], ['Wk 2', 'Check-in'], ['Wk 6', 'Progress'], ['Wk 12', 'Results']];
const OPTIONS = [{ id: 'biweekly', label: 'Every 2 weeks', sub: 'Recommended for your goal' }, { id: 'monthly', label: 'Monthly' }];

export default function Rescan() {
  const { answers, setAnswer, setReminder } = useStore();
  const { next } = useStep('rescan');
  const freq: string = answers.rescan ?? 'biweekly';
  const turnOn = () => { setAnswer('rescan', freq); setReminder('scan', true); next(); };
  const later = () => { setReminder('scan', false); next(); };
  return (
    <StepScreen step="rescan" title="Get reminded to rescan." sub="Same time, same light, every two weeks — so we can compare like with like."
      cta="Turn on reminders" onNext={turnOn} secondary={{ label: 'Maybe later', onPress: later }}>
      <View style={{ marginTop: 22, flexDirection: 'row', backgroundColor: C.card, borderRadius: 18, paddingVertical: 14 }}>
        {MILESTONES.map(([t, s], k) => (
          <View key={t} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: k === 0 ? C.ink : '#fff', borderWidth: 1.5, borderColor: k === 0 ? C.ink : '#CFCFD4' }} />
            <Text style={{ fontFamily: F.semibold, fontSize: 13, color: C.ink }}>{t}</Text>
            <Text style={{ fontFamily: F.regular, fontSize: 11, color: C.gray }}>{s}</Text>
          </View>
        ))}
      </View>
      <Text style={{ fontFamily: F.semibold, fontSize: 11, letterSpacing: 1.3, color: C.gray2, marginTop: 22, marginBottom: 8 }}>HOW OFTEN</Text>
      <View style={{ gap: 8 }}>
        {OPTIONS.map(o => {
          const on = freq === o.id;
          return (
            <Pressable key={o.id} onPress={() => setAnswer('rescan', o.id)} style={({ pressed }) => ({ borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: on ? C.ink : pressed ? C.pressed : C.option })}>
              <Text style={{ fontFamily: F.medium, fontSize: 15, color: on ? '#fff' : C.ink }}>{o.label}</Text>
              {o.sub ? <Text style={{ fontFamily: F.regular, fontSize: 12, color: on ? '#D9D9D9' : C.gray, marginTop: 2 }}>{o.sub}</Text> : null}
            </Pressable>
          );
        })}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.option }}>
          <Text style={{ fontFamily: F.regular, fontSize: 15, color: C.ink }}>Reminder time</Text>
          <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.ink }}>Sun · 10:00 AM</Text>
        </View>
      </View>
    </StepScreen>
  );
}
