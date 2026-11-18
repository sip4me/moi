import { router } from 'expo-router';
import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';

/** Unique per stack: SVG gradient ids are page-global on web, and screens stay mounted underneath each other. */
const Uid = createContext('s');
import { Animated, Easing, Image, Modal, Platform, Pressable, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { PINEAPPLE_ART, PINEAPPLE_TIMING } from '../data/art';
import { icon3d } from '../data/icons3d';
import * as ImagePicker from 'expo-image-picker';
import { haptic } from '../lib/haptics';
import { BreathRecorder } from './BreathRecorder';
import { BlueGlass } from './BlueGlass';
import { C, F } from '../theme';
import { TwoFrameArt } from './TwoFrameArt';
import { Seal } from './ui';

const web = Platform.OS === 'web';
const H = 80; // one rec, collapsed or listed
const GAP = 10;
/** Bright two-tone badge gradients (light, deep), cycled so neighbouring recs never share a colour. */
const TINTS = [['#FFB36B', '#FF6A3D'], ['#C49BFF', '#7C4DFF'], ['#FFE066', '#FFAA00'], ['#7FD3FF', '#2E86FF'], ['#7BEBB0', '#17B872'], ['#FF9CC4', '#F0408A']];

/** One notification in the stack: a daily rec or a wash-day step. */
export type RecItem = {
  /** What gets ticked in the store (a card id, or `wash:<step>`). */
  id: string;
  label: string;
  /** The line under the title (amount, or the step's one-line how). */
  sub: string;
  /** Right-hand timestamp: Tonight, 5 min, Before... */
  when: string;
  /** Opened text: one or more short paragraphs, each with an optional heading. */
  body: { title?: string; text: string }[];
  icon: string;
  link?: { label: string; href: string };
  /** Bedtime pineapple: the animated art goes in the badge. */
  pineapple?: boolean;
  /** Proof we ask for before the coin: a breathing recording, a photo, or a product scan. */
  proof?: { kind: 'voice' | 'photo' | 'scan'; ask: string };
};

/** The frosted, faintly iridescent face every rec shares: pearl white with a pink, lilac and sky sheen. */
function Holo({ radius: _r, id: local }: { radius: number; id: string }) {
  const id = useContext(Uid) + local;
  return (
    <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" pointerEvents="none">
      <Defs>
        <LinearGradient id={`moiHb${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#F1F1F4" />
        </LinearGradient>
        <LinearGradient id={`moiHh${id}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFD9E8" stopOpacity="0.55" />
          <Stop offset="0.35" stopColor="#E9DDFF" stopOpacity="0.35" />
          <Stop offset="0.65" stopColor="#D6F0FF" stopOpacity="0.35" />
          <Stop offset="1" stopColor="#FFF1C9" stopOpacity="0.5" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100" height="100" fill={`url(#moiHb${id})`} />
      <Rect x="0" y="0" width="100" height="100" fill={`url(#moiHh${id})`} />
    </Svg>
  );
}

/** A light band that drifts across a card now and then, like light catching a hologram. */
function Sheen({ delay = 0 }: { delay?: number }) {
  const u = useContext(Uid);
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(2600 + delay),
      Animated.timing(x, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(x, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [x, delay]);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -20, bottom: -20, width: 70, opacity: 0.7,
      transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [-120, 480] }) }, { rotate: '18deg' }] }}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 10 10">
        <Defs>
          <LinearGradient id={`${u}sh`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#fff" stopOpacity="0" />
            <Stop offset="0.5" stopColor="#fff" stopOpacity="0.85" />
            <Stop offset="1" stopColor="#fff" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width="10" height="10" fill={`url(#${u}sh)`} />
      </Svg>
    </Animated.View>
  );
}

