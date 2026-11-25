import React, { useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';

// The "Not now" discount wheel. Every slice is a real outcome (20, 30 or 50% off); the server picks the result,
// and the wheel turns to land on a slice showing it.
export const SLICES = [20, 30, 20, 50, 20, 30] as const;
const COLORS = ['#111114', '#F0A6BE', '#2A2A30', '#5F4FC4', '#111114', '#F0A6BE'];
const INK = ['#FFFFFF', '#111114', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#111114'];
const N = SLICES.length, STEP = 360 / N;

const pt = (r: number, deg: number) => { const a = ((deg - 90) * Math.PI) / 180; return [100 + r * Math.cos(a), 100 + r * Math.sin(a)]; };
const slice = (i: number) => {
  const [x1, y1] = pt(96, i * STEP), [x2, y2] = pt(96, (i + 1) * STEP);
  return `M100 100 L${x1} ${y1} A96 96 0 0 1 ${x2} ${y2} Z`;
};

/** Spins to `result` when it arrives; calls onDone when it stops. */
export function useWheel() {
  const turn = useRef(new Animated.Value(0)).current;
  const [spinning, setSpinning] = useState(false);
  const spinTo = (percent: number, onDone: () => void) => {
    const options = SLICES.map((p, i) => (p === percent ? i : -1)).filter(i => i >= 0);
    const i = options[Math.floor(Math.random() * options.length)] ?? 0;
    // Slice i's centre sits under the top pointer after this many degrees.
    const target = 360 * 5 + (360 - (i * STEP + STEP / 2));
    setSpinning(true);
    turn.setValue(0);
    Animated.timing(turn, { toValue: target, duration: 3200, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => { setSpinning(false); onDone(); });
  };
  return { turn, spinning, spinTo };
}

export function Wheel({ turn, size = 240 }: { turn: Animated.Value; size?: number }) {
  return (
    <View style={{ width: size, height: size + 14, alignItems: 'center' }} accessibilityRole="image" accessibilityLabel="Discount wheel with 20%, 30% and 50% off slices">
      {/* Pointer */}
      <View style={{ position: 'absolute', top: 0, zIndex: 2, width: 0, height: 0, borderLeftWidth: 11, borderRightWidth: 11, borderTopWidth: 18, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#111114' }} />
      <Animated.View style={{ marginTop: 12, width: size, height: size, transform: [{ rotate: turn.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) }] }}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          {SLICES.map((p, i) => (
            <G key={i}>
              <Path d={slice(i)} fill={COLORS[i]} stroke="#FFFFFF" strokeWidth={2} />
              <SvgText x={pt(62, i * STEP + STEP / 2)[0]} y={pt(62, i * STEP + STEP / 2)[1] + 6} fill={INK[i]} fontSize={17} fontWeight="800" textAnchor="middle">{`${p}%`}</SvgText>
            </G>
          ))}
          <Path d="M100 86a14 14 0 1 1 0 28a14 14 0 1 1 0-28Z" fill="#FFFFFF" stroke="#111114" strokeWidth={2} />
        </Svg>
      </Animated.View>
    </View>
  );
}

export const WheelNote = () => <Text style={{ fontSize: 12, color: '#5B5F6B', textAlign: 'center' }}>One spin per account. The discount comes off your first payment.</Text>;
