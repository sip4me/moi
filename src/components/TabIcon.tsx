import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const S = 25;            // icon size in px
const K = S / 24;        // viewBox (24) → px

/** One SVG layer filling the icon box; layers stack so each moving part can animate on its own. */
const Layer = ({ children }: { children: React.ReactNode }) => (
  <Svg width={S} height={S} viewBox="0 0 24 24" style={{ position: 'absolute', left: 0, top: 0 }}>{children}</Svg>
);

/** Turn a hinge point (in viewBox units) into the translate pair RN needs to rotate/scale around it. */
const around = (hx: number, hy: number) => ({ dx: (hx - 12) * K, dy: (hy - 12) * K });

/**
 * Tab bar icons that act out what they are when you pick them:
 * Home's door swings open (a warm light inside), Products' bottle cap pops off,
 * Progress's arrow climbs the stairs, Profile gives a little nod. Each replays on every tap.
 */
export function TabIcon({ name, color, active, tick }: { name: string; color: string; active: boolean; tick: number }) {
  const v = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    if (active) {
      v.setValue(0);
      Animated.spring(v, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
    } else {
      Animated.timing(v, { toValue: 0, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    }
  }, [active, tick, v]);

  if (name === 'index') {
    // House with a doorway; the door is its own layer, hinged on its left edge.
    const h = around(10, 17);
    return (
      <View style={{ width: S, height: S }}>
        <Layer><Path d="M10 14h4v6h-4z" fill="#F6C66B" /></Layer>
        <Layer><Path fillRule="evenodd" d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8ZM10 14h4v6h-4z" fill={color} /></Layer>
        <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: S, height: S, transform: [
          { translateX: h.dx }, { scaleX: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.18] }) }, { translateX: -h.dx },
        ] }}>
          <Layer><Path d="M10 14h4v6h-4z" fill={color} /><Circle cx={13.1} cy={17.2} r={0.55} fill="#fff" /></Layer>
        </Animated.View>
      </View>
    );
  }

  if (name === 'products') {
    // Bottle with a screw cap that pops up and tips off to the right.
    const h = around(14.75, 6.5);
    return (
      <View style={{ width: S, height: S }}>
        <Layer>
          <Rect x={7.5} y={10} width={9} height={11.5} rx={2.2} stroke={color} strokeWidth={2} fill="none" />
          <Rect x={9.75} y={7.2} width={4.5} height={2.8} rx={0.6} fill={color} />
        </Layer>
        <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: S, height: S, transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -3.2 * K] }) },
          { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, 2.2 * K] }) },
          { translateX: h.dx }, { translateY: h.dy },
          { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '34deg'] }) },
          { translateX: -h.dx }, { translateY: -h.dy },
        ] }}>
          <Layer><Rect x={9.25} y={3.6} width={5.5} height={3.4} rx={1.1} fill={color} /></Layer>
        </Animated.View>
      </View>
    );
  }

  if (name === 'progress') {
    // Stairs stay put; the arrow climbs up along them.
    return (
      <View style={{ width: S, height: S }}>
        <Layer><Path d="M3.5 21v-4.5h5.5v-4.5h5.5V7.5H20.5V21z" fill={color} /></Layer>
        <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: S, height: S, transform: [
          { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, 2 * K] }) },
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -1.7 * K] }) },
        ] }}>
          <Layer><Path d="M3.5 11.5 12.5 4M12.5 4H8.6M12.5 4v3.9" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Layer>
        </Animated.View>
      </View>
    );
  }

  // Profile: a little nod.
  return (
    <Animated.View style={{ width: S, height: S, transform: [{ translateY: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -2, 0] }) }] }}>
      <Layer><Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={2} fill="none" /><Path d="M5 20c1-4 4-6 7-6s6 2 7 6" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" /></Layer>
    </Animated.View>
  );
}
