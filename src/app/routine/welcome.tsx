import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMembers } from '../../lib/routine/access';
import { Logo } from '../../components/ui';
import { haptic } from '../../lib/haptics';
import { fill } from '../../lib/routine/shine';
import { setRoutine } from '../../lib/routine/model';
import { C, F } from '../../theme';

const crownArt = require('../../../assets/crown-pink.png');

/** The front page on warm paper: the crowned Moi wordmark, "beauty is genius" in vermilion, and a gold coin arrow into Routine. */
/** Counts up from 0 to the live number, then follows it as it grows. */
function useCountUp(target: number | null) {
  const [n, setN] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (target == null) return;
    const start = from.current, t0 = Date.now(), dur = start === 0 ? 1400 : 600;
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      const v = Math.round(start + (target - start) * e);
      setN(v); from.current = v;
      if (p >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [target]);
  return n;
}

const COIN_NEXT = require('../../../assets/coin-next.png');
const COIN_CROWN = require('../../../assets/coin-seal.png');

export default function Welcome() {
  const members = useMembers();
  const shown = useCountUp(members);
  const logo = useRef(new Animated.Value(0)).current;
  const line = useRef(new Animated.Value(0)).current;
  const arrow = useRef(new Animated.Value(0)).current;
  const nudge = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  // "beauty is genius" drifts gently up and down.
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  useEffect(() => {
    Animated.sequence([
      Animated.timing(logo, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(line, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(arrow, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(nudge, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(nudge, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])).start();
    });
  }, []);
  const rise = (v: Animated.Value) => ({ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] });
  const go = () => { haptic(); setRoutine(r => ({ ...r, welcomed: true })); router.replace('/routine'); };
  return (
    <View {...fill('paper')} style={{ flex: 1, backgroundColor: '#F3EFE7' }}>
      <SafeAreaView style={{ flex: 1 }}>
        {members != null ? (
          <Animated.View style={[{ position: 'absolute', top: 14, right: 16, zIndex: 2, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingLeft: 8, paddingRight: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: 'rgba(201,154,46,0.4)' }, rise(arrow)]} accessibilityLabel={`${members} people building routines`}>
            <Image source={COIN_CROWN} style={{ width: 30, height: 30 }} resizeMode="contain" />
            <View>
              <Text style={{ fontFamily: F.display, fontSize: 22, lineHeight: 24, color: C.ink, fontVariant: ['tabular-nums'] }}>{shown.toLocaleString()}</Text>
              <Text style={{ fontFamily: F.medium, fontSize: 11, color: '#8E7A55', letterSpacing: 0.2 }}>building routines</Text>
            </View>
          </Animated.View>
        ) : null}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 24 }}>
          <Animated.View style={rise(logo)}><Logo size={104} color={C.ink} /></Animated.View>
          <Animated.View style={rise(line)}>
            <Animated.Text style={{ fontFamily: F.display, fontSize: 28, lineHeight: 34, letterSpacing: 0.2, color: '#E8573A', marginTop: 22, transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) }] }}>beauty is genius</Animated.Text>
          </Animated.View>
          <Animated.View style={[{ marginTop: 56 }, rise(arrow)]}>
            <Pressable onPress={go} accessibilityRole="button" accessibilityLabel="Continue to Find the gaps in your hair routine"
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({ width: 72, height: 72, borderRadius: 36, shadowColor: '#7A5A12', shadowOpacity: hovered ? 0.45 : 0.32, shadowRadius: hovered ? 12 : 16, shadowOffset: { width: 0, height: 12 }, transform: [{ scale: pressed ? 0.94 : hovered ? 1.04 : 1 }, { translateX: 0 }] })}>
              <Animated.View style={{ transform: [{ translateX: nudge.interpolate({ inputRange: [0, 1], outputRange: [-2, 3] }) }] }}>
                <Image source={COIN_NEXT} style={{ width: 76, height: 76, margin: -2 }} resizeMode="contain" />
              </Animated.View>
            </Pressable>
          </Animated.View>
        </View>
        <Text style={{ textAlign: 'center', paddingBottom: 18, fontFamily: F.medium, fontSize: 12, letterSpacing: 0.4, color: '#9A9EA4' }}>© 2026 Moi</Text>
      </SafeAreaView>
    </View>
  );
}
