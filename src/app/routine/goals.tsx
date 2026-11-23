import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Btn, Heading, Label, Pill, Shell, st, useWide } from '../../components/routine/Kit';
import { C } from '../../theme';
import { planFor, planSteps } from '../../lib/routine/plan';
import { GOALS, goalCounts, HAIR_Q, setRoutine, useRoutine } from '../../lib/routine/model';

export default function Goals() {
  const s = useRoutine();
  const wide = useWide();
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => { goalCounts().then(setCounts); }, []);
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
  // Live preview of what the tracker's plan rules make of these picks.
  const plan = ready ? planFor(s) : null;
  const steps = plan ? [...new Set(planSteps(plan).map(x => x.title))] : [];
  const preview = plan ? (
    <View style={{ gap: 10, padding: 18, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECEEF2' }}>
      <Label>Your picks mean we look for</Label>
      {s.goals.some(g => counts[g]) ? <Text style={[st.sub, { fontSize: 14, lineHeight: 20, color: C.ink }]}>Matching products: {s.goals.filter(g => counts[g]).map(g => `${counts[g].toLocaleString()} for ${g.toLowerCase()}`).join(', ')}</Text> : null}
      {steps.length ? <Text style={[st.sub, { fontSize: 14, lineHeight: 20 }]}>Steps: {steps.join(', ')}</Text> : null}
      {plan.ingredients.lookFor.length ? <Text style={[st.sub, { fontSize: 14, lineHeight: 20 }]}>Ingredients: {plan.ingredients.lookFor.join(', ')}</Text> : null}
      {plan.ingredients.avoid.length ? <Text style={[st.sub, { fontSize: 14, lineHeight: 20, color: '#7E3A4C' }]}>Avoid: {plan.ingredients.avoid.join(', ')}</Text> : null}
    </View>
  ) : null;
  return (
    <Shell active="goals" step="1 of 3"
      footer={wide ? <><Btn kind="secondary" label="Back" onPress={() => router.back()} /><Btn label="Next: your routine" onPress={next} disabled={!ready} /></> : <Btn label={ready ? 'Next: your routine' : 'Pick at least one goal'} onPress={next} disabled={!ready} />}>
      <Heading title="What are you working toward?" sub="We judge your routine against these. Change them any time." />
      {wide ? (
        <View style={{ flexDirection: 'row', gap: 48 }}>
          <View style={{ flex: 1, gap: 28 }}>{goals}{qs.slice(0, 3)}</View>
          <View style={{ flex: 1, gap: 28 }}>{qs.slice(3)}{preview}</View>
        </View>
      ) : <View style={{ gap: 28 }}>{goals}{qs}{preview}</View>}
    </Shell>
  );
}
