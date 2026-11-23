import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Logo } from '../../components/ui';
import { haptic } from '../../lib/haptics';
import { fill } from '../../lib/routine/shine';
import { setRoutine } from '../../lib/routine/model';
import { C, F } from '../../theme';

const crownArt = require('../../../assets/crown-pink.png');

/** The front page on warm paper: the crowned Moi wordmark, "beauty is genius" in vermilion, and a gold coin arrow into Routine. */
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
    <View {...fill('paper')} style={{ flex: 1, backgroundColor: '#F3EFE7' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 24 }}>
          <Animated.View style={rise(logo)}><Logo size={104} color={C.ink} /></Animated.View>
          <Animated.View style={rise(line)}>
            <Animated.Text style={{ fontFamily: F.display, fontSize: 28, lineHeight: 34, letterSpacing: 0.2, color: '#E8573A', marginTop: 22, transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) }] }}>beauty is genius</Animated.Text>
          </Animated.View>
          <Animated.View style={[{ marginTop: 56 }, rise(arrow)]}>
            <Pressable {...fill('gold-coin')} onPress={go} accessibilityRole="button" accessibilityLabel="Continue to Find the gaps in your hair routine"
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({ width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, borderColor: '#F3E2B3', backgroundColor: hovered ? '#B8892A' : '#C99A2E', alignItems: 'center', justifyContent: 'center', shadowColor: '#7A5A12', shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 12 }, transform: [{ scale: pressed ? 0.94 : 1 }] })}>
              <Animated.View style={{ transform: [{ translateX: nudge.interpolate({ inputRange: [0, 1], outputRange: [-3, 4] }) }] }}>
                <Svg width={24} height={24} viewBox="0 0 24 24"><Path d="M5 12h13M13 6l6 6-6 6" stroke="#1F2430" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
              </Animated.View>
            </Pressable>
          </Animated.View>
        </View>
        <Text style={{ textAlign: 'center', paddingBottom: 18, fontFamily: F.medium, fontSize: 12, letterSpacing: 0.4, color: '#9A9EA4' }}>© 2026 Moi</Text>
      </SafeAreaView>
    </View>
  );
}
