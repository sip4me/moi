import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
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
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28, paddingHorizontal: 24 }}>
          <Animated.View style={[{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center', shadowColor: '#1E2028', shadowOpacity: 0.14, shadowRadius: 30, shadowOffset: { width: 0, height: 30 }, borderRadius: 110 }, rise(logo)]}>
            {/* The glass bowl, with a coral, pink and yellow glow at its base like the fishbowl */}
            <Svg width={220} height={220} viewBox="0 0 220 220" style={{ position: 'absolute' }} aria-hidden>
              <Defs>
                <RadialGradient id="bowl" cx="35%" cy="28%" r="75%">
                  <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.97" />
                  <Stop offset="0.4" stopColor="#FFFFFF" stopOpacity="0.6" />
                  <Stop offset="1" stopColor="#D8DADF" stopOpacity="0.75" />
                </RadialGradient>
                <RadialGradient id="coral" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#F0533A" stopOpacity="0.6" /><Stop offset="1" stopColor="#F0533A" stopOpacity="0" /></RadialGradient>
                <RadialGradient id="pink" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#E0457B" stopOpacity="0.55" /><Stop offset="1" stopColor="#E0457B" stopOpacity="0" /></RadialGradient>
                <RadialGradient id="gold" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#F6C451" stopOpacity="0.6" /><Stop offset="1" stopColor="#F6C451" stopOpacity="0" /></RadialGradient>
                <RadialGradient id="cobalt" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#2B3FD6" stopOpacity="0.22" /><Stop offset="1" stopColor="#2B3FD6" stopOpacity="0" /></RadialGradient>
                <ClipPath id="inBowl"><Circle cx="110" cy="110" r="106" /></ClipPath>
                <RadialGradient id="shine" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" /><Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></RadialGradient>
              </Defs>
              <Circle cx="110" cy="110" r="109" fill="url(#bowl)" stroke="#FFFFFF" strokeOpacity="0.9" strokeWidth="1.5" />
              <G clipPath="url(#inBowl)">
                <Ellipse cx="110" cy="120" rx="80" ry="40" fill="url(#cobalt)" />
                <Ellipse cx="66" cy="196" rx="62" ry="38" fill="url(#coral)" />
                <Ellipse cx="114" cy="206" rx="60" ry="34" fill="url(#pink)" />
                <Ellipse cx="160" cy="194" rx="52" ry="34" fill="url(#gold)" />
              </G>
              <Ellipse cx="80" cy="42" rx="40" ry="14" fill="url(#shine)" transform="rotate(-22 80 42)" />
            </Svg>
            <Image source={crownArt} resizeMode="contain" style={{ width: 132, height: 132 }} accessibilityLabel="Moi crown" />
          </Animated.View>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Animated.Text style={[{ fontFamily: F.serif, fontSize: 56, lineHeight: 62, letterSpacing: -1, color: '#1C1C1E' }, rise(logo)]}>Moi</Animated.Text>
            <Animated.Text style={[{ fontFamily: F.displayItalic, fontSize: 22, lineHeight: 26, color: '#55585E' }, rise(line)]}>beauty is genius</Animated.Text>
          </View>
          <Animated.View style={[{ marginTop: 12 }, rise(arrow)]}>
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
