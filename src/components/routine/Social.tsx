import { router } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BEAUTY_ROUTINES, setRoutine, type Area, type Item, type RoutineState } from '../../lib/routine/model';
import { myPage, pageUrl, savePage, shareLink, shareText, snapshot, stepCount, suggestHandle, type Page, type SharedStep } from '../../lib/routine/social';
import { useStore } from '../../state/store';
import { F } from '../../theme';
import { Btn, Bubble, SYS } from './Kit';

/** Keyboard focus ring shared by the Routine section controls. */
const ring = (focused?: boolean) => (focused ? ({ outlineStyle: 'solid', outlineWidth: 2, outlineColor: '#5F4FC4', outlineOffset: 2 } as any) : null);

/** The share arrow, as a round icon button with hover, pressed and focus states. */
export function ShareButton({ onPress, label = 'Share routine', size = 36 }: { onPress: () => void; label?: string; size?: number }) {
  return (
    <Pressable onPress={e => { (e as any)?.stopPropagation?.(); onPress(); }} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}
      style={({ hovered, pressed, focused }: any) => ({ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center',
        backgroundColor: pressed ? '#E9E9EE' : hovered ? '#F4F4F6' : '#FFFFFF', borderWidth: 1, borderColor: hovered ? 'rgba(17,17,20,0.32)' : 'rgba(17,17,20,0.14)', transform: [{ scale: pressed ? 0.94 : 1 }], ...ring(focused) })}>
      <Svg width={size * 0.46} height={size * 0.46} viewBox="0 0 24 24">
        <Path d="M12 15V3.5M7.5 8 12 3.5 16.5 8" stroke="#111114" strokeWidth={2.1} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M5.5 11.5v7a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-7" stroke="#111114" strokeWidth={2.1} fill="none" strokeLinecap="round" />
      </Svg>
    </Pressable>
  );
}

/** Share someone's public routine page. */
export async function sharePage(page: Page, mine = false) {
  return shareLink(pageUrl(page.handle), shareText(mine ? null : page.name || page.handle, page.routine, mine));
}

/**
 * Share my routine: one tap once there's a link (it refreshes the page with the latest routine first);
 * the first time, a small sheet picks the link name. Guests are asked to create their account.
 */
