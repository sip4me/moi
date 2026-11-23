import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Svg, { Path } from 'react-native-svg';
import { ActivityIndicator, Animated, Easing, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { icon3d } from '../../data/icons3d';
import { haptic } from '../../lib/haptics';
import { ingredientsFromPhoto, itemFromPhoto, submitTyped, takeProductPhoto } from '../../lib/routine/capture';
import { KIND_COLOR, KIND_LABEL, retailerLinks, type Gap } from '../../lib/routine/gaps';
import { CATEGORY_ICON, CATEGORY_LABEL, classify, isHydrated, searchCatalogLocal, searchRemote, setRoutine, useRoutine, TOOL_KINDS, useCatalog, type Item, type Step } from '../../lib/routine/model';
import { C, F } from '../../theme';
import { useStore } from '../../state/store';

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
  { key: 'tracker', label: 'Routine tracker', icon: 'goal_target', href: 'tracker' },
] as const;

/** The daily tracker add-on: Moi's original app (its onboarding the first time). */
function useGo() {
  const { onboarded } = useStore();
  return (href: string) => (href === 'tracker' ? router.push((onboarded ? '/(tabs)' : '/onboarding') as any) : router.replace(href as any));
}

function MenuButton({ onPress, hint }: { onPress: () => void; hint: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const tip = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!hint) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.delay(250),
    ]));
    loop.start();
    Animated.timing(tip, { toValue: 1, duration: 400, delay: 1200, useNativeDriver: true }).start();
    return () => { loop.stop(); pulse.setValue(0); };
  }, [hint]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        {hint ? <Animated.View pointerEvents="none" style={{ position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: BLUE, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }] }} /> : null}
        <Pressable onPress={() => { haptic('select'); onPress(); }} accessibilityRole="button" accessibilityLabel="Open menu"
          style={({ pressed }) => [st.menuBtn, pressed && { transform: [{ scale: 0.94 }] }]}>
          <Image source={crownImg} style={{ width: 24, height: 24 }} />
        </Pressable>
      </View>
      {hint ? (
        <Animated.View pointerEvents="none" style={[st.tip, { opacity: tip, transform: [{ translateX: tip.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }] }]}>
          <View style={st.tipArrow} />
          <Text style={st.tipText}>Tap to explore</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

function Menu({ open, onClose, active }: { open: boolean; onClose: () => void; active?: string }) {
  const go = useGo();
  const wide = useWide();
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(x, { toValue: open ? 1 : 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, [open]);
  if (!open) return null;
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <Pressable style={st.menuScrim} onPress={onClose}>
        <Animated.View style={[st.menuPanel, { width: wide ? 300 : '82%', transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }] }]}>
          <Pressable onPress={() => {}} style={{ flex: 1, gap: 4 }}>
            <View style={[st.brand, { paddingBottom: 20 }]}><Image source={crownImg} style={{ width: 24, height: 24 }} /><Text style={st.brandText}>Moi Routine</Text></View>
            {NAV.map(n => {
              const on = n.key === active;
              return (
                <Pressable key={n.key} onPress={() => { haptic('select'); onClose(); go(n.href); }} style={({ pressed }) => [st.nav, on && st.navOn, pressed && { opacity: 0.7 }, n.key === 'tracker' && st.navAddon]}>
                  <Image source={icon3d(n.icon)} style={{ width: 26, height: 26, opacity: on ? 1 : 0.75 }} />
                  <Text style={[st.navText, on && { fontFamily: F.semibold, color: C.ink }]}>{n.label}</Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export function Shell({ active, children, side, footer, step, hideNav }: { active?: string; children: React.ReactNode; side?: React.ReactNode; footer?: React.ReactNode; step?: string; hideNav?: boolean }) {
  const wide = useWide();
  const r = useRoutine();
  const [menu, setMenu] = useState(false);
  const openMenu = () => { setMenu(true); if (!r.menuSeen) setRoutine(x => ({ ...x, menuSeen: true })); };
  const top = (
    <View style={[st.topBar, wide && { paddingHorizontal: 32, paddingTop: 20 }]}>
      {hideNav ? <View style={{ height: 44 }} /> : <MenuButton onPress={openMenu} hint={isHydrated() && !r.menuSeen} />}
      <View style={{ flex: 1 }} />
      {step ? <Text style={st.meta}>{step}</Text> : null}
    </View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
      {top}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}
            contentContainerStyle={wide ? { paddingHorizontal: 56, paddingTop: 24, paddingBottom: 48, gap: 32, width: '100%', maxWidth: 920, alignSelf: 'center' } : { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 24 }}>
            {children}
            {!wide && side ? <View style={{ gap: 16 }}>{side}</View> : null}
          </ScrollView>
          {footer ? (wide
            ? <View style={st.wFooter}><View style={{ maxWidth: 808, width: '100%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>{footer}</View></View>
            : <View style={st.mFooter}>{footer}</View>) : null}
        </View>
        {wide && side ? <ScrollView style={st.side} contentContainerStyle={{ padding: 24, gap: 16 }}>{side}</ScrollView> : null}
      </View>
      <Menu open={menu} onClose={() => setMenu(false)} active={active} />
    </SafeAreaView>
  );
}

export function Heading({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  const wide = useWide();
  return (
    <View style={{ gap: 16, maxWidth: 720 }}>
      <View style={{ gap: 6 }}>
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
// Filled steps get a blue check node; the rail below a filled step draws itself down to the next one,
// and the first empty step pulses as "Up next" so it's clear where to add next.
function Rail({ filled, empty }: { filled: boolean; empty: boolean }) {
  const v = useRef(new Animated.Value(filled ? 1 : 0)).current;
  useEffect(() => { Animated.timing(v, { toValue: filled ? 1 : 0, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }, [filled]);
  return (
    <View style={[st.rail, { backgroundColor: empty ? '#E1E4E8' : '#D6E2FB' }]}>
      <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, backgroundColor: BLUE, height: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
    </View>
  );
}

export function Node({ state }: { state: 'done' | 'next' | 'empty' }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(state === 'done' ? 1 : 0)).current;
  useEffect(() => {
    if (state !== 'next') return;
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => { loop.stop(); pulse.setValue(0); };
  }, [state]);
  useEffect(() => { Animated.spring(pop, { toValue: state === 'done' ? 1 : 0, friction: 5, tension: 160, useNativeDriver: true }).start(); }, [state]);
  return (
    <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
      {state === 'next' ? <Animated.View style={{ position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: BLUE, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }] }} /> : null}
      <View style={[st.node, state === 'empty' && st.nodeEmpty, state === 'next' && st.nodeOn]} />
      <Animated.View style={{ position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', opacity: pop, transform: [{ scale: pop }] }}>
        <Svg width={11} height={11} viewBox="0 0 24 24"><Path d="m5 12.5 4.5 4.5L19 7.5" stroke="#fff" strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
      </Animated.View>
    </View>
  );
}

function StepRow({ s, state, last, nextFilled, onOpen }: { s: Step; state: 'done' | 'next' | 'empty'; last: boolean; nextFilled: boolean; onOpen: () => void }) {
  const empty = !s.item;
  const appear = useRef(new Animated.Value(1)).current;
  const prev = useRef(s.item?.name);
  useEffect(() => {
    if (s.item?.name && s.item.name !== prev.current) { appear.setValue(0); Animated.spring(appear, { toValue: 1, friction: 7, tension: 120, useNativeDriver: true }).start(); }
    prev.current = s.item?.name;
  }, [s.item?.name]);
  const next = state === 'next';
  return (
    <View style={{ flexDirection: 'row', gap: 14 }}>
      <View style={{ width: 20, alignItems: 'center', paddingTop: 18 }}>
        <Node state={state} />
        {!last ? <Rail filled={!empty} empty={empty && !next} /> : null}
      </View>
      <Pressable onPress={() => { haptic('select'); onOpen(); }} style={({ pressed }) => [{ flex: 1, paddingBottom: 12 }, pressed && { opacity: 0.85 }]}>
        <Animated.View style={[st.stepCard, empty && !next && st.stepQuiet, next && st.stepNext, { opacity: appear, transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }]}>
          {!empty ? <Image source={iconFor(s.item!.category)} style={st.stepIcon} /> : null}
          <View style={{ flex: 1, gap: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[st.stepTitle, empty && !next && { color: C.gray2 }]} numberOfLines={1}>{empty ? `+ Add ${(CATEGORY_LABEL[s.hint] ?? s.label).toLowerCase()}` : s.label}</Text>
              {next ? <View style={st.upNext}><Text style={st.upNextText}>Up next</Text></View> : s.when && !empty ? <Text style={st.meta}>{s.when}</Text> : null}
            </View>
            {empty && !next ? null : <Text style={st.stepSub} numberOfLines={2}>{empty ? 'Search, scan a barcode, or skip' : `${s.item!.brand ? `${s.item!.brand} · ` : ''}${s.item!.name}`}</Text>}
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

export function Timeline({ steps, onOpen }: { steps: Step[]; onOpen: (s: Step) => void; active?: string }) {
  const nextIdx = steps.findIndex(s => !s.item);
  const done = steps.filter(s => s.item).length;
  return (
    <View style={{ gap: 12 }}>
      {steps.length ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={[st.bar, { flex: 1, height: 6 }]}><View style={[st.barFill, { height: 6, width: `${Math.round((done / steps.length) * 100)}%` }]} /></View>
          <Text style={st.meta}>{done === steps.length ? 'All added' : `${done}/${steps.length}`}</Text>
        </View>
      ) : null}
      <View>
        {steps.map((s, i) => (
          <StepRow key={s.id} s={s} last={i === steps.length - 1} nextFilled={!!steps[i + 1]?.item}
            state={s.item ? 'done' : i === nextIdx ? 'next' : 'empty'} onOpen={() => onOpen(s)} />
        ))}
      </View>
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
  const local = useMemo(() => (step ? searchCatalogLocal(cat, q, step.hint).slice(0, 12) : []), [cat, q, step]);
  const [remote, setRemote] = useState<Item[]>([]);
  useEffect(() => {
    if (q.trim().length < 2) { setRemote([]); return; }
    let live = true;
    const t = setTimeout(() => { searchRemote(q).then(r => { if (live) setRemote(r); }).catch(() => {}); }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [q]);
  const results = useMemo(() => { const seen = new Set(local.map(i => `${i.kind}${i.id}`)); return [...local, ...remote.filter(i => !seen.has(`${i.kind}${i.id}`))].slice(0, 30); }, [local, remote]);
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
          ) : null}
          {step.item && step.item.kind === 'custom' ? (
            <Pressable onPress={async () => {
              const uri = await takeProductPhoto(false); if (!uri) return;
              setBusy(true); setMsg('Reading the ingredient list…');
              try {
                const r = await ingredientsFromPhoto(uri, step.item!, p => setMsg(`Reading the ingredient list… ${Math.round(p * 100)}%`));
                onPick(r.item);
                setMsg(r.found >= 3 ? `Read ${r.found} ingredients. Your gap report now checks them.` : 'We couldn\u2019t read the list clearly. Try a flatter, brighter photo.');
              } catch { setMsg('That photo didn\u2019t work. Try again in good light.'); } finally { setBusy(false); }
            }} style={st.ingCta}>
              <Text style={{ fontSize: 18 }}>🧴</Text>
              <View style={{ flex: 1 }}><Text style={st.cardTitle}>Snap the ingredient list</Text><Text style={st.meta}>We don’t have this one yet. A photo lets us check it now.</Text></View>
            </Pressable>
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

// ── Start-page teaser: a wash day filling in, left to right, on a loop ───────
function HRail({ filled }: { filled: boolean }) {
  const v = useRef(new Animated.Value(filled ? 1 : 0)).current;
  useEffect(() => { Animated.timing(v, { toValue: filled ? 1 : 0, duration: filled ? 480 : 0, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }, [filled]);
  return (
    <View style={{ flex: 1, height: 2, marginTop: 9, borderRadius: 1, backgroundColor: '#D6E2FB', overflow: 'hidden' }}>
      <Animated.View style={{ height: 2, backgroundColor: BLUE, width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
    </View>
  );
}

function TeaserStep({ label, sub, state }: { label: string; sub: string; state: 'done' | 'next' | 'empty' }) {
  const v = useRef(new Animated.Value(state === 'done' ? 1 : 0)).current;
  useEffect(() => { Animated.timing(v, { toValue: state === 'done' ? 1 : 0, duration: state === 'done' ? 320 : 0, useNativeDriver: true }).start(); }, [state]);
  return (
    <View style={{ width: 68, alignItems: 'center', gap: 6 }}>
      <Node state={state} />
      <Text style={{ fontFamily: state === 'empty' ? F.medium : F.semibold, fontSize: 12, color: state === 'empty' ? C.gray : C.ink, textAlign: 'center' }} numberOfLines={1}>{label}</Text>
      <Animated.Text style={{ fontFamily: F.regular, fontSize: 11, color: C.gray, opacity: v, marginTop: -3 }} numberOfLines={1}>{sub}</Animated.Text>
    </View>
  );
}

/** A short, looping simulation of adding a wash-day routine step by step. Generic names only. */
export function LinearTeaser() {
  const narrow = useWindowDimensions().width < 420;
  const steps = (narrow
    ? [['Pre-poo', 'Oil'], ['Cleanse', 'Shampoo'], ['Condition', 'Conditioner'], ['Style', 'Styler']]
    : [['Pre-poo', 'Oil'], ['Cleanse', 'Shampoo'], ['Condition', 'Conditioner'], ['Hair oil', 'Oil'], ['Style', 'Styler']]);
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setN(x => (x >= steps.length + 2 ? 0 : x + 1)), n === 0 ? 700 : n >= steps.length ? 1500 : 1000);
    return () => clearTimeout(t);
  }, [n, steps.length]);
  const done = Math.min(n, steps.length);
  const complete = done === steps.length;
  return (
    <View style={{ borderRadius: 24, backgroundColor: '#EEF1FD', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, gap: 12, maxWidth: 560 }} accessibilityLabel="Example: adding a wash day routine step by step">
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 13, color: C.ink, flex: 1 }}>Wash day</Text>
        <Text style={{ fontFamily: F.semibold, fontSize: 12, color: complete ? '#1E7B45' : BLUE }}>{complete ? 'Routine checked ✓' : `${done}/${steps.length} added`}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {steps.map(([label, sub], i) => (
          <React.Fragment key={label + i}>
            {i > 0 ? <HRail filled={i - 1 < done} /> : null}
            <TeaserStep label={label} sub={sub} state={i < done ? 'done' : i === done ? 'next' : 'empty'} />
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

export function NeedInfo({ goals }: { goals: boolean }) {
  return (
    <View style={{ gap: 16, maxWidth: 520, paddingTop: 8 }}>
      <Image source={icon3d(goals ? 'conditioner' : 'learn')} style={{ width: 72, height: 72 }} />
      <Text style={[st.h1, { fontSize: 30, lineHeight: 34 }]}>{goals ? 'Add your routine first' : 'Tell us about your hair first'}</Text>
      <Text style={st.sub}>{goals ? 'Add at least one product you use, and we\u2019ll check it against your goals.' : 'Pick your goals and a few details about your hair. Then we can judge your routine.'}</Text>
      <Btn label={goals ? 'Add my routine' : 'Start with my goals'} onPress={() => router.push(goals ? '/routine/build' : '/routine/goals')} style={{ alignSelf: 'flex-start' }} />
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
  navAddon: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#E3E5E8', borderTopLeftRadius: 0, borderTopRightRadius: 0, paddingTop: 12, height: 56 },
  navText: { fontFamily: F.medium, fontSize: 15, color: C.gray2 },
  side: { width: 360, flexGrow: 0, backgroundColor: '#fff', borderLeftWidth: 1, borderLeftColor: '#EEF0F3' },
  mHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 52 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, minHeight: 56 },
  menuBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  tip: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.ink, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  tipArrow: { position: 'absolute', left: -4, top: '50%', marginTop: -4, width: 8, height: 8, backgroundColor: C.ink, transform: [{ rotate: '45deg' }] },
  tipText: { fontFamily: F.semibold, fontSize: 13, color: '#fff' },
  menuScrim: { flex: 1, backgroundColor: 'rgba(20,20,24,0.28)' },
  menuPanel: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#F8F9FA', paddingHorizontal: 16, paddingTop: 28, paddingBottom: 24, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 6, height: 0 } },
  wFooter: { paddingHorizontal: 56, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#EEF0F3', backgroundColor: C.bg },
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
  rail: { flex: 1, width: 2, backgroundColor: '#D6E2FB', marginTop: 2, overflow: 'hidden', borderRadius: 1 },
  stepCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 14 },
  stepEmpty: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#C9CDD2', borderStyle: 'dashed' },
  stepOn: { backgroundColor: BLUE },
  stepQuiet: { backgroundColor: 'transparent', paddingVertical: 10 },
  stepNext: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: BLUE, borderStyle: 'dashed', shadowColor: BLUE, shadowOpacity: 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  upNext: { backgroundColor: '#EAF1FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  upNextText: { fontFamily: F.semibold, fontSize: 11, color: BLUE },
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
  ingCta: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1.5, borderColor: BLUE, borderStyle: 'dashed', padding: 12, backgroundColor: '#F4F7FE' },
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
