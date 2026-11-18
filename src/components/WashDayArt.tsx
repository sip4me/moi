import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

/**
 * Wash-day illustration (Figma "Illustration / Wash day (animated suds)", 108:508).
 * Figma smart-animates between two frames, A (resting) and B (suds lifted), every 0.9 s.
 * Each moving piece is its own layer here: it moves by `d` and scales by `s` about its
 * centre `c`, both measured from those two frames, and loops ease-in-out the same way.
 */
const W = 280, H = 210;
const svg = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" fill="none" overflow="visible">${body}</svg>`;
const BASE = svg("<path d=\"M14 150C50 144 92 142 122 147M158 147C190 142 232 144 266 150\" stroke=\"#2F3B3B\" stroke-width=\"6\" stroke-linecap=\"round\"/><path d=\"M122 147C116 170 120 198 140 198C160 198 164 170 158 147\" stroke=\"#2F3B3B\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M140 187C131 187 126 180 127 172C128 164 133 159 136 150C138 115 150 76 184 40\" stroke=\"#2F3B3B\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M140 187C149 187 154 180 153 172C152 164 147 160 145 152C146 120 158 82 184 40\" stroke=\"#2F3B3B\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
const PARTS: { svg: string; c: [number, number]; d: [number, number]; s: number }[] = [
  { svg: "<path d=\"M36 140C36 126 46 118 58 120C62 106 76 100 90 104C100 107 106 116 108 126\" stroke=\"#2F3B3B\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>", c: [72.0, 121.0], d: [0.1, -3.8], s: 1.0702 },
  { svg: "<path d=\"M62 138C64 126 76 120 88 124\" stroke=\"#2F3B3B\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>", c: [76.0, 125.0], d: [-0.0, -3.2], s: 1.0694 },
  { svg: "<path d=\"M250 140C250 126 240 118 228 120C224 106 210 100 196 104C186 107 180 116 178 126\" stroke=\"#2F3B3B\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>", c: [214.0, 121.0], d: [0.1, -3.8], s: 1.0702 },
  { svg: "<path d=\"M214 138C212 126 200 120 188 124\" stroke=\"#2F3B3B\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>", c: [200.0, 125.0], d: [-0.1, -3.2], s: 1.0694 },
  { svg: "<circle cx=\"62\" cy=\"72\" r=\"10.5\" stroke=\"#2F3B3B\" stroke-width=\"5\"/>", c: [62.0, 72.0], d: [-3.0, -14.0], s: 1.1192 },
  { svg: "<circle cx=\"104\" cy=\"56\" r=\"12.5\" stroke=\"#2F3B3B\" stroke-width=\"5\"/>", c: [104.0, 56.0], d: [3.0, -20.0], s: 1.12 },
  { svg: "<circle cx=\"104\" cy=\"56\" r=\"3.75\" fill=\"#2F3B3B\"/>", c: [104.0, 56.0], d: [3.0, -20.0], s: 1.12 },
  { svg: "<circle cx=\"116\" cy=\"96\" r=\"6.5\" stroke=\"#2F3B3B\" stroke-width=\"5\"/>", c: [116.0, 96.0], d: [-3.0, -26.0], s: 1.1222 },
  { svg: "<circle cx=\"196\" cy=\"58\" r=\"7.5\" stroke=\"#2F3B3B\" stroke-width=\"5\"/>", c: [196.0, 58.0], d: [3.0, -14.0], s: 1.12 },
  { svg: "<circle cx=\"196\" cy=\"58\" r=\"2.5\" fill=\"#2F3B3B\"/>", c: [196.0, 58.0], d: [3.0, -14.0], s: 1.12 },
  { svg: "<circle cx=\"224\" cy=\"92\" r=\"10.5\" stroke=\"#2F3B3B\" stroke-width=\"5\"/>", c: [224.0, 92.0], d: [-3.0, -20.0], s: 1.1192 },
  { svg: "<circle cx=\"84\" cy=\"28\" r=\"5.5\" stroke=\"#2F3B3B\" stroke-width=\"5\"/>", c: [84.0, 28.0], d: [3.0, -26.1], s: 1.1187 },
  { svg: "<circle cx=\"236\" cy=\"40\" r=\"4.5\" stroke=\"#2F3B3B\" stroke-width=\"5\"/>", c: [236.0, 40.0], d: [-3.0, -14.0], s: 1.1214 },
  { svg: "<path d=\"M44 100C44 88 54 80 66 82C70 76 80 74 88 80\" stroke=\"#2F3B3B\" stroke-width=\"5\" stroke-linecap=\"round\"/>", c: [66.0, 89.0], d: [0.0, -7.2], s: 1.0808 },
  { svg: "<path d=\"M236 100C236 88 226 80 214 82C210 76 200 74 192 80\" stroke=\"#2F3B3B\" stroke-width=\"5\" stroke-linecap=\"round\"/>", c: [214.0, 89.0], d: [0.0, -7.2], s: 1.0808 },
  { svg: "<path d=\"M12 146C14 136 24 132 32 136\" stroke=\"#2F3B3B\" stroke-width=\"5\" stroke-linecap=\"round\"/>", c: [23.0, 137.0], d: [0.0, -7.0], s: 1.08 },
  { svg: "<path d=\"M268 146C266 136 256 132 248 136\" stroke=\"#2F3B3B\" stroke-width=\"5\" stroke-linecap=\"round\"/>", c: [257.0, 137.0], d: [0.0, -7.0], s: 1.08 },
  { svg: "<circle cx=\"36\" cy=\"58\" r=\"5\" stroke=\"#2F3B3B\" stroke-width=\"4\"/>", c: [36.0, 58.0], d: [3.0, -10.0], s: 1.15 },
  { svg: "<circle cx=\"150\" cy=\"22\" r=\"4\" stroke=\"#2F3B3B\" stroke-width=\"4\"/>", c: [150.0, 22.0], d: [-2.0, -15.0], s: 1.15 },
  { svg: "<circle cx=\"258\" cy=\"66\" r=\"7\" stroke=\"#2F3B3B\" stroke-width=\"4\"/>", c: [258.0, 66.0], d: [2.9, -19.9], s: 1.15 },
  { svg: "<circle cx=\"20\" cy=\"100\" r=\"3\" stroke=\"#2F3B3B\" stroke-width=\"4\"/>", c: [20.0, 100.0], d: [-1.9, -25.0], s: 1.15 },
  { svg: "<circle cx=\"172\" cy=\"102\" r=\"4\" stroke=\"#2F3B3B\" stroke-width=\"4\"/>", c: [172.0, 102.0], d: [3.0, -10.0], s: 1.15 },
  { svg: "<circle cx=\"212\" cy=\"18\" r=\"6\" stroke=\"#2F3B3B\" stroke-width=\"4\"/>", c: [212.0, 18.0], d: [-2.0, -15.0], s: 1.15 },
  { svg: "<circle cx=\"130\" cy=\"30\" r=\"3\" stroke=\"#2F3B3B\" stroke-width=\"4\"/>", c: [130.0, 30.0], d: [3.1, -19.9], s: 1.15 },
  { svg: "<circle cx=\"264\" cy=\"112\" r=\"3\" stroke=\"#2F3B3B\" stroke-width=\"4\"/>", c: [264.0, 112.0], d: [-1.9, -25.0], s: 1.15 },
  { svg: "<circle cx=\"74\" cy=\"108\" r=\"3\" stroke=\"#2F3B3B\" stroke-width=\"4\"/>", c: [74.0, 108.0], d: [3.0, -10.0], s: 1.15 },
];

export function WashDayArt({ width = 240, still }: { width?: number; still?: boolean }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) return;
    const ease = Easing.inOut(Easing.ease);
    const native = Platform.OS !== 'web';
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: 900, easing: ease, useNativeDriver: native }),
      Animated.timing(t, { toValue: 0, duration: 900, easing: ease, useNativeDriver: native }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [still, t]);

  const k = width / W;
  const height = H * k;
  return (
    <View style={{ width, height }} accessibilityRole="image" accessibilityLabel="Wash day: suds rising around a hair">
      <SvgXml xml={BASE} width={width} height={height} style={StyleSheet.absoluteFill} />
      {PARTS.map((p, i) => {
        // Scale about the piece's own centre: shift by d + (c − view centre)(1 − s).
        const tx = (p.d[0] + (p.c[0] - W / 2) * (1 - p.s)) * k;
        const ty = (p.d[1] + (p.c[1] - H / 2) * (1 - p.s)) * k;
        return (
          <Animated.View key={i} style={[StyleSheet.absoluteFill, { transform: [
            { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, tx] }) },
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, ty] }) },
            { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, p.s] }) },
          ] }]}>
            <SvgXml xml={svg(p.svg)} width={width} height={height} />
          </Animated.View>
        );
      })}
    </View>
  );
}
