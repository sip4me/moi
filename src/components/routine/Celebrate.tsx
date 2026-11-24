import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Animated, Easing, Text, useWindowDimensions, View } from 'react-native';
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
let showing = false;
const setShowing = (v: boolean) => { if (showing !== v) { showing = v; subs.forEach(f => f()); } };
/** True while a toast is up: the top bar tucks its small step label away so the toast has room. */
export const useToasting = () => useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f); }; }, () => showing, () => showing);
const useBurst = () => useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f); }; }, () => current, () => current);

const COLORS = ['#6E7BD9', '#C99A2E', '#E8573A', '#F4A38C', '#8F99E6', '#5E9468'];

function Spark({ i, n, big, v }: { i: number; n: number; big?: boolean; v: Animated.Value }) {
  const a = (i / n) * Math.PI * 2 + (i % 2 ? 0.2 : 0);
  // Kept tight around the toast so nothing on the page is covered.
  const d = (big ? 54 : 38) * (0.7 + ((i * 37) % 10) / 20);
  const size = big ? 7 : 5;
  return (
    <Animated.View style={{
      position: 'absolute', width: size, height: size, borderRadius: i % 3 ? size / 2 : 2, backgroundColor: COLORS[i % COLORS.length],
      opacity: v.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 1, 0] }),
      transform: [
        { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(a) * d * 2.4] }) },
        { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(a) * d * 0.7] }) },
        { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${(i % 2 ? 1 : -1) * 220}deg`] }) },
        { scale: v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.3, 1.2, 0.8] }) },
      ],
    }} />
  );
}

export function CelebrateLayer() {
  const b = useBurst();
  const narrow = useWindowDimensions().width < 600;
  const [shown, setShown] = useState<Burst | null>(null);
  const v = useRef(new Animated.Value(0)).current;
  const chip = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!b) return;
    setShown(b); setShowing(true);
    v.setValue(0); chip.setValue(0);
    Animated.parallel([
      Animated.timing(v, { toValue: 1, duration: b.big ? 1100 : 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.spring(chip, { toValue: 1, friction: 6, tension: 140, useNativeDriver: true }),
        Animated.delay(b.big ? 1800 : 1300),
        Animated.timing(chip, { toValue: 2, duration: 300, useNativeDriver: true }),
      ]),
    ]).start(() => setShown(s => { if (s?.id !== b.id) return s; setShowing(false); return null; }));
  }, [b?.id]);
  if (!shown) return null;
  const n = shown.big ? 20 : 12;
  return (
    // A toast in the top bar's empty middle: never over the step you're filling, never blocks a tap.
    <View pointerEvents="none" accessibilityLiveRegion="polite" aria-live="polite" style={{ position: 'absolute', left: narrow ? 66 : 0, right: narrow ? 84 : 0, top: 14, alignItems: 'center', zIndex: 50 }}>
      <View style={{ position: 'absolute', top: 19, width: 0, height: 0, alignItems: 'center', justifyContent: 'center' }}>
        {Array.from({ length: n }).map((_, i) => <Spark key={`${shown.id}-${i}`} i={i} n={n} big={shown.big} v={v} />)}
      </View>
      <Animated.View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8, height: 38, paddingHorizontal: 14, borderRadius: 19, maxWidth: '100%',
        backgroundColor: shown.big ? '#5B67C9' : '#6E7BD9',
        shadowColor: '#3D4699', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8,
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.55)',
        opacity: chip.interpolate({ inputRange: [0, 0.4, 1, 2], outputRange: [0, 1, 1, 0] }),
        transform: [{ translateY: chip.interpolate({ inputRange: [0, 1, 2], outputRange: [-24, 0, -16] }) }, { scale: chip.interpolate({ inputRange: [0, 1, 2], outputRange: [0.8, 1, 0.96] }) }],
      }}>
        <Text style={{ fontSize: 15, color: '#FFE7A3' }}>✦</Text>
        <Text style={{ fontFamily: F.semibold, fontSize: 14, color: '#fff' }} numberOfLines={1}>{shown.text}</Text>
      </Animated.View>
    </View>
  );
}
