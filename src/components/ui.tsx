import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, SvgXml } from 'react-native-svg';
import { glyphSvg, leverColor, leverSvg } from '../data/icons';
import { C, evidenceStyle, F } from '../theme';

const crown = require('../../assets/crown.png');
const seal = require('../../assets/seal.png');

// Phone-width column on web so screens look like the Figma frames.
export function Screen({ children, scroll, style, footer }: { children: React.ReactNode; scroll?: boolean; style?: ViewStyle; footer?: React.ReactNode }) {
  const narrow = useWindowDimensions().width < 360;
  const px = narrow ? 18 : 24;
  const body = scroll
    ? <ScrollView contentContainerStyle={[s.pad, { paddingHorizontal: px }, { paddingBottom: footer ? 24 : 120 }, style]} showsVerticalScrollIndicator={false}>{children}</ScrollView>
    : <View style={[s.pad, { paddingHorizontal: px, flex: 1 }, style]}>{children}</View>;
  return (
    <SafeAreaView style={s.outer} edges={['top', 'bottom']}>
      <View style={s.col}>
        {body}
        {footer ? <View style={[s.footer, { paddingHorizontal: px }]}>{footer}</View> : null}
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

export function Button({ label, onPress, variant = 'primary', disabled, loading, style }: { label: string; onPress?: () => void; variant?: 'primary' | 'secondary' | 'ghost'; disabled?: boolean; loading?: boolean; style?: ViewStyle }) {
  return (
    <Pressable disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [
      s.btn,
      variant === 'primary' && { backgroundColor: disabled ? '#E3E3E6' : pressed ? '#2E2E2E' : C.ink },
      variant === 'secondary' && { backgroundColor: pressed ? C.pressed : C.option, borderWidth: 1, borderColor: '#E5E5E5' },
      variant === 'ghost' && { backgroundColor: 'transparent', height: 44 },
      style,
    ]}>
      {({ pressed }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {loading ? <ActivityIndicator color={variant === 'primary' ? '#fff' : C.ink} size="small" /> : null}
          <Text style={[s.btnText, variant === 'primary' && { color: disabled ? '#9A9A9A' : '#fff' }, variant !== 'primary' && { color: variant === 'ghost' ? (pressed ? C.ink : C.gray2) : C.ink }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function OptionRow({ label, sub, selected, onPress, multi }: { label: string; sub?: string; selected: boolean; onPress: () => void; multi?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.opt, { backgroundColor: selected ? (pressed ? '#2E2E2E' : C.ink) : pressed ? C.pressed : C.option }]}>
      <View style={{ flex: 1 }}>
        <Text style={[s.optTitle, selected && { color: '#fff' }]}>{label}</Text>
        {sub ? <Text style={[s.optSub, selected && { color: '#fff', opacity: 0.8 }]}>{sub}</Text> : null}
      </View>
      {multi ? <View style={[s.check, selected && { backgroundColor: '#fff', borderColor: '#fff' }]}>{selected ? <Svg width={12} height={12} viewBox="0 0 24 24"><Path d="m5 12.5 4.5 4.5L19 7.5" stroke={C.ink} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg> : null}</View> : null}
    </Pressable>
  );
}

export function Title({ children, size = 30, style }: { children: React.ReactNode; size?: number; style?: any }) {
  return <Text style={[{ fontFamily: F.bold, fontSize: size, color: C.ink, letterSpacing: -0.6, lineHeight: size * 1.16 }, style]}>{children}</Text>;
}
export function Sub({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[{ fontFamily: F.regular, fontSize: 16, color: C.gray2, lineHeight: 22 }, style]}>{children}</Text>;
}

// "Moi" in Young Serif with the 3D crown on the o, scaled from the Figma lockup (64 px master).
export function Logo({ size = 40, color = '#2F3D3B' }: { size?: number; color?: string }) {
  const k = size / 64;
  return (
    <View style={{ width: 123 * k, height: 64 * k }}>
      <Text style={{ position: 'absolute', left: -2 * k, top: -3.7 * k, fontFamily: F.serif, fontSize: size, lineHeight: 90 * k, color }}>Moi</Text>
      <Image source={crown} style={{ position: 'absolute', left: 53.8 * k, top: 12 * k, width: 32 * k, height: 34 * k, transform: [{ rotate: '27deg' }] }} resizeMode="contain" />
    </View>
  );
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

export function RecCard({ id, label, value, unit, done, onPress }: { id: string; label: string; value: string | number; unit: string; done?: boolean; onPress?: () => void; width?: any }) {
  const col = leverColor(id);
  const narrow = useWindowDimensions().width < 360;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.rec, narrow && { padding: 10, gap: 6 }, { flex: 1, minWidth: 0, backgroundColor: pressed ? '#F2F2F4' : '#fff' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: narrow ? 6 : 8 }}>
        <Glyph id={id} size={narrow ? 14 : undefined} />
        <Text numberOfLines={1} style={{ fontFamily: F.medium, fontSize: narrow ? 13 : 14, color: done ? C.gray : C.ink, flex: 1 }}>{label}</Text>
      </View>
      <View style={{ alignItems: 'center', justifyContent: 'center', height: 64 }}>
        <Ring color={col} full={done} />
        <View style={StyleSheet.absoluteFill as any}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {done ? <Seal size={26} /> : (
              <Text style={{ fontFamily: F.semibold, fontSize: String(value).length > 5 ? 11 : 13, color: C.ink, textAlign: 'center', maxWidth: 44 }}>
                {String(value)}{unit ? <Text style={{ fontFamily: F.medium, fontSize: 8 }}>{'\n'}{unit}</Text> : null}
              </Text>
            )}
          </View>
        </View>
      </View>
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
        <View style={s.moreIcon}><Glyph id={id} /></View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.ink }}>{label}</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 11, color: C.gray }}>{meta}</Text>
        </View>
      </View>
      <View style={{ backgroundColor: C.ink, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}><Text style={{ fontFamily: F.semibold, fontSize: 12, color: '#fff' }}>Why?</Text></View>
    </Pressable>
  );
}

export function SectionCard({ label, children, style }: { label?: string; children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[s.section, style]}>
      {label ? <Text style={s.sectionLabel}>{label}</Text> : null}
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#fff', alignItems: 'center' },
  col: { flex: 1, width: '100%', maxWidth: 430 },
  pad: { paddingHorizontal: 24, paddingTop: 12 },
  footer: { paddingHorizontal: 24, paddingBottom: 12, gap: 4 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 16, height: 44 },
  track: { flex: 1, height: 4, backgroundColor: '#EDEDED', borderRadius: 2, overflow: 'hidden' },
  trackFill: { height: 4, borderRadius: 2 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F2F2F4', alignItems: 'center', justifyContent: 'center' },
  btn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  btnText: { fontFamily: F.semibold, fontSize: 17 },
  opt: { flexDirection: 'row', alignItems: 'center', minHeight: 64, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 14 },
  optTitle: { fontFamily: F.semibold, fontSize: 16, color: C.ink },
  optSub: { fontFamily: F.regular, fontSize: 13, color: C.gray2, marginTop: 2 },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#CFC9BD', alignItems: 'center', justifyContent: 'center' },
  rec: { borderRadius: 16, padding: 12, gap: 8 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.line },
  noteIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F2F2F4', alignItems: 'center', justifyContent: 'center' },
  more: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  moreIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  section: { backgroundColor: C.card, borderRadius: 24, padding: 16, gap: 10, borderWidth: 1, borderColor: C.line },
  sectionLabel: { fontFamily: F.semibold, fontSize: 13, color: C.ink, letterSpacing: 1.5 },
});
