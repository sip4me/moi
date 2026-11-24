import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Svg, { Path } from 'react-native-svg';
import { ActivityIndicator, Animated, Platform, Easing, Image, Linking, Modal, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, TextInput, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { useScrollCue } from '../ScrollCue';
import { GlassBackdrop, SoftBackdrop } from './Glass';
import { CelebrateLayer, useToasting } from './Celebrate';
import { SafeAreaView } from 'react-native-safe-area-context';
import { icon3d } from '../../data/icons3d';
import { haptic } from '../../lib/haptics';
import { ingredientsFromPhoto, itemFromPhoto, submitTyped, takeProductPhoto } from '../../lib/routine/capture';
import { KIND_COLOR, KIND_LABEL, retailerLinks, type Gap } from '../../lib/routine/gaps';
import { allSteps, AREA_OF, CATEGORY_ICON, CATEGORY_LABEL, classify, DAYS, isHydrated, searchCatalogLocal, searchRemote, setRoutine, useRoutine, TOOL_KINDS, useCatalog, type Item, type RoutineState, type Step } from '../../lib/routine/model';
import { C, F } from '../../theme';
import { fill, PALETTE, shine } from '../../lib/routine/shine';
import { useStore } from '../../state/store';

export const BLUE = PALETTE.cobalt;
export const GOLD = PALETTE.champagne;
/** Hover (web): every button gets a black rim and a slightly darker fill than it has at rest. */
export const HOVER_RIM = { borderColor: PALETTE.garnetDeep, borderWidth: 1.5 } as const;
type PS = { pressed: boolean; hovered?: boolean };
export const crownImg = require('../../../assets/crown-pink.png');
export const useWide = () => useWindowDimensions().width >= 900;
/** Lower-cases a label for use mid-sentence, keeping acronyms like SPF. */
const lc = (l: string) => l.split(' ').map(w => (w.length > 1 && w === w.toUpperCase() ? w : w.toLowerCase())).join(' ');
export const iconFor = (cat?: string) => icon3d(CATEGORY_ICON[cat ?? ''] ?? 'drop');
export const money = (n?: number | null) => (n == null ? '' : `$${n % 1 ? n.toFixed(2) : n}`);

const CROWN_ART = require('../../../assets/crown-pink.png');
const COIN_PLUS = require('../../../assets/coin-plus.png');
const AVATAR_ART = require('../../../assets/avatar.png');

// ── Layout ───────────────────────────────────────────────────────────────────
const NAV = [
  { key: 'build', label: 'Routine', icon: 'conditioner', href: '/routine/build' },
  { key: 'gaps', label: 'Gap report', icon: 'mirror', href: '/routine/gaps' },
  { key: 'shop', label: 'Shop', icon: 'hair_food', href: '/routine/shop' },
  { key: 'goals', label: 'About you', icon: 'learn', href: '/routine/about' },
  { key: 'plans', label: 'Royal plans', icon: 'crown', href: '/routine/plans' },
  { key: 'profile', label: 'My profile', icon: 'avatar', href: '/routine/profile' },
  { key: 'tracker', label: 'Routine tracker', icon: 'goal_target', href: 'tracker' },
] as const;

/** The daily tracker add-on: Moi's original app (its onboarding the first time). */
function useGo() {
  const { onboarded } = useStore();
  return (href: string) => (href === 'tracker' ? router.push((onboarded ? '/(tabs)' : '/onboarding') as any) : router.push(href as any));
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
        <Pressable {...fill('pearl')} onPress={() => { haptic('select'); onPress(); }} accessibilityRole="button" accessibilityLabel="Open menu"
          style={({ pressed, hovered }: PS) => [st.menuBtn, hovered && { ...HOVER_RIM, backgroundColor: '#E9EAEC' }, pressed && { transform: [{ scale: 0.94 }] }]}>
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
                <Pressable key={n.key} onPress={() => { haptic('select'); onClose(); go(n.href); }} style={({ pressed, hovered }: PS) => [st.nav, on && st.navOn, n.key === 'tracker' && st.navAddon, hovered && { ...HOVER_RIM, backgroundColor: on ? '#EDEEF0' : '#E6E8EB' }, pressed && { opacity: 0.7 }]}>
                  <Image source={n.icon === 'crown' ? CROWN_ART : n.icon === 'avatar' ? AVATAR_ART : icon3d(n.icon)} resizeMode="contain" style={{ width: 26, height: 26, opacity: on ? 1 : 0.75 }} />
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

export function Shell({ active, children, side, footer, step, hideNav, glass }: { active?: string; children: React.ReactNode; side?: React.ReactNode; footer?: React.ReactNode; step?: string; hideNav?: boolean; glass?: boolean }) {
  const wide = useWide();
  const r = useRoutine();
  const toasting = useToasting();
  const [menu, setMenu] = useState(false);
  const openMenu = () => { setMenu(true); if (!r.menuSeen) setRoutine(x => ({ ...x, menuSeen: true })); };
  const top = (
    <View style={[st.topBar, wide && { paddingHorizontal: 32, paddingTop: 24 }]}>
      {hideNav ? <View style={{ height: 44 }} /> : <MenuButton onPress={openMenu} hint={isHydrated() && !r.menuSeen} />}
      <View style={{ flex: 1 }} />
      {r.bag.length ? <BagPill n={r.bag.reduce((t, k) => t + Math.max(1, r.qty?.[k] ?? 1), 0)} /> : null}
      {step && !toasting ? <Text style={[st.meta, r.bag.length ? { marginLeft: 12 } : null]}>{step}</Text> : null}
    </View>
  );
  const scrollRef = useRef<ScrollViewInstance>(null);
  const cue = useScrollCue(scrollRef);
  const { account } = useStore();
  useEffect(() => { if (account && !account.anonymous && !r.saved) setRoutine(x => ({ ...x, saved: true })); }, [account, r.saved]);
  return (
    <View style={{ flex: 1 }}>
    {glass ? <GlassBackdrop /> : <SoftBackdrop />}
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'bottom']}>
      {top}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
          <ScrollView ref={scrollRef} style={{ flex: 1 }} {...cue.props}
            contentContainerStyle={wide ? { paddingHorizontal: 72, paddingTop: 32, paddingBottom: 64, gap: 32, width: '100%', maxWidth: 920, alignSelf: 'center' } : { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40, gap: 24 }}>
            {children}
            {!wide && side ? <View style={{ gap: 16 }}>{side}</View> : null}
          </ScrollView>
          {cue.cue}
          </View>
          {footer ? (wide
            ? <View style={[st.wFooter, glass && { backgroundColor: 'transparent', borderTopColor: 'rgba(255,255,255,0.4)' }]}><View style={{ maxWidth: 808, width: '100%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>{footer}</View></View>
            : <View style={[st.mFooter, glass && { backgroundColor: 'transparent' }]}>{footer}</View>) : null}
        </View>
        {wide && side ? <ScrollView style={st.side} contentContainerStyle={{ paddingHorizontal: 22, paddingVertical: 20, gap: 12 }}>{side}</ScrollView> : null}
      </View>
      <Menu open={menu} onClose={() => setMenu(false)} active={active} />
      <CelebrateLayer />
    </SafeAreaView>
    </View>
  );
}

export function Heading({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  const wide = useWide();
  return (
    <View style={{ gap: 16, maxWidth: 720 }}>
      <View style={{ gap: 6 }}>
        <Text {...shine('chrome')} style={[st.h1, { fontSize: wide ? 44 : 34, lineHeight: wide ? 48 : 38 }]}>{title}</Text>
        {sub ? <Text style={st.sub}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export const Label = ({ children }: { children: string }) => <Text style={st.label}>{children.toUpperCase()}</Text>;

export function Pill({ label, on, onPress }: { label: string; on?: boolean; onPress?: () => void }) {
  return (
    <Pressable {...fill(on ? 'garnet' : 'pearl')} onPress={onPress ? () => { haptic('select'); onPress(); } : undefined} accessibilityRole="button" accessibilityState={{ selected: !!on }}
      style={({ pressed, hovered }: PS) => [st.pill, on && st.pillOn, hovered && { ...HOVER_RIM, backgroundColor: on ? PALETTE.garnetDeep : '#ECEDEF' }, pressed && { opacity: 0.8 }]}>
      <Text style={[st.pillText, on && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

/** The bag, always in reach once something's in it: bounces when the count changes, opens checkout. */
function BagPill({ n }: { n: number }) {
  const pop = useRef(new Animated.Value(1)).current;
  const prev = useRef(n);
  useEffect(() => {
    if (n > prev.current) Animated.sequence([Animated.spring(pop, { toValue: 1.25, friction: 3, tension: 220, useNativeDriver: true }), Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: true })]).start();
    prev.current = n;
  }, [n, pop]);
  return (
    <Animated.View style={{ transform: [{ scale: pop }] }}>
      <Pressable {...fill('pearl')} onPress={() => router.push('/routine/checkout')} accessibilityRole="button" accessibilityLabel={`Bag, ${n} item${n === 1 ? '' : 's'}. Check out`}
        style={({ hovered }: PS) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1.5, borderColor: hovered ? '#C9CEF0' : 'transparent' })}>
        <Ico name="bag" size={16} />
        <Text style={{ fontFamily: F.semibold, fontSize: 13, color: C.ink }}>{n}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** `glow`: everything needed is filled in, so the halo breathes (web). */
export function Btn({ label, onPress, kind = 'primary', style, disabled, glow }: { label: string; onPress?: () => void; kind?: 'primary' | 'secondary' | 'small'; style?: ViewStyle; disabled?: boolean; glow?: boolean }) {
  const fx: { dataSet?: Record<string, string> } = disabled ? {} : fill(kind === 'secondary' ? 'pearl' : 'garnet');
  if (glow && fx.dataSet) fx.dataSet = { ...fx.dataSet, glow: '1' };
  return (
    <Pressable {...fx} disabled={disabled} onPress={onPress ? () => { haptic(); onPress(); } : undefined} accessibilityRole="button"
      style={({ pressed, hovered }: PS) => [kind === 'small' ? st.btnSm : st.btn, kind === 'secondary' && st.btnSec, kind === 'primary' && !disabled && { paddingHorizontal: 54 }, style, hovered && !disabled && { ...HOVER_RIM, backgroundColor: kind === 'secondary' ? '#E6E8EB' : PALETTE.garnetDeep }, disabled && { opacity: 0.4 }, pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }]}>
      <Text style={[kind === 'small' ? st.btnSmText : st.btnText, kind === 'secondary' && { color: C.ink }]}>{label}</Text>
      {kind === 'primary' && !disabled ? <View pointerEvents="none" style={{ position: 'absolute', right: 22, top: 0, bottom: 0, justifyContent: 'center' }}><Svg width={18} height={18} viewBox="0 0 24 24"><Path {...({ dataSet: { chev: '' } } as object)} d="M9 5l7 7-7 7" stroke="#8E92A8" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg></View> : null}
    </Pressable>
  );
}

/** `progress`: each tab's own steps done / total, drawn as a thin bar under its label. */
export function Segmented({ options, value, onChange, progress }: { options: string[]; value: string; onChange: (v: string) => void; progress?: Record<string, { done: number; total: number }> }) {
  return (
    <View style={st.seg}>
      {options.map(o => {
        const pr = progress?.[o];
        const full = !!pr && pr.total > 0 && pr.done >= pr.total;
        return (
          <Pressable key={o} onPress={() => { haptic('select'); onChange(o); }} accessibilityLabel={pr ? `${o}, ${pr.done} of ${pr.total} steps` : o}
            style={({ hovered }: PS) => [st.segItem, o === value && st.segOn, hovered && { ...HOVER_RIM, backgroundColor: o === value ? '#F1F2F4' : '#E2E4E8' }]}>
            <Text style={[st.segText, o === value && { color: C.ink, fontFamily: F.semibold }]}>{full ? `${o} ✓` : o}</Text>
            {pr && pr.total ? <TabBar value={pr.done / pr.total} full={full} /> : null}
          </Pressable>
        );
      })}
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
    <View style={[st.rail, { backgroundColor: '#E1E4E8' }]}>
      <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, backgroundColor: BLUE, height: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
    </View>
  );
}

export function Node({ state, check = true }: { state: 'done' | 'next' | 'empty'; check?: boolean }) {
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
      <Animated.View {...fill('cobalt-dot')} style={{ position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', opacity: pop, transform: [{ scale: pop }] }}>
        {check ? <Svg width={11} height={11} viewBox="0 0 24 24"><Path d="m5 12.5 4.5 4.5L19 7.5" stroke="#fff" strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg> : null}
      </Animated.View>
    </View>
  );
}

function StepRow({ s, state, last, nextFilled, onOpen, locked, nudge = 0 }: { s: Step; state: 'done' | 'next' | 'empty' | 'skipped'; last: boolean; nextFilled: boolean; onOpen: () => void; locked?: boolean; nudge?: number }) {
  // The step to fill floats gently and sits a little bigger; a tap on a later step gives it a nudge.
  const bob = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (state !== 'next') { bob.setValue(0); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [state, bob]);
  useEffect(() => {
    if (!nudge || state !== 'next') return;
    shake.setValue(0);
    Animated.sequence([0, 1, 2, 3].map(i => Animated.timing(shake, { toValue: i % 2 ? -1 : 1, duration: 70, useNativeDriver: true })).concat([Animated.timing(shake, { toValue: 0, duration: 70, useNativeDriver: true })])).start();
  }, [nudge]);
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
        {state === 'skipped' ? <View style={st.skipNode}><View style={st.skipDash} /></View> : <Node state={state} />}
        {!last ? <Rail filled={!empty || state === 'skipped'} empty={empty && !next && state !== 'skipped'} /> : null}
      </View>
      <Pressable onPress={() => { haptic('select'); onOpen(); }} accessibilityState={{ disabled: !!locked }} style={({ pressed }) => [{ flex: 1, paddingBottom: next ? 16 : 12, paddingTop: next ? 4 : 0 }, pressed && { opacity: 0.85 }, locked && { opacity: 0.55 }]}>
        {({ hovered }: PS) => (
        <Animated.View style={next ? [st.stepFloat, { transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }, { translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] }) }, { scale: 1.035 }] }] : undefined}>
        <Animated.View style={[st.stepCard, empty && !next && st.stepQuiet, next && st.stepNext, hovered && { ...HOVER_RIM, borderStyle: 'solid', backgroundColor: '#EDEEF0' }, { opacity: appear, transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }]}>
          {!empty ? <Image source={iconFor(s.item!.category)} style={st.stepIcon} /> : state === 'skipped' ? null : <PlusDot solid={next} />}
          <View style={{ flex: 1, gap: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[st.stepTitle, empty && !next && { color: C.gray2 }, state === 'skipped' && { color: C.gray, textDecorationLine: 'line-through' }]} numberOfLines={1}>{state === 'skipped' ? s.label : empty ? `Add ${lc(CATEGORY_LABEL[s.hint] ?? s.label)}` : s.label}</Text>
              {state === 'skipped' ? <Text style={st.meta}>Skipped</Text> : null}
              {next ? <View style={st.upNext}><Text style={st.upNextText}>Up next</Text></View> : s.when && !empty ? <Text style={st.meta}>{s.when}</Text> : null}
            </View>
            {empty && !next ? null : <Text style={st.stepSub} numberOfLines={2}>{empty ? 'Search, scan or skip' : `${s.item!.brand ? `${s.item!.brand} · ` : ''}${s.item!.name}`}</Text>}
          </View>
        </Animated.View>
        </Animated.View>
        )}
      </Pressable>
    </View>
  );
}

/** A small outlined action button: used wherever an action used to be plain text. */
/** Line icons for actions people know by symbol (done, delete, back, search, retry...). Stroke follows the text colour. */
const ICON_PATHS: Record<string, string> = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  trash: 'M4 7h16M9 7V4.8h6V7M6.5 7l1 12.2h9l1-12.2M10 11v5.5M14 11v5.5',
  minus: 'M6 12h12',
  up: 'M12 19V5M6 11l6-6 6 6',
  tag: 'M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3-8.7 8.7zM8 8h.01',
  crown: 'M4 17h16M5 17 3.5 8l5 4L12 6l3.5 6 5-4L19 17',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5h4',
  card: 'M3.5 6.5h17v11h-17zM3.5 10h17',
  back: 'M19 12H5M11 6l-6 6 6 6',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.8-4.8',
  retry: 'M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6',
  calendar: 'M5 6.5h14v13H5zM5 10.5h14M9 4v4M15 4v4',
  skip: 'M6 6l7 6-7 6zM17 6v12',
  undo: 'M9 7L4 12l5 5M4 12h9a6 6 0 0 1 6 6',
  bag: 'M6 8h12l-1 12H7zM9 8V6.5a3 3 0 0 1 6 0V8',
  store: 'M4 9l1.5-4.5h13L20 9M4 9h16v1.5a2.7 2.7 0 0 1-5.3 0 2.7 2.7 0 0 1-5.4 0A2.7 2.7 0 0 1 4 10.5zM5.5 13v7h13v-7',
  plus: 'M12 5v14M5 12h14',
};
export function Ico({ name, size = 18, color = C.ink }: { name: keyof typeof ICON_PATHS | string; size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d={ICON_PATHS[name] ?? ''} stroke={color} strokeWidth={1.9} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}

/** A small action button. `iconOnly` shows just the icon (the label stays as the accessible name and hover tooltip). */
/** Cart line controls: a red trash to remove, and − count + for how many. */
export function QtyStepper({ n, onChange, onRemove, label }: { n: number; onChange: (n: number) => void; onRemove: () => void; label: string }) {
  const round = (name: string, on: () => void, a11y: string, disabled?: boolean, red?: boolean) => (
    <Pressable onPress={() => { if (disabled) return; haptic('select'); on(); }} accessibilityRole="button" accessibilityLabel={a11y} accessibilityState={{ disabled }} hitSlop={6}
      style={({ hovered, pressed }: PS) => ({ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
        backgroundColor: red ? (hovered ? '#FDE4E1' : '#FEF0EE') : hovered ? '#F1F2F4' : '#fff', borderWidth: 1, borderColor: red ? '#F7C6BF' : '#D9DCE3',
        opacity: disabled ? 0.35 : pressed ? 0.8 : 1 })}>
      <Ico name={name} size={16} color={red ? '#D92D20' : C.ink} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {round('trash', onRemove, `Remove ${label}`, false, true)}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 2, borderRadius: 20, backgroundColor: '#F4F5F8' }}>
        {round('minus', () => onChange(n - 1), `One fewer ${label}`, n <= 1)}
        <Text style={{ minWidth: 22, textAlign: 'center', fontFamily: F.semibold, fontSize: 15, color: C.ink, fontVariant: ['tabular-nums'] }} accessibilityLabel={`Quantity ${n}`}>{n}</Text>
        {round('plus', () => onChange(n + 1), `One more ${label}`, n >= 9)}
      </View>
    </View>
  );
}

export function ChipBtn({ label, onPress, tone = 'default', icon, iconOnly }: { label: string; onPress: () => void; tone?: 'default' | 'danger' | 'dark'; icon?: React.ReactNode | string; iconOnly?: boolean }) {
  const dark = tone === 'dark';
  const ink = tone === 'danger' ? '#B42318' : dark ? '#3B2A0B' : C.ink;
  const glyph = typeof icon === 'string' ? <Ico name={icon} size={iconOnly ? 19 : 16} color={ink} /> : icon;
  return (
    <Pressable {...fill(dark ? 'garnet' : 'pearl')} onPress={() => { haptic('select'); onPress(); }} accessibilityRole="button" accessibilityLabel={label} {...(iconOnly && Platform.OS === 'web' ? ({ title: label } as any) : {})}
      style={({ pressed, hovered }: PS) => [st.chipBtn, iconOnly && { width: 40, height: 40, paddingHorizontal: 0, justifyContent: 'center' }, dark && { backgroundColor: PALETTE.garnet, borderColor: PALETTE.garnet }, hovered && { ...HOVER_RIM, backgroundColor: dark ? PALETTE.garnetDeep : '#ECEDEF' }, pressed && { transform: [{ scale: 0.97 }] }]}>
      {glyph}
      {iconOnly ? null : <Text style={[st.chipBtnText, tone === 'danger' && { color: '#B42318' }, dark && { color: '#fff' }]}>{label}</Text>}
    </Pressable>
  );
}

/** The round "+" that says: tap here to add a product. */
export function PlusDot({ solid, size = 32 }: { solid?: boolean; size?: number }) {
  // Filled: the gold "+" coin from the Figma seal. Empty: a pearl circle with a garnet plus.
  if (solid) return <Image source={COIN_PLUS} style={{ width: size * 1.15, height: size * 1.15, margin: -size * 0.075 }} resizeMode="contain" />;
  return (
    <View {...fill(solid ? 'lilac' : 'pearl')} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: solid ? PALETTE.garnet : '#fff', borderWidth: 1.5, borderColor: solid ? PALETTE.garnet : '#C4C8CE' }} accessibilityElementsHidden importantForAccessibility="no">
      <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" stroke={solid ? '#fff' : PALETTE.garnet} strokeWidth={2.6} strokeLinecap="round" /></Svg>
    </View>
  );
}

