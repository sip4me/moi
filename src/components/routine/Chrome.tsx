import React from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { haptic } from '../../lib/haptics';
import { fill } from '../../lib/routine/shine';
import { F } from '../../theme';

/**
 * Checkout's silver kit, after the chrome stepper reference: soft light-grey cards on a flat silver ground,
 * a quiet grey label against a crisp black value, and chunky keys with a polished chrome bezel set in a
 * recessed track. One look for every control on the page: quantity, the buy choice, the confirm key.
 */
export const SILVER = { ground: '#C9C9CA', card: '#F2F2F2', label: '#A3A3A3', ink: '#0E0E0E', track: '#EDEDED', cell: '#EAEAEA', icon: '#8E8E8E' };

export function SilverCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View {...fill('silver-card')} style={[{ borderRadius: 32, padding: 26, gap: 22, backgroundColor: SILVER.card }, style]}>{children}</View>;
}

/** Grey label left, black value right, as in "Credits  $30.00". */
export function LabelValue({ label, value, big, onPress }: { label: string; value: string; big?: boolean; onPress?: () => void }) {
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 16 }}>
      <Text style={{ flex: 1, fontFamily: F.medium, fontSize: big ? 18 : 15, lineHeight: big ? 23 : 20, letterSpacing: -0.2, color: SILVER.label }}>{label}</Text>
      <Text style={{ fontFamily: F.medium, fontSize: big ? 20 : 15, lineHeight: big ? 25 : 20, letterSpacing: -0.3, color: SILVER.ink, fontVariant: ['tabular-nums'], textAlign: 'right', flexShrink: 1, maxWidth: '55%' }}>{value}</Text>
    </View>
  );
  return onPress ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Edit ${label}`}>{({ hovered }: any) => <View style={{ opacity: hovered ? 0.7 : 1 }}>{body}</View>}</Pressable> : body;
}

/** A chrome-bezel key. `on` pushes it in (used for the selected choice). */
export function ChromeKey({ children, onPress, a11y, disabled, on, style, flex = 1 }: { children: React.ReactNode; onPress: () => void; a11y: string; disabled?: boolean; on?: boolean; style?: ViewStyle; flex?: number }) {
  return (
    <Pressable {...(on ? fill('chrome-key-on') : fill('chrome-key'))} onPress={() => { if (disabled) return; haptic('select'); onPress(); }} accessibilityRole="button" accessibilityLabel={a11y} accessibilityState={{ disabled, selected: on }}
      style={({ pressed }: any) => [{ flex, minHeight: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DADADA', borderWidth: 1.5, borderColor: '#161616', opacity: disabled ? 0.45 : 1, transform: [{ translateY: pressed ? 1 : 0 }] }, style]}>
      {children}
    </Pressable>
  );
}

/** The recessed track the keys sit in. */
export const ChromeTrack = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <View {...fill('chrome-track')} style={[{ flexDirection: 'row', alignItems: 'stretch', gap: 8, padding: 6, borderRadius: 24, backgroundColor: SILVER.track, borderWidth: 1, borderColor: '#E3E3E3' }, style]}>{children}</View>
);

const Glyph = ({ d, color = SILVER.icon, size = 26 }: { d: string; color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"><Path d={d} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
);
const MINUS = 'M5 12h14', PLUS = 'M12 5v14M5 12h14', TRASH = 'M4 7h16M9 7V4.8h6V7M6.5 7l1 12.2h9l1-12.2M10 11v5.5M14 11v5.5';

/** One pick: its name in grey and price in black, then − count + in chrome. At 1, − becomes a red trash. */
export function StepperCard({ name, sub, price, n, onChange, onRemove, footer }: { name: string; sub?: string; price: string; n: number; onChange: (n: number) => void; onRemove: () => void; footer?: React.ReactNode }) {
  return (
    <SilverCard>
      <View style={{ gap: 4 }}>
        <LabelValue label={name} value={price} big />
        {sub ? <Text style={{ fontFamily: F.medium, fontSize: 13, lineHeight: 18, color: SILVER.label }}>{sub}</Text> : null}
      </View>
      <ChromeTrack>
        {n <= 1
          ? <ChromeKey onPress={onRemove} a11y={`Remove ${name}`}><Glyph d={TRASH} color="#D92D20" size={22} /></ChromeKey>
          : <ChromeKey onPress={() => onChange(n - 1)} a11y={`One fewer ${name}`}><Glyph d={MINUS} /></ChromeKey>}
        <View {...fill('chrome-cell')} style={{ flex: 1, minHeight: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: SILVER.cell, borderWidth: 1, borderColor: '#E1E1E1' }} accessibilityLabel={`Quantity ${n}`}>
          <Text style={{ fontFamily: F.medium, fontSize: 26, letterSpacing: -0.5, color: SILVER.ink, fontVariant: ['tabular-nums'] }}>{n}</Text>
        </View>
        <ChromeKey onPress={() => onChange(n + 1)} a11y={`One more ${name}`} disabled={n >= 9}><Glyph d={PLUS} /></ChromeKey>
      </ChromeTrack>
      {footer}
    </SilverCard>
  );
}

/** Two choices as keys in one track: the chosen one is pressed in. */
export function ChromeChoice<T extends string>({ value, options, onChange }: { value: T; options: { key: T; title: string; sub: string }[]; onChange: (v: T) => void }) {
  return (
    <ChromeTrack>
      {options.map(o => (
        <ChromeKey key={o.key} on={value === o.key} onPress={() => onChange(o.key)} a11y={o.title} style={{ minHeight: 76, paddingHorizontal: 12, paddingVertical: 10 }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 15, color: value === o.key ? SILVER.ink : '#6E6E6E' }}>{o.title}</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 12, lineHeight: 16, color: value === o.key ? '#5A5A5A' : SILVER.label, textAlign: 'center', marginTop: 3 }} numberOfLines={2}>{o.sub}</Text>
        </ChromeKey>
      ))}
    </ChromeTrack>
  );
}

/** The confirm key: the same chrome, full width. */
export function ChromeButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <ChromeTrack style={{ alignSelf: 'stretch' }}>
      <ChromeKey onPress={onPress} a11y={label} disabled={disabled} style={{ minHeight: 64 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 18, letterSpacing: -0.3, color: SILVER.ink }}>{label}</Text>
          <Glyph d="M9 5l7 7-7 7" color={SILVER.ink} size={18} />
        </View>
      </ChromeKey>
    </ChromeTrack>
  );
}
