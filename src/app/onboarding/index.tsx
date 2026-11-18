import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Platform, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { GoalBullseye } from '../../components/GoalBullseye';
import { LanguagePill } from '../../components/LanguagePill';
import { LegalLine } from '../../components/Legal';
import { Button, CROWN, LETTERS, Screen, Seal, crown } from '../../components/ui';
import { firstStep } from '../../data/flow';
import { icon3d } from '../../data/icons3d';
import { haptic } from '../../lib/haptics';
import { C, F } from '../../theme';

const LOGO = 96;
const DOCK = 0.34; // logo scale once it settles in the top-left corner
const LW = 123 * (LOGO / 64), LH = 64 * (LOGO / 64);
const TYPE_MS = 190; // per letter
const PROPS = [
  { key: 'coin', text: 'Win products you love' },
  { key: 'goal', text: 'Your dream hair, step by step' },
  { key: 'food', text: 'Track the nutrients your hair needs' },
  { key: 'more', text: '& more!' },
] as const;

/** Say "moi" the French way (/mwa/). Works on the web through the browser's voice; silent elsewhere. */
function sayMoi() {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const u = new SpeechSynthesisUtterance('moi');
    u.lang = 'fr-FR'; u.rate = 0.85;
    const fr = window.speechSynthesis.getVoices().find(v => v.lang?.toLowerCase().startsWith('fr'));
    if (fr) u.voice = fr;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch { /* no voice available */ }
}

const Speaker = () => (
  <Svg width={30} height={30} viewBox="0 0 24 24">
    <Path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="#fff" />
    <Path d="M15.2 9a4 4 0 0 1 0 6M17.8 6.6a7.4 7.4 0 0 1 0 10.8" stroke="#fff" strokeWidth={1.9} fill="none" strokeLinecap="round" />
  </Svg>
);

