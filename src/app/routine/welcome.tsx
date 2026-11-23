import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Logo } from '../../components/ui';
import { haptic } from '../../lib/haptics';
import { setRoutine } from '../../lib/routine/model';
import { C, F } from '../../theme';

/** First open: the Moi wordmark, "beauty is genius", and an arrow into Routine. */
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
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 }}>
        <Animated.View style={rise(logo)}><Logo size={72} color={C.ink} /></Animated.View>
        <Animated.Text style={[{ fontFamily: F.displayItalic, fontSize: 22, lineHeight: 26, color: C.ink, letterSpacing: -0.3 }, rise(line)]}>beauty is genius</Animated.Text>
        <Animated.View style={[{ marginTop: 24 }, rise(arrow)]}>
          <Pressable onPress={go} accessibilityRole="button" accessibilityLabel="Continue to Find the gaps in your hair routine"
            style={({ pressed }) => ({ width: 52, height: 52, borderRadius: 26, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.94 : 1 }] })}>
            <Animated.View style={{ transform: [{ translateX: nudge.interpolate({ inputRange: [0, 1], outputRange: [-3, 4] }) }] }}>
              <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M5 12h13M13 6l6 6-6 6" stroke="#fff" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
