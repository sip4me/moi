import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Image, Linking, Pressable, Text, View } from 'react-native';
import { Btn, ChipBtn, Heading, iconFor, money, NeedInfo, ScoreBar, Shell, st, useWide } from '../../components/routine/Kit';
import { analyze, retailerLinks } from '../../lib/routine/gaps';
import { allSteps, AREAS, BEAUTY_ROUTINES, CATEGORY_LABEL, DAYS, findByKey, hasInfo, itemKey, placeItems, setRoutine, useCatalog, useRoutine, type Item } from '../../lib/routine/model';
import { C, F } from '../../theme';

// Review before buying, the Airbnb way: each part of the order is a section with its own Edit link, and a
// summary card (sticky on the side on laptop, at the end on phone) holds the total and the one button.

function Section({ title, value, edit, first, children }: { title: string; value?: string; edit?: () => void; first?: boolean; children?: React.ReactNode }) {
  return (
    <View style={{ paddingVertical: 20, borderTopWidth: first ? 0 : 1, borderTopColor: '#E6E8EE', gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>{title}</Text>
          {value ? <Text style={{ fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: C.gray2 }}>{value}</Text> : null}
        </View>
        {edit ? (
          <Pressable onPress={edit} accessibilityRole="button" accessibilityLabel={`Edit ${title.toLowerCase()}`} hitSlop={8}>
            <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink, textDecorationLine: 'underline' }}>Edit</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export default function Checkout() {
  const s = useRoutine();
  const cat = useCatalog();
  const wide = useWide();
  const bag = s.bag.map(k => findByKey(cat, k)).filter((i): i is Item => !!i);
  const { score } = useMemo(() => analyze(s, cat), [s, cat]);
  const after = useMemo(() => analyze(s, cat, bag).score, [s, cat, bag.length]);
  const total = Math.round(bag.reduce((a, i) => a + (i.price ?? 0), 0) * 100) / 100;
  const unpriced = bag.filter(i => i.price == null).length;

  if (!hasInfo(s)) return <Shell active="shop"><NeedInfo goals={s.goals.length > 0} /></Shell>;

  const areas = s.areas ?? ['hair'];
  const goalsLine = [
    areas.includes('hair') && s.goals.length ? `Hair: ${s.goals.join(', ')}` : '',
    areas.includes('skin') && s.prefs?.skin_concerns?.length ? `Skin: ${s.prefs.skin_concerns.join(', ')}` : '',
    areas.includes('makeup') && s.prefs?.mk_look?.length ? `Makeup: ${s.prefs.mk_look[0]}` : '',
    areas.includes('body') && s.prefs?.body_concerns?.length ? `Body: ${s.prefs.body_concerns.join(', ')}` : '',
  ].filter(Boolean).join(' · ') || 'Not set';
  const steps = allSteps(s);
  const routineLine = AREAS.filter(a => areas.includes(a.key)).map(a => {
    const n = steps.filter(x => x.step.item?.addedAt && (a.key === 'hair' ? !BEAUTY_ROUTINES.some(b => b.key === x.where) : BEAUTY_ROUTINES.some(b => b.key === x.where && b.area === a.key))).length;
    return `${a.label}: ${n} product${n === 1 ? '' : 's'}`;
  }).join(' · ') + (areas.includes('hair') ? ` · wash ${s.washDays.map(d => DAYS[d]).join(', ')}` : '');

  const place = () => { setRoutine(r => ({ ...placeItems(r, bag), bag: [] })); router.replace('/routine/build'); };

  const summary = (
    <View style={{ borderRadius: 24, borderWidth: 1, borderColor: '#E3E5EC', backgroundColor: '#fff', padding: 22, gap: 16, shadowColor: '#283050', shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } }}>
      <Text style={{ fontFamily: F.semibold, fontSize: 17, color: C.ink }}>Summary</Text>
      {bag.map(i => (
        <View key={itemKey(i)} style={{ flexDirection: 'row', gap: 10 }}>
          <Text style={{ flex: 1, fontFamily: F.regular, fontSize: 14, color: C.gray2 }} numberOfLines={1}>{`${i.brand} ${i.name}`}</Text>
          <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.ink }}>{i.price != null ? money(i.price) : 'See store'}</Text>
        </View>
      ))}
      <View style={{ height: 1, backgroundColor: '#E6E8EE' }} />
      <View style={{ flexDirection: 'row' }}>
        <Text style={{ flex: 1, fontFamily: F.semibold, fontSize: 16, color: C.ink }}>Estimated total</Text>
        <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>{`${money(total)}${unpriced ? ' +' : ''}`}</Text>
      </View>
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row' }}><Text style={[st.meta, { flex: 1 }]}>Routine fit</Text><Text style={{ fontFamily: F.semibold, fontSize: 13, color: '#5B67C9' }}>{`${score} → ${after}`}</Text></View>
        <ScoreBar score={score} after={after} />
      </View>
      <Btn label="Add to my routines" onPress={place} disabled={!bag.length} />
      <Text style={[st.meta, { fontSize: 12, textAlign: 'center' }]}>Prices are estimates. You buy from the store.</Text>
    </View>
  );

  return (
    <Shell active="shop" side={wide ? summary : undefined}>
      <Heading title="Review your picks" sub="Check everything before you buy." />
      <View style={{ maxWidth: 640 }}>
        <Section first title="Your goals" value={goalsLine} edit={() => router.push('/routine/about')} />
        <Section title="Your routines" value={routineLine} edit={() => router.push('/routine/build')} />
        <Section title={`Your picks · ${bag.length}`} value={bag.length ? undefined : 'Nothing in your bag yet.'} edit={() => router.push('/routine/shop')}>
          {bag.map(i => (
            <View key={itemKey(i)} style={{ gap: 8, paddingTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: '#F4F5F7', alignItems: 'center', justifyContent: 'center' }}><Image source={iconFor(i.category)} style={{ width: 42, height: 42 }} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={st.meta}>{`${i.brand} · ${CATEGORY_LABEL[i.category] ?? ''}`}</Text>
                  <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }} numberOfLines={2}>{i.name}</Text>
                </View>
                <ChipBtn label="Remove" tone="danger" icon="trash" iconOnly onPress={() => setRoutine(r => ({ ...r, bag: r.bag.filter(k => k !== itemKey(i)) }))} />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingLeft: 64 }}>
                {retailerLinks(i).map(r => (
                  <Pressable key={r.name} onPress={() => Linking.openURL(r.url)} accessibilityRole="link" style={({ hovered }: any) => ({ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: hovered ? '#E7E9F0' : '#F1F3F5' })}>
                    <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.gray2 }}>{`${r.name} ↗`}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </Section>
        {!wide ? <View style={{ paddingTop: 8 }}>{summary}</View> : null}
      </View>
    </Shell>
  );
}
