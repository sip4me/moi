import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { week } from '../data/schedule';
import { haptic } from '../lib/haptics';
import { type MoiNote, notify, onNotify, onTapped } from '../lib/notify';
import { useStore } from '../state/store';
import { F } from '../theme';
import { BlueGlass } from './BlueGlass';

const CROWN = require('../../assets/crown-pink.png');
const SHOW_MS = 3800;
const NUDGE_GAP_MS = 75_000; // at most one goal nudge every 75 s
const NUDGES_PER_DAY = 6;

/** Part of the day in the person's own time, for brief, well-timed copy. */
export function partOfDay(h = new Date().getHours()) {
  return h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 22 ? 'evening' : 'night';
}

/** Brief, encouraging copy for the moment: never guilt, always one clear next step. */
function greeting(part: string, name: string, left: number, next?: string) {
  const hi = name && name !== 'Your name' ? `, ${name.split(' ')[0]}` : '';
  if (part === 'morning') return { title: `Good morning${hi}`, body: left ? `${left} recs between you and today’s goal.${next ? ` Start with ${next.toLowerCase()}.` : ''}` : 'Your goal is already met today. Royal.' };
  if (part === 'afternoon') return { title: `Midday check-in${hi}`, body: left ? `${left} to go.${next ? ` ${next} takes a minute.` : ''}` : 'Goal met. Enjoy the rest of your day.' };
  if (part === 'evening') return { title: `Evening${hi}`, body: left ? `Wind down with ${next ? next.toLowerCase() : 'your last recs'}. ${left} left today.` : 'All done today. Sleep on it, literally.' };
  return { title: 'Wind-down time', body: left ? `One calm rec before bed? ${left} left.` : 'Goal met. Rest well.' };
}

/**
 * Moi's in-app notifications: a frosted banner on the blue glass gradient with the pink crown, sliding
 * in from the top. It greets you by time of day when you open the app, nudges you toward your goal
 * after you tap a button (throttled), and celebrates when today's goal is met.
 */
export function MoiNotifications() {
  const { plan, lastWash, todayKey, done, onboarded, hydrated, name } = useStore();
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState<MoiNote | null>(null);
  const y = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastNudge = useRef(0);
  const nudges = useRef({ day: '', n: 0 });

  const items = plan ? week(plan, lastWash, todayKey)[0]?.items ?? [] : [];
  const doneToday = done[todayKey] ?? [];
  // Recs still to do, named the way you'd say them: "Sleep on satin", "Oil on ends 2 drops".
  const left = items.filter(c => !doneToday.includes(c.id))
    .map(c => ({ id: c.id, label: `${c.label}${c.value !== '' && c.value != null ? ` ${String(c.value).trim().toLowerCase()}` : ''}${c.unit ? ` ${c.unit.trim()}` : ''}`.trim() }));
  const quiet = !hydrated || !onboarded || !plan || /^\/(onboarding|checkout|sign-in|scan)/.test(path);
  const ctx = useRef({ quiet, left, name });
  ctx.current = { quiet, left, name };

  // Show whatever gets posted.
  useEffect(() => onNotify(n => {
    if (timer.current) clearTimeout(timer.current);
    setNote(n);
    y.setValue(0);
    Animated.timing(y, { toValue: 1, duration: 360, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }).start();
    haptic('tap');
    timer.current = setTimeout(() => hide(), SHOW_MS);
  }), [y]);

  function hide() {
    Animated.timing(y, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => setNote(null));
  }

  // Greet once per part of the day, the first time the app is opened in it.
  useEffect(() => {
    if (quiet) return;
    const part = partOfDay();
    const key = `${todayKey}-${part}`;
    AsyncStorage.getItem('moi-greeted').then(v => {
      if (v === key) return;
      AsyncStorage.setItem('moi-greeted', key).catch(() => {});
      const c = ctx.current;
      setTimeout(() => notify({ kind: 'greet', ...greeting(part, c.name, c.left.length, c.left[0]?.label) }), 1200);
    }).catch(() => {});
  }, [quiet, todayKey]);

  // After a button tap: a brief nudge toward the goal, at most every 75 s and 6 times a day.
  useEffect(() => onTapped(() => {
    const c = ctx.current;
    const now = Date.now();
    if (c.quiet || !c.left.length || now - lastNudge.current < NUDGE_GAP_MS) return;
    if (nudges.current.day !== todayKey) nudges.current = { day: todayKey, n: 0 };
    if (nudges.current.n >= NUDGES_PER_DAY) return;
    lastNudge.current = now; nudges.current.n++;
    const next = c.left[0];
    const n = c.left.length;
    setTimeout(() => notify({ kind: 'nudge', title: n === 1 ? 'One rec from your goal' : `${n} recs to your goal`, body: `Next up: ${next.label}. Tap to do it now.`, href: '/(tabs)' }), 700);
  }), [todayKey]);

  // The moment today's last rec is ticked: celebrate.
  const prevLeft = useRef<number | null>(null);
  useEffect(() => {
    if (quiet) { prevLeft.current = left.length; return; }
    if (prevLeft.current !== null && prevLeft.current > 0 && left.length === 0 && items.length) {
      setTimeout(() => notify({ kind: 'goal', title: 'Goal met for today', body: 'Every rec done. Your crown is earned.' }), 1500);
    }
    prevLeft.current = left.length;
  }, [left.length, items.length, quiet]);

  if (!note) return null;
  return (
    <Animated.View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, alignItems: 'center', zIndex: 1000,
      opacity: y, transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [-90, 0] }) }] }}>
      <Pressable onPress={() => { hide(); if (note.href) router.navigate(note.href as never); }} accessibilityRole="alert" accessibilityLabel={`${note.title}. ${note.body}`}
        style={[{ width: '94%', maxWidth: 410, borderRadius: 26, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)',
          shadowColor: '#3D5FAF', shadowOpacity: 0.22, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
          Platform.OS === 'web' && ({ backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' } as any)]}>
        {/* Frosted: the blue glass gradient at partial strength, so what's behind shows through. */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.82 }}><BlueGlass strength={1.3} /></View>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.28)' }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingLeft: 12, paddingRight: 16 }}>
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', shadowColor: '#E46C93', shadowOpacity: 0.18, shadowRadius: 6 }}>
            <Image source={CROWN} style={{ width: 32, height: 32 }} resizeMode="contain" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Text numberOfLines={1} style={{ flex: 1, fontFamily: F.semibold, fontSize: 15, color: '#1E2B4A' }}>{note.title}</Text>
              <Text style={{ fontFamily: F.regular, fontSize: 12, color: '#6A7BA0' }}>now</Text>
            </View>
            <Text numberOfLines={2} style={{ fontFamily: F.regular, fontSize: 13.5, lineHeight: 18, color: '#3E4E70', marginTop: 1 }}>{note.body}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
