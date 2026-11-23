import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMembers } from '../../lib/routine/access';
import { Logo } from '../../components/ui';
import { haptic } from '../../lib/haptics';
import { fill } from '../../lib/routine/shine';
import { session, setRoutine } from '../../lib/routine/model';
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
  // First time through on this visit, the answers open empty; coming back later keeps them for editing.
  const go = () => {
    haptic();
    const fresh = !session.started; session.started = true;
    setRoutine(r => ({ ...r, welcomed: true, ...(fresh ? { goals: [], hair: {}, areas: [], prefs: {}, started: false } : {}) }));
    router.replace('/routine/about');
  };
  const { width: W, height: H } = useWindowDimensions();
  const cw = Math.min(340, W - 56), ch = Math.min(540, Math.max(440, H * 0.64));
  const back = useRef(new Animated.Value(0)).current;
  // The circles behind the glass drift very slowly, so the colour under the card shifts a little.
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(back, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(back, { toValue: 0, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  const drift = (dx: number, dy: number) => ({ transform: [{ translateX: back.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) }, { translateY: back.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) }] });
  const orb = (size: number, left: number, top: number, id: string, a: string, b: string, dx: number, dy: number) => (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left, top, width: size, height: size }, drift(dx, dy)]}>
      <Svg width={size} height={size}>
        <Defs><LinearGradient id={id} x1="0.2" y1="0" x2="0.8" y2="1"><Stop offset="0" stopColor={a} /><Stop offset="1" stopColor={b} /></LinearGradient></Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
  const cx = W / 2 - cw / 2, cy = H / 2 - ch / 2;
  return (
    <View {...fill('glass-bg')} style={{ flex: 1, backgroundColor: '#B7AFC2' }}>
      {/* Colour behind the glass: crimson to amber top left, mauve to sage right, coral bottom left. */}
      {orb(cw * 0.72, cx - cw * 0.26, cy - ch * 0.1, 'o1', '#E8A06B', '#C8164E', 10, 8)}
      {orb(cw * 0.66, Math.min(cx + cw * 0.62, W - cw * 0.66 * 0.62), cy + ch * 0.24, 'o2', '#C996A8', '#5E9468', -8, 10)}
      {orb(cw * 0.46, cx - cw * 0.04, cy + ch * 0.74, 'o3', '#F4A38C', '#E06B4F', 8, -6)}
      <SafeAreaView style={{ flex: 1, zIndex: 2 }}>
        {members != null ? (
          <Animated.View {...fill('glass-bar')} style={[{ position: 'absolute', top: 14, right: 16, zIndex: 3, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingLeft: 8, paddingRight: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)' }, rise(arrow)]} accessibilityLabel={`${members} people building routines`}>
            <Image source={COIN_CROWN} style={{ width: 30, height: 30 }} resizeMode="contain" />
            <View>
              <Text style={{ fontFamily: F.display, fontSize: 22, lineHeight: 24, color: C.ink, fontVariant: ['tabular-nums'] }}>{shown.toLocaleString()}</Text>
              <Text style={{ fontFamily: F.medium, fontSize: 11, color: '#4A4F63', letterSpacing: 0.2 }}>building routines</Text>
            </View>
          </Animated.View>
        ) : null}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View {...fill('glass-card')} style={[{ width: cw, height: ch, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.28)', padding: 16, justifyContent: 'space-between' }, rise(logo)]}>
            <View />
            <View style={{ alignItems: 'center' }}>
              <Logo size={96} color={C.ink} />
              <Animated.Text style={[{ fontFamily: F.display, fontSize: 26, lineHeight: 32, letterSpacing: 0.2, color: '#9E3550', marginTop: 20, transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] }, { opacity: line }]}>beauty is genius</Animated.Text>
              <Animated.View style={{ height: 1, width: cw * 0.62, backgroundColor: 'rgba(255,255,255,0.7)', marginTop: 18, opacity: line }} />
            </View>
            {/* Frosted bar with the way in, like the label bar on the reference card. */}
            <Animated.View {...fill('glass-bar')} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 18, paddingRight: 8, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)', backgroundColor: 'rgba(255,255,255,0.45)' }, rise(arrow)]}>
              <Text style={{ flex: 1, fontFamily: F.semibold, fontSize: 13, letterSpacing: 1.2, color: '#2A2F45' }}>{'FIND THE GAPS IN\nYOUR ROUTINE'}</Text>
              <Pressable {...fill('lilac')} onPress={go} accessibilityRole="button" accessibilityLabel="Continue to find the gaps in your routine"
                style={({ pressed }: { pressed: boolean }) => ({ width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: '#fff', backgroundColor: '#F4F5FC', alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.95 : 1 }] })}>
                <Animated.View style={{ transform: [{ translateX: nudge.interpolate({ inputRange: [0, 1], outputRange: [-2, 2] }) }] }}>
                  <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M5 12h13M13 6l6 6-6 6" stroke="#2A2F45" strokeWidth={2.1} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
                </Animated.View>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </View>
        <Text style={{ textAlign: 'center', paddingBottom: 18, fontFamily: F.medium, fontSize: 12, letterSpacing: 0.4, color: 'rgba(255,255,255,0.82)' }}>© 2026 Moi</Text>
      </SafeAreaView>
    </View>
  );
}
