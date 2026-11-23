import React, { useEffect, useRef } from 'react';
import { Animated, Easing, useWindowDimensions, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { fill } from '../../lib/routine/shine';

/**
 * The welcome screen's glassmorphism ground, shared so the start of the flow, the gap reveal and the paywall
 * feel like one brand: a grainy peach-to-teal gradient with three soft colour circles drifting behind the glass.
 * `anchor` is the box the circles gather around (defaults to the middle of the screen).
 */
export function GlassBackdrop({ anchor }: { anchor?: { w: number; h: number } }) {
  const { width: W, height: H } = useWindowDimensions();
  const cw = anchor?.w ?? Math.min(340, W - 56), ch = anchor?.h ?? Math.min(540, Math.max(440, H * 0.64));
  const cx = W / 2 - cw / 2, cy = H / 2 - ch / 2;
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(t, { toValue: 0, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [t]);
  const orb = (size: number, left: number, top: number, id: string, a: string, b: string, dx: number, dy: number) => (
    <Animated.View key={id} pointerEvents="none" style={{ position: 'absolute', left, top, width: size, height: size, transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) }, { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) }] }}>
      <Svg width={size} height={size}>
        <Defs><LinearGradient id={id} x1="0.2" y1="0" x2="0.8" y2="1"><Stop offset="0" stopColor={a} /><Stop offset="1" stopColor={b} /></LinearGradient></Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
  return (
    <View {...fill('glass-bg')} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: '#B7AFC2' }}>
      {orb(cw * 0.72, cx - cw * 0.26, cy - ch * 0.1, 'g1', '#E8A06B', '#C8164E', 10, 8)}
      {orb(cw * 0.66, Math.min(cx + cw * 0.62, W - cw * 0.66 * 0.62), cy + ch * 0.24, 'g2', '#C996A8', '#5E9468', -8, 10)}
      {orb(cw * 0.46, cx - cw * 0.04, cy + ch * 0.74, 'g3', '#F4A38C', '#E06B4F', 8, -6)}
    </View>
  );
}

/** A frosted glass card with a fine white edge (web blurs what's behind it; native gets a translucent card). */
/** `solid` frosts more, for forms with small text. */
export function GlassCard({ children, style, solid }: { children: React.ReactNode; style?: ViewStyle; solid?: boolean }) {
  return (
    <View {...fill(solid ? 'glass-panel' : 'glass-card')} style={[{ borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.55)', padding: 20 }, style]}>
      {children}
    </View>
  );
}
