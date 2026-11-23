import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Btn, Heading, Label, Pill, Shell, useWide } from '../../components/routine/Kit';
import { GOALS, HAIR_Q, setRoutine, useRoutine } from '../../lib/routine/model';

export default function Goals() {
  const s = useRoutine();
  const wide = useWide();
  const toggleGoal = (g: string) => setRoutine(r => ({ ...r, goals: r.goals.includes(g) ? r.goals.filter(x => x !== g) : r.goals.length >= 3 ? [...r.goals.slice(1), g] : [...r.goals, g] }));
  const group = (label: string, opts: string[], on: (o: string) => boolean, press: (o: string) => void) => (
    <View key={label} style={{ gap: 12 }}>
      <Label>{label}</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{opts.map(o => <Pill key={o} label={o} on={on(o)} onPress={() => press(o)} />)}</View>
    </View>
  );
  const goals = group('Goals · pick up to 3', GOALS, o => s.goals.includes(o), toggleGoal);
  const qs = HAIR_Q.map(q => group(q.label, q.options, o => s.hair[q.key] === o, o => setRoutine(r => ({ ...r, hair: { ...r.hair, [q.key]: r.hair[q.key] === o ? undefined : o } }))));
  const next = () => router.push('/routine/build');
  const ready = s.goals.length > 0;
  return (
    <Shell active="goals" step="1 of 3"
      footer={wide ? <><Btn kind="secondary" label="Back" onPress={() => router.back()} /><Btn label="Next: your routine" onPress={next} disabled={!ready} /></> : <Btn label={ready ? 'Next: your routine' : 'Pick at least one goal'} onPress={next} disabled={!ready} />}>
      <Heading title="What are you working toward?" sub="We judge your routine against these. Change them any time." />
      {wide ? (
        <View style={{ flexDirection: 'row', gap: 48 }}>
          <View style={{ flex: 1, gap: 28 }}>{goals}{qs.slice(0, 3)}</View>
          <View style={{ flex: 1, gap: 28 }}>{qs.slice(3)}</View>
        </View>
      ) : <View style={{ gap: 28 }}>{goals}{qs}</View>}
    </Shell>
  );
}