/** Round pastel badge with a soft ring, holding the rec's 3D icon (or the pineapple at bedtime). */
function Badge({ c, i, size = 48 }: { c: RecItem; i: number; size?: number }) {
  const [light, deep] = TINTS[i % TINTS.length];
  const g = `${useContext(Uid)}g${i % TINTS.length}`;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      shadowColor: deep, shadowOpacity: 0.45, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }}>
      <Svg style={{ position: 'absolute', top: 0, left: 0 }} width={size} height={size} viewBox="0 0 10 10" pointerEvents="none">
        <Defs>
          <RadialGradient id={g} cx="0.35" cy="0.3" r="0.85">
            <Stop offset="0" stopColor={light} />
            <Stop offset="1" stopColor={deep} />
          </RadialGradient>
        </Defs>
        <Rect width="10" height="10" fill={`url(#${g})`} />
      </Svg>
      {c.pineapple ? <TwoFrameArt spec={PINEAPPLE_ART} timing={PINEAPPLE_TIMING} width={size * 0.8} />
        : <Image source={icon3d(c.icon)} style={{ width: size * 0.64, height: size * 0.64 }} resizeMode="contain" />}
    </View>
  );
}

const shadow = { shadowColor: '#4B6BC9', shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 };

/** One notification-style rec. */
function Rec({ c, i, done, sheen }: { c: RecItem; i: number; done: boolean; sheen?: boolean }) {
  return (
    <View style={[shadow, { height: H, borderRadius: 26, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.95)', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14 }]}>
      <Holo radius={26} id={`r${i}`} />
      {sheen ? <Sheen delay={i * 400} /> : null}
      <Badge c={c} i={i} />
      <View style={{ flex: 1, opacity: done ? 0.55 : 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text numberOfLines={1} style={{ flex: 1, fontFamily: F.semibold, fontSize: 16, color: '#3A3A40', textDecorationLine: done ? 'line-through' : 'none' }}>{c.label}</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 12, color: '#9A9AA2' }}>{done ? 'Done' : c.when}</Text>
        </View>
        <Text numberOfLines={1} style={{ fontFamily: F.regular, fontSize: 14, color: '#75757D', marginTop: 2 }}>{c.sub}</Text>
      </View>
      {done ? <Seal size={26} /> : null}
    </View>
  );
}

/**
 * Today's recs as a stack of notifications. Collapsed, the next rec sits on top with the rest layered
 * underneath; a tap fans them out. Press and hold any rec to open it, then tick the box: the rec is
 * done and a gold coin drops into the token bag.
 */
export function RecStack({ items, done, canCheck, onToggle, dayLabel, defaultOpen = false, noun = 'rec' }: {
  items: RecItem[]; done: string[]; canCheck: boolean; onToggle: (id: string) => void; dayLabel: string; defaultOpen?: boolean; noun?: string;
}) {
  const u = 'moi' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const [open, setOpen] = useState(defaultOpen);
  const [peek, setPeek] = useState<{ c: RecItem; i: number } | null>(null);
  const fan = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;
  // Still-to-do recs first, done ones sink to the bottom.
  const order = items.map((c, i) => ({ c, i })).sort((a, b) => Number(done.includes(a.c.id)) - Number(done.includes(b.c.id)));
  const n = order.length;
  const left = order.filter(o => !done.includes(o.c.id)).length;

  useEffect(() => { Animated.spring(fan, { toValue: open ? 1 : 0, friction: 9, tension: 70, useNativeDriver: false }).start(); }, [open, fan]);
  const height = fan.interpolate({ inputRange: [0, 1], outputRange: [H + Math.min(2, n - 1) * 12, n * H + (n - 1) * GAP] });

  const hold = (o: { c: RecItem; i: number }) => { haptic('select'); setPeek(o); };

  return (
    <Uid.Provider value={u}>
    <View style={{ borderRadius: 30, padding: 12, paddingTop: 14, overflow: 'hidden' }}>
      {/* Moi's blue glass behind the recs, so the white cards lift off it like notifications on a wallpaper. */}
      <BlueGlass />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, marginBottom: 10 }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 13, color: '#3E5480' }}>{left ? `${left} ${noun}${left > 1 ? 's' : ''} ${canCheck ? 'left today' : `for ${dayLabel}`}` : canCheck ? 'All done. Nice work.' : 'Nothing left'}</Text>
        {n > 1 ? (
          <Pressable onPress={() => { haptic('tap'); setOpen(o => !o); }} hitSlop={8} accessibilityRole="button"
            style={({ pressed }) => [shadow, { shadowOpacity: 0.08, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: pressed ? '#F0F0F2' : '#FAFAFB', borderWidth: 1, borderColor: '#fff' }]}>
            <Text style={{ fontFamily: F.semibold, fontSize: 12, color: '#55555C' }}>{open ? 'Show less' : `View all ${n}`}</Text>
          </Pressable>
        ) : null}
      </View>

      <Animated.View style={{ height }}>
        {order.map((o, k) => {
          const isDone = done.includes(o.c.id);
          // Collapsed: the first rec on top, two more layered beneath it, narrower and fainter.
          const top = fan.interpolate({ inputRange: [0, 1], outputRange: [Math.min(k, 2) * 12, k * (H + GAP)] });
          const scale = fan.interpolate({ inputRange: [0, 1], outputRange: [1 - Math.min(k, 2) * 0.06, 1] });
          const opacity = fan.interpolate({ inputRange: [0, 1], outputRange: [k === 0 ? 1 : k < 3 ? 1 - k * 0.12 : 0, 1] });
          return (
            <Animated.View key={o.c.id} style={{ position: 'absolute', left: 0, right: 0, top, opacity, zIndex: n - k, transform: [{ scaleX: scale }] }}>
              <Pressable onPress={() => (open || n === 1 ? hold(o) : (haptic('tap'), setOpen(true)))} onLongPress={() => hold(o)} delayLongPress={320}
                accessibilityRole="button" accessibilityLabel={`${o.c.label}, ${o.c.sub}${isDone ? ', done' : ''}`} accessibilityHint="Press and hold to open"
                style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }, web && ({ userSelect: 'none', WebkitTouchCallout: 'none' } as any)]}>
                {k === 0 || open ? <Rec c={o.c} i={o.i} done={isDone} sheen={k === 0} />
                  : <View style={[shadow, { height: H, borderRadius: 26, borderWidth: 1.5, borderColor: '#fff', overflow: 'hidden' }]}><Holo radius={26} id={`l${k}`} /></View>}
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.View>

      <Text style={{ fontFamily: F.regular, fontSize: 12, color: '#6A7BA0', textAlign: 'center', marginTop: 12 }}>
        {canCheck ? `Press and hold a ${noun} to open it. Tick it off for a coin.` : `Press and hold a ${noun} to see what’s planned.`}
      </Text>

      <RecPeek peek={peek} done={!!peek && done.includes(peek.c.id)} canCheck={canCheck} dayLabel={dayLabel}
        onClose={() => setPeek(null)} onCheck={id => { setPeek(null); setTimeout(() => onToggle(id), 220); }} />
    </View>
    </Uid.Provider>
  );
}

