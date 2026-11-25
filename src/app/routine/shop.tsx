import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { BLUE, Btn, ChipBtn, Heading, iconFor, Label, money, MorePicks, NeedInfo, Pill, Bubble, Panel, ScoreBar, SYS, Shell, st, useWide } from '../../components/routine/Kit';
import { useAccess } from '../../lib/routine/access';
import { celebrate } from '../../components/routine/Celebrate';
import { analyze, hasMorePicks, profileOf, rankPicks, retailerLinks } from '../../lib/routine/gaps';
import { allSteps, findByKey, hasInfo, hasInput, itemKey, setRoutine, useCatalog, useRoutine, type Item } from '../../lib/routine/model';
import { C, F } from '../../theme';
import { fill } from '../../lib/routine/shine';
import { lookNote } from '../../lib/routine/looks';

const T = {
  title: { fontFamily: SYS ?? F.bold, fontWeight: '700' as const, fontSize: 26, lineHeight: 31, letterSpacing: -0.6, color: '#111114' },
  h2: { fontFamily: SYS ?? F.semibold, fontWeight: '600' as const, fontSize: 16, lineHeight: 21, letterSpacing: -0.2, color: '#1D1D22' },
  name: { fontFamily: SYS ?? F.semibold, fontWeight: '600' as const, fontSize: 14, lineHeight: 19, color: '#1D1D22' },
  body: { fontFamily: SYS ?? F.regular, fontWeight: '400' as const, fontSize: 14, lineHeight: 20, color: '#6E6E78' },
  meta: { fontFamily: SYS ?? F.medium, fontWeight: '500' as const, fontSize: 12, lineHeight: 16, color: '#8A8A93' },
  price: { fontFamily: SYS ?? F.semibold, fontWeight: '600' as const, fontSize: 14, color: '#111114', fontVariant: ['tabular-nums' as const] },
  label: { fontFamily: SYS ?? F.semibold, fontWeight: '600' as const, fontSize: 13 },
};

