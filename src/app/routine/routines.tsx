import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Btn, Shell, SYS } from '../../components/routine/Kit';
import { CATEGORIES, CategoryTabs, RoutineCard, RoutineTabs, type RoutineTab } from '../../components/routine/Social';
import { session, setRoutine } from '../../lib/routine/model';
import { following, MOI_ROUTINES, trending, type Page } from '../../lib/routine/social';
import { useStore } from '../../state/store';
import { F } from '../../theme';

/** Routine section: Saved (routines they follow), Moi routines (curated looks) and Trending. */
export default function Routines() {
  const { tab: t, cat: c } = useLocalSearchParams<{ tab?: string; cat?: string }>();
  const cat = CATEGORIES.find(x => x.key === c) ?? null;
  const tab: RoutineTab = t === 'moi' || t === 'trending' ? t : 'saved';
  const { account } = useStore();
  const signedIn = !!account && !account.anonymous;
  const [list, setList] = useState<Page[] | null>(null);

  useEffect(() => {
    if (tab === 'moi') return;
    let alive = true;
    setList(null);
    (tab === 'saved' ? (signedIn ? following() : Promise.resolve([])) : trending()).then(r => { if (alive) setList(r); }).catch(() => { if (alive) setList([]); });
    return () => { alive = false; };
  }, [tab, signedIn]);

  const shown = (list ?? []).filter(p => !cat || (p.routine?.areas ?? []).includes(cat.area ?? cat.key));
  const moiShown = !cat || cat.key === 'makeup' ? MOI_ROUTINES : [];
  // Moi routines open in the look chat, built from Moi's database (no photo read needed).
  const tryMoi = (r: (typeof MOI_ROUTINES)[number]) => {
    session.lookPhoto = undefined;
    session.lookReadFor = r.text;
    setRoutine(x => ({ ...x, lookText: r.text, lookRead: { name: r.name, area: 'makeup', summary: r.blurb, steps: [] }, lookPicks: {}, areas: ['makeup'], prefs: { ...(x.prefs ?? {}), ...r.prefs } }));
    router.push('/routine/look');
  };

  const title = { fontFamily: SYS ?? F.bold, fontWeight: '700' as const, fontSize: 24, color: '#111114' };
  const sub = { fontFamily: SYS ?? F.medium, fontSize: 13, lineHeight: 19, color: '#4A4858' };
  const empty = (text: string, cta?: { label: string; on: () => void }) => (
    <View style={{ gap: 12, padding: 18, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)' }}>
      <Text style={sub}>{text}</Text>
      {cta ? <Btn label={cta.label} onPress={cta.on} style={{ alignSelf: 'flex-start' }} /> : null}
    </View>
  );

  return (
    <Shell glass active="build">
      <View style={{ gap: 14, maxWidth: 640, width: '100%' }}>
        <RoutineTabs active={tab} />
        <CategoryTabs mode="list" tab={tab} active={cat?.key ?? ''} />
        <View style={{ gap: 4 }}>
          <Text {...({ dataSet: { grad: 'title' } } as any)} style={title}>{tab === 'saved' ? 'Saved routines' : tab === 'moi' ? 'Moi routines' : 'Trending routines'}</Text>
          <Text style={sub}>{tab === 'saved' ? 'Routines you follow, from people with looks you love.' : tab === 'moi' ? 'Trending looks, built from products that fit your budget.' : 'The routines people are following most this week.'}</Text>
        </View>

        {tab === 'moi' && cat && !moiShown.length ? empty(`Moi’s ${cat.label.toLowerCase()} routines are coming. Build one with Moi in the meantime.`, { label: 'Explore with Moi', on: () => router.push({ pathname: '/routine/chat', params: { type: cat.label === 'Haircare' ? 'Haircare' : cat.label === 'Skincare' ? 'Skincare' : cat.label === 'Bath & Body' ? 'Bath & body' : cat.label } } as any) }) : null}
        {tab === 'moi' ? moiShown.map(r => (
          <Pressable key={r.key} onPress={() => tryMoi(r)} accessibilityRole="button" accessibilityLabel={`Try ${r.name}`}
            style={({ hovered }: any) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 24, backgroundColor: hovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.75)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)' })}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '700', fontSize: 15, color: '#111114' }}>{r.name}</Text>
              <Text style={sub}>{r.blurb}</Text>
            </View>
            <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 13, color: '#111114' }}>Try it ›</Text>
          </Pressable>
        )) : list == null ? <ActivityIndicator color="#6C6A80" style={{ marginTop: 20 }} />
          : shown.length ? shown.map(p => <RoutineCard key={p.user_id} page={p} />)
          : tab === 'saved'
            ? (signedIn ? empty('No saved routines yet. Follow one from Trending, or open someone’s Moi link.', { label: 'See trending', on: () => router.replace({ pathname: '/routine/routines', params: { tab: 'trending' } }) })
              : empty('Create your account to follow routines and keep them here.', { label: 'Create my account', on: () => router.push({ pathname: '/sign-in', params: { mode: 'signup', next: '/routine/routines' } }) }))
            : empty('No one has shared a routine yet. Share yours from your profile and you could be first.', { label: 'Share my routine', on: () => router.push('/routine/profile') })}
      </View>
    </Shell>
  );
}
