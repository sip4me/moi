import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Pressable, Text, View } from 'react-native';
import { GoalBullseye } from '../../components/GoalBullseye';
import { LanguagePill } from '../../components/LanguagePill';
import { LegalLine } from '../../components/Legal';
import { Button, CROWN, LETTERS, Screen, Seal, crown } from '../../components/ui';
import { firstStep } from '../../data/flow';
import { icon3d } from '../../data/icons3d';
import { C, F } from '../../theme';

const LOGO = 96;
const DOCK = 0.46; // logo scale once it settles in the top-left corner
const LW = 123 * (LOGO / 64), LH = 64 * (LOGO / 64);
const TYPE_MS = 190; // per letter
const FEATURES = [
  { key: 'coin', text: 'Win products you love' },
  { key: 'goal', text: 'Reach your dream hair, step by step' },
  { key: 'food', text: 'Track the nutrients your hair needs' },
] as const;

/** "Moi" typed out letter by letter, then the pink crown drops onto the o. */
function TypedLogo({ show }: { show: Animated.Value[] }) {
  const k = LOGO / 64;
  const [m, o, i, c] = show;
  const letters = [m, o, i];
  return (
    <View style={{ width: 123 * k, height: 64 * k }} accessibilityRole="image" accessibilityLabel="Moi">
      {LETTERS.map(([ch, x], n) => (
        <Animated.Text key={ch} style={{ position: 'absolute', left: x * k, top: -3.7 * k, fontFamily: F.serif, fontSize: LOGO, lineHeight: 90 * k, color: C.ink,
          opacity: letters[n], transform: [{ translateY: letters[n].interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }}>{ch}</Animated.Text>
      ))}
      <Animated.Image source={crown} resizeMode="contain" style={{ position: 'absolute', left: CROWN.left * k, top: CROWN.top * k, width: CROWN.w * k, height: CROWN.h * k,
        opacity: c, transform: [{ translateY: c.interpolate({ inputRange: [0, 1], outputRange: [-34, 0] }) }, { rotate: CROWN.rotate }, { scale: c.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.6, 1.12, 1] }) }] }} />
    </View>
  );
}

/**
 * The splash: Moi types itself out and gets its crown, then three promises appear one by one, each
 * with its 3D object (the gold check coin, the bullseye, the food bowl), and "& more!". Get started
 * goes straight to the first question.
 */
export default function Welcome() {
  const vals = useRef([...Array(4)].map(() => new Animated.Value(0))).current; // M, o, i, crown
  const rows = useRef([...Array(FEATURES.length + 1)].map(() => new Animated.Value(0))).current; // 3 rows + "& more!"
  const cta = useRef(new Animated.Value(0)).current;
  const dock = useRef(new Animated.Value(0)).current; // 0 = centre stage, 1 = top-left corner
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then(reduce => {
      if (cancelled) return;
      if (reduce) { [...vals, ...rows, cta, dock].forEach(v => v.setValue(1)); return; }
      const letter = (v: Animated.Value) => Animated.timing(v, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true });
      Animated.sequence([
        Animated.delay(300),
        Animated.stagger(TYPE_MS, vals.slice(0, 3).map(letter)),
        Animated.spring(vals[3], { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
        Animated.delay(450),
        // Moi glides up into the top-left corner, making room for what it does.
        Animated.timing(dock, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.stagger(420, rows.map(v => Animated.timing(v, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }))),
        Animated.timing(cta, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    });
    return () => { cancelled = true; };
  }, [vals, rows, cta, dock]);

  const rise = (v: Animated.Value) => ({ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] });

  return (
    <Screen footer={
      <Animated.View style={{ opacity: cta }}>
        <Button label="Get started" onPress={() => router.push(firstStep())} />
        <LegalLine style={{ marginTop: 10 }} />
        <Pressable onPress={() => router.push('/sign-in')} hitSlop={12} style={{ alignSelf: 'center', marginTop: 12, paddingVertical: 6 }}>
          {({ pressed }) => (
            <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.gray2, opacity: pressed ? 0.6 : 1 }}>
              Already have an account? <Text style={{ fontFamily: F.semibold, color: C.ink }}>Sign in</Text>
            </Text>
          )}
        </Pressable>
      </Animated.View>
    }>
      <View style={{ flex: 1 }} onLayout={e => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {/* Top bar: the docked logo lands on the left; the language pill stays on the right. */}
        <View style={{ height: LH * DOCK + 4, alignItems: 'flex-end', justifyContent: 'center' }}><LanguagePill /></View>

        <View style={{ flex: 1, justifyContent: 'center' }}>
          <View style={{ gap: 22, alignSelf: 'center' }}>
            {FEATURES.map((f, n) => (
              <Animated.View key={f.key} style={[{ flexDirection: 'row', alignItems: 'center', gap: 16 }, rise(rows[n])]}>
                <View style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                  {f.key === 'coin' ? <Seal size={46} /> : f.key === 'goal' ? <GoalBullseye size={50} /> : <Image source={icon3d('cat_food')} style={{ width: 50, height: 50 }} resizeMode="contain" />}
                </View>
                <Text style={{ fontFamily: F.semibold, fontSize: 18, lineHeight: 24, color: C.ink, flexShrink: 1 }}>{f.text}</Text>
              </Animated.View>
            ))}
            <Animated.Text style={[{ fontFamily: F.medium, fontSize: 16, color: C.gray2, paddingLeft: 68 }, rise(rows[FEATURES.length])]}>& more!</Animated.Text>
          </View>
        </View>

        {/* The logo: typed out in the middle of the screen, then it shrinks and docks top-left. */}
        {box.w ? (() => {
          const startX = box.w / 2 - LW / 2, startY = box.h * 0.42 - LH / 2;
          // Scaling happens around the logo's centre, so aim that centre at the docked spot.
          const dx = (LW * DOCK) / 2 - (startX + LW / 2) - 6 * (LOGO / 64) * DOCK;
          const dy = (LH * DOCK) / 2 - (startY + LH / 2);
          return (
            <Animated.View pointerEvents="none" style={{ position: 'absolute', left: startX, top: startY, transform: [
              { translateX: dock.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
              { translateY: dock.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
              { scale: dock.interpolate({ inputRange: [0, 1], outputRange: [1, DOCK] }) },
            ] }}>
              <TypedLogo show={vals} />
            </Animated.View>
          );
        })() : null}
      </View>
    </Screen>
  );
}
