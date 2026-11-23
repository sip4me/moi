import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Logo } from '../../components/ui';
import { haptic } from '../../lib/haptics';
import { setRoutine } from '../../lib/routine/model';
import { C, F } from '../../theme';

const crownArt = require('../../../assets/crown-pink.png');

/** The front page: the crown in a glass bowl, the Moi wordmark, "beauty is genius", and an arrow into Routine. */
export default function Welcome() {
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
    <View style={{ flex: 1, backgroundColor: '#ECEDEF' }}>
      {/* Silver ground: a soft radial light from the top */}
      <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden>
        <Defs>
          <RadialGradient id="moiGround" cx="50%" cy="32%" rx="80%" ry="70%">
            <Stop offset="0" stopColor="#FAFAFB" />
            <Stop offset="0.55" stopColor="#ECEDEF" />
            <Stop offset="1" stopColor="#DCDDE0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#moiGround)" />
      </Svg>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 24 }}>
          <Animated.View style={rise(logo)}><Logo size={104} color={C.ink} /></Animated.View>
          <Animated.View style={rise(line)}>
            <Animated.Text style={{ fontFamily: F.display, fontSize: 42, lineHeight: 48, letterSpacing: -0.5, color: C.ink, marginTop: -6, transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) }] }}>beauty is genius</Animated.Text>
          </Animated.View>
          <Animated.View style={[{ marginTop: 56 }, rise(arrow)]}>
            <Pressable onPress={go} accessibilityRole="button" accessibilityLabel="Continue to Find the gaps in your hair routine"
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({ width: 64, height: 64, borderRadius: 22, borderWidth: 1.5, borderColor: hovered ? '#000000' : '#2A2B2E', backgroundColor: hovered ? '#0E0E10' : '#2A2B2E', alignItems: 'center', justifyContent: 'center', shadowColor: '#14161C', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 12 }, transform: [{ scale: pressed ? 0.94 : 1 }] })}>
              <Animated.View style={{ transform: [{ translateX: nudge.interpolate({ inputRange: [0, 1], outputRange: [-3, 4] }) }] }}>
                <Svg width={24} height={24} viewBox="0 0 24 24"><Path d="M5 12h13M13 6l6 6-6 6" stroke="#fff" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
              </Animated.View>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}