export function ShareMyRoutine({ s, size }: { s: RoutineState; size?: number }) {
  const { name: storeName, account } = useStore();
  // "Your name" is the unset placeholder, not a name.
  const name = storeName && storeName.trim() && storeName !== 'Your name' ? storeName.trim() : null;
  const signedIn = !!account && !account.anonymous;
  const [sheet, setSheet] = useState(false);
  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const go = async (h: string, bio?: string | null) => {
    setBusy(true); setMsg('');
    const r = await savePage({ handle: h, name: name || undefined, bio: bio ?? undefined, is_public: true }, s);
    setBusy(false);
    if (!r.ok) { setMsg(r.why); setSheet(true); return; }
    setSheet(false);
    const out = await shareLink(pageUrl(h), shareText(name, snapshot(s), true));
    setMsg(out === 'copied' ? 'Link copied.' : out === 'failed' ? `Your link: ${pageUrl(h).replace('https://', '')}` : '');
    if (out === 'copied' || out === 'failed') setTimeout(() => setMsg(''), 4000);
  };
  const open = async () => {
    if (!signedIn) { router.push({ pathname: '/sign-in', params: { mode: 'signup', next: '/routine/build' } }); return; }
    const p = await myPage().catch(() => null);
    if (p) { go(p.handle, p.bio); return; }
    setHandle(suggestHandle(name || account?.email)); setMsg(''); setSheet(true);
  };
  return (
    <View style={{ alignItems: 'flex-end' }}>
      <ShareButton onPress={open} label="Share my routine" size={size} />
      {msg && !sheet ? <Text accessibilityLiveRegion="polite" style={{ position: 'absolute', top: (size ?? 36) + 6, right: 0, minWidth: 140, fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 12, color: '#111114', backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, overflow: 'hidden', textAlign: 'center' }}>{msg}</Text> : null}
      <Modal visible={sheet} transparent animationType="fade" onRequestClose={() => setSheet(false)}>
        <Pressable onPress={() => setSheet(false)} accessibilityLabel="Close" style={{ flex: 1, backgroundColor: 'rgba(17,17,20,0.35)', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 480, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 }}>
            <Text style={{ fontFamily: SYS ?? F.bold, fontWeight: '700', fontSize: 18, color: '#111114' }}>Share your routine</Text>
            <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 13, lineHeight: 18, color: '#4A4858' }}>Pick a name for your link. Anyone with it can see your products and follow your routine.</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 15, color: '#5B5F6B' }}>usemoi.com/u/</Text>
              <TextInput value={handle} onChangeText={t => setHandle(t.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20))} placeholder="yourname" autoCapitalize="none" autoFocus accessibilityLabel="Your link name"
                onSubmitEditing={() => handle.length >= 3 && !busy && go(handle)}
                style={{ flex: 1, minWidth: 0, fontFamily: SYS ?? F.medium, fontSize: 15, color: '#111114', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#F4F4F6', ...({ outlineStyle: 'none' } as object) }} />
            </View>
            {msg ? <Text accessibilityRole="alert" style={{ fontFamily: SYS ?? F.semibold, fontSize: 13, color: '#B42318' }}>{msg}</Text> : null}
            <Btn label={busy ? 'Creating your link…' : 'Share my routine'} disabled={busy || handle.length < 3} onPress={busy || handle.length < 3 ? undefined : () => go(handle)} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export type RoutineTab = 'mine' | 'saved' | 'moi' | 'trending';
const TABS: { key: RoutineTab; label: string }[] = [
  { key: 'mine', label: 'My routine' }, { key: 'saved', label: 'Saved' }, { key: 'moi', label: 'Moi routines' }, { key: 'trending', label: 'Trending' },
];

/** The row of buttons at the top of the Routine section. */
export function RoutineTabs({ active }: { active: RoutineTab }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
      {TABS.map(t => {
        const on = t.key === active;
        return (
          <Pressable key={t.key} accessibilityRole="tab" accessibilityState={{ selected: on }}
            onPress={() => (on ? null : t.key === 'mine' ? router.replace('/routine/build') : router.replace({ pathname: '/routine/routines', params: { tab: t.key } }))}
            style={({ hovered, pressed, focused }: any) => ({ paddingHorizontal: 14, height: 34, borderRadius: 17, justifyContent: 'center', backgroundColor: on ? '#111114' : pressed ? '#E9E9EE' : hovered ? '#F4F4F6' : '#FFFFFF', borderWidth: 1, borderColor: on ? '#111114' : hovered ? 'rgba(17,17,20,0.32)' : 'rgba(17,17,20,0.16)', transform: [{ scale: pressed && !on ? 0.97 : 1 }], ...ring(focused) })}>
            <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 13, color: on ? '#fff' : '#111114' }}>{t.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** A shared step as an Item, so it can use Moi's product bubble and store links. */
export const asItem = (x: SharedStep): Item & { lab?: [number, number, number] } => ({ kind: 'product', id: x.id, brand: x.brand, name: x.name, category: x.category, tags: [], code: x.code ?? null, asin: x.asin ?? null, ...(x.lab ? { lab: x.lab } : {}) } as Item);

/** A routine in a list: who, the look, how many steps, a few product bubbles. */
export function RoutineCard({ page, onPress }: { page: Page; onPress?: () => void }) {
  const steps = page.routine?.groups?.flatMap(g => g.steps) ?? [];
  return (
    <Pressable onPress={onPress ?? (() => router.push(`/u/${page.handle}` as any))} accessibilityRole="link" accessibilityLabel={`${page.name ?? page.handle}'s routine`}
      style={({ hovered, pressed, focused }: any) => ({ gap: 10, padding: 16, borderRadius: 24, backgroundColor: pressed ? '#F0F0F3' : hovered ? '#F7F7F9' : '#FFFFFF', borderWidth: 1, borderColor: hovered ? 'rgba(17,17,20,0.22)' : 'rgba(17,17,20,0.10)', transform: [{ scale: pressed ? 0.99 : 1 }], ...ring(focused) })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '700', fontSize: 15, color: '#111114' }}>{page.name || `@${page.handle}`}</Text>
          <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 12, color: '#6C6A80' }}>{[`@${page.handle}`, `${stepCount(page.routine)} products`, page.followers ? `${page.followers} follower${page.followers === 1 ? '' : 's'}` : null].filter(Boolean).join(' · ')}</Text>
        </View>
        <ShareButton onPress={() => { sharePage(page); }} label={`Share ${page.name || '@' + page.handle}'s routine`} size={32} />
      </View>
      {page.routine?.look ? <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 13, color: '#4A4858' }}>{page.routine.look.name}</Text> : page.bio ? <Text numberOfLines={2} style={{ fontFamily: SYS ?? F.medium, fontSize: 13, color: '#4A4858' }}>{page.bio}</Text> : null}
      {steps.length ? <View style={{ flexDirection: 'row', gap: 6 }}>{steps.slice(0, 6).map((x, n) => <Bubble key={n} category={x.category} item={asItem(x)} size={28} />)}</View> : null}
    </Pressable>
  );
}

/** Beauty categories under the Routine tab. Four are routine builders; the rest open the Moi chat with that type picked. */
export const CATEGORIES: { key: string; label: string; area?: Area }[] = [
  { key: 'skin', label: 'Skincare', area: 'skin' }, { key: 'makeup', label: 'Makeup', area: 'makeup' },
  { key: 'hair', label: 'Haircare', area: 'hair' }, { key: 'fragrance', label: 'Fragrance' }, { key: 'body', label: 'Bath & Body', area: 'body' },
  { key: 'tools', label: 'Tools & Devices' }, { key: 'wellness', label: 'Wellness' },
];
const CHAT_TYPE: Record<string, string> = { fragrance: 'Fragrance', tools: 'Tools & devices', wellness: 'Wellness' };

/** The routines someone is working on: areas with at least one product added. */
export function workingAreas(s: RoutineState): Area[] {
  const has = (steps?: { item?: unknown }[]) => (steps ?? []).some(x => !!x.item);
  const out: Area[] = [];
  if (has(s.wash) || has(s.every) || s.occasions.some(o => has(s.occ[o]))) out.push('hair');
  for (const r of BEAUTY_ROUTINES) if (has(s.beauty?.[r.key]) && !out.includes(r.area)) out.push(r.area);
  return out;
}

/** The category row. `mode` build: switches which routine you're building; list: filters the list (via the cat param). */
export function CategoryTabs({ active, mode, tab, working = [] }: { active: string; mode: 'build' | 'list'; tab?: RoutineTab; working?: Area[] }) {
  const go = (c: (typeof CATEGORIES)[number]) => {
    if (CHAT_TYPE[c.key]) { router.push({ pathname: '/routine/chat', params: { type: CHAT_TYPE[c.key] } } as any); return; }
    if (mode === 'build') {
      if (!c.area) return;
      setRoutine(r => ({ ...r, areas: [c.area!] }));
      router.replace({ pathname: '/routine/build', params: { area: c.area } });
      return;
    }
    router.replace({ pathname: '/routine/routines', params: { tab: tab ?? 'saved', ...(c.key === active ? {} : { cat: c.key }) } });
  };
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(17,17,20,0.10)' }}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 18, paddingHorizontal: 14 }}>
      {CATEGORIES.map(c => {
        const on = c.key === active;
        const busy = mode === 'build' && !!c.area && working.includes(c.area);
        return (
          <Pressable key={c.key} onPress={() => go(c)} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={busy ? `${c.label}, in progress` : c.label} hitSlop={6}
            style={({ hovered, pressed, focused }: any) => ({ paddingVertical: 10, borderBottomWidth: 2.5, borderBottomColor: on ? '#111114' : hovered ? 'rgba(17,17,20,0.25)' : 'transparent', opacity: pressed ? 0.6 : 1, ...ring(focused) })}>
            {({ hovered }: any) => <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: on ? '700' : '600', fontSize: 14, color: on || hovered ? '#111114' : '#3A3C45' }}>{c.label}</Text>
              {busy ? <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#5F4FC4' }} /> : null}
            </View>}
          </Pressable>
        );
      })}
    </ScrollView>
    </View>
  );
}
