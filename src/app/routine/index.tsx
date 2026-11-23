import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Btn, Label, LinearTeaser, Shell, st, useWide } from '../../components/routine/Kit';
import { icon3d } from '../../data/icons3d';
import { haptic } from '../../lib/haptics';
import { session, setRoutine, useRoutine } from '../../lib/routine/model';
import { C, F } from '../../theme';
import { fill, shine } from '../../lib/routine/shine';

export default function Start() {
  const s = useRoutine();
  const wide = useWide();
  const [picked, setPicked] = useState<'check' | 'new' | null>(session.started ? s.mode : null);
  const [ask, setAsk] = useState(false);
  const choice = (mode: 'check' | 'new', title: string, body: string, icon: string) => {
    const on = picked === mode;
    return (
      <Pressable key={mode} {...fill(on ? 'pearl-on' : ask ? 'pearl-ask' : 'pearl')} onPress={() => { haptic('select'); setPicked(mode); setAsk(false); setRoutine(r => ({ ...r, mode })); }} accessibilityRole="radio" accessibilityState={{ checked: on }}
        style={({ hovered }: { pressed: boolean; hovered?: boolean }) => ({ flex: wide ? 1 : undefined, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: on ? '#FBEDEB' : hovered ? '#ECEDEF' : '#fff', borderRadius: 24, padding: 16, borderWidth: 2, borderColor: on ? '#A8576A' : hovered ? '#7E3A4C' : ask ? 'rgba(168,87,106,0.55)' : 'transparent' })}>
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: on ? '#F8E3DF' : '#EEF0F3', alignItems: 'center', justifyContent: 'center' }}><Image source={icon3d(icon)} style={{ width: 42, height: 42 }} /></View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>{title}</Text>
          <Text style={[st.sub, { fontSize: 14, lineHeight: 19 }]}>{body}</Text>
        </View>
        <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: on ? '#6E7BD9' : '#D5D8DE', backgroundColor: on ? '#6E7BD9' : '#fff', alignItems: 'center', justifyContent: 'center' }}>
          {on ? <Text style={{ color: '#fff', fontSize: 13, fontFamily: F.semibold, lineHeight: 15 }}>{'\u2713'}</Text> : null}
        </View>
      </Pressable>
    );
  };
  const go = () => {
    if (!picked) { haptic('select'); setAsk(true); return; }
    // First time through on this visit: goals and hair open empty. Coming back later keeps them for editing.
    const fresh = !session.started; session.started = true;
    setRoutine(r => ({ ...r, started: true, ...(fresh ? { goals: [], hair: {} } : {}) })); router.push('/routine/goals'); };
  return (
    <Shell active="start" hideNav={!wide && !s.started} footer={wide ? undefined : <><Btn label="Continue" onPress={go} /><Text style={[st.meta, { textAlign: 'center', fontSize: 12 }]}>Free. No account needed.</Text></>}>
      <View style={{ gap: 24, maxWidth: 600 }}>
        <View style={{ gap: 12 }}>
          <Text {...shine('chrome')} style={[st.h1, { fontSize: wide ? 60 : 40, lineHeight: wide ? 62 : 42 }]}>Find the gaps in your hair routine.</Text>
          <Text style={[st.sub, { fontSize: wide ? 17 : 15, lineHeight: wide ? 25 : 22 }]}>Add what you use, step by step. We check it against your goals and show what is missing.</Text>
        </View>
        <LinearTeaser />
        <View style={{ gap: 12 }}>
          <Label>Where are you starting?</Label>
          <View style={{ flexDirection: wide ? 'row' : 'column', gap: 12 }}>
            {choice('check', 'Check my routine', 'Add what you use now.', 'mirror')}
            {choice('new', 'Build me a new one', 'Start fresh from your goals.', 'learn')}
          </View>
          {ask ? <Text accessibilityRole="alert" style={{ fontFamily: F.semibold, fontSize: 14, color: '#A8576A' }}>Please select one of the options.</Text> : null}
        </View>
        {wide ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}><Btn label="Continue" onPress={go} /><Text style={st.meta}>Free. No account needed.</Text></View> : null}
      </View>
    </Shell>
  );
}
