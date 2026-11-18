import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

/**
 * Plays a Figma two-frame Smart Animate illustration: each layer sits at its frame-A pose and eases to its
 * frame-B pose (position, scale, rotation, opacity), then back, like Figma's prototype.
 * A pose is the layer's centre in the artboard, its scale, its rotation (CSS degrees, clockwise) and opacity.
 */
export type Pose = { cx: number; cy: number; sx?: number; sy?: number; rot?: number; op?: number };
export type ArtLayer = { svg: string; w: number; h: number; a: Pose; b?: Pose };
export type ArtSpec = { W: number; H: number; layers: ArtLayer[]; label: string };
export type Timing = { toB: number; holdB?: number; toA: number; holdA?: number };

export function TwoFrameArt({ spec, width = 240, timing, still }: { spec: ArtSpec; width?: number; timing: Timing; still?: boolean }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) return;
    const ease = Easing.inOut(Easing.ease);
    const native = Platform.OS !== 'web';
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: timing.toB, easing: ease, useNativeDriver: native }),
      Animated.delay(timing.holdB ?? 0),
      Animated.timing(t, { toValue: 0, duration: timing.toA, easing: ease, useNativeDriver: native }),
      Animated.delay(timing.holdA ?? 0),
    ]));
    loop.start();
    return () => loop.stop();
  }, [still, t, timing.toB, timing.holdB, timing.toA, timing.holdA]);

  const k = width / spec.W;
  const lerp = (from: number, to: number) => t.interpolate({ inputRange: [0, 1], outputRange: [from, to] });
  return (
    <View style={{ width, height: spec.H * k }} accessibilityRole="image" accessibilityLabel={spec.label}>
      {spec.layers.map((l, i) => {
        const a = l.a, b = l.b ?? l.a;
        const box = { position: 'absolute' as const, left: (a.cx - l.w / 2) * k, top: (a.cy - l.h / 2) * k, width: l.w * k, height: l.h * k };
        const art = <SvgXml xml={l.svg} width={l.w * k} height={l.h * k} />;
        if (!l.b) return <View key={i} style={[box, { opacity: a.op ?? 1, transform: [{ rotate: `${a.rot ?? 0}deg` }, { scaleX: a.sx ?? 1 }, { scaleY: a.sy ?? 1 }] }]}>{art}</View>;
        return (
          <Animated.View key={i} style={[box, {
            opacity: lerp(a.op ?? 1, b.op ?? 1),
            transform: [
              { translateX: lerp(0, (b.cx - a.cx) * k) },
              { translateY: lerp(0, (b.cy - a.cy) * k) },
              { rotate: t.interpolate({ inputRange: [0, 1], outputRange: [`${a.rot ?? 0}deg`, `${b.rot ?? 0}deg`] }) },
              { scaleX: lerp(a.sx ?? 1, b.sx ?? 1) },
              { scaleY: lerp(a.sy ?? 1, b.sy ?? 1) },
            ],
          }]}>{art}</Animated.View>
        );
      })}
    </View>
  );
}
