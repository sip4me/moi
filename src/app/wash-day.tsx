import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { TwoFrameArt } from '../components/TwoFrameArt';
import { Button, EvidenceChip, Screen, Sub, TopBar } from '../components/ui';
import { OIL_ART, OIL_TIMING } from '../data/art';
import { week } from '../data/schedule';
import { icon3d } from '../data/icons3d';
import { GOAL_COPY } from '../data/goals';
import { PHASE_LABEL, type Phase, type WashStep } from '../engine/washRoutine';
import { haptic } from '../lib/haptics';
import { useStore } from '../state/store';
import { C, F, TILE, surface } from '../theme';

const Check = ({ on }: { on: boolean }) => (
  <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: on ? 0 : 1.5, borderColor: '#D5D5D8', backgroundColor: on ? C.ink : '#fff', alignItems: 'center', justifyContent: 'center' }}>
    {on ? <Svg width={13} height={13} viewBox="0 0 24 24"><Path d="m5 12.5 4.5 4.5L19 7.5" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg> : null}
  </View>
);

function StepRow({ step, n, on, open, onToggle, onOpen, canCheck }: { step: WashStep; n: number; on: boolean; open: boolean; onToggle: () => void; onOpen: () => void; canCheck: boolean }) {
  const time = [step.minutes ? `${step.minutes} min` : null, step.waitMinutes ? `+${step.waitMinutes} min wait` : null, step.perWeek ? `${step.perWeek}× a week` : null].filter(Boolean).join(' · ');
  return (
    <Pressable onPress={onOpen} style={({ pressed }) => ({ ...surface, borderRadius: 22, padding: 16, backgroundColor: pressed ? '#F7F7F8' : '#fff' })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: TILE, alignItems: 'center', justifyContent: 'center' }}><Image source={icon3d(step.icon)} style={{ width: 48, height: 48 }} resizeMode="contain" /></View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.medium, fontSize: 11, color: C.gray, letterSpacing: 0.4 }}>STEP {n}</Text>
          <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink, textDecorationLine: on ? 'line-through' : 'none' }}>{step.title}</Text>
          {time ? <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray2, marginTop: 1 }}>{time}</Text> : null}
        </View>
        {canCheck ? <Pressable onPress={onToggle} hitSlop={12} accessibilityRole="checkbox" accessibilityState={{ checked: on }}><Check on={on} /></Pressable> : null}
      </View>
      <Text style={{ fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: C.ink, marginTop: 12 }}>{step.how}</Text>
      {open ? (
        <View style={{ marginTop: 10, gap: 8 }}>
          <Text style={{ fontFamily: F.regular, fontSize: 13, lineHeight: 19, color: C.gray2 }}>{step.why}</Text>
          <EvidenceChip level={step.evidence} />
        </View>
      ) : <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.gray, marginTop: 8 }}>Why this step ›</Text>}
    </Pressable>
  );
}

/** The wash-day routine for one day of the calendar, grouped by phase and checkable on the day itself. */
export default function WashDay() {
  const { day: dayKey } = useLocalSearchParams<{ day?: string }>();
  const { plan, lastWash, todayKey, done, toggleDone, logWash } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  if (!plan?.washRoutine) return null;
  const days = week(plan, lastWash, todayKey);
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
  let n = 0;

  return (
    <Screen scroll footer={isToday ? (
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

      {phases.map(p => (
        <View key={p} style={{ marginTop: 32, gap: 14 }}>
          <Text style={{ fontFamily: F.bold, fontSize: 20, letterSpacing: -0.3, color: C.ink }}>{PHASE_LABEL[p]}</Text>
          {steps.filter(s => s.phase === p).map(s => (
            <StepRow key={s.id} step={s} n={++n} on={isDone(s)} open={open === s.id} canCheck={isToday}
              onOpen={() => setOpen(open === s.id ? null : s.id)}
              onToggle={() => { if (!isDone(s)) haptic('select'); toggleDone(`wash:${s.id}`); }} />
          ))}
        </View>
      ))}

      {r.notes.map(note => (
        <View key={note} style={{ marginTop: 18, borderRadius: 18, padding: 14, backgroundColor: C.amberSoft }}>
          <Text style={{ fontFamily: F.regular, fontSize: 13, lineHeight: 19, color: C.amberText }}>{note}</Text>
        </View>
      ))}
      {!isToday ? <Sub style={{ fontSize: 12, textAlign: 'center', marginTop: 18 }}>A preview. It moves when you log a wash or change how often you wash.</Sub> : null}
    </Screen>
  );
}
