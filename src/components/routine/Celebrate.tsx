import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { haptic } from '../../lib/haptics';
import { F } from '../../theme';

// Small rewards for real progress: a burst of sparkles and a floating chip ("+8 fit", "Gap closed",
// "Routine complete"). Fired from anywhere with celebrate(); drawn once, above the page, by <CelebrateLayer/>.

type Burst = { id: number; text: string; big?: boolean };
let current: Burst | null = null;
let seq = 0;
const subs = new Set<() => void>();
export function celebrate(text: string, big = false) {
  current = { id: ++seq, text, big };
  haptic(big ? 'success' : 'select');
  subs.forEach(f => f());
}
const useBurst = () => useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f); }; }, () => current, () => current);

const COLORS = ['#6E7BD9', '#C99A2E', '#E8573A', '#F4A38C', '#8F99E6', '#5E9468'];

function Spark({ i, n, big, v }: { i: number; n: number; big?: boolean; v: Animated.Value }) {
  const a = (i / n) * Math.PI * 2 + (i % 2 ? 0.2 : 0);
  const d = (big ? 120 : 70) * (0.7 + ((i * 37) % 10) / 20);
  const size = big ? 9 : 6;
  return (
    <Animated.View style={{
      position: 'absolute', width: size, height: size, borderRadius: i % 3 ? size / 2 : 2, backgroundColor: COLORS[i % COLORS.length],
      opacity: v.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 1, 0] }),
      transform: [
        { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(a) * d] }) },
        { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(a) * d + (big ? 30 : 16)] }) },
        { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${(i % 2 ? 1 : -1) * 220}deg`] }) },
        { scale: v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.3, 1.2, 0.8] }) },
      ],
    }} />
  );
}

export function CelebrateLayer() {
  const b = useBurst();
  const [shown, setShown] = useState<Burst | null>(null);
  const v = useRef(new Animated.Value(0)).current;
  const chip = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!b) return;
    setShown(b);
    v.setValue(0); chip.setValue(0);
    Animated.parallel([
      Animated.timing(v, { toValue: 1, duration: b.big ? 1100 : 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.spring(chip, { toValue: 1, friction: 6, tension: 140, useNativeDriver: true }),
        Animated.delay(b.big ? 1200 : 800),
        Animated.timing(chip, { toValue: 2, duration: 300, useNativeDriver: true }),
      ]),
    ]).start(() => setShown(s => (s?.id === b.id ? null : s)));
  }, [b?.id]);
  if (!shown) return null;
  const n = shown.big ? 26 : 14;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <View style={{ width: 0, height: 0, alignItems: 'center', justifyContent: 'center' }}>
        {Array.from({ length: n }).map((_, i) => <Spark key={`${shown.id}-${i}`} i={i} n={n} big={shown.big} v={v} />)}
      </View>
      <Animated.View style={{
        position: 'absolute', paddingHorizontal: shown.big ? 22 : 16, paddingVertical: shown.big ? 12 : 8, borderRadius: 999, backgroundColor: '#fff',
        shadowColor: '#5B67C9', shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8,
        borderWidth: 1.5, borderColor: '#C9CEF0',
        opacity: chip.interpolate({ inputRange: [0, 0.4, 1, 2], outputRange: [0, 1, 1, 0] }),
        transform: [{ translateY: chip.interpolate({ inputRange: [0, 1, 2], outputRange: [10, -6, -40] }) }, { scale: chip.interpolate({ inputRange: [0, 1, 2], outputRange: [0.7, 1, 0.95] }) }],
      }}>
        <Text style={{ fontFamily: F.semibold, fontSize: shown.big ? 18 : 15, color: '#2A2F45' }}>{shown.text}</Text>
      </Animated.View>
    </View>
  );
}
