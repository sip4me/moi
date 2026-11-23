import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { icon3d } from '../../data/icons3d';
import { haptic } from '../../lib/haptics';
import { itemFromPhoto, submitTyped, takeProductPhoto } from '../../lib/routine/capture';
import { KIND_COLOR, KIND_LABEL, retailerLinks, type Gap } from '../../lib/routine/gaps';
import { CATEGORY_ICON, CATEGORY_LABEL, classify, searchCatalogLocal, TOOL_KINDS, useCatalog, type Item, type Step } from '../../lib/routine/model';
import { C, F } from '../../theme';

export const BLUE = '#5B8DEF';
export const crownImg = require('../../../assets/crown-pink.png');
export const useWide = () => useWindowDimensions().width >= 900;
export const iconFor = (cat?: string) => icon3d(CATEGORY_ICON[cat ?? ''] ?? 'drop');
export const money = (n?: number | null) => (n == null ? '' : `$${n % 1 ? n.toFixed(2) : n}`);

// ── Layout ───────────────────────────────────────────────────────────────────
const NAV = [
  { key: 'build', label: 'Routine', icon: 'conditioner', href: '/routine/build' },
  { key: 'gaps', label: 'Gap report', icon: 'mirror', href: '/routine/gaps' },
  { key: 'shop', label: 'Shop', icon: 'hair_food', href: '/routine/shop' },
  { key: 'goals', label: 'Goals & hair', icon: 'learn', href: '/routine/goals' },
] as const;

