import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { BLUE, Btn, ChipBtn, Heading, iconFor, Label, money, NeedInfo, Pill, PickRow, ScoreBar, Shell, st, useWide } from '../../components/routine/Kit';
import { useAccess } from '../../lib/routine/access';
import { celebrate } from '../../components/routine/Celebrate';
import { analyze, profileOf, rankPicks, retailerLinks } from '../../lib/routine/gaps';
import { findByKey, hasInfo, itemKey, setRoutine, useCatalog, useRoutine, type Item } from '../../lib/routine/model';
import { C, F } from '../../theme';

export default function Shop() {
  const s = useRoutine();
  const cat = useCatalog();
  const wide = useWide();
  const access = useAccess();
  // Paywall: shopping the picks needs a plan.
  useEffect(() => { if (hasInfo(s) && !access.ok && !access.loading) router.replace('/routine/plans'); }, [access.ok, access.loading]);
  const [budgetOnly, setBudgetOnly] = useState(true);
  const [under15, setUnder15] = useState(false);
  const { score, gaps } = useMemo(() => analyze(s, cat), [s, cat]);
  const bag = s.bag.map(k => findByKey(cat, k)).filter((i): i is Item => !!i);
  const after = useMemo(() => analyze(s, cat, bag).score, [s, cat, bag.length]);
  const max = profileOf(s).budgetMax;
  // Ranked by advantage: how much each pick actually raises this routine's fit, then match, then price.
  // The top pick is "Best for you"; a cheaper one within 2 points of it is "Best value".
  const rows = useMemo(() => gaps.map(g => ({ g, picks: rankPicks(g, s, cat, score, i => (!budgetOnly || (i.price ?? 0) <= max || max > 999) && (!under15 || (i.price ?? 0) <= 15)) })
  ).filter(r => r.picks.length), [gaps, s, cat, budgetOnly, under15, max, score]);
  const bundle = rows.map(r => r.picks[0].item).filter(i => i.price != null);
  const bundleAfter = useMemo(() => analyze(s, cat, bundle).score, [s, cat, bundle.length]);
  const total = (items: Item[]) => items.reduce((a, i) => a + (i.price ?? 0), 0);
  const toggle = (k: string) => { if (!s.bag.includes(k)) celebrate('Added to bag'); setRoutine(r => ({ ...r, bag: r.bag.includes(k) ? r.bag.filter(x => x !== k) : [...r.bag, k] })); };
  const addAll = () => { celebrate(`${bundle.length} added · fit ${bundleAfter}`, true); setRoutine(r => ({ ...r, bag: Array.from(new Set([...r.bag, ...bundle.map(itemKey)])) })); };

  const bagPanel = (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={[st.h1, { fontSize: 24, flex: 1 }]}>Your bag</Text><Text style={st.meta}>{`${bag.length} item${bag.length === 1 ? '' : 's'}`}</Text></View>
      {bag.length === 0 ? <Text style={st.sub}>Add picks to see your new fit.</Text> : null}
      {bag.map(i => (
        <View key={itemKey(i)} style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: '#F4F5F7', alignItems: 'center', justifyContent: 'center' }}><Image source={iconFor(i.category)} style={{ width: 42, height: 42 }} /></View>
            <View style={{ flex: 1 }}><Text style={st.meta}>{i.brand}</Text><Text style={st.cardTitle} numberOfLines={2}>{i.name}</Text></View>
            <Text style={st.price}>{money(i.price)}</Text>
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
          <View style={{ flexDirection: 'row' }}><Text style={[st.cardTitle, { flex: 1 }]}>Estimated total</Text><Text style={st.price}>{`about ${money(Math.round(total(bag) * 100) / 100)}`}</Text></View>
          <Btn label="Review and check out" onPress={() => router.push('/routine/checkout')} />
          <Text style={[st.meta, { fontSize: 12, textAlign: 'center' }]}>Prices are estimates. You buy from the store.</Text>
        </>
      ) : null}
    </View>
  );

  if (!hasInfo(s)) return <Shell active="shop"><NeedInfo goals={s.goals.length > 0} /></Shell>;
  return (
    <Shell active="shop" side={wide && bag.length ? bagPanel : undefined}
      footer={!wide && bag.length ? <Pressable onPress={() => {}} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ flex: 1 }}><Text style={st.cardTitle}>{`${bag.length} in bag · about ${money(Math.round(total(bag)))}`}</Text><Text style={st.meta}>{`Routine fit ${score} → ${after}`}</Text></View></Pressable> : undefined}>
      <Heading title="Shop your gaps" sub="Only products that fill a gap. Biggest fit gain first." />
      {bundle.length > 1 ? (
        <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'stretch', gap: 16, padding: 20, borderRadius: 24, backgroundColor: '#EEF1FD' }}>
          <View style={{ flexDirection: 'row' }}>{bundle.slice(0, 4).map((i, n) => <View key={n} style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#fff', borderWidth: 3, borderColor: '#fff', marginLeft: n ? -14 : 0, alignItems: 'center', justifyContent: 'center' }}><Image source={iconFor(i.category)} style={{ width: 40, height: 40 }} /></View>)}</View>
          <View style={{ flex: wide ? 1 : undefined, gap: 4 }}>
            <Text style={{ fontFamily: F.semibold, fontSize: 18, color: C.ink }}>{`Fill ${bundle.length} gaps for about ${money(Math.round(total(bundle)))}`}</Text>
            <Text style={st.sub}>{`Top picks together · fit ${score} → ${bundleAfter}`}</Text>
          </View>
          <Btn label="Add all to bag" onPress={addAll} />
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Pill label="Fits my budget" on={budgetOnly} onPress={() => setBudgetOnly(v => !v)} />
        <Pill label="Under $15" on={under15} onPress={() => setUnder15(v => !v)} />
      </View>
      {rows.length === 0 ? <Text style={st.sub}>{gaps.length ? 'No matches. Turn a filter off.' : 'No gaps to fill.'}</Text> : null}
      {rows.map(({ g, picks }) => (
        <View key={g.id} style={{ gap: 16 }}>
          <View style={{ gap: 4 }}><Text style={{ fontFamily: F.semibold, fontSize: 20, color: C.ink }}>{g.title}</Text><Text style={[st.sub, { fontSize: 13, lineHeight: 19 }]}>{g.why}</Text></View>
          {/* A ranked list, not a carousel: options side by side in one column are easier to compare. */}
          <View style={{ gap: 8, maxWidth: 720 }}>
            {picks.map((p, i) => <PickRow key={p.item.id} rank={i + 1} item={p.item} fit={p.fit} gain={p.gain} badge={p.badge} why={p.why} inBag={s.bag.includes(itemKey(p.item))} onAdd={() => toggle(itemKey(p.item))} />)}
          </View>
        </View>
      ))}
      {!wide && bag.length ? <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 20 }}>{bagPanel}</View> : null}
      <Label>{`Product data: Moi, Open Beauty Facts contributors (ODbL), California Safe Cosmetics Program (CC-BY)`}</Label>
    </Shell>
  );
}
