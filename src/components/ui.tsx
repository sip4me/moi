import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, SvgXml } from 'react-native-svg';
import { glyphSvg, leverColor, leverSvg } from '../data/icons';
import { icon3d } from '../data/icons3d';
import { haptic } from '../lib/haptics';
import { tapped } from '../lib/notify';
import { onScrollTop } from '../lib/scrollTop';
import { C, evidenceStyle, F, surface, TILE } from '../theme';

export const crown = require('../../assets/crown-pink.png');
const seal = require('../../assets/seal.png');

// Phone-width column on web so screens look like the Figma frames.
/** `tab`: the tab this screen belongs to, so tapping that tab again scrolls back to the top. */
/** `overlay` floats above the page (outside the scrolling content), e.g. Home's coin drop. */
/**
 * `overlay` floats above the page (outside the scrolling content), e.g. Home's coin drop.
 * `stops` are scroll positions the page settles on: when scrolling comes to rest above the last stop,
 * it eases to the nearest one. Past the last stop, scrolling is free.
 */
export function Screen({ children, scroll, style, footer, tab, overlay, stops }: { children: React.ReactNode; scroll?: boolean; style?: ViewStyle; footer?: React.ReactNode; tab?: string; overlay?: React.ReactNode; stops?: number[] }) {
  const px = 20; // page margin (titles); section content adds CONTENT_INDENT → 24
  const ref = useRef<ScrollViewInstance>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settling = useRef(false);
  const rest = useRef(0); // where the page last came to rest, to tell up from down
  const settle = (y: number) => {
    if (!stops?.length) return;
    if (timer.current) clearTimeout(timer.current);
    if (settling.current) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      const last = stops[stops.length - 1];
      if (y <= 2 || y >= last - 2) { rest.current = y; return; }
      // Page-like: a short push in either direction moves to the next stop that way.
      const down = y > rest.current;
      const next = down ? stops.find(s => s > y) : [...stops].reverse().find(s => s < y);
      const target = next ?? stops.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) ? b : a));
      settling.current = true;
      ref.current?.scrollTo({ y: target, animated: true });
      rest.current = target;
      setTimeout(() => { settling.current = false; }, 500);
    }, 140);
  };
  useEffect(() => (tab ? onScrollTop(tab, () => ref.current?.scrollTo({ y: 0, animated: true })) : undefined), [tab]);
  // Tab pages (Home, Progress, Products, Profile) get more air above their first row.
  const top = tab ? { paddingTop: 28 } : null;
  const body = scroll
    ? <ScrollView ref={ref} contentContainerStyle={[s.pad, { paddingHorizontal: px }, top, { paddingBottom: footer ? 24 : 120 }, style]} showsVerticalScrollIndicator={false}
        scrollEventThrottle={32} onScroll={stops ? e => settle(e.nativeEvent.contentOffset.y) : undefined}>{children}</ScrollView>
    : <View style={[s.pad, { paddingHorizontal: px, flex: 1 }, top, style]}>{children}</View>;
  return (
    <SafeAreaView style={[s.outer, tab ? s.canvas : null]} edges={['top', 'bottom']}>
      <View style={s.col}>
        {body}
        {footer ? <View style={[s.footer, { paddingHorizontal: px }]}>{footer}</View> : null}
        {overlay}
      </View>
    </SafeAreaView>
  );
}

export function TopBar({ progress, onBack }: { progress?: number; onBack?: () => void }) {
  return (
    <View style={s.topbar}>
      <BackButton onPress={onBack} />
      {progress !== undefined ? <View style={s.track}><View style={[s.trackFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: progress >= 1 ? C.gold : C.ink }]} /></View> : <View style={{ flex: 1 }} />}
    </View>
  );
}

export function BackButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))} style={({ pressed }) => [s.back, pressed && { backgroundColor: '#E3E3E6' }]} accessibilityLabel="Back">
      <Svg width={10} height={16} viewBox="0 0 10 16"><Path d="M8 2 2 8l6 6" stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>
    </Pressable>
  );
}

/**
 * States: default · pressed (darker, 0.98 squeeze) · loading (spinner, keeps its colour, can't be tapped)
 * · disabled (grey, can't be tapped). Ghost buttons darken their text when pressed.
 */
