import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, useWindowDimensions, View } from 'react-native';

const COLORS = ['#F0A6BE', '#E5C46B', '#B98BB4', '#7FA6E8', '#F2A285', '#FFFFFF', '#C8566A'];

/** A one-time burst of falling confetti over the whole screen. Ignores touches. */
export function Confetti({ count = 36 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  const t = useRef(new Animated.Value(0)).current;
  const bits = useMemo(() => Array.from({ length: count }, (_, i) => ({
    x: Math.random() * width, drift: (Math.random() - 0.5) * 140, delay: Math.random() * 0.25,
    w: 6 + Math.random() * 6, h: 10 + Math.random() * 8, spin: 360 + Math.random() * 540, color: COLORS[i % COLORS.length], round: i % 3 === 0,
  })), [count, width]);
  useEffect(() => { Animated.timing(t, { toValue: 1, duration: 2600, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(); }, [t]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 50 }}>
      {bits.map((b, i) => {
        const p = t.interpolate({ inputRange: [0, b.delay, 1], outputRange: [0, 0, 1], extrapolate: 'clamp' });
        return (
          <Animated.View key={i} style={{
            position: 'absolute', left: b.x, top: -24, width: b.w, height: b.round ? b.w : b.h, borderRadius: b.round ? b.w : 2, backgroundColor: b.color,
            opacity: p.interpolate({ inputRange: [0, 0.05, 0.85, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [0, height + 40] }) },
              { translateX: p.interpolate({ inputRange: [0, 1], outputRange: [0, b.drift] }) },
              { rotate: p.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${b.spin}deg`] }) },
            ],
          }} />
        );
      })}
    </View>
  );
}
