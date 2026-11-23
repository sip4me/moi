import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Btn, Label, Shell, st, Timeline, useWide } from '../../components/routine/Kit';
import { icon3d } from '../../data/icons3d';
import { haptic } from '../../lib/haptics';
import { setRoutine, useRoutine, type Step } from '../../lib/routine/model';
import { C, F } from '../../theme';

// Generic steps only: no product names until the person has told us about their hair and routine.
const PREVIEW: Step[] = [
  { id: 'a', label: 'Cleanse', hint: 'shampoo', when: 'Every wash', item: { kind: 'custom', brand: '', name: 'Your shampoo', category: 'shampoo', tags: [] } },
  { id: 'b', label: 'Condition', hint: 'conditioner', when: '3 min', item: { kind: 'custom', brand: '', name: 'Your conditioner', category: 'conditioner', tags: [] } },
  { id: 'c', label: 'Heat protectant', hint: 'heat_protectant' },
  { id: 'd', label: 'Style', hint: 'flat_iron' },
];

export default function Start() {
  const s = useRoutine();
  const wide = useWide();
  const roomy = useWindowDimensions().width >= 1100;
  const choice = (mode: 'check' | 'new', title: string, body: string, icon: string) => {
    const on = s.mode === mode;
    return (
      <Pressable key={mode} onPress={() => { haptic('select'); setRoutine(r => ({ ...r, mode })); }} accessibilityRole="radio" accessibilityState={{ checked: on }}
        style={[{ flex: wide ? 1 : undefined, flexDirection: wide ? 'column' : 'row', alignItems: wide ? 'flex-start' : 'center', gap: 14, backgroundColor: '#fff', borderRadius: 24, padding: 18, borderWidth: 2, borderColor: on ? C.ink : 'transparent' }]}>
        <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: on ? '#FFF8E8' : '#EEF0F3', alignItems: 'center', justifyContent: 'center' }}><Image source={icon3d(icon)} style={{ width: 50, height: 50 }} /></View>
        <View style={{ flex: wide ? undefined : 1, gap: 4 }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 17, color: C.ink }}>{title}</Text>
          <Text style={[st.sub, { fontSize: 14, lineHeight: 20 }]}>{body}</Text>
        </View>
      </Pressable>
    );
  };
  const go = () => router.push('/routine/goals');
  const left = (
    <View style={{ gap: 28, flex: wide ? 1 : undefined, maxWidth: 560 }}>
      <View style={{ gap: 14 }}>
        <Text style={[st.h1, { fontSize: wide ? 68 : 44, lineHeight: wide ? 68 : 46 }]}>Find the gaps in your hair routine.</Text>
        <Text style={[st.sub, { fontSize: wide ? 18 : 16, lineHeight: wide ? 27 : 23 }]}>Tell us your goals and what you use. We check it against our product, tool and ingredient database, then show exactly what is missing.</Text>
      </View>
      <View style={{ gap: 12 }}>
        <Label>Where are you starting?</Label>
        <View style={{ flexDirection: wide ? 'row' : 'column', gap: 12 }}>
          {choice('check', 'Check my routine', 'Add what you use now. We show what is missing for your goals.', 'mirror')}
          {choice('new', 'Build me a new one', 'Start fresh. We build a routine around your goals and budget.', 'learn')}
        </View>
      </View>
      {wide ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}><Btn label="Continue" onPress={go} /><Text style={st.meta}>Free. No account needed.</Text></View> : null}
    </View>
  );
  return (
    <Shell active="start" footer={wide ? undefined : <><Btn label="Continue" onPress={go} /><Text style={[st.meta, { textAlign: 'center', fontSize: 12 }]}>Free. No account needed.</Text></>}>
      {wide && roomy ? (
        <View style={{ flexDirection: 'row', gap: 56, alignItems: 'flex-start', paddingTop: 24 }}>
          {left}
          <View style={{ width: 380, borderRadius: 32, padding: 24, backgroundColor: '#EEF1FD', gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={[st.h1, { fontSize: 24, flex: 1 }]}>Wash day</Text><Text style={[st.meta, { color: '#5B8DEF', fontFamily: F.semibold }]}>Example</Text></View>
            <Timeline steps={PREVIEW} onOpen={go} active="b" />
          </View>
        </View>
      ) : left}
    </Shell>
  );
}