export function Button({ label, onPress, variant = 'primary', disabled, loading, style }: { label: string; onPress?: () => void; variant?: 'primary' | 'secondary' | 'ghost'; disabled?: boolean; loading?: boolean; style?: ViewStyle }) {
  const off = disabled && !loading;
  return (
    <Pressable disabled={disabled || loading} onPress={onPress ? () => { haptic(); onPress(); tapped(); } : undefined}
      accessibilityRole="button" accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      style={({ pressed }) => [
        s.btn,
        variant === 'primary' && { backgroundColor: off ? '#E3E3E6' : pressed ? '#2E2E2E' : C.ink },
        variant === 'secondary' && { backgroundColor: off ? '#F7F7F8' : pressed ? C.pressed : C.option, borderWidth: 1, borderColor: off ? '#EFEFF1' : '#E5E5E5' },
        variant === 'ghost' && { backgroundColor: 'transparent', height: 44 },
        { transform: [{ scale: pressed && variant !== 'ghost' ? 0.98 : 1 }] },
        style,
      ]}>
      {({ pressed }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {loading ? <ActivityIndicator color={variant === 'primary' ? '#fff' : C.ink} size="small" /> : null}
          {/\bMoi\b/.test(label)
            ? <BrandText text={label} size={17} weight="semibold" color={variant === 'primary' ? (off ? '#9A9A9A' : '#fff') : variant === 'ghost' ? (pressed ? C.ink : C.gray2) : (off ? '#B5B5BA' : C.ink)} />
            : <Text style={[s.btnText, variant === 'primary' && { color: off ? '#9A9A9A' : '#fff' }, variant === 'secondary' && { color: off ? '#B5B5BA' : C.ink }, variant === 'ghost' && { color: pressed ? C.ink : C.gray2 }]}>{label}</Text>}
        </View>
      )}
    </Pressable>
  );
}

export function OptionRow({ label, sub, selected, onPress, multi, icon }: { label: string; sub?: string; selected: boolean; onPress: () => void; multi?: boolean; icon?: { xml: string; size: number } }) {
  return (
    <Pressable onPress={() => { haptic('select'); onPress(); }} style={({ pressed }) => [s.opt, { backgroundColor: selected ? (pressed ? '#2E2E2E' : C.ink) : pressed ? C.pressed : C.option }]}>
      {icon ? <View style={s.optIcon}><SvgXml xml={icon.xml} width={icon.size} height={icon.size} /></View> : null}
      <View style={{ flex: 1 }}>
        <Text style={[s.optTitle, selected && { color: '#fff' }]}>{label}</Text>
        {sub ? <Text style={[s.optSub, selected && { color: '#fff', opacity: 0.8 }]}>{sub}</Text> : null}
      </View>
      {multi ? <View style={[s.check, selected && { backgroundColor: '#fff', borderColor: '#fff' }]}>{selected ? <Svg width={12} height={12} viewBox="0 0 24 24"><Path d="m5 12.5 4.5 4.5L19 7.5" stroke={C.ink} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg> : null}</View> : null}
    </Pressable>
  );
}

/** Pill toggle used by chip questions. */
export function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={() => { haptic('select'); onPress(); }} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
      style={({ pressed }) => ({ paddingHorizontal: 16, height: 40, borderRadius: 20, justifyContent: 'center', backgroundColor: on ? (pressed ? '#2E2E2E' : C.ink) : pressed ? C.pressed : '#fff', borderWidth: 1, borderColor: on ? C.ink : '#E3E3E6' })}>
      <Text style={{ fontFamily: F.medium, fontSize: 14, color: on ? '#fff' : C.ink }}>{label}</Text>
    </Pressable>
  );
}

export function Title({ children, size = 30, style }: { children: React.ReactNode; size?: number; style?: any }) {
  return <Text style={[{ fontFamily: F.bold, fontSize: size, color: C.ink, letterSpacing: -0.6, lineHeight: size * 1.16 }, style]}>{children}</Text>;
}
export function Sub({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[{ fontFamily: F.regular, fontSize: 16, color: C.gray2, lineHeight: 23 }, style]}>{children}</Text>;
}

// "Moi" in Young Serif with the 3D crown on the o, scaled from the Figma lockup (64 px master).
/**
 * Wordmark. Letters sit where the Figma "Logo/Moi lockup" (40:400) places them, in units of
 * its 64px master (k = size / 64). The pink velvet crown rests on the "o" the way it would on a
 * head: as wide as the letter (ink 65.8–98.5 × 30.2–63.7), its band hugging the top curve, tipped 14° left.
 * The box is the text height, so inline baselines line up with the sentence around it.
 */
export const LETTERS: [string, number][] = [['M', -1.9], ['o', 63.8], ['i', 99.5]];
// Brand reference: the crown sits over the o's top-left, tilted 14° to the left, band covering the top of the o.
// scripts/make-icons.py renders the app icon from these same numbers.
export const CROWN = { w: 32.3, h: 32.8, left: 59.85, top: 6.6, rotate: '-14deg' }; // 852×865 artwork, centred at (76, 23)

