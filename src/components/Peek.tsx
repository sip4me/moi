import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, Text, View, type ViewStyle, useWindowDimensions } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useStore } from '../state/store';
import { C, F } from '../theme';

const web = Platform.OS === 'web';

/** The page's side padding (matches Screen), so rows can bleed to the edge and still start in line. */
export const usePageInset = () => (useWindowDimensions().width < 360 ? 18 : 24);

/**
 * A horizontal row that bleeds to the edges: the first card starts at the page margin, cards snap to the
 * centre, and the neighbours peek in on both sides so you can always see there's more.
 * `inset` is how far the row reaches past its parent (the page margin by default, or a card's padding).
 */
export function PeekRow({ children, itemWidth, gap = 12, inset }: { children: React.ReactNode; itemWidth: number; gap?: number; inset?: number }) {
  const page = usePageInset();
  const pad = inset ?? page;
  const view = Math.min(useWindowDimensions().width, 430) - 2 * (page - pad);
  const items = React.Children.toArray(children);
  // Native: snap each card to the centre; the first and last clamp to the row's edges.
  const offsets = items.map((_, i) => Math.max(0, pad + i * (itemWidth + gap) + itemWidth / 2 - view / 2));
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast" snapToOffsets={web ? undefined : offsets}
      style={[{ marginHorizontal: -pad, flexGrow: 0 }, web && ({ scrollSnapType: 'x mandatory', scrollPaddingInline: pad } as any)]}
      contentContainerStyle={{ paddingHorizontal: pad, gap }}>
      {items.map((c, i) => <View key={i} style={[{ width: itemWidth }, web && ({ scrollSnapAlign: 'center' } as any)]}>{c}</View>)}
    </ScrollView>
  );
}

export const LockIcon = ({ size = 13, color = C.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"><Rect x={5} y={10.5} width={14} height={10} rx={2.5} stroke={color} strokeWidth={1.8} fill="none" /><Path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke={color} strokeWidth={1.8} fill="none" /></Svg>
);

export const openPaywall = () => router.push({ pathname: '/onboarding/paywall', params: { from: 'home' } });

/**
 * Locks a card for anyone without a subscription: the card still shows, under a light veil with an
 * "Unlock" pill, and tapping anywhere on it opens the paywall. Subscribers get the card as is.
 */
export function Locked({ children, radius = 16, label, style }: { children: React.ReactNode; radius?: number; label?: string; style?: ViewStyle }) {
  const { subscribed } = useStore();
  if (subscribed) return <View style={style}>{children}</View>;
  return (
    <Pressable onPress={openPaywall} accessibilityRole="button" accessibilityLabel={`${label ?? 'Locked'}. Subscribe to unlock.`} style={style}>
      <View pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>{children}</View>
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius, backgroundColor: 'rgba(255,255,255,0.5)', justifyContent: 'center', alignItems: 'center', padding: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: C.line }}>
          <LockIcon /><Text style={{ fontFamily: F.semibold, fontSize: 11, color: C.ink }}>Unlock</Text>
        </View>
      </View>
    </Pressable>
  );
}
