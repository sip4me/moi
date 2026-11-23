import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/**
 * "There's more below" cue for long pages. While the page is taller than the screen and the bottom
 * hasn't been reached, a small round arrow floats at the bottom centre, bobbing gently. Tapping it scrolls
 * down most of a screen. It fades away near the bottom and never shows on pages that fit.
 */
export function useScrollCue(ref: React.RefObject<ScrollViewInstance | null>, opts?: { bottom?: number; onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void }) {
  const [box, setBox] = useState(0);
  const [content, setContent] = useState(0);
  const [y, setY] = useState(0);
  const more = content - box > 24 && y < content - box - 40;

  const fade = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(fade, { toValue: more ? 1 : 0, duration: 200, useNativeDriver: true }).start(); }, [more, fade]);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [bob]);

  const props = {
    onLayout: (e: LayoutChangeEvent) => setBox(e.nativeEvent.layout.height),
    onContentSizeChange: (_w: number, h: number) => setContent(h),
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => { setY(e.nativeEvent.contentOffset.y); opts?.onScroll?.(e); },
    scrollEventThrottle: 32,
    showsVerticalScrollIndicator: true,
  };

  const cue = (
    <Animated.View pointerEvents={more ? 'box-none' : 'none'}
      style={{ position: 'absolute', left: 0, right: 0, bottom: opts?.bottom ?? 16, alignItems: 'center', opacity: fade, transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, 4] }) }] }}>
      <Pressable onPress={() => ref.current?.scrollTo({ y: Math.min(content - box, y + box * 0.8), animated: true })}
        accessibilityRole="button" accessibilityLabel="Scroll down for more" hitSlop={8}
        style={({ hovered }: any) => ({ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: hovered ? '#F1F2F5' : 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: 'rgba(31,36,48,0.08)', shadowColor: '#283050', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 })}>
        <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M6 9.5l6 6 6-6" stroke="#1F2430" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
      </Pressable>
    </Animated.View>
  );
  return { props, cue };
}