export function Logo({ size = 40, color = '#2F3D3B', letterProps }: { size?: number; color?: string; letterProps?: object }) {
  const k = size / 64;
  return (
    <View style={{ width: 123 * k, height: 64 * k }} accessibilityRole="image" accessibilityLabel="Moi">
      {LETTERS.map(([ch, x]) => (
        <Text key={ch} {...letterProps} style={{ position: 'absolute', left: x * k, top: -3.7 * k, fontFamily: F.serif, fontSize: size, lineHeight: 90 * k, color }}>{ch}</Text>
      ))}
      <Image source={crown} resizeMode="contain" style={{ position: 'absolute', left: CROWN.left * k, top: CROWN.top * k, width: CROWN.w * k, height: CROWN.h * k, transform: [{ rotate: CROWN.rotate }] }} />
    </View>
  );
}

/**
 * A sentence with the Moi wordmark inside it, e.g. ["Unlock", "logo", "to reach"].
 * The wordmark is sized so its capitals match the text's (Young Serif caps are 0.75 of the
 * size, Inter's 0.727) and nudged so both share one baseline: Inter at lineHeight 1.16 sits
 * 0.217 × size above its box's bottom; the wordmark's baseline is 1.2/64 of its size above its own.
 */
export function BrandLine({ parts, size = 30, weight = 'bold', color = C.ink, center, lineHeight = 1.16 }: { parts: (string | 'logo')[]; size?: number; weight?: 'bold' | 'semibold' | 'medium' | 'regular'; color?: string; center?: boolean; lineHeight?: number }) {
  const logo = size * 0.97;
  // Inter's baseline sits 0.217 × size above the bottom of a 1.16 line box; taller lines add half the extra below it.
  const lift = (0.2167 + (lineHeight - 1.16) / 2) * size - (1.2 / 64) * logo;
  const font = weight === 'bold' ? F.bold : weight === 'semibold' ? F.semibold : weight === 'medium' ? F.medium : F.regular;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: center ? 'center' : 'flex-start', columnGap: size * 0.26 }}>
      {parts.flatMap((p, i) => p === 'logo'
        ? [<View key={i} style={{ marginBottom: lift }}><Logo size={logo} color={color} /></View>]
        : p.split(' ').filter(Boolean).map((w, j) => (
          <Text key={`${i}-${j}`} style={{ fontFamily: font, fontSize: size, lineHeight: size * lineHeight, letterSpacing: weight === 'bold' ? -0.02 * size : 0, color }}>{w}</Text>
        )))}
    </View>
  );
}

/** Any sentence that mentions Moi, with the wordmark in place of the word (e.g. "Open Moi in one tap"). */
export function BrandText({ text, ...rest }: { text: string } & Omit<Parameters<typeof BrandLine>[0], 'parts'>) {
  const parts = text.split(/\bMoi\b/).flatMap((t, i) => (i ? ['logo' as const, t] : [t])).filter(p => p === 'logo' || p.trim());
  return <BrandLine parts={parts} {...rest} />;
}

export function Seal({ size = 24 }: { size?: number }) {
  return <Image source={seal} style={{ width: size, height: size * 783 / 741 }} resizeMode="contain" />;
}

export function Glyph({ id, size = 18, name, color }: { id?: string; size?: number; name?: string; color?: string }) {
  const xml = name ? glyphSvg(name, color ?? C.ink) : leverSvg(id!, color);
  return <SvgXml xml={xml} width={size} height={size} />;
}

export function Ring({ size = 56, color, full, track = '#ECECEC' }: { size?: number; color: string; full?: boolean; track?: string }) {
  const r = (size - 8) / 2, c = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={4} fill="none" />
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={4} fill="none" strokeLinecap="round"
        strokeDasharray={`${full ? c : c * 0.75} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </Svg>
  );
}

export function CardGrid({ children }: { children: React.ReactNode[] }) {
  const rows: React.ReactNode[][] = [];
  children.forEach((c, i) => { if (i % 2 === 0) rows.push([]); rows[rows.length - 1].push(c); });
  return <View style={{ gap: 10 }}>{rows.map((r, i) => <View key={i} style={{ flexDirection: 'row', gap: 10 }}>{r}{r.length === 1 ? <View style={{ flex: 1 }} /> : null}</View>)}</View>;
}

/** A routine card: label on top, the 3D object for the step, and today's amount underneath. */
/** `art` replaces the 3D object, e.g. the small pineapple animation at bedtime. */
export function RecCard({ id, icon, label, value, unit, done, onPress, art }: { id: string; icon?: string; label: string; value: string | number; unit: string; done?: boolean; onPress?: () => void; width?: any; art?: React.ReactNode }) {
  const narrow = useWindowDimensions().width < 360;
  const amount = `${value}${unit ? ` ${unit}` : ''}`;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}, ${amount}${done ? ', done' : ''}`}
      style={({ pressed }) => [s.rec, narrow && { padding: 10, gap: 4 }, { flex: 1, minWidth: 0, backgroundColor: pressed ? '#F2F2F4' : '#fff' }]}>
      <Text numberOfLines={1} style={{ fontFamily: F.semibold, fontSize: narrow ? 13 : 14, color: done ? C.gray : C.ink }}>{label}</Text>
      <View style={{ alignItems: 'center', justifyContent: 'center', height: narrow ? 64 : 72 }}>
        {art ? <View style={{ opacity: done ? 0.45 : 1 }}>{art}</View> : <Image source={icon3d(icon ?? id)} resizeMode="contain" style={{ width: narrow ? 58 : 66, height: narrow ? 58 : 66, opacity: done ? 0.45 : 1 }} />}
        {done ? <View style={{ position: 'absolute', right: 2, bottom: 0 }}><Seal size={26} /></View> : null}
      </View>
      <Text numberOfLines={1} style={{ fontFamily: F.medium, fontSize: 12, color: done ? C.gray : C.gray2, textAlign: 'center' }}>{done ? 'Done today' : amount}</Text>
    </Pressable>
  );
}