export function Shell({ active, children, side, footer, step }: { active?: string; children: React.ReactNode; side?: React.ReactNode; footer?: React.ReactNode; step?: string }) {
  const wide = useWide();
  if (wide) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: C.bg }}>
        <View style={st.sidebar}>
          <Pressable onPress={() => router.push('/')} style={st.brand}><Image source={crownImg} style={{ width: 24, height: 24 }} /><Text style={st.brandText}>Moi Routine</Text></Pressable>
          {NAV.map(n => {
            const on = n.key === active;
            return (
              <Pressable key={n.key} onPress={() => { haptic('select'); router.replace(n.href as any); }} style={({ pressed }) => [st.nav, on && st.navOn, pressed && { opacity: 0.7 }]}>
                <Image source={icon3d(n.icon)} style={{ width: 24, height: 24, opacity: on ? 1 : 0.6 }} />
                <Text style={[st.navText, on && { fontFamily: F.semibold, color: C.ink }]}>{n.label}</Text>
              </Pressable>
            );
          })}
          <View style={{ flex: 1 }} />
          <Pressable onPress={() => router.push('/')} style={st.nav}><Text style={[st.navText, { color: C.gray }]}>← Back to Moi</Text></Pressable>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 48, paddingTop: 44, paddingBottom: 64, maxWidth: 1000, width: '100%', gap: 32 }}>
          {children}
          {footer ? <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>{footer}</View> : null}
        </ScrollView>
        {side ? <ScrollView style={st.side} contentContainerStyle={{ padding: 24, gap: 16 }}>{side}</ScrollView> : null}
      </View>
    );
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
      <View style={st.mHeader}>
        <Pressable onPress={() => router.push('/')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Image source={crownImg} style={{ width: 22, height: 22 }} /><Text style={st.brandText}>Moi Routine</Text></Pressable>
        <View style={{ flex: 1 }} />
        {step ? <Text style={st.meta}>{step}</Text> : null}
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 24 }} showsVerticalScrollIndicator={false}>
        {children}
        {side ? <View style={{ gap: 16 }}>{side}</View> : null}
      </ScrollView>
      {footer ? <View style={st.mFooter}>{footer}</View> : null}
      {active ? (
        <View style={st.tabbar}>
          {NAV.map(n => {
            const on = n.key === active;
            return (
              <Pressable key={n.key} onPress={() => { haptic('select'); router.replace(n.href as any); }} style={st.tab}>
                <Image source={icon3d(n.icon)} style={{ width: 26, height: 26, opacity: on ? 1 : 0.5 }} />
                <Text style={[st.tabText, on && { color: C.ink, fontFamily: F.semibold }]}>{n.label === 'Goals & hair' ? 'Goals' : n.label === 'Gap report' ? 'Gaps' : n.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export function Heading({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  const wide = useWide();
  return (
    <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'flex-end' : 'stretch', gap: wide ? 24 : 16 }}>
      <View style={{ flex: wide ? 1 : undefined, gap: 6 }}>
        <Text style={[st.h1, { fontSize: wide ? 44 : 34, lineHeight: wide ? 48 : 38 }]}>{title}</Text>
        {sub ? <Text style={st.sub}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export const Label = ({ children }: { children: string }) => <Text style={st.label}>{children.toUpperCase()}</Text>;

export function Pill({ label, on, onPress }: { label: string; on?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress ? () => { haptic('select'); onPress(); } : undefined} accessibilityRole="button" accessibilityState={{ selected: !!on }}
      style={({ pressed }) => [st.pill, on && st.pillOn, pressed && { opacity: 0.8 }]}>
      <Text style={[st.pillText, on && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function Btn({ label, onPress, kind = 'primary', style, disabled }: { label: string; onPress?: () => void; kind?: 'primary' | 'secondary' | 'small'; style?: ViewStyle; disabled?: boolean }) {
  return (
    <Pressable disabled={disabled} onPress={onPress ? () => { haptic(); onPress(); } : undefined} accessibilityRole="button"
      style={({ pressed }) => [kind === 'small' ? st.btnSm : st.btn, kind === 'secondary' && st.btnSec, disabled && { opacity: 0.4 }, pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }, style]}>
      <Text style={[kind === 'small' ? st.btnSmText : st.btnText, kind === 'secondary' && { color: C.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={st.seg}>
      {options.map(o => (
        <Pressable key={o} onPress={() => { haptic('select'); onChange(o); }} style={[st.segItem, o === value && st.segOn]}>
          <Text style={[st.segText, o === value && { color: C.ink, fontFamily: F.semibold }]}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ── Timeline ─────────────────────────────────────────────────────────────────
export function Timeline({ steps, onOpen, active }: { steps: Step[]; onOpen: (s: Step) => void; active?: string }) {
  return (
    <View>
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const empty = !s.item;
        const on = s.id === active;
        return (
          <View key={s.id} style={{ flexDirection: 'row', gap: 14 }}>
            <View style={{ width: 18, alignItems: 'center', paddingTop: 20 }}>
              <View style={[st.node, empty && st.nodeEmpty, on && st.nodeOn]} />
              {!last ? <View style={[st.rail, empty && { backgroundColor: '#D9DDE2' }]} /> : null}
            </View>
            <Pressable onPress={() => { haptic('select'); onOpen(s); }} style={({ pressed }) => [{ flex: 1, paddingBottom: 12 }, pressed && { opacity: 0.85 }]}>
              <View style={[st.stepCard, empty && st.stepEmpty, on && st.stepOn]}>
                {!empty ? <Image source={iconFor(s.item!.category)} style={st.stepIcon} /> : null}
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[st.stepTitle, empty && { color: C.gray2 }, on && { color: '#fff' }]} numberOfLines={1}>{empty ? `+ Add ${(CATEGORY_LABEL[s.hint] ?? s.label).toLowerCase()}` : s.label}</Text>
                    {s.when && !empty ? <Text style={[st.meta, on && { color: '#E6EEFF' }]}>{s.when}</Text> : null}
                  </View>
                  <Text style={[st.stepSub, on && { color: '#E6EEFF' }]} numberOfLines={2}>{empty ? `${s.label} · search, scan a barcode, or skip` : `${s.item!.brand ? `${s.item!.brand} · ` : ''}${s.item!.name}`}</Text>
                </View>
              </View>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

// ── Add / change a step ──────────────────────────────────────────────────────
export function PickerSheet({ step, onClose, onPick, onRemove, onRename }: { step: Step | null; onClose: () => void; onPick: (i: Item) => void; onRemove: () => void; onRename: (label: string) => void }) {
  const wide = useWide();
  const cat = useCatalog();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const results = useMemo(() => (step ? searchCatalogLocal(cat, q, step.hint).slice(0, 12) : []), [cat, q, step]);
  if (!step) return null;
  const close = () => { setQ(''); setMsg(''); onClose(); };
  const pick = (i: Item) => { onPick(i); setQ(''); setMsg(''); };
  const scan = async (lib: boolean) => {
    const uri = await takeProductPhoto(lib);
    if (!uri) return;
    setBusy(true); setMsg('Reading the barcode…');
    try { const r = await itemFromPhoto(uri, cat); setMsg(r.message); if (r.item) setTimeout(() => pick(r.item!), 700); }
    catch { setMsg('That photo didn’t work. Try again, or type the name.'); }
    finally { setBusy(false); }
  };
  const typed = () => {
    const name = q.trim();
    const guess = TOOL_KINDS.has(step.hint) ? { category: step.hint, tags: [] } : classify(`${name} ${CATEGORY_LABEL[step.hint] ?? ''}`);
    const category = TOOL_KINDS.has(step.hint) || !/shampoo|condition|oil|gel|cream|spray|mask|serum/i.test(name) ? step.hint : guess.category;
    submitTyped(name, category);
    pick({ kind: TOOL_KINDS.has(category) ? 'tool' : 'custom', brand: '', name, category, tags: guess.tags });
  };
  return (
    <Modal transparent visible animationType={wide ? 'fade' : 'slide'} onRequestClose={close}>
      <Pressable style={[st.scrim, wide && { justifyContent: 'center', alignItems: 'center' }]} onPress={close}>
        <Pressable onPress={() => {}} style={[st.sheet, wide && st.dialog]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput value={step.label} onChangeText={onRename} style={st.sheetTitle} accessibilityLabel="Step name" />
            <Pressable onPress={close} hitSlop={12}><Text style={[st.meta, { fontSize: 15 }]}>Done</Text></Pressable>
          </View>
          {step.item ? (
            <View style={st.current}>
              <Image source={iconFor(step.item.category)} style={{ width: 44, height: 44 }} />
              <View style={{ flex: 1 }}><Text style={st.meta}>{step.item.brand || CATEGORY_LABEL[step.item.category]}</Text><Text style={st.cardTitle}>{step.item.name}</Text></View>
              <Pressable onPress={onRemove} hitSlop={8}><Text style={{ fontFamily: F.semibold, color: '#C2383D', fontSize: 14 }}>Remove</Text></Pressable>
            </View>
          ) : <Pressable onPress={onRemove} hitSlop={8} style={{ alignSelf: 'flex-start' }}><Text style={{ fontFamily: F.medium, color: C.gray, fontSize: 13 }}>Delete this step</Text></Pressable>}
          <View style={st.search}>
            <TextInput value={q} onChangeText={setQ} placeholder={`Search ${(CATEGORY_LABEL[step.hint] ?? 'products').toLowerCase()}s, brands or tools`} placeholderTextColor={C.gray} style={st.searchInput} autoFocus={wide} returnKeyType="search" />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn kind="small" label="📷  Scan barcode" onPress={() => scan(false)} />
            <Btn kind="small" label="Upload photo" onPress={() => scan(true)} style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#E3E5E8' }} />
          </View>
          {busy || msg ? <View style={st.msg}>{busy ? <ActivityIndicator size="small" color={C.ink} /> : null}<Text style={[st.sub, { flex: 1, fontSize: 14 }]}>{msg}</Text></View> : null}
          <ScrollView style={{ maxHeight: wide ? 360 : 320 }} keyboardShouldPersistTaps="handled">
            {q.trim().length >= 2 ? (
              <Pressable onPress={typed} style={st.result}>
                <View style={[st.resultIcon, { backgroundColor: '#EEF0F3', alignItems: 'center', justifyContent: 'center' }]}><Text style={{ fontSize: 20 }}>+</Text></View>
                <View style={{ flex: 1 }}><Text style={st.cardTitle}>Add “{q.trim()}”</Text><Text style={st.meta}>Not listed? We’ll add it to the database</Text></View>
              </Pressable>
            ) : null}
            {results.map(i => (
              <Pressable key={`${i.kind}${i.id}`} onPress={() => pick(i)} style={({ pressed }) => [st.result, pressed && { backgroundColor: C.pressed }]}>
                <Image source={iconFor(i.category)} style={st.resultIcon} />
                <View style={{ flex: 1 }}><Text style={st.meta}>{i.brand || (i.kind === 'tool' ? 'Tool' : '')}</Text><Text style={st.cardTitle} numberOfLines={1}>{i.name}</Text></View>
                <Text style={st.tag}>{CATEGORY_LABEL[i.category] ?? i.category}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Gaps and products ────────────────────────────────────────────────────────
export function GapCard({ gap, onPress, selected, cta, price }: { gap: Gap; onPress?: () => void; selected?: boolean; cta?: string; price?: string }) {
  const c = KIND_COLOR[gap.kind];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.gap, selected && { borderColor: C.ink }, pressed && { opacity: 0.9 }]}>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <View style={[st.gapIcon, { backgroundColor: c.bg }]}><Image source={iconFor(gap.fills[0])} style={{ width: 46, height: 46 }} /></View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={[st.kind, { backgroundColor: c.bg }]}><Text style={[st.kindText, { color: c.fg }]}>{KIND_LABEL[gap.kind]}</Text></View>
          <Text style={st.gapTitle}>{gap.title}</Text>
        </View>
      </View>
      <Text style={st.why}>{gap.why}</Text>
      {cta ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={st.btnSm}><Text style={st.btnSmText}>{cta}</Text></View>{price ? <Text style={st.meta}>{price}</Text> : null}</View> : null}
    </Pressable>
  );
}

export function ProductCard({ item, fit, best, inBag, onAdd, width }: { item: Item; fit: number; best?: boolean; inBag?: boolean; onAdd: () => void; width?: number }) {
  return (
    <View style={[{ gap: 12 }, width ? { width } : { flex: 1, minWidth: 0 }]}>
      <View style={[st.tile, best && { backgroundColor: '#FFF8E8' }]}>
        <Image source={iconFor(item.category)} style={{ width: '68%', height: '68%' }} resizeMode="contain" />
        <View style={[st.fit, best && { backgroundColor: C.ink }]}><Text style={[st.fitText, best && { color: '#fff' }]}>{best ? `Best for you · ${fit}%` : `${fit}% match`}</Text></View>
      </View>
      <View style={{ gap: 3, paddingHorizontal: 4 }}>
        <Text style={st.meta} numberOfLines={1}>{item.brand || CATEGORY_LABEL[item.category]}</Text>
        <Text style={st.cardTitle} numberOfLines={2}>{item.name}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}>
        <Text style={st.price}>{item.price ? `about ${money(item.price)}` : ''}</Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => { haptic(); onAdd(); }} style={[st.btnSm, inBag && { backgroundColor: '#E5F4EA' }]}><Text style={[st.btnSmText, inBag && { color: '#1E7B45' }]}>{inBag ? 'In bag ✓' : 'Add'}</Text></Pressable>
      </View>
    </View>
  );
}

export function WhereToBuy({ item }: { item: Item }) {
  return (
    <View style={st.wtb}>
      {retailerLinks(item).map((r, i) => (
        <Pressable key={r.name} onPress={() => Linking.openURL(r.url)} style={({ pressed }) => [st.wtbRow, i > 0 && st.wtbDiv, pressed && { backgroundColor: C.pressed }]}>
          <Text style={[st.cardTitle, { flex: 1, fontFamily: F.medium }]}>{r.name}</Text>
          <Text style={[st.meta, { color: BLUE, fontFamily: F.semibold }]}>Check price ↗</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function ScoreBar({ score, after }: { score: number; after?: number }) {
  return (
    <View style={st.bar}>
      {after && after > score ? <View style={[st.barFill, { width: `${after}%`, backgroundColor: '#A9C3F6', position: 'absolute' }]} /> : null}
      <View style={[st.barFill, { width: `${score}%` }]} />
    </View>
  );
}

export const st = StyleSheet.create({
  sidebar: { width: 248, backgroundColor: '#F1F3F5', paddingHorizontal: 18, paddingVertical: 28, gap: 4 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingBottom: 24 },
  brandText: { fontFamily: F.bold, fontSize: 17, color: C.ink },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, height: 44, borderRadius: 14 },
  navOn: { backgroundColor: '#fff' },
  navText: { fontFamily: F.medium, fontSize: 15, color: C.gray2 },
  side: { width: 360, flexGrow: 0, backgroundColor: '#fff', borderLeftWidth: 1, borderLeftColor: '#EEF0F3' },
  mHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 52 },
  mFooter: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, backgroundColor: C.bg, gap: 8 },
  tabbar: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F0F1F3', paddingTop: 8, paddingBottom: 6 },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  tabText: { fontFamily: F.medium, fontSize: 11, color: C.gray },
  h1: { fontFamily: F.display, color: C.ink, letterSpacing: -0.5 },
  sub: { fontFamily: F.regular, fontSize: 15, lineHeight: 22, color: C.gray },
  label: { fontFamily: F.semibold, fontSize: 12, letterSpacing: 0.4, color: C.gray },
  meta: { fontFamily: F.medium, fontSize: 13, color: C.gray },
  pill: { paddingHorizontal: 16, height: 40, borderRadius: 20, justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E3E5E8' },
  pillOn: { backgroundColor: C.ink, borderColor: C.ink },
  pillText: { fontFamily: F.medium, fontSize: 14, color: C.ink },
  btn: { height: 54, borderRadius: 27, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  btnSec: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E3E5E8' },
  btnText: { fontFamily: F.semibold, fontSize: 16, color: '#fff' },
  btnSm: { height: 36, borderRadius: 18, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, alignSelf: 'flex-start' },
  btnSmText: { fontFamily: F.semibold, fontSize: 13, color: '#fff' },
  seg: { flexDirection: 'row', backgroundColor: '#EEF0F3', borderRadius: 999, padding: 4 },
  segItem: { flex: 1, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  segOn: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  segText: { fontFamily: F.medium, fontSize: 14, color: C.gray },
  node: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: BLUE, backgroundColor: '#fff' },
  nodeEmpty: { borderColor: '#B8BEC6', borderStyle: 'dashed', borderWidth: 1.5, backgroundColor: C.bg },
  nodeOn: { width: 18, height: 18, borderRadius: 9, borderWidth: 5 },
  rail: { flex: 1, width: 2, backgroundColor: '#BFD3FA', marginTop: 2 },
  stepCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 14 },
  stepEmpty: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#C9CDD2', borderStyle: 'dashed' },
  stepOn: { backgroundColor: BLUE },
  stepIcon: { width: 40, height: 40 },
  stepTitle: { flex: 1, fontFamily: F.semibold, fontSize: 16, color: C.ink },
  stepSub: { fontFamily: F.regular, fontSize: 14, lineHeight: 19, color: C.gray },
  scrim: { flex: 1, backgroundColor: 'rgba(20,20,24,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 32, gap: 14 },
  dialog: { width: 540, borderRadius: 28, paddingBottom: 24 },
  sheetTitle: { flex: 1, fontFamily: F.display, fontSize: 30, color: C.ink, paddingVertical: 2, outlineStyle: 'none' } as any,
  current: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F4F7FE', borderRadius: 16, padding: 12 },
  search: { height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#E3E5E8', paddingHorizontal: 18, justifyContent: 'center' },
  searchInput: { fontFamily: F.regular, fontSize: 15, color: C.ink, outlineStyle: 'none' } as any,
  msg: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F4F5F7', borderRadius: 14, padding: 12 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 14 },
  resultIcon: { width: 44, height: 44, borderRadius: 12 },
  tag: { fontFamily: F.medium, fontSize: 12, color: C.gray2, backgroundColor: '#F1F3F5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, overflow: 'hidden' },
  cardTitle: { fontFamily: F.semibold, fontSize: 15, lineHeight: 20, color: C.ink },
  gap: { backgroundColor: '#fff', borderRadius: 24, padding: 18, gap: 14, borderWidth: 2, borderColor: 'transparent' },
  gapIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  kind: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  kindText: { fontFamily: F.semibold, fontSize: 11 },
  gapTitle: { fontFamily: F.semibold, fontSize: 17, color: C.ink },
  why: { fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.gray2 },
  tile: { aspectRatio: 1, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  fit: { position: 'absolute', top: 10, left: 10, backgroundColor: '#E5F4EA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  fitText: { fontFamily: F.semibold, fontSize: 11, color: '#1E7B45' },
  price: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  wtb: { borderRadius: 16, borderWidth: 1, borderColor: '#EEF0F3', overflow: 'hidden' },
  wtbRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  wtbDiv: { borderTopWidth: 1, borderTopColor: '#EEF0F3' },
  bar: { height: 8, borderRadius: 4, backgroundColor: '#E6ECF8', overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: BLUE },
});
