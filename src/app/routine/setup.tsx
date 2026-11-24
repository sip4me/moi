import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { Shell, SYS } from '../../components/routine/Kit';
import { haptic } from '../../lib/haptics';
import { AREAS, useRoutine } from '../../lib/routine/model';
import { F } from '../../theme';

const MS = 4200;

/**
 * "We're setting everything up for you": a short build-up between the routine and the gap report.
 * A counter to 100%, one status line at a time, and a checklist that ticks off as each part is ready.
 */
export default function Setup() {
  const s = useRoutine();
  const areas = AREAS.filter(a => (s.areas ?? ['hair']).includes(a.key)).map(a => a.label.toLowerCase());
  const makeup = (s.areas ?? []).includes('makeup');
  const steps = [
    `Your ${areas.join(' and ') || 'routine'} routine`,
    'Gaps in what you use',
    makeup ? 'Picks for your looks' : 'Picks matched to you',
    'Prices in your budget',
  ];
  const lines = ['Reading your routine…', 'Checking 74,000+ products…', makeup ? 'Matching shades and finishes…' : 'Matching ingredients to your goals…', 'Ranking picks by how much they help…'];
  const t = useRef(new Animated.Value(0)).current;
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const id = t.addListener(({ value }) => setPct(Math.round(value * 100)));
    Animated.timing(t, { toValue: 1, duration: MS, easing: Easing.bezier(0.3, 0.1, 0.2, 1), useNativeDriver: false }).start(({ finished }) => {
      if (!finished) return;
      haptic('success');
      setTimeout(() => router.replace('/routine/gaps'), 350);
    });
    return () => t.removeListener(id);
  }, [t]);

  const done = (k: number) => pct >= (k + 1) * 24;
  return (
    <Shell active="gaps" step="3 of 3">
      <View style={{ alignItems: 'center', gap: 18, paddingVertical: 28, maxWidth: 420, alignSelf: 'center', width: '100%' }}>
        <Text {...({ dataSet: { grad: 'title' } } as any)} style={{ fontFamily: SYS ?? F.bold, fontWeight: '800', fontSize: 64, lineHeight: 70, letterSpacing: -2, color: '#1D1D22' }}>{`${pct}%`}</Text>
        <Text {...({ dataSet: { grad: 'title' } } as any)} style={{ fontFamily: SYS ?? F.bold, fontWeight: '700', fontSize: 26, lineHeight: 31, letterSpacing: -0.5, color: '#1D1D22', textAlign: 'center' }}>We’re setting everything{'\n'}up for you</Text>
        <View style={{ alignSelf: 'stretch', height: 8, borderRadius: 4, backgroundColor: 'rgba(20,20,40,0.08)', overflow: 'hidden' }}>
          <Animated.View {...({ dataSet: { fill: 'progress-grad' } } as any)} style={{ height: 8, borderRadius: 4, backgroundColor: '#8F86C6', width: t.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
        </View>
        <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 15, color: '#6C6A80', textAlign: 'center' }}>{lines[Math.min(lines.length - 1, Math.floor(pct / 26))]}</Text>
        <View style={{ alignSelf: 'stretch', gap: 12, padding: 18, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 0.5, borderColor: 'rgba(20,20,40,0.10)' }}>
          <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 15, color: '#1D1D22' }}>Building your plan</Text>
          {steps.map((x, k) => (
            <View key={x} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ flex: 1, fontFamily: SYS ?? F.medium, fontSize: 15, color: done(k) ? '#1D1D22' : '#8E8E93' }}>{`·  ${x}`}</Text>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: done(k) ? '#111114' : 'transparent', borderWidth: done(k) ? 0 : 1.5, borderColor: '#D5D8DE', alignItems: 'center', justifyContent: 'center' }}>
                {done(k) ? <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>✓</Text> : null}
              </View>
            </View>
          ))}
        </View>
      </View>
    </Shell>
  );
}