/** Progress fill that glides to its new width; full and gold-tinted once the routine is submitted. */
function TabBar({ value, full }: { value: number; full: boolean }) {
  const v = useRef(new Animated.Value(value)).current;
  useEffect(() => { Animated.timing(v, { toValue: value, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }, [value]);
  return (
    <View style={{ alignSelf: 'stretch', marginHorizontal: 10, marginTop: 4, height: 3, borderRadius: 2, backgroundColor: 'rgba(110,123,217,0.15)', overflow: 'hidden' }}>
      <Animated.View style={{ height: 3, borderRadius: 2, backgroundColor: full ? GOLD : BLUE, width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
    </View>
  );
}

function ProgressBar({ value, submitted }: { value: number; submitted: boolean }) {
  const v = useRef(new Animated.Value(value)).current;
  useEffect(() => { Animated.timing(v, { toValue: value, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }, [value]);
  return (
    <View style={[st.bar, { flex: 1, height: 6 }]}>
      <Animated.View {...fill(submitted ? 'champagne' : 'cateye')} style={[st.barFill, { height: 6, backgroundColor: submitted ? GOLD : BLUE, width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
    </View>
  );
}

/** The end of the line: a Submit button, which becomes a gold check once the routine is submitted. */
function RoutineEnd({ submitted, canSubmit, onSubmit }: { submitted: boolean; canSubmit: boolean; onSubmit: () => void }) {
  const pop = useRef(new Animated.Value(submitted ? 1 : 0)).current;
  useEffect(() => { Animated.spring(pop, { toValue: submitted ? 1 : 0, friction: 4, tension: 140, useNativeDriver: true }).start(); }, [submitted]);
  return (
    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', paddingTop: 4 }}>
      <View style={{ width: 20, alignItems: 'center' }}>
        {submitted ? (
          <Animated.View style={{ transform: [{ scale: pop }] }}><GoldCheck size={30} /></Animated.View>
        ) : <View style={[st.node, st.nodeEmpty]} />}
      </View>
      {submitted ? (
        <Animated.View style={{ flex: 1, opacity: pop }}>
          <Text style={[st.cardTitle, { color: '#8C6D35' }]}>Routine saved</Text>
          <Text style={st.meta}>Tap a step to edit.</Text>
        </Animated.View>
      ) : (
        <View style={{ flex: 1, gap: 6 }}>
          <ChipBtn label="Submit routine" tone="dark" onPress={canSubmit ? onSubmit : () => {}} />
          {!canSubmit ? <Text style={st.meta}>Add or skip a step first.</Text> : null}
        </View>
      )}
    </View>
  );
}

/** Moi's gold check: a gold coin with a white tick. */
export function GoldCheck({ size = 28 }: { size?: number }) {
  return (
    <View {...fill('champagne-coin')} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: GOLD, borderWidth: 2, borderColor: '#EFE0B8', shadowColor: '#8A6A1F', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }}>
      <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24"><Path d="m5 12.5 4.5 4.5L19 7.5" stroke="#fff" strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
    </View>
  );
}

export function Timeline({ steps, onOpen, submitted = false, onSubmit, extra }: { steps: Step[]; onOpen: (s: Step) => void; active?: string; submitted?: boolean; onSubmit?: () => void; extra?: React.ReactNode }) {
  const nextIdx = steps.findIndex(s => !s.item && !s.skipped);
  const [nudge, setNudge] = useState(0);
  const [tip, setTip] = useState('');
  const nextStep = nextIdx >= 0 ? steps[nextIdx] : undefined;
  const tapLocked = () => { haptic('select'); setNudge(n => n + 1); setTip(`Finish ${lc(CATEGORY_LABEL[nextStep?.hint ?? ''] ?? nextStep?.label ?? 'this step')} first, or skip it.`); };
  useEffect(() => { if (!tip) return; const t = setTimeout(() => setTip(''), 2600); return () => clearTimeout(t); }, [tip, nudge]);
  const done = steps.filter(s => s.item || s.skipped).length;
  // Each filled or skipped box moves the bar one step; submitting completes it.
  const value = submitted ? 1 : steps.length ? done / steps.length : 0;
  return (
    <View style={{ gap: 12 }}>
      {steps.length ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ProgressBar value={value} submitted={submitted} />
          <Text style={[st.meta, submitted && { color: '#8C6D35', fontFamily: F.semibold }]}>{submitted ? 'Complete' : `${done}/${steps.length}`}</Text>
        </View>
      ) : null}
      <View>
        {steps.map((s, i) => (
          <View key={s.id}>
            <StepRow s={s} last={i === steps.length - 1 && !onSubmit} nextFilled={!!steps[i + 1]?.item}
              state={s.item?.addedAt ? 'done' : s.skipped ? 'skipped' : !submitted && i === nextIdx ? 'next' : 'empty'}
              locked={!submitted && nextIdx >= 0 && i > nextIdx && !s.item && !s.skipped} nudge={i === nextIdx ? nudge : 0}
              onOpen={() => (!submitted && nextIdx >= 0 && i > nextIdx && !s.item && !s.skipped ? tapLocked() : onOpen(s))} />
            {tip && i === nextIdx ? <Text accessibilityRole="alert" style={{ marginLeft: 34, marginTop: -6, marginBottom: 10, fontFamily: F.semibold, fontSize: 13, color: '#5B67C9' }}>{tip}</Text> : null}
          </View>
        ))}
        {extra}
        {onSubmit && steps.length ? <RoutineEnd submitted={submitted} canSubmit={done > 0} onSubmit={onSubmit} /> : null}
      </View>
    </View>
  );
}

// ── Add / change a step ──────────────────────────────────────────────────────
export function PickerSheet({ step, onClose, onPick, onRemove, onRename, onSkip }: { step: Step | null; onClose: () => void; onPick: (i: Item) => void; onRemove: () => void; onRename: (label: string) => void; onSkip?: () => void }) {
  const wide = useWide();
  const cat = useCatalog();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const listRef = useRef<ScrollViewInstance>(null);
  const listCue = useScrollCue(listRef, { bottom: 8 });
  // Search: nothing is listed until the whole search has finished, so results never jump around while typing.
  const [search, setSearch] = useState<{ phase: 'idle' | 'searching' | 'done' | 'error'; q: string; items: Item[] }>({ phase: 'idle', q: '', items: [] });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setSearch({ phase: 'idle', q: '', items: [] }); return; }
    let live = true;
    setSearch(s => ({ phase: 'searching', q: term, items: s.items }));
    const t = setTimeout(async () => {
      try {
        const remote = await searchRemote(term, step?.hint);
        // Anything the person already has in their routine catalog (e.g. typed earlier) is merged in, database results first.
        const local = searchCatalogLocal(cat, term, step?.hint).slice(0, 10);
        const seen = new Set(remote.map(i => `${i.kind}${i.id}`));
        const items = [...remote, ...local.filter(i => !seen.has(`${i.kind}${i.id}`))].slice(0, 30);
        if (live) setSearch({ phase: 'done', q: term, items });
      } catch {
        if (live) setSearch({ phase: 'error', q: term, items: [] });
      }
    }, 300);
    return () => { live = false; clearTimeout(t); };
  }, [q, retry, step?.hint]);
  const results = search.phase === 'done' ? search.items : [];
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
    const guess = TOOL_KINDS.has(step.hint) || AREA_OF[step.hint] ? { category: step.hint, tags: [] } : classify(`${name} ${CATEGORY_LABEL[step.hint] ?? ''}`);
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
            <ChipBtn label="Done" tone="dark" icon="check" iconOnly onPress={close} />
          </View>
          {step.item ? (
            <View style={st.current}>
              <Image source={iconFor(step.item.category)} style={{ width: 44, height: 44 }} />
              <View style={{ flex: 1 }}><Text style={st.meta}>{step.item.brand || CATEGORY_LABEL[step.item.category]}</Text><Text style={st.cardTitle}>{step.item.name}</Text></View>
              <ChipBtn label="Remove product" tone="danger" icon="trash" iconOnly onPress={onRemove} />
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
            }} style={({ hovered }: PS) => [st.ingCta, hovered && { ...HOVER_RIM, borderStyle: 'solid', backgroundColor: '#E3EAFB' }]}>
              <Text style={{ fontSize: 18 }}>🧴</Text>
              <View style={{ flex: 1 }}><Text style={st.cardTitle}>Snap the ingredient list</Text><Text style={st.meta}>Not in our database yet. Snap the label so we can check it.</Text></View>
            </Pressable>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {onSkip ? <ChipBtn label={step.skipped ? 'Undo skip' : 'Skip this step'} icon={step.skipped ? 'undo' : 'skip'} onPress={onSkip} /> : null}
              <ChipBtn label="Delete step" tone="danger" icon="trash" onPress={onRemove} />
            </View>
          )}
          <View style={[st.search, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
            <Ico name="search" size={18} color={C.gray} />
            <TextInput value={q} onChangeText={setQ} placeholder={`Search ${lc(CATEGORY_LABEL[step.hint] ?? 'products')} or brands`} placeholderTextColor={C.gray} style={st.searchInput} autoFocus={wide} returnKeyType="search" />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <ChipBtn label="Scan barcode" tone="dark" onPress={() => scan(false)} icon={<Svg width={16} height={16} viewBox="0 0 24 24"><Path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M8 9v6M11 9v6M14 9v6M17 9v6" stroke="#fff" strokeWidth={1.8} fill="none" strokeLinecap="round" /></Svg>} />
            <ChipBtn label="Upload photo" onPress={() => scan(true)} icon={<Svg width={16} height={16} viewBox="0 0 24 24"><Path d="M12 16V5M7 10l5-5 5 5M5 19h14" stroke={C.ink} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>} />
          </View>
          {busy || msg ? <View style={st.msg}>{busy ? <ActivityIndicator size="small" color={C.ink} /> : null}<Text style={[st.sub, { flex: 1, fontSize: 14 }]}>{msg}</Text></View> : null}
          <View>
          <ScrollView ref={listRef} style={{ maxHeight: wide ? 360 : 320 }} keyboardShouldPersistTaps="handled" {...listCue.props}>
            {search.phase === 'searching' ? (
              <View style={[st.msg, { marginBottom: 6 }]}><ActivityIndicator size="small" color={C.ink} /><Text style={[st.sub, { flex: 1, fontSize: 14 }]}>{`Searching every product for \u201c${search.q}\u201d`}</Text></View>
            ) : null}
            {search.phase === 'error' ? (
              <View style={[st.msg, { marginBottom: 6 }]}><Text style={[st.sub, { flex: 1, fontSize: 14 }]}>Search didn’t go through. Check your connection.</Text><ChipBtn label="Try again" icon="retry" iconOnly onPress={() => setRetry(n => n + 1)} /></View>
            ) : null}
            {search.phase === 'done' && !results.length ? (
              <Text style={[st.sub, { fontSize: 14, paddingVertical: 6 }]}>{`No matches for \u201c${search.q}\u201d. Try the brand alone, or add it below.`}</Text>
            ) : null}
            {search.phase === 'done' && results.length ? <Text style={[st.meta, { paddingVertical: 4 }]}>{`${results.length} result${results.length === 1 ? '' : 's'}`}</Text> : null}
            {search.phase === 'done' || search.phase === 'error' ? (
              <Pressable onPress={typed} style={({ hovered }: PS) => [st.result, hovered && { ...HOVER_RIM, backgroundColor: '#ECEDEF' }]}>
                <View style={[st.resultIcon, { backgroundColor: '#EEF0F3', alignItems: 'center', justifyContent: 'center' }]}><Text style={{ fontSize: 20 }}>+</Text></View>
                <View style={{ flex: 1 }}><Text style={st.cardTitle}>Add “{q.trim()}”</Text><Text style={st.meta}>Not listed? We’ll add it.</Text></View>
              </Pressable>
            ) : null}
            {results.map(i => (
              <Pressable key={`${i.kind}${i.id}`} onPress={() => pick(i)} style={({ pressed, hovered }: PS) => [st.result, hovered && { ...HOVER_RIM, backgroundColor: '#ECEDEF' }, pressed && { backgroundColor: C.pressed }]}>
                <Image source={iconFor(i.category)} style={st.resultIcon} />
                <View style={{ flex: 1 }}><Text style={st.meta}>{i.brand || (i.kind === 'tool' ? 'Tool' : '')}</Text><Text style={st.cardTitle} numberOfLines={1}>{i.name}</Text></View>
                <Text style={st.tag}>{CATEGORY_LABEL[i.category] ?? i.category}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {listCue.cue}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Gaps and products ────────────────────────────────────────────────────────
/** Laptop side panel: everything the person entered, with edit links. The report is judged on exactly this. */
export function InputsPanel({ s, compact }: { s: RoutineState; compact?: boolean }) {
  const hair = [s.hair.texture, s.hair.strands, s.hair.scalp && `${s.hair.scalp} scalp`, s.hair.treated && s.hair.treated !== 'No' && s.hair.treated, s.hair.heat && `Heat ${s.hair.heat.toLowerCase()}`].filter(Boolean).join(' · ');
  const logged = allSteps(s).filter(x => x.step.item?.addedAt).length;
  const skipped = allSteps(s).filter(x => x.step.skipped).length;
  const row = (k: string, v: string, href: string) => (
    <Pressable key={k} onPress={() => router.push(href as any)} accessibilityRole="button" accessibilityLabel={`Edit ${k}`}
      style={({ hovered }: PS) => ({ gap: 1, paddingVertical: compact ? 6 : 10, paddingHorizontal: 12, marginHorizontal: -12, borderRadius: compact ? 0 : 10, borderTopWidth: compact ? 1 : 0, borderTopColor: '#F0F1F4', backgroundColor: hovered ? '#F4F5F8' : 'transparent' })}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={[st.label, { flex: 1 }]}>{k}</Text><Text style={{ fontFamily: F.semibold, fontSize: 12, color: '#6E7BD9' }}>Edit</Text></View>
      <Text style={{ fontFamily: F.medium, fontSize: compact ? 13 : 14, lineHeight: compact ? 18 : 20, color: v ? C.ink : C.gray }} numberOfLines={compact ? 2 : undefined}>{v || 'Not set'}</Text>
    </Pressable>
  );
  return (
    <View style={{ gap: 4 }}>
      <Text style={compact ? [st.label, { color: C.gray2, marginBottom: 2 }] : { fontFamily: F.semibold, fontSize: 15, color: C.ink, marginBottom: 6 }}>Judged on</Text>
      {(s.areas ?? ['hair']).includes('hair') ? row('Hair goals', s.goals.join(', '), '/routine/about') : null}
      {(s.areas ?? ['hair']).includes('hair') ? row('Hair', hair, '/routine/about') : null}
      {row('Budget', s.hair.budget ?? '', '/routine/about')}
      {row('Routine', `${logged} product${logged === 1 ? '' : 's'}${skipped ? ` · ${skipped} skipped` : ''}${(s.areas ?? ['hair']).includes('hair') ? ` · wash ${s.washDays.map(d => DAYS[d]).join(', ') || 'days not set'}` : ''}`, '/routine/build')}
      {s.occasions.length ? row('Occasions', s.occasions.join(', '), '/routine/build') : null}
      {(s.areas ?? []).includes('skin') ? row('Skin', [...(s.prefs?.skin_type ?? []), ...(s.prefs?.skin_concerns ?? [])].join(' · '), '/routine/about') : null}
      {(s.areas ?? []).includes('makeup') ? row('Makeup', [s.prefs?.mk_look?.[0], s.prefs?.mk_tone?.[0], s.prefs?.mk_undertone?.[0], s.prefs?.mk_finish?.[0], s.prefs?.mk_coverage?.[0] && `${s.prefs.mk_coverage[0]} coverage`].filter(Boolean).join(' · '), '/routine/about') : null}
      {(s.areas ?? []).includes('body') ? row('Body', [...(s.prefs?.body_feel ?? []), ...(s.prefs?.body_concerns ?? [])].join(' · '), '/routine/about') : null}
    </View>
  );
}

/** Laptop side panel on the routine builder: fit, top gaps and what it's judged on, compact enough to see whole. */
export function LivePanel({ score, gaps, onOpen, empty }: { score: number; gaps: Gap[]; onOpen: () => void; empty?: boolean }) {
  const top = [...gaps].sort((x, y) => y.weight - x.weight).slice(0, 4);
  if (empty) return (
    <View style={{ gap: 10 }}>
      <Text style={[st.label, { color: C.gray2 }]}>Live check</Text>
      <Text style={[st.meta, { fontSize: 13 }]}>Add your first product to see your fit.</Text>
      <ScoreBar score={0} />
    </View>
  );
  return (
    <View style={{ gap: 10 }}>
      <Text style={[st.label, { color: C.gray2 }]}>Live check</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
        <Text style={{ fontFamily: F.display, fontSize: 30, lineHeight: 32, color: C.ink }}>{score}</Text>
        <Text style={[st.meta, { fontSize: 12 }]}>routine fit</Text>
      </View>
      <ScoreBar score={score} />
      <Faint />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[st.label, { flex: 1, color: C.gray2 }]}>{gaps.length ? `${gaps.length} gap${gaps.length === 1 ? '' : 's'}` : 'No gaps'}</Text>
      </View>
      {top.map(g => (
        <View key={g.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: KIND_COLOR[g.kind].fg }} />
          <Text style={{ flex: 1, fontFamily: F.medium, fontSize: 13, color: C.ink }} numberOfLines={1}>{g.title}</Text>
        </View>
      ))}
      {gaps.length > top.length ? <Text style={[st.meta, { fontSize: 12 }]}>{`+${gaps.length - top.length} more`}</Text> : null}
    </View>
  );
}
/** Phone version of the live check: one slim card pinned above the main button, so it's always in view. */
export function LiveStrip({ score, gaps, empty }: { score: number; gaps: Gap[]; empty?: boolean }) {
  const top = [...gaps].sort((x, y) => y.weight - x.weight).slice(0, 2);
  if (empty) return (
    <View style={{ alignSelf: 'stretch', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECEEF2', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Text style={[st.label, { color: C.gray2, fontSize: 11 }]}>Live check</Text>
      <Text style={[st.meta, { fontSize: 12, flex: 1 }]} numberOfLines={1}>Add your first product to see your fit</Text>
    </View>
  );
  return (
    <View style={{ alignSelf: 'stretch', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECEEF2', gap: 6 }} accessibilityLabel={`Live check: routine fit ${score}, ${gaps.length} gaps`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={[st.label, { color: C.gray2, fontSize: 11 }]}>Live check</Text>
        <Text style={{ fontFamily: F.display, fontSize: 20, lineHeight: 22, color: C.ink }}>{score}</Text>
        <View style={{ flex: 1 }}><ScoreBar score={score} /></View>
      </View>
      <Faint />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={[st.label, { color: C.gray2, fontSize: 11 }]}>{gaps.length ? `${gaps.length} gap${gaps.length === 1 ? '' : 's'}` : 'No gaps'}</Text>
        {top.map(g => (
          <View key={g.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: KIND_COLOR[g.kind].fg }} />
            <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.ink, flexShrink: 1 }} numberOfLines={1}>{g.title}</Text>
          </View>
        ))}
        {gaps.length > top.length ? <Text style={[st.meta, { fontSize: 12 }]}>{`+${gaps.length - top.length}`}</Text> : null}
      </View>
    </View>
  );
}
/** A faint line between groups. */
export const Faint = () => <View style={{ height: 1, backgroundColor: '#ECEEF2', marginVertical: 4 }} accessibilityElementsHidden importantForAccessibility="no" />;

export function GapCard({ gap, onPress, selected, cta, price }: { gap: Gap; onPress?: () => void; selected?: boolean; cta?: string; price?: string }) {
  const c = KIND_COLOR[gap.kind];
  return (
    <Pressable onPress={onPress} style={({ pressed, hovered }: PS) => [st.gap, selected && { borderColor: '#8F99E6' }, hovered && { borderColor: '#B7BEF0', backgroundColor: '#FAFAFE' }, pressed && { opacity: 0.9 }]}>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <View style={[st.gapIcon, { backgroundColor: c.bg }]}><Image source={iconFor(gap.fills[0])} style={{ width: 46, height: 46 }} /></View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={[st.kind, { backgroundColor: c.bg }]}><Text style={[st.kindText, { color: c.fg }]}>{KIND_LABEL[gap.kind]}</Text></View>
          <Text style={st.gapTitle}>{gap.title}</Text>
        </View>
      </View>
      <Text style={st.why}>{gap.why}</Text>
      {cta ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {price ? <Text style={[st.meta, { flex: 1 }]}>{price}</Text> : <View style={{ flex: 1 }} />}
        {/* Sits at the tail of the card; the arrow leads the eye to the picks. */}
        <View style={[st.btnSm, st.tint, { flexDirection: 'row', gap: 6, paddingLeft: 18, paddingRight: 14, alignSelf: 'auto' }]}>
          <Text style={[st.btnSmText, { color: TINT_INK }]}>{cta}</Text>
          <Svg width={15} height={15} viewBox="0 0 24 24"><Path d={cta === 'Hide' ? 'M6 15l6-6 6 6' : 'M5 12h14M13 6l6 6-6 6'} stroke={TINT_INK} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
        </View>
      </View> : null}
    </Pressable>
  );
}

/** One ranked option for a gap. The category picture is a small marker, not a product photo, so it stays thumbnail-sized (48, like the bag and checkout); the advantage reads first. */
const TINT_INK = '#4652B5';

export function PickRow({ rank, item, fit, gain, badge, why, inBag, onAdd }: { rank: number; item: Item; fit: number; gain?: number; badge?: 'best' | 'value'; why?: string; inBag?: boolean; onAdd: () => void }) {
  const lead = badge === 'best';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1.5, borderColor: lead ? '#E7C98B' : '#EEF0F3' }}>
      <Text style={{ width: 16, textAlign: 'center', fontFamily: F.semibold, fontSize: 13, color: C.gray2 }} accessibilityLabel={`Rank ${rank}`}>{rank}</Text>
      <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: lead ? '#FFF8E8' : '#F4F5F7', alignItems: 'center', justifyContent: 'center' }}><Image source={iconFor(item.category)} style={{ width: 38, height: 38 }} /></View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          {badge ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: badge === 'best' ? PALETTE.garnet : '#1E7B45' }}>
              <Ico name={badge === 'best' ? 'crown' : 'tag'} size={11} color="#fff" />
              <Text style={{ fontFamily: F.semibold, fontSize: 11, color: '#fff' }}>{badge === 'best' ? 'Best for you' : 'Best value'}</Text>
            </View>
          ) : null}
          {gain ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }} accessibilityLabel={`Raises your fit by ${gain}`}>
              <Ico name="up" size={11} color={BLUE} /><Text style={{ fontFamily: F.bold, fontSize: 12, color: BLUE }}>{`+${gain} fit`}</Text>
            </View>
          ) : <Text style={[st.meta, { fontSize: 12 }]}>{`${fit}% match`}</Text>}
        </View>
        <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }} numberOfLines={2}>{item.name}</Text>
        <Text style={[st.meta, { fontSize: 12 }]} numberOfLines={1}>{[item.brand, why].filter(Boolean).join(' · ')}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.ink }}>{item.price != null ? money(item.price) : 'At store'}</Text>
        <Pressable onPress={() => { haptic(); onAdd(); }} accessibilityRole="button" accessibilityLabel={inBag ? `Remove ${item.name} from bag` : `Add ${item.name} to bag`}
          style={({ hovered }: PS) => [st.btnSm, st.tint, { height: 32, paddingHorizontal: 12, flexDirection: 'row', gap: 4 }, hovered && { backgroundColor: 'rgba(94,106,206,0.24)' }, inBag && { backgroundColor: '#E5F4EA', borderColor: '#CDEBD6' }]}>
          <Ico name={inBag ? 'check' : 'plus'} size={13} color={inBag ? '#1E7B45' : TINT_INK} />
          <Text style={[st.btnSmText, { color: inBag ? '#1E7B45' : TINT_INK }]}>{inBag ? 'Added' : 'Add'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ProductCard({ item, fit, best, inBag, onAdd, width, why, gain, badge }: { item: Item; fit: number; best?: boolean; inBag?: boolean; onAdd: () => void; width?: number; why?: string; gain?: number; badge?: 'best' | 'value' }) {
  const tag = badge === 'best' || best ? 'Best for you' : badge === 'value' ? 'Best value' : `${fit}% match`;
  return (
    <View style={[{ gap: 12 }, width ? { width } : { flex: 1, minWidth: 0 }]}>
      <View style={[st.tile, (badge === 'best' || best) && { backgroundColor: '#FFF8E8' }, badge === 'value' && { backgroundColor: '#EEF7F0' }]}>
        <Image source={iconFor(item.category)} style={{ width: '68%', height: '68%' }} resizeMode="contain" />
        <View style={[st.fit, (badge === 'best' || best) && { backgroundColor: PALETTE.garnet }, badge === 'value' && { backgroundColor: '#1E7B45' }, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
          {badge ? <Ico name={badge === 'value' ? 'tag' : 'crown'} size={12} color="#fff" /> : null}
          <Text style={[st.fitText, badge && { color: '#fff' }]}>{tag}</Text>
        </View>
        {gain ? <View style={{ position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: '#fff' }} accessibilityLabel={`Raises your fit by ${gain}`}>
          <Ico name="up" size={11} color={BLUE} /><Text style={{ fontFamily: F.bold, fontSize: 12, color: BLUE }}>{`+${gain} fit`}</Text>
        </View> : null}
      </View>
      <View style={{ gap: 3, paddingHorizontal: 4 }}>
        <Text style={st.meta} numberOfLines={1}>{item.brand || CATEGORY_LABEL[item.category]}</Text>
        <Text style={st.cardTitle} numberOfLines={2}>{item.name}</Text>
        {why ? <Text style={[st.meta, { color: '#7E3A4C' }]} numberOfLines={2}>{why}</Text> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}>
        <Text style={st.price}>{item.price ? `about ${money(item.price)}` : ''}</Text>
        <View style={{ flex: 1 }} />
        <Pressable {...(inBag ? {} : fill('garnet'))} onPress={() => { haptic(); onAdd(); }} style={({ hovered }: PS) => [st.btnSm, inBag && { backgroundColor: '#E5F4EA' }, hovered && { ...HOVER_RIM, backgroundColor: inBag ? '#CFEBD8' : PALETTE.garnetDeep }]}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Ico name={inBag ? 'check' : 'bag'} size={14} color={inBag ? '#1E7B45' : '#fff'} /><Text style={[st.btnSmText, inBag && { color: '#1E7B45' }]}>{inBag ? 'In bag' : 'Add'}</Text></View></Pressable>
      </View>
    </View>
  );
}

// ── Start-page teaser: a wash day filling in, left to right, on a loop ───────
function HRail({ filled }: { filled: boolean }) {
  const v = useRef(new Animated.Value(filled ? 1 : 0)).current;
  useEffect(() => { Animated.timing(v, { toValue: filled ? 1 : 0, duration: filled ? 480 : 0, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }, [filled]);
  return (
    <View style={{ flex: 1, height: 2, marginTop: 9, borderRadius: 1, backgroundColor: '#DDE1E8', overflow: 'hidden' }}>
      <Animated.View {...fill('cateye')} style={{ height: 2, backgroundColor: BLUE, width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
    </View>
  );
}

function TeaserStep({ label, sub, state }: { label: string; sub: string; state: 'done' | 'next' | 'empty' }) {
  const v = useRef(new Animated.Value(state === 'done' ? 1 : 0)).current;
  useEffect(() => { Animated.timing(v, { toValue: state === 'done' ? 1 : 0, duration: state === 'done' ? 320 : 0, useNativeDriver: true }).start(); }, [state]);
  return (
    <View style={{ width: 68, alignItems: 'center', gap: 6 }}>
      <Node state={state} check={false} />
      <Text style={{ fontFamily: state === 'empty' ? F.medium : F.semibold, fontSize: 12, color: state === 'empty' ? C.gray : C.ink, textAlign: 'center' }} numberOfLines={1}>{label}</Text>
      <Animated.Text style={{ fontFamily: F.regular, fontSize: 11, color: C.gray, opacity: v, marginTop: -3 }} numberOfLines={1}>{sub}</Animated.Text>
    </View>
  );
}

/** A short, looping simulation of adding a wash-day routine step by step. Generic names only. */
const TEASER: Record<string, { title: string; steps: string[][] }> = {
  hair: { title: 'Wash day', steps: [['Pre-poo', 'Oil'], ['Shampoo', 'Added'], ['Condition', 'Conditioner'], ['Hair oil', 'Oil'], ['Style', 'Styler']] },
  skin: { title: 'Morning skin', steps: [['Cleanse', 'Cleanser'], ['Tone', 'Toner'], ['Serum', 'Added'], ['Moisturize', 'Cream'], ['SPF', 'Sunscreen']] },
  makeup: { title: 'Everyday makeup', steps: [['Primer', 'Prep'], ['Base', 'Added'], ['Conceal', 'Concealer'], ['Mascara', 'Lashes'], ['Lips', 'Color']] },
  body: { title: 'Body', steps: [['Wash', 'Body wash'], ['Scrub', 'Added'], ['Lotion', 'Moisture'], ['Oil', 'Seal'], ['Deodorant', 'Daily']] },
};
export function LinearTeaser({ area = 'hair' }: { area?: string }) {
  const narrow = useWindowDimensions().width < 420;
  const t = TEASER[area] ?? TEASER.hair;
  const steps = narrow ? t.steps.filter((_, i) => i !== 3) : t.steps;
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setN(x => (x >= steps.length + 2 ? 0 : x + 1)), n === 0 ? 700 : n >= steps.length ? 1500 : 1000);
    return () => clearTimeout(t);
  }, [n, steps.length]);
  const done = Math.min(n, steps.length);
  const complete = done === steps.length;
  return (
    <View style={{ borderRadius: 24, backgroundColor: PALETTE.frost, borderWidth: 1, borderColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, gap: 12, maxWidth: 560 }} accessibilityLabel="Example: adding a wash day routine step by step">
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 13, color: C.ink, flex: 1 }}>{t.title}</Text>
        <Text style={{ fontFamily: F.semibold, fontSize: 12, color: complete ? '#8C6D35' : BLUE }}>{complete ? 'Routine complete' : `${done}/${steps.length} added`}</Text>
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
      <Text {...shine('chrome')} style={[st.h1, { fontSize: 30, lineHeight: 34 }]}>{goals ? 'Add your routine first' : 'A few questions first'}</Text>
      <Text style={st.sub}>{goals ? 'Add one product you use to see your gaps.' : 'Answer a few quick questions to see your gaps.'}</Text>
      <Btn label={goals ? 'Add my routine' : 'Start'} onPress={() => router.push(goals ? '/routine/build' : '/routine/about')} style={{ alignSelf: 'flex-start' }} />
    </View>
  );
}

export function WhereToBuy({ item }: { item: Item }) {
  return (
    <View style={st.wtb}>
      {retailerLinks(item).map((r, i) => (
        <Pressable key={r.name} onPress={() => Linking.openURL(r.url)} style={({ pressed, hovered }: PS) => [st.wtbRow, i > 0 && st.wtbDiv, hovered && { backgroundColor: '#ECEDEF' }, pressed && { backgroundColor: C.pressed }]}>
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
  nav: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, height: 44, borderRadius: 14, borderWidth: 1.5, borderColor: 'transparent' },
  navOn: { backgroundColor: '#fff' },
  navAddon: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#E3E5E8', borderTopLeftRadius: 0, borderTopRightRadius: 0, paddingTop: 12, height: 56 },
  navText: { fontFamily: F.medium, fontSize: 15, color: C.gray2 },
  side: { width: 300, flexGrow: 0, backgroundColor: 'transparent', borderLeftWidth: 1, borderLeftColor: '#ECEEF2', opacity: 0.92 },
  mHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 52 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4, minHeight: 60 },
  menuBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: 'transparent', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  tip: { flexDirection: 'row', alignItems: 'center', backgroundColor: PALETTE.garnet, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  tipArrow: { position: 'absolute', left: -4, top: '50%', marginTop: -4, width: 8, height: 8, backgroundColor: PALETTE.garnet, transform: [{ rotate: '45deg' }] },
  tipText: { fontFamily: F.semibold, fontSize: 13, color: '#fff' },
  menuScrim: { flex: 1, backgroundColor: 'rgba(20,20,24,0.28)' },
  menuPanel: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#F8F9FA', paddingHorizontal: 16, paddingTop: 28, paddingBottom: 24, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 6, height: 0 } },
  wFooter: { paddingHorizontal: 72, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#E9ECF1', backgroundColor: PALETTE.pearl },
  mFooter: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16, backgroundColor: PALETTE.pearl, gap: 8 },
  tabbar: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F0F1F3', paddingTop: 8, paddingBottom: 6 },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  tabText: { fontFamily: F.medium, fontSize: 11, color: C.gray },
  h1: { fontFamily: F.display, color: C.ink, letterSpacing: -0.5 },
  sub: { fontFamily: F.regular, fontSize: 15, lineHeight: 22, color: PALETTE.quiet },
  label: { fontFamily: F.semibold, fontSize: 12, letterSpacing: 0.6, color: '#A3A7AD' },
  meta: { fontFamily: F.medium, fontSize: 13, color: '#9A9EA4' },
  pill: { paddingHorizontal: 16, height: 40, borderRadius: 20, justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D3D6DB' },
  pillOn: { backgroundColor: PALETTE.garnet, borderColor: PALETTE.garnet },
  pillText: { fontFamily: F.medium, fontSize: 14, color: C.ink },
  btn: { height: 54, borderRadius: 27, backgroundColor: PALETTE.garnet, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, borderWidth: 1.5, borderColor: PALETTE.garnet },
  btnSec: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#C9CDD3' },
  btnText: { fontFamily: F.semibold, fontSize: 16, color: '#fff' },
  chipBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1.5, borderColor: '#C9CDD3', backgroundColor: '#fff', alignSelf: 'flex-start' },
  chipBtnText: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
  btnSm: { height: 36, borderRadius: 18, backgroundColor: PALETTE.garnet, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, alignSelf: 'flex-start', borderWidth: 1.5, borderColor: PALETTE.garnet },
  btnSmText: { fontFamily: F.semibold, fontSize: 13, color: '#fff' },
  // Secondary actions inside a list: a see-through darker lavender, quieter than the page's main button.
  tint: { backgroundColor: 'rgba(94,106,206,0.16)', borderColor: 'rgba(94,106,206,0.34)' },
  seg: { flexDirection: 'row', backgroundColor: '#EEF0F3', borderRadius: 999, padding: 4 },
  segItem: { flex: 1, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderWidth: 1.5, borderColor: 'transparent' },
  segOn: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  segText: { fontFamily: F.medium, fontSize: 14, color: C.gray },
  node: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: BLUE, backgroundColor: '#fff' },
  nodeEmpty: { borderColor: '#B8BEC6', borderStyle: 'dashed', borderWidth: 1.5, backgroundColor: C.bg },
  nodeOn: { width: 18, height: 18, borderRadius: 9, borderWidth: 5 },
  rail: { flex: 1, width: 2, backgroundColor: '#E1E4E8', marginTop: 2, overflow: 'hidden', borderRadius: 1 },
  stepFloat: { borderRadius: 20, shadowColor: '#5B67C9', shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  stepCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1.5, borderColor: 'transparent' },
  stepEmpty: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#C9CDD2', borderStyle: 'dashed' },
  stepOn: { backgroundColor: BLUE },
  skipNode: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#E6E8EB', alignItems: 'center', justifyContent: 'center' },
  skipDash: { width: 8, height: 2, borderRadius: 1, backgroundColor: C.gray },
  stepQuiet: { backgroundColor: 'transparent', paddingVertical: 10 },
  stepNext: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: PALETTE.icy, borderStyle: 'dashed', shadowColor: PALETTE.cobalt, shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  upNext: { backgroundColor: PALETTE.ice, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  upNextText: { fontFamily: F.semibold, fontSize: 11, color: BLUE },
  stepIcon: { width: 40, height: 40 },
  stepTitle: { flex: 1, fontFamily: F.semibold, fontSize: 16, color: C.ink },
  stepSub: { fontFamily: F.regular, fontSize: 14, lineHeight: 19, color: PALETTE.quiet },
  scrim: { flex: 1, backgroundColor: 'rgba(20,20,24,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, gap: 14 },
  dialog: { width: 540, borderRadius: 28, paddingBottom: 24 },
  sheetTitle: { flex: 1, fontFamily: F.display, fontSize: 30, color: C.ink, paddingVertical: 2, outlineStyle: 'none' } as any,
  current: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F4F7FE', borderRadius: 16, padding: 12 },
  search: { height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#E3E5E8', paddingHorizontal: 18, justifyContent: 'center' },
  searchInput: { fontFamily: F.regular, fontSize: 15, color: C.ink, outlineStyle: 'none' } as any,
  ingCta: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1.5, borderColor: BLUE, borderStyle: 'dashed', padding: 12, backgroundColor: '#F4F7FE' },
  msg: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F4F5F7', borderRadius: 14, padding: 12 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 14, borderWidth: 1.5, borderColor: 'transparent' },
  resultIcon: { width: 44, height: 44, borderRadius: 12 },
  tag: { fontFamily: F.medium, fontSize: 12, color: C.gray2, backgroundColor: '#F1F3F5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, overflow: 'hidden' },
  cardTitle: { fontFamily: F.semibold, fontSize: 15, lineHeight: 20, color: C.ink },
  gap: { backgroundColor: '#fff', borderRadius: 24, padding: 18, gap: 14, borderWidth: 2, borderColor: 'transparent' },
  gapIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  kind: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  kindText: { fontFamily: F.semibold, fontSize: 11 },
  gapTitle: { fontFamily: F.semibold, fontSize: 17, color: C.ink },
  why: { fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: PALETTE.quiet },
  tile: { aspectRatio: 1, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  fit: { position: 'absolute', top: 10, left: 10, backgroundColor: '#E5F4EA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  fitText: { fontFamily: F.semibold, fontSize: 11, color: '#1E7B45' },
  price: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  wtb: { borderRadius: 16, borderWidth: 1, borderColor: '#EEF0F3', overflow: 'hidden' },
  wtbRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  wtbDiv: { borderTopWidth: 1, borderTopColor: '#EEF0F3' },
  bar: { height: 8, borderRadius: 4, backgroundColor: '#E6E8EB', overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: BLUE },
});
