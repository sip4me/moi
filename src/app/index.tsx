import { Redirect, router } from 'expo-router';
import React from 'react';
import { Image, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { icon3d } from '../data/icons3d';
import { haptic } from '../lib/haptics';
import { useStore } from '../state/store';
import { C, F } from '../theme';

const crown = require('../../assets/crown-pink.png');

/** The front door: Moi's daily tracker, or the new routine builder. */
export default function Index() {
  const { hydrated, onboarded } = useStore();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  if (!hydrated) return null;
  const tracker = onboarded ? '/(tabs)' : '/onboarding';
  // A tapped reminder (/?n=<id>) goes straight to the tracker.
  if (Platform.OS === 'web' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('n')) return <Redirect href={tracker} />;
  const card = (title: string, body: string, icon: string, href: string, dark?: boolean) => (
    <Pressable key={title} accessibilityRole="button" onPress={() => { haptic(); router.push(href as any); }}
      style={({ pressed }) => ({ flex: wide ? 1 : undefined, minHeight: wide ? 300 : 168, borderRadius: 32, padding: wide ? 32 : 22, backgroundColor: dark ? C.ink : '#fff', justifyContent: 'space-between', gap: 16, transform: [{ scale: pressed ? 0.985 : 1 }], shadowColor: '#2A221B', shadowOpacity: dark ? 0.18 : 0.06, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } })}>
      <View style={{ width: wide ? 88 : 64, height: wide ? 88 : 64, borderRadius: 22, backgroundColor: dark ? 'rgba(255,255,255,0.1)' : '#EEF1FD', alignItems: 'center', justifyContent: 'center' }}>
        <Image source={icon3d(icon)} style={{ width: wide ? 72 : 52, height: wide ? 72 : 52 }} />
      </View>
      <View style={{ gap: 6 }}>
        <Text style={{ fontFamily: F.display, fontSize: wide ? 40 : 32, lineHeight: wide ? 44 : 36, color: dark ? '#fff' : C.ink }}>{title}</Text>
        <Text style={{ fontFamily: F.regular, fontSize: wide ? 16 : 15, lineHeight: 22, color: dark ? 'rgba(255,255,255,0.72)' : C.gray }}>{body}</Text>
      </View>
      <Text style={{ fontFamily: F.semibold, fontSize: 15, color: dark ? '#fff' : C.ink }}>Open →</Text>
    </Pressable>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 1040, alignSelf: 'center', paddingHorizontal: wide ? 48 : 20, paddingTop: wide ? 56 : 24, paddingBottom: 32, gap: wide ? 40 : 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Image source={crown} style={{ width: 26, height: 26 }} /><Text style={{ fontFamily: F.bold, fontSize: 19, color: C.ink }}>Moi</Text></View>
        <Text style={{ fontFamily: F.display, fontSize: wide ? 60 : 40, lineHeight: wide ? 62 : 42, color: C.ink, letterSpacing: -0.5 }}>What do you want{'\n'}to do today?</Text>
        <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16 }}>
          {card('Routine tracker', 'Your daily hair plan, check-ins, progress and reminders.', 'goal_target', tracker, true)}
          {card('Routine', 'Enter your routine and products. See the gaps for your goals and what fills them.', 'conditioner', '/routine')}
        </View>
      </View>
    </SafeAreaView>
  );
}