/** "Moi" typed out letter by letter, then the pink crown drops onto the o. */
function TypedLogo({ show }: { show: Animated.Value[] }) {
  const k = LOGO / 64;
  const [m, o, i, c] = show;
  const letters = [m, o, i];
  return (
    <View style={{ width: LW, height: LH }} accessibilityRole="image" accessibilityLabel="Moi">
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
 * The splash, a short story in the middle of the screen:
 * Moi types itself out and gets its crown → it docks small in the top-left corner → a black sound
 * button shows how to say it (/mwa/, French for "me") → each promise slides up into the centre and
 * away, one by one → "Ready when you are!" stays, with Get started.
 */
export default function Welcome() {
  const logo = useRef([...Array(4)].map(() => new Animated.Value(0))).current; // M, o, i, crown
  const dock = useRef(new Animated.Value(0)).current;      // 0 centre stage, 1 top-left
  const sound = useRef(new Animated.Value(0)).current;     // 0 below, 1 centre, 2 gone above
  const props = useRef(PROPS.map(() => new Animated.Value(0))).current; // same 0 → 1 → 2
  const ready = useRef(new Animated.Value(0)).current;     // the last line, stays
  const cta = useRef(new Animated.Value(0)).current;
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    let cancelled = false;
    let speak: ReturnType<typeof setTimeout> | null = null;
    const t = (v: Animated.Value, to: number, ms: number, ease = Easing.out(Easing.cubic)) => Animated.timing(v, { toValue: to, duration: ms, easing: ease, useNativeDriver: true });
    // Slide up into the centre, hold, slide up and away.
    const beat = (v: Animated.Value, hold: number) => Animated.sequence([t(v, 1, 450), Animated.delay(hold), t(v, 2, 380, Easing.in(Easing.cubic))]);
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then(reduce => {
      if (cancelled) return;
      if (reduce) { [...logo, dock, ready, cta].forEach(v => v.setValue(1)); [sound, ...props].forEach(v => v.setValue(2)); return; }
      Animated.sequence([
        Animated.delay(300),
        Animated.stagger(TYPE_MS, logo.slice(0, 3).map(v => t(v, 1, 140, Easing.out(Easing.quad)))),
        Animated.spring(logo[3], { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
        Animated.delay(450),
        t(dock, 1, 650, Easing.inOut(Easing.cubic)),
        // How to say it; Get started fades in here so nobody has to wait for the whole story.
        Animated.parallel([beat(sound, 1700), Animated.sequence([Animated.delay(400), t(cta, 1, 300)])]),
        ...props.map((v, i) => beat(v, i === props.length - 1 ? 650 : 1150)),
        t(ready, 1, 500),
      ]).start();
      // Say it as the sound button arrives, if the browser allows speech without a tap.
      speak = setTimeout(sayMoi, 300 + TYPE_MS * 3 + 600 + 450 + 650 + 450);
    });
    return () => { cancelled = true; if (speak) clearTimeout(speak); };
  }, [logo, dock, sound, props, ready, cta]);

  // In from below, out through the top.
  const slide = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 1, 0] }),
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1, 2], outputRange: [36, 0, -36] }) }],
  });
  const center = { position: 'absolute' as const, left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center' as const, justifyContent: 'center' as const };

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
        <View style={{ height: 40, alignItems: 'flex-end', justifyContent: 'center' }}><LanguagePill /></View>

        {/* Centre stage: one thing at a time. */}
        <View style={{ flex: 1 }}>
          <Animated.View style={[center, slide(sound)]} pointerEvents="box-none">
            <Pressable onPress={() => { haptic('tap'); sayMoi(); }} accessibilityRole="button" accessibilityLabel="Hear how to say Moi: mwa, French for me"
              style={({ pressed }) => ({ width: 72, height: 72, borderRadius: 36, backgroundColor: pressed ? '#2E2E2E' : C.ink, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.95 : 1 }] })}>
              <Speaker />
            </Pressable>
            <Text style={{ fontFamily: F.serif, fontSize: 30, color: C.ink, marginTop: 18 }}>/mwa/</Text>
            <Text style={{ fontFamily: F.regular, fontSize: 16, color: C.gray2, marginTop: 6 }}>French for “me”</Text>
          </Animated.View>

          {PROPS.map((p, i) => (
            <Animated.View key={p.key} style={[center, slide(props[i])]} pointerEvents="none">
              {p.key === 'more' ? null : (
                <View style={{ width: 88, height: 88, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  {p.key === 'coin' ? <Seal size={80} /> : p.key === 'goal' ? <GoalBullseye size={86} /> : <Image source={icon3d('cat_food')} style={{ width: 86, height: 86 }} resizeMode="contain" />}
                </View>
              )}
              <Text style={{ fontFamily: F.bold, fontSize: p.key === 'more' ? 34 : 26, lineHeight: p.key === 'more' ? 40 : 32, letterSpacing: -0.5, color: C.ink, textAlign: 'center', paddingHorizontal: 24 }}>{p.text}</Text>
            </Animated.View>
          ))}

          <Animated.View style={[center, { opacity: ready, transform: [{ translateY: ready.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }]} pointerEvents="none">
            <Text style={{ fontFamily: F.bold, fontSize: 34, lineHeight: 40, letterSpacing: -0.6, color: C.ink, textAlign: 'center' }}>Ready when you are!</Text>
          </Animated.View>
        </View>

        {/* The logo: typed out in the middle of the screen, then it shrinks and docks top-left. */}
        {box.w ? (() => {
          const startX = box.w / 2 - LW / 2, startY = box.h * 0.42 - LH / 2;
          // Scaling happens around the logo's centre, so aim that centre at the docked spot (vertically centred in the top bar).
          const dx = (LW * DOCK) / 2 - (startX + LW / 2);
          const dy = 20 - (startY + LH / 2);
          return (
            <Animated.View pointerEvents="none" style={{ position: 'absolute', left: startX, top: startY, transform: [
              { translateX: dock.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
              { translateY: dock.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
              { scale: dock.interpolate({ inputRange: [0, 1], outputRange: [1, DOCK] }) },
            ] }}>
              <TypedLogo show={logo} />
            </Animated.View>
          );
        })() : null}
      </View>
    </Screen>
  );
}
