import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, Linking, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Panel, Bubble, QtyStepper, Btn, ChipBtn, iconFor, money, NeedInfo, ScoreBar, Shell, st, useWide } from '../../components/routine/Kit';
import { analyze, retailerLinks } from '../../lib/routine/gaps';
import { allSteps, AREA_Q, AREAS, BEAUTY_ROUTINES, CATEGORY_LABEL, DAYS, findByKey, GOALS, hasInfo, HAIR_Q, itemKey, placeItems, pref, setRoutine, useCatalog, useRoutine, type Item } from '../../lib/routine/model';
import { C, F } from '../../theme';
import { fill } from '../../lib/routine/shine';

// "Confirm and buy", in the layout of Airbnb's "Confirm and pay": a back arrow and title; on the left,
// "Your routine" rows (label, value, underlined Edit) so goals and answers can be changed right here, then a
// boxed radio choice and the stores; on the right a sticky card with the first pick and the price details.

const Underline = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={8}>
    {({ hovered }: any) => <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink, textDecorationLine: 'underline', opacity: hovered ? 0.7 : 1 }}>Edit</Text>}
  </Pressable>
);

function Row({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingVertical: 12 }}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>{label}</Text>
        <Text style={{ fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: '#4A4F5C' }}>{value || 'Not set'}</Text>
      </View>
      {onEdit ? <Underline label={`Edit ${label.toLowerCase()}`} onPress={onEdit} /> : null}
    </View>
  );
}