export function EvidenceChip({ level }: { level?: string }) {
  const e = evidenceStyle[level ?? 'early'];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: e.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: e.fg }} />
      <Text style={{ fontFamily: F.semibold, fontSize: 12, color: e.fg }}>{e.label}</Text>
    </View>
  );
}

export function DoctorNote({ id, label, why, onPress }: { id: string; label: string; why: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.note, pressed && { backgroundColor: '#F2F2F4' }]}>
      <View style={s.noteIcon}><Glyph id={id} /></View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 13, color: C.ink }}>{label}</Text>
        <Text numberOfLines={2} style={{ fontFamily: F.regular, fontSize: 12, color: C.gray, marginTop: 2 }}>{why}</Text>
      </View>
    </Pressable>
  );
}

export function MoreRow({ id, label, meta, onPress }: { id: string; label: string; meta: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.more, pressed && { backgroundColor: '#F2F2F4' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
        <View style={s.moreIcon}><Image source={icon3d(id)} resizeMode="contain" style={{ width: 32, height: 32 }} /></View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>{label}</Text>
          <Text numberOfLines={1} style={{ fontFamily: F.regular, fontSize: 12, color: C.gray, marginTop: 1 }}>{meta}</Text>
        </View>
      </View>
      <View style={{ backgroundColor: '#F2F2F3', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}><Text style={{ fontFamily: F.semibold, fontSize: 13, color: C.ink }}>Why?</Text></View>
    </Pressable>
  );
}

/** A titled group: the title sits above in sentence case, the content on a white card lifted by a soft shadow. */
export function SectionCard({ label, children, style }: { label?: string; children: React.ReactNode; style?: ViewStyle }) {
  const flat = (StyleSheet.flatten(style) ?? {}) as ViewStyle & Record<string, unknown>;
  const outer: ViewStyle = {}; const inner: ViewStyle = {};
  for (const [k, v] of Object.entries(flat)) ((k.startsWith('margin') ? outer : inner) as Record<string, unknown>)[k] = v;
  const title = label ? label.charAt(0) + label.slice(1).toLowerCase() : null;
  return (
    <View style={outer}>
      {title ? <Text style={s.sectionLabel}>{title}</Text> : null}
      <View style={[s.section, inner]}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#fff', alignItems: 'center' },
  canvas: { backgroundColor: C.bg },
  col: { flex: 1, width: '100%', maxWidth: 430 },
  pad: { paddingHorizontal: 24, paddingTop: 12 },
  // The primary action gets an island of space: 24 px above and below.
  footer: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, gap: 4 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 16, height: 44 },
  track: { flex: 1, height: 4, backgroundColor: '#EDEDED', borderRadius: 2, overflow: 'hidden' },
  trackFill: { height: 4, borderRadius: 2 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F2F2F4', alignItems: 'center', justifyContent: 'center' },
  btn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  btnText: { fontFamily: F.semibold, fontSize: 17 },
  opt: { flexDirection: 'row', alignItems: 'center', minHeight: 64, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 14 },
  optIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  optTitle: { fontFamily: F.semibold, fontSize: 16, color: C.ink },
  optSub: { fontFamily: F.regular, fontSize: 13, color: C.gray2, marginTop: 2 },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#CFC9BD', alignItems: 'center', justifyContent: 'center' },
  rec: { borderRadius: 16, padding: 12, gap: 8 },
  note: { ...surface, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 14 },
  noteIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F2F2F4', alignItems: 'center', justifyContent: 'center' },
  more: { ...surface, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12 },
  moreIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: TILE, alignItems: 'center', justifyContent: 'center' },
  section: { ...surface, padding: 16, gap: 10 },
  sectionLabel: { fontFamily: F.bold, fontSize: 20, letterSpacing: -0.3, color: C.ink, marginBottom: 12 },
});
