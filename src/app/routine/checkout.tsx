import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { money, NeedInfo, ScoreBar, Shell, SYS, useWide } from '../../components/routine/Kit';
import { ChromeButton, ChromeChoice, LabelValue, SILVER, SilverCard, StepperCard } from '../../components/routine/Chrome';
import { analyze, retailerLinks } from '../../lib/routine/gaps';
import { HAS_AFFILIATE } from '../../lib/routine/affiliate';
import { allSteps, AREA_Q, AREAS, BEAUTY_ROUTINES, CATEGORY_LABEL, DAYS, findByKey, GOALS, hasInfo, HAIR_Q, itemKey, placeItems, pref, setRoutine, useCatalog, useRoutine, type Item } from '../../lib/routine/model';
import { C, F } from '../../theme';

// "Confirm and buy" in the silver chrome style: each pick is a card with its name in grey and price in black over a
// chrome − count + stepper; then how to buy (two chrome keys), the routine's answers (tap to edit), the price summary
// (sticky on the right on wide screens) and one chrome confirm key.




export default function Checkout() {
  const s = useRoutine();
  const cat = useCatalog();
  const wide = useWide();
  const [how, setHow] = useState<'buy' | 'save'>('buy');
  const bag = s.bag.map(k => findByKey(cat, k)).filter((i): i is Item => !!i);
  const { score } = useMemo(() => analyze(s, cat), [s, cat]);
  const after = useMemo(() => analyze(s, cat, bag).score, [s, cat, bag.length]);
  const q = (i: Item) => Math.max(1, s.qty?.[itemKey(i)] ?? 1);
  const setQ = (i: Item, n: number) => setRoutine(r => ({ ...r, qty: { ...(r.qty ?? {}), [itemKey(i)]: Math.min(9, Math.max(1, n)) } }));
  const removeItem = (i: Item) => setRoutine(r => { const k = itemKey(i); const { [k]: _, ...rest } = r.qty ?? {}; return { ...r, bag: r.bag.filter(x => x !== k), qty: rest }; });
  const count = bag.reduce((a, i) => a + q(i), 0);
  const priced = bag.filter(i => i.price != null);
  const total = Math.round(priced.reduce((a, i) => a + (i.price ?? 0) * q(i), 0) * 100) / 100;

  if (!hasInfo(s)) return <Shell active="shop"><NeedInfo goals={s.goals.length > 0} /></Shell>;

  const area = (s.areas ?? ['hair'])[0] ?? 'hair';
  const areaLabel = AREAS.find(a => a.key === area)?.label ?? 'Hair';
  const about = () => router.push('/routine/about');
  const steps = allSteps(s).filter(x => x.step.item?.addedAt);
  const routineValue = area === 'hair'
    ? `${steps.length} product${steps.length === 1 ? '' : 's'} · wash ${s.washDays.map(d => DAYS[d]).join(', ') || 'days not set'}`
    : BEAUTY_ROUTINES.filter(b => b.area === area).map(b => `${b.label}: ${(s.beauty?.[b.key] ?? []).filter(x => x.item?.addedAt).length}`).join(' · ');
  // Every answer for this routine type, as its own editable row.
  const answerRows = area === 'hair'
    ? [{ label: s.goals.length > 1 ? 'Goals' : 'Goal', value: s.goals.filter(g => GOALS.includes(g)).join(', ') }, { label: 'Hair', value: HAIR_Q.filter(q => q.key !== 'budget').map(q => s.hair[q.key]).filter(Boolean).join(' · ') }]
    : AREA_Q.filter(q => q.area === area).map(q => ({ label: q.label.replace(/ · .*/, ''), value: pref(s, q.key).join(', ') })).filter(r => r.value);

  const confirm = () => {
    setRoutine(r => ({ ...placeItems(r, bag), bag: [], qty: {} }));
    if (how === 'buy') bag.forEach((i, n) => setTimeout(() => Linking.openURL(retailerLinks(i)[0].url), n * 400));
    router.replace({ pathname: '/routine/done', params: { from: String(score), to: String(after), n: String(bag.length), buy: how } });
  };

  const stores = (i: Item) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
      {retailerLinks(i).slice(0, 3).map(r => (
        <Pressable key={r.name} onPress={() => Linking.openURL(r.url)} accessibilityRole="link" hitSlop={6}>
          {({ hovered }: any) => <Text style={{ fontFamily: F.medium, fontSize: 13, color: hovered ? SILVER.ink : '#7A7A7A' }}>{`${r.name} ↗`}</Text>}
        </Pressable>
      ))}
    </View>
  );

  const summary = (
    <SilverCard>
      <LabelValue label="Total" value={priced.length ? `${money(total)}${priced.length < bag.length ? ' + store' : ''}` : 'At store'} big />
      <View style={{ gap: 8 }}>
        <LabelValue label="Fit" value={`${score} → ${after}`} />
        <ScoreBar score={score} after={after} />
      </View>
    </SilverCard>
  );

  return (
    <Shell silver active="shop" side={wide ? <View style={{ paddingTop: 64 }}>{summary}</View> : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/routine/shop'))} accessibilityRole="button" accessibilityLabel="Back" hitSlop={10}
          style={({ hovered }: any) => ({ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: hovered ? 'rgba(255,255,255,0.5)' : 'transparent' })}>
          <Svg width={10} height={16} viewBox="0 0 10 16"><Path d="M8 2 2 8l6 6" stroke={SILVER.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>
        </Pressable>
        <Text {...({ dataSet: { grad: 'title' } } as any)} style={{ fontFamily: SYS ?? F.medium, fontWeight: '700', fontSize: wide ? 32 : 26, lineHeight: wide ? 38 : 31, letterSpacing: -0.7, color: SILVER.ink }}>Checkout</Text>
      </View>

      <View style={{ maxWidth: 600, gap: 22 }}>
        {bag.map(i => (
          <StepperCard key={itemKey(i)} name={i.name} sub={q(i) > 1 && i.price != null ? `${money(i.price)} each` : undefined}
            price={i.price != null ? money(i.price * q(i)) : 'See price'} n={q(i)} onChange={n => setQ(i, n)} onRemove={() => removeItem(i)} footer={stores(i)} />
        ))}
        {!bag.length ? <SilverCard><Text style={{ fontFamily: F.medium, fontSize: 16, color: SILVER.label }}>Nothing in your bag yet.</Text></SilverCard> : null}

        <SilverCard>
          <ChromeChoice value={how} onChange={setHow} options={[
            { key: 'buy', title: 'Buy now' },
            { key: 'save', title: 'Save for later' },
          ]} />
        </SilverCard>

        {/* One line for the answers this was built on; tap to change them. */}
        <SilverCard style={{ paddingVertical: 18 }}>
          <LabelValue label={[...answerRows.map(r => r.value), s.hair.budget].filter(v => v && v !== 'Nothing').join(' · ') || areaLabel} value="Edit" onPress={about} />
        </SilverCard>

        {!wide ? summary : null}
        <ChromeButton label={how === 'buy' ? `Buy · ${money(total)}` : 'Save'} onPress={confirm} disabled={!bag.length} />
        <Text style={{ fontFamily: F.medium, fontSize: 12, lineHeight: 18, color: '#7A7A7A', textAlign: 'center' }}>{`${priced.length ? 'Estimated prices. ' : ''}${HAS_AFFILIATE ? 'Moi may earn a commission from store links.' : ''}`.trim() || 'Prices are set by each store.'}</Text>
      </View>
    </Shell>
  );
}
