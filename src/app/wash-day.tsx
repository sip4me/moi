import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { TwoFrameArt } from '../components/TwoFrameArt';
import { Button, Screen, Sub, TopBar } from '../components/ui';
import { OIL_ART, OIL_TIMING } from '../data/art';
import { calendar } from '../data/schedule';
import { RecStack } from '../components/RecStack';
import { CoinDrop } from '../components/TokenBag';
import { GOAL_COPY } from '../data/goals';
import { PHASE_LABEL, type Phase, type WashStep } from '../engine/washRoutine';
import { haptic } from '../lib/haptics';
import { useStore } from '../state/store';
import { C, F } from '../theme';

/** The wash-day routine for one day of the calendar, grouped by phase and checkable on the day itself. */
export default function WashDay() {
  const { day: dayKey } = useLocalSearchParams<{ day?: string }>();
  const { plan, lastWash, todayKey, done, toggleDone, logWash } = useStore();
  if (!plan?.washRoutine) return null;
  const days = calendar(plan, lastWash, todayKey);
  const day = days.find(d => d.key === dayKey) ?? days.find(d => d.isWash);
  const r = plan.washRoutine;
  const steps = day?.wash.length ? day.wash : r.steps;
  const isToday = day?.isToday ?? false;
  const doneToday = done[todayKey] ?? [];
  const isDone = (s: WashStep) => doneToday.includes(`wash:${s.id}`);
  const finished = steps.filter(isDone).length;
  const phases = (Object.keys(PHASE_LABEL) as Phase[]).filter(p => steps.some(s => s.phase === p));
  const goals = r.goals.map(g => GOAL_COPY[g].short);
  const when = !day ? '' : isToday ? 'Today' : day.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <Screen scroll overlay={<CoinDrop />} footer={isToday ? (
      <Button label={finished === steps.length ? 'Log this wash' : `Log wash · ${finished}/${steps.length} steps`} onPress={() => { haptic('success'); logWash(); router.back(); }} />
    ) : undefined}>
      <TopBar />
      {steps.some(st => st.id === 'pre_wash_oil') ? <View style={{ alignItems: 'center', marginTop: -24 }}><TwoFrameArt spec={OIL_ART} timing={OIL_TIMING} width={150} /></View> : null}
      <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.gray2, marginTop: 4 }}>{when ? `${when} · ` : ''}{r.minutes} min hands-on</Text>
      <Text style={{ fontFamily: F.bold, fontSize: 28, lineHeight: 32, letterSpacing: -0.5, color: C.ink, marginTop: 4 }}>{r.headline}</Text>
      <Sub style={{ marginTop: 8 }}>{r.summary}</Sub>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {goals.map((g, i) => (
          <View key={g} style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: i === 0 ? C.ink : C.option }}>
            <Text style={{ fontFamily: F.medium, fontSize: 12, color: i === 0 ? '#fff' : C.ink }}>{g}</Text>
          </View>
        ))}
      </View>

      {/* The steps as phone-style notifications, in order: press and hold to open one, tick it for a coin. */}
      <View style={{ marginTop: 28 }}>
        <RecStack noun="step" defaultOpen canCheck={isToday} dayLabel={when}
          done={doneToday.filter(id => id.startsWith('wash:'))}
          onToggle={id => { toggleDone(id); }}
          items={phases.flatMap(p => steps.filter(st => st.phase === p).map(st => ({
            id: `wash:${st.id}`, label: st.title, sub: PHASE_LABEL[p], icon: st.icon,
            when: `${st.minutes} min${st.waitMinutes ? ` + ${st.waitMinutes} wait` : ''}`,
            body: [{ title: 'How', text: st.how }, { title: 'Why', text: st.why }],
          })))} />
      </View>

      {r.notes.map(note => (
        <View key={note} style={{ marginTop: 18, borderRadius: 18, padding: 14, backgroundColor: C.amberSoft }}>
          <Text style={{ fontFamily: F.regular, fontSize: 13, lineHeight: 19, color: C.amberText }}>{note}</Text>
        </View>
      ))}
      {!isToday ? <Sub style={{ fontSize: 12, textAlign: 'center', marginTop: 18 }}>A preview. It moves when you log a wash or change how often you wash.</Sub> : null}
    </Screen>
  );
}