export default function Shop() {
  const s = useRoutine();
  const cat = useCatalog();
  const wide = useWide();
  const access = useAccess();
  // Paywall: shopping the picks needs a plan.
  useEffect(() => { if (hasInfo(s) && !access.ok && !access.loading) router.replace('/routine/plans'); }, [access.ok, access.loading]);
  const { score, gaps } = useMemo(() => analyze(s, cat), [s, cat]);
  const bag = s.bag.map(k => findByKey(cat, k)).filter((i): i is Item => !!i);
  const after = useMemo(() => analyze(s, cat, bag).score, [s, cat, bag.length]);
  const max = profileOf(s).budgetMax;
  // Ranked by advantage: how much each pick actually raises this routine's fit, then match, then price.
  // The top pick is "Best for you"; a cheaper one within 2 points of it is "Best value".
  const keep = () => true;
  const rows = useMemo(() => gaps.map(g => ({ g, picks: rankPicks(g, s, cat, score, keep) })
  ).filter(r => r.picks.length), [gaps, s, cat, score]);
  // Swipe shelves: the best picks across every gap that fit their budget, and the ones under $15.
  const pool = rows.flatMap(r => r.picks.map(p => ({ ...p, gap: r.g }))).filter((p, n, a) => a.findIndex(q => q.item.id === p.item.id) === n).sort((a, b) => b.gain - a.gain);
  const inBudget = max > 999 ? [] : pool.filter(p => p.item.price != null && p.item.price <= max);
  const under15 = pool.filter(p => p.item.price != null && p.item.price <= 15);
  const total = (items: Item[]) => items.reduce((a, i) => a + (i.price ?? 0), 0);
  const toggle = (k: string) => { if (!s.bag.includes(k)) celebrate('Added to bag'); setRoutine(r => ({ ...r, bag: r.bag.includes(k) ? r.bag.filter(x => x !== k) : [...r.bag, k] })); };

  const bagPanel = (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={[T.h2, { fontSize: 18, flex: 1 }]}>Your bag</Text><Text style={T.meta}>{`${bag.length} item${bag.length === 1 ? '' : 's'}`}</Text></View>
      {bag.length === 0 ? <Text style={st.sub}>Add picks to see your new fit.</Text> : null}
      {bag.map(i => (
        <View key={itemKey(i)} style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: '#F4F5F7', alignItems: 'center', justifyContent: 'center' }}><Image source={iconFor(i.category)} style={{ width: 42, height: 42 }} /></View>
            <View style={{ flex: 1 }}><Text style={T.name}>{i.name}</Text><Text style={T.meta}>{i.brand}</Text></View>
            <Text style={T.price}>{money(i.price)}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingLeft: 64 }}>
            {retailerLinks(i).slice(0, 3).map(r => <Pressable key={r.name} onPress={() => Linking.openURL(r.url)} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: '#F1F3F5' }}><Text style={{ fontFamily: F.medium, fontSize: 12, color: C.gray2 }}>{`${r.name} ↗`}</Text></Pressable>)}
            <ChipBtn label="Remove from bag" tone="danger" icon="trash" iconOnly onPress={() => toggle(itemKey(i))} />
          </View>
        </View>
      ))}
      {bag.length ? (
        <>
          <View style={{ backgroundColor: '#F4F7FE', borderRadius: 16, padding: 16, gap: 10 }}>
            <View style={{ flexDirection: 'row' }}><Text style={[st.meta, { flex: 1, color: C.gray2 }]}>Fit with your bag</Text><Text style={{ fontFamily: F.bold, fontSize: 13, color: BLUE }}>{`${score} → ${after}`}</Text></View>
            <ScoreBar score={score} after={after} />
          </View>
          <View style={{ flexDirection: 'row' }}><Text style={[T.name, { flex: 1 }]}>Estimated total</Text><Text style={T.price}>{`about ${money(Math.round(total(bag) * 100) / 100)}`}</Text></View>
          <Btn label="Your picks" onPress={() => router.push('/routine/checkout')} />
          <Text style={[st.meta, { fontSize: 12, textAlign: 'center' }]}>Prices are estimates. You buy from the store.</Text>
        </>
      ) : null}
    </View>
  );

  if (!hasInfo(s)) return <Shell active="shop"><NeedInfo goals={s.goals.length > 0} /></Shell>;
  if (!hasInput(s)) return <Shell active="shop"><NeedInfo goals /></Shell>;
  // Refills: everything already in their routine, one tap from a store to buy it again.
  const mine = allSteps(s).map(x => x.step.item).filter((i): i is Item => !!i?.addedAt);
  const refills = mine.filter((i, n) => mine.findIndex(j => itemKey(j) === itemKey(i)) === n);
  const buyAgain = (i: Item) => {
    const link = retailerLinks(i)[0]; if (!link) return;
    setRoutine(r => ({ ...r, opened: { ...(r.opened ?? {}), [itemKey(i)]: { store: link.name, at: Date.now() } } }));
    Linking.openURL(link.url);
    router.push({ pathname: '/routine/handoff', params: { k: itemKey(i), store: link.name, url: link.url } });
  };
  return (
    <Shell active="shop" side={wide && bag.length ? bagPanel : undefined}
      footer={!wide && bag.length ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ flex: 1 }}><Text style={T.h2}>{`${bag.length} item${bag.length === 1 ? '' : 's'} · ${money(Math.round(total(bag)))}`}</Text><Text style={T.meta}>{`+${after - score} fit`}</Text></View><Btn label="Your picks" onPress={() => router.push('/routine/checkout')} /></View> : undefined}>
      {/* One type scale on this page (system sans): title 26, section 16, body 14, meta 12. Compact rows so more fits. */}
      <View style={{ gap: 6 }}>
        <Text {...({ dataSet: { grad: 'title' } } as any)} style={T.title}>Shop your gaps</Text>
      </View>
      {refills.length ? (
        <View style={{ gap: 10 }}>
          <Text style={T.h2}>Buy again</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 8 }}>
            {refills.map(i => {
              const store = retailerLinks(i)[0]?.name;
              return (
                <View key={itemKey(i)} style={{ width: 148, gap: 8, padding: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 0.5, borderColor: 'rgba(20,20,40,0.10)' }}>
                  <Bubble category={i.category} item={i} size={44} />
                  <Text numberOfLines={2} style={[T.name, { minHeight: 38 }]}>{i.name}</Text>
                  <Text style={T.meta}>{i.price != null ? money(i.price) : i.brand}</Text>
                  {store ? (
                    <Pressable {...fill('chrome-key')} onPress={() => buyAgain(i)} accessibilityRole="link" accessibilityLabel={`Buy ${i.name} again at ${store}`}
                      style={{ height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DADADA', borderWidth: 1.5, borderColor: '#161616' }}>
                      <Text style={[T.label, { color: '#111114' }]}>{`${store} ↗`}</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
      {[{ title: `In your budget${max < 999 ? ` · up to ${money(max)}` : ''}`, list: inBudget }, { title: 'Under $15', list: max > 15 ? under15 : [] }].filter(x => x.list.length).map(shelf => (
        <View key={shelf.title} style={{ gap: 10 }}>
          <Text style={T.h2}>{shelf.title}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 8 }}>
            {shelf.list.map(p => {
              const on = s.bag.includes(itemKey(p.item));
              return (
                <View key={p.item.id} style={{ width: 168, gap: 8, padding: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 0.5, borderColor: 'rgba(20,20,40,0.10)' }}>
                  <Bubble category={p.item.category} item={p.item} size={44} />
                  <Text numberOfLines={2} style={[T.name, { minHeight: 38 }]}>{p.item.name}</Text>
                  <Text numberOfLines={3} style={[T.meta, { minHeight: 48 }]}>{lookNote(p.item, s, p.gap.title)}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={T.price}>{money(p.item.price)}</Text>
                    <Pressable {...(on ? {} : fill('chrome-key'))} onPress={() => toggle(itemKey(p.item))} accessibilityRole="button" accessibilityLabel={on ? `Remove ${p.item.name} from bag` : `Add ${p.item.name} to bag`}
                      style={{ height: 28, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? '#E5F4EA' : '#DADADA', borderWidth: 1.5, borderColor: on ? '#CDEBD6' : '#161616' }}>
                      <Text style={[T.label, { color: on ? '#1E7B45' : '#111114' }]}>{on ? 'Added' : 'Add'}</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      ))}
      {rows.length === 0 ? <Text style={T.body}>No gaps to fill.</Text> : null}
      <View style={{ gap: 12, maxWidth: 720 }}>
        {rows.map(({ g, picks }) => (
          <Panel key={g.id} style={{ gap: 8, padding: 14 }}>
            <Text style={T.h2}>{g.title}</Text>
            <View style={{ marginTop: 2 }}>
              {picks.map((p, n) => {
                const inBag = s.bag.includes(itemKey(p.item));
                return (
                  <View key={p.item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: n ? 0.5 : 0, borderTopColor: 'rgba(20,20,40,0.10)' }}>
                    <Bubble category={p.item.category} item={p.item} size={40} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={T.name}>{p.item.name}</Text>
                      <Text style={T.meta}>{[p.badge === 'best' ? 'Best' : p.badge === 'value' ? 'Best value' : null, p.match, p.gain ? `+${p.gain} fit` : null].filter(Boolean).join(' · ')}</Text>
                      {lookNote(p.item, s) ? <Text style={[T.meta, { color: '#4A4858' }]}>{lookNote(p.item, s)}</Text> : null}
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Text style={T.price}>{p.item.price != null ? money(p.item.price) : 'At store'}</Text>
                      <Pressable {...(inBag ? {} : fill('chrome-key'))} onPress={() => toggle(itemKey(p.item))} accessibilityRole="button" accessibilityLabel={inBag ? `Remove ${p.item.name} from bag` : `Add ${p.item.name} to bag`}
                        style={{ height: 28, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: inBag ? '#E5F4EA' : '#DADADA', borderWidth: 1.5, borderColor: inBag ? '#CDEBD6' : '#161616' }}>
                        <Text style={[T.label, { color: inBag ? '#1E7B45' : '#111114' }]}>{inBag ? 'Added' : 'Add'}</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
            <MorePicks gap={g} more={hasMorePicks(g, s, cat, keep)} />
          </Panel>
        ))}
      </View>
      <Text style={[T.meta, { fontSize: 11 }]}>{`Product data: Moi, Open Beauty Facts contributors (ODbL), California Safe Cosmetics Program (CC-BY)`}</Text>
    </Shell>
  );
}
