import { useId } from 'react';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * Moi's blue glass: a pale periwinkle wash with soft blue glows (from the frosted-folder reference:
 * #3D8BFF blue, #7C9CFF frosted periwinkle, on a cool #F3F5FB page). Fills its parent; put it first.
 * Ids are unique per instance because SVG ids are page-global on web.
 */
export function BlueGlass({ strength = 1 }: { strength?: number }) {
  const u = 'bg' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const o = (v: number) => String(Math.min(1, v * strength));
  return (
    <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" pointerEvents="none">
      <Defs>
        <LinearGradient id={`${u}w`} x1="0" y1="0" x2="0.4" y2="1">
          <Stop offset="0" stopColor="#F3F6FF" />
          <Stop offset="0.55" stopColor="#E6EDFF" />
          <Stop offset="1" stopColor="#DCE5FF" />
        </LinearGradient>
        <RadialGradient id={`${u}a`} cx="0.15" cy="0" r="0.7"><Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" /><Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></RadialGradient>
        <RadialGradient id={`${u}b`} cx="0.95" cy="0.15" r="0.55"><Stop offset="0" stopColor="#8FB6FF" stopOpacity={o(0.45)} /><Stop offset="1" stopColor="#8FB6FF" stopOpacity="0" /></RadialGradient>
        <RadialGradient id={`${u}c`} cx="0.5" cy="1.05" r="0.6"><Stop offset="0" stopColor="#7C9CFF" stopOpacity={o(0.4)} /><Stop offset="1" stopColor="#7C9CFF" stopOpacity="0" /></RadialGradient>
      </Defs>
      <Rect width="100" height="100" fill={`url(#${u}w)`} />
      <Rect width="100" height="100" fill={`url(#${u}a)`} />
      <Rect width="100" height="100" fill={`url(#${u}b)`} />
      <Rect width="100" height="100" fill={`url(#${u}c)`} />
    </Svg>
  );
}