/** The opened rec, like a long-pressed notification: lifted over a frosted backdrop with a check box. */
function RecPeek({ peek, done, canCheck, dayLabel, onClose, onCheck }: {
  peek: { c: RecItem; i: number } | null; done: boolean; canCheck: boolean; dayLabel: string; onClose: () => void; onCheck: (id: string) => void;
}) {
  const pop = useRef(new Animated.Value(0)).current;
  const [ticked, setTicked] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => {
    if (!peek) return;
    setTicked(false);
    setPhoto(null);
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }).start();
  }, [peek, pop]);
  if (!peek) return null;
  const { c, i } = peek;
  const on = done || ticked;
  const tick = () => {
    if (!canCheck) return;
    if (done) { onCheck(c.id); return; } // un-ticking: no coin
    haptic('success');
    setTicked(true);
    setTimeout(() => onCheck(c.id), 520); // show the seal for a beat, then the coin drops on Home
  };
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={[{ flex: 1, backgroundColor: 'rgba(226,226,232,0.72)', justifyContent: 'center', padding: 20 }, web && ({ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' } as any)]}>
        <Animated.View style={{ maxWidth: 430, width: '100%', alignSelf: 'center', opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }}>
          <Pressable onPress={() => {}} style={[shadow, { shadowOpacity: 0.22, shadowRadius: 30, borderRadius: 30, borderWidth: 1.5, borderColor: '#fff', overflow: 'hidden', padding: 20 }]}>
            <Holo radius={30} id="peek" />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Badge c={c} i={i} size={60} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.bold, fontSize: 20, color: C.ink, letterSpacing: -0.3 }}>{c.label}</Text>
                <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.gray2, marginTop: 2 }}>{c.sub ? `${c.sub} · ` : ''}{c.when}</Text>
              </View>
            </View>
            {c.body.map((b, k) => (
              <View key={k} style={{ marginTop: k ? 12 : 16 }}>
                {b.title ? <Text style={{ fontFamily: F.semibold, fontSize: 13, color: C.gray, letterSpacing: 0.3, marginBottom: 3 }}>{b.title.toUpperCase()}</Text> : null}
                <Text style={{ fontFamily: F.regular, fontSize: 15, lineHeight: 22, color: '#4A4A50' }}>{b.text}</Text>
              </View>
            ))}
            {c.link ? (
              <Pressable onPress={() => { onClose(); router.push(c.link!.href as never); }} hitSlop={6} style={{ alignSelf: 'flex-start', marginTop: 10 }}>
                <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.ink, textDecorationLine: 'underline' }}>{c.link.label}</Text>
              </Pressable>
            ) : null}

            {photo ? <Image source={{ uri: photo }} style={{ marginTop: 16, height: 150, borderRadius: 18 }} resizeMode="cover" /> : null}
            {c.proof && canCheck && !on ? (
              <>
                <Text style={{ fontFamily: F.medium, fontSize: 13, color: '#6B5C7A', marginTop: 16 }}>{c.proof.ask}</Text>
                {c.proof.kind === 'voice' ? <BreathRecorder onSubmit={tick} /> : (
                  <Pressable accessibilityRole="button" onPress={async () => {
                    if (c.proof!.kind === 'scan') { onClose(); router.push({ pathname: '/scan-label', params: { proof: c.id } }); return; }
                    if (Platform.OS !== 'web') { const p = await ImagePicker.requestCameraPermissionsAsync(); if (!p.granted) return; }
                    const r = await ImagePicker.launchCameraAsync({ quality: 0.4, allowsEditing: false });
                    if (r.canceled || !r.assets?.[0]) return;
                    setPhoto(r.assets[0].uri); // shown here only; not uploaded
                    tick();
                  }}
                    style={({ pressed }) => ({ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, backgroundColor: pressed ? '#F1F1F4' : 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: '#ECECF0' })}>
                    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c.proof.kind === 'scan' ? '#2E86FF' : '#F0408A', alignItems: 'center', justifyContent: 'center' }}>
                      <Svg width={16} height={16} viewBox="0 0 24 24">{c.proof.kind === 'scan'
                        ? <Path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 12h8" stroke="#fff" strokeWidth={2.2} fill="none" strokeLinecap="round" />
                        : <Path d="M4 8.5a2 2 0 0 1 2-2h2l1.5-2h5L16 6.5h2a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" stroke="#fff" strokeWidth={2} fill="none" strokeLinejoin="round" />}</Svg>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>{c.proof.kind === 'scan' ? 'Scan the product' : 'Take a photo'}</Text>
                      <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray }}>{c.proof.kind === 'scan' ? 'Snap its label. Your coin lands when it’s found.' : 'Stays on your phone. Earns a gold coin.'}</Text>
                    </View>
                  </Pressable>
                )}
              </>
            ) : (              <>{/* The check box: ticking it marks the rec done and drops a coin into the bag. */}
            <Pressable onPress={tick} disabled={!canCheck} accessibilityRole="checkbox" accessibilityState={{ checked: on, disabled: !canCheck }} accessibilityLabel={`Mark ${c.label} done`}
              style={({ pressed }) => ({ marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, backgroundColor: pressed ? '#F1F1F4' : 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: '#ECECF0', opacity: canCheck ? 1 : 0.6 })}>
              {on ? <Seal size={30} /> : <View style={{ width: 28, height: 28, borderRadius: 9, borderWidth: 2, borderColor: '#C9C9CF', backgroundColor: '#fff' }} />}
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>{on ? 'Done' : 'Mark as done'}</Text>
                <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray }}>{!canCheck ? `You can tick this off on ${dayLabel}.` : on ? 'A gold coin is in your bag.' : 'Earn a gold coin for your bag.'}</Text>
              </View>
            </Pressable></>
            )}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
