import React, { useEffect, useRef, useState } from 'react';
import { Animated, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';

/**
 * "There's more below" cue for long pages: while the page is taller than the screen and the bottom hasn't been
 * reached, a soft fade shows at the bottom edge. It goes away near the bottom and never shows on pages that fit.
 */
export function useScrollCue(ref: React.RefObject<ScrollViewInstance | null>, opts?: { bottom?: number; onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void }) {
  const [box, setBox] = useState(0);
  const [content, setContent] = useState(0);
  const [y, setY] = useState(0);
  const more = content - box > 24 && y < content - box - 40;

  const fade = useRef(new Animated.Value(0)).current;
  const props = {
    onLayout: (e: LayoutChangeEvent) => setBox(e.nativeEvent.layout.height),
    onContentSizeChange: (_w: number, h: number) => setContent(h),
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => { setY(e.nativeEvent.contentOffset.y); opts?.onScroll?.(e); },
    scrollEventThrottle: 32,
    showsVerticalScrollIndicator: true,
  };

  // A soft fade at the bottom edge, not a button: it hints at more without covering any text or controls.
  const cue = (
    <Animated.View pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: opts?.bottom != null ? opts.bottom - 16 : 0, height: 28, opacity: fade, ...({ backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 100%)' } as object) }} />
  );
  return { props, cue };
}
