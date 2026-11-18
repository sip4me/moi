import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { haptic } from '../lib/haptics';
import { C, F } from '../theme';

const PAD = 4;

/**
 * A segmented switch whose white pill stretches as it moves: the leading edge springs to the
 * new tab first, then the trailing edge catches up, so the pill reads as one soft object
 * travelling rather than snapping into place.
 */
export function SegmentedTabs({ tabs, value, onChange }: { tabs: string[]; value: number; onChange: (i: number) => void }) {
  const [w, setW] = useState(0);
  const seg = w ? (w - PAD * 2) / tabs.length : 0;
  const left = useRef(new Animated.Value(0)).current;
  const right = useRef(new Animated.Value(0)).current;
  const prev = useRef(value);
  const ready = useRef(false);

  useEffect(() => {
    if (!seg) return;
    const L = PAD + value * seg;
    const R = L + seg;
    if (!ready.current) { left.setValue(L); right.setValue(R); ready.current = true; prev.current = value; return; }
    const toRight = value > prev.current;
    prev.current = value;
    const lead = { stiffness: 380, damping: 30, mass: 1, useNativeDriver: false };
    const trail = { stiffness: 220, damping: 26, mass: 1, useNativeDriver: false };
    Animated.parallel([
      Animated.spring(right, { toValue: R, ...(toRight ? lead : trail), delay: toRight ? 0 : 70 }),
      Animated.spring(left, { toValue: L, ...(toRight ? trail : lead), delay: toRight ? 70 : 0 }),
    ]).start();
  }, [value, seg, left, right]);

  return (
    <View onLayout={e => setW(e.nativeEvent.layout.width)} accessibilityRole="tablist"
      style={{ flexDirection: 'row', backgroundColor: '#EDEDEF', borderRadius: 999, padding: PAD, height: 48 }}>
      {seg ? (
        <Animated.View pointerEvents="none" style={{
          position: 'absolute', top: PAD, bottom: PAD, left, width: Animated.subtract(right, left), borderRadius: 999, backgroundColor: '#fff',
          shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
        }} />
      ) : null}
      {tabs.map((t, i) => (
        <Pressable key={t} onPress={() => { if (i !== value) { haptic('tap'); onChange(i); } }} accessibilityRole="tab" accessibilityState={{ selected: i === value }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {({ pressed }) => <Text style={{ fontFamily: i === value ? F.semibold : F.medium, fontSize: 15, color: i === value ? C.ink : C.gray2, opacity: pressed && i !== value ? 0.6 : 1 }}>{t}</Text>}
        </Pressable>
      ))}
    </View>
  );
}