const H2 = ({ children }: { children: string }) => <Text style={{ fontFamily: F.semibold, fontSize: 21, color: C.ink, marginBottom: 6 }}>{children}</Text>;

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

  const option = (key: 'buy' | 'save', title: string, sub: string, first: boolean) => {
    const on = how === key;
    return (
      <Pressable key={key} onPress={() => setHow(key)} accessibilityRole="radio" accessibilityState={{ checked: on }}
        style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderWidth: on ? 2 : 1, borderColor: on ? '#7D74B0' : '#DDDCE4', marginTop: first ? 0 : -1, borderTopLeftRadius: first ? 14 : 0, borderTopRightRadius: first ? 14 : 0, borderBottomLeftRadius: first ? 0 : 14, borderBottomRightRadius: first ? 0 : 14, zIndex: on ? 1 : 0, backgroundColor: on ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.7)' }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>{title}</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: '#4A4F5C' }}>{sub}</Text>
        </View>
        <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: on ? 7 : 1.5, borderColor: on ? C.ink : '#B9BDC7', marginTop: 2 }} />
      </Pressable>
    );
  };

  const first = bag[0];
  const card = (
    <View {...fill('metal-card')} style={{ borderRadius: 22, borderWidth: 1, borderColor: '#D9D2E0', backgroundColor: '#fff', padding: 24, gap: 0 }}>
      {first ? (
        <View style={{ flexDirection: 'row', gap: 14, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#E3E5EB' }}>
          <View style={{ width: 104, height: 84, borderRadius: 12, backgroundColor: '#F2F3F6', alignItems: 'center', justifyContent: 'center' }}><Image source={iconFor(first.category)} style={{ width: 64, height: 64 }} /></View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray }}>{`${areaLabel} · ${CATEGORY_LABEL[first.category] ?? ''}`}</Text>
            <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.ink }} numberOfLines={2}>{`${first.brand} ${first.name}`}</Text>
            {bag.length > 1 ? <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray }}>{`+${bag.length - 1} more pick${bag.length > 2 ? 's' : ''}`}</Text> : null}
          </View>
        </View>
      ) : null}
      <Text style={{ fontFamily: F.semibold, fontSize: 21, color: C.ink, marginTop: 20, marginBottom: 14 }}>Price details</Text>
      <View style={{ gap: 12 }}>
        {bag.map(i => (
          <View key={itemKey(i)} style={{ flexDirection: 'row', gap: 12 }}>
            <Text style={{ flex: 1, fontFamily: F.regular, fontSize: 15, color: C.ink, textDecorationLine: 'underline' }} numberOfLines={1}>{`${CATEGORY_LABEL[i.category] ?? i.name}${q(i) > 1 ? ` × ${q(i)}` : ''}`}</Text>
            <Text style={{ fontFamily: F.regular, fontSize: 15, color: C.ink }}>{i.price != null ? money(i.price * q(i)) : 'At store'}</Text>
          </View>
        ))}
        {!bag.length ? <Text style={st.sub}>Your bag is empty.</Text> : null}
      </View>
      <View style={{ height: 1, backgroundColor: '#E3E5EB', marginVertical: 18 }} />
      <View style={{ flexDirection: 'row' }}>
        <Text style={{ flex: 1, fontFamily: F.semibold, fontSize: 16, color: C.ink }}>Total <Text style={{ textDecorationLine: 'underline' }}>(USD)</Text></Text>
        <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>{`${money(total)}${priced.length < bag.length ? ' +' : ''}`}</Text>
      </View>
      <View style={{ gap: 6, marginTop: 18 }}>
        <View style={{ flexDirection: 'row' }}><Text style={[st.meta, { flex: 1 }]}>Routine fit</Text><Text style={{ fontFamily: F.semibold, fontSize: 13, color: '#5B67C9' }}>{`${score} → ${after}`}</Text></View>
        <ScoreBar score={score} after={after} />
      </View>
    </View>
  );

  return (
    <Shell active="shop" side={wide ? <View style={{ paddingTop: 72 }}>{card}</View> : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/routine/shop'))} accessibilityRole="button" accessibilityLabel="Back" hitSlop={10}
          style={({ hovered }: any) => ({ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: hovered ? '#ECEEF2' : 'transparent' })}>
          <Svg width={10} height={16} viewBox="0 0 10 16"><Path d="M8 2 2 8l6 6" stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>
        </Pressable>
        <Text style={{ fontFamily: F.semibold, fontSize: wide ? 32 : 26, color: C.ink }}>Confirm and buy</Text>
      </View>

      <View style={{ maxWidth: 600, gap: 14 }}>
        <Panel style={{ gap: 0 }}>
        <H2>{`Your ${areaLabel.toLowerCase()} routine`}</H2>
        {answerRows.map(r => <Row key={r.label} label={r.label} value={r.value} onEdit={about} />)}
        <Row label="Routine" value={routineValue} onEdit={() => router.push({ pathname: '/routine/build', params: { area } })} />
        <Row label="Budget" value={s.hair.budget ?? ''} onEdit={about} />
        </Panel>

        <Panel style={{ gap: 0 }}>
        <H2>Choose how to buy</H2>
        <View style={{ marginTop: 8 }}>
          {option('buy', 'Buy now', `Add ${bag.length || 'your'} pick${bag.length === 1 ? '' : 's'} to your routine and open each store.`, true)}
          {option('save', 'Save for later', 'Add them to your routine now and buy whenever you like.', false)}
        </View>
        </Panel>

        <Panel>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}><H2>{`Your picks · ${count}`}</H2></View>
          <Underline label="Edit picks" onPress={() => router.push('/routine/shop')} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 6 }}>
          {bag.map(i => (
            <View {...fill('metal-card')} key={itemKey(i)} style={{ flexGrow: 1, flexBasis: 150, maxWidth: wide ? 220 : undefined, alignItems: 'center', gap: 10, paddingTop: 14, paddingBottom: 14, paddingHorizontal: 12, borderRadius: 24, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D9DCE2' }}>
              <Bubble category={i.category} chip={<Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.gray2 }} numberOfLines={1}>{CATEGORY_LABEL[i.category] ?? 'Pick'}</Text>} />
              <View style={{ alignItems: 'center', gap: 2, alignSelf: 'stretch' }}>
                <Text style={{ fontFamily: F.semibold, fontSize: 15, lineHeight: 19, color: C.ink, textAlign: 'center' }} numberOfLines={2}>{i.name}</Text>
                <Text style={[st.meta, { fontSize: 12, textAlign: 'center' }]} numberOfLines={1}>{i.brand}</Text>
              </View>
              <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>{i.price != null ? money(i.price * q(i)) : 'At store'}</Text>
              <QtyStepper n={q(i)} onChange={n => setQ(i, n)} onRemove={() => removeItem(i)} label={i.name} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
                {retailerLinks(i).slice(0, 3).map(r => (
                  <Pressable key={r.name} onPress={() => Linking.openURL(r.url)} accessibilityRole="link" style={({ hovered }: any) => ({ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: '#E3E5EB', backgroundColor: hovered ? '#F2F3F6' : '#fff' })}>
                    <Text style={{ fontFamily: F.medium, fontSize: 11, color: C.ink }}>{`${r.name} ↗`}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>
        {!bag.length ? <Text style={st.sub}>Nothing in your bag yet.</Text> : null}
        </Panel>
        {!wide ? card : null}
        <Text style={[st.meta, { fontSize: 12, lineHeight: 18 }]}>Prices are estimates. You buy from the store at its price.</Text>
        <View style={{ marginTop: 4, alignSelf: wide ? 'flex-start' : 'stretch' }}>
          <Btn label={how === 'buy' ? 'Confirm and buy' : 'Confirm and save'} onPress={confirm} disabled={!bag.length} />
        </View>
      </View>
    </Shell>
  );
}
