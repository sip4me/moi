import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { Item } from '../../lib/routine/model';
import { stepCount, type Page, type SharedStep } from '../../lib/routine/social';
import { F } from '../../theme';
import { Bubble, SYS } from './Kit';

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
            style={({ hovered }: any) => ({ paddingHorizontal: 14, height: 34, borderRadius: 17, justifyContent: 'center', backgroundColor: on ? '#111114' : hovered ? '#fff' : 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: on ? '#111114' : 'rgba(255,255,255,0.85)' })}>
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
      style={({ hovered }: any) => ({ gap: 10, padding: 16, borderRadius: 24, backgroundColor: hovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.75)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)' })}>
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
