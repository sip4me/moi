import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BEAUTY_ROUTINES, setRoutine, type Area, type Item, type RoutineState } from '../../lib/routine/model';
import { stepCount, type Page, type SharedStep } from '../../lib/routine/social';
import { F } from '../../theme';
import { Bubble, SYS } from './Kit';

/** Keyboard focus ring shared by the Routine section controls. */
const ring = (focused?: boolean) => (focused ? ({ outlineStyle: 'solid', outlineWidth: 2, outlineColor: '#5F4FC4', outlineOffset: 2 } as any) : null);

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
        <Text style={{ fontSize: 16, color: '#8E9298' }}>›</Text>
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
