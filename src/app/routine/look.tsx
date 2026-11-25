import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Btn, Bubble, money, Shell, SYS, useWide } from '../../components/routine/Kit';
import { analyze, profileOf, rankPicks, tailoredBeauty, type Gap } from '../../lib/routine/gaps';
import { lookFromText, lookNote } from '../../lib/routine/looks';
import { BEAUTY_ROUTINES, CATEGORY_LABEL, pref, session, setRoutine, useCatalog, useRoutine, type Item, type RoutineState } from '../../lib/routine/model';
import { F } from '../../theme';
import { ModelFace } from '../../components/routine/ModelFace';

const crown = require('../../../assets/crown-pink.png');

/** The steps a look needs (makeup: its face, eye and lip routines), each with the best product in budget. */
function routineFor(s: RoutineState, cat: ReturnType<typeof useCatalog>) {
  const { score } = analyze(s, cat);
  const max = profileOf(s).budgetMax;
  const keep = (i: Item) => i.price == null || max > 999 || i.price <= max;
  const keys = BEAUTY_ROUTINES.filter(r => (s.areas ?? []).includes(r.area)).map(r => r.key);
  const steps = keys.flatMap(k => tailoredBeauty(s, k));
  const seen = new Set<string>();
  const out: { step: string; pick: ReturnType<typeof rankPicks>[number] }[] = [];
  for (const st of steps) {
    const c = st.hint ?? '';
    if (!c || seen.has(`${c}:${st.label}`)) continue;
    seen.add(`${c}:${st.label}`);
    const g: Gap = { id: `look_${c}_${st.label}`, kind: 'step', title: st.label, why: '', fills: [c], weight: 1 } as Gap;
    const pick = rankPicks(g, s, cat, score, i => keep(i) && !out.some(o => o.pick.item.id === i.id), 1)[0];
    if (pick) out.push({ step: st.label, pick });
  }
  // Hair (or anything without look steps): their gaps, best pick each.
  if (!out.length) for (const g of analyze(s, cat).gaps.slice(0, 5)) { const p = rankPicks(g, s, cat, score, keep, 1)[0]; if (p) out.push({ step: g.title, pick: p }); }
  return out;
}

/**
 * The first answer after sign-up, as a chat: their look on one side, Moi's reply on the other.
 * "You can achieve this look:" with one product per step, in their budget, then the ask to tell Moi
 * about their current routine.
 */
export default function Look() {
  const s = useRoutine();
  const cat = useCatalog();
  const wide = useWide();
  const [after, setAfter] = useState(true);
  const [more, setMore] = useState('');
  const list = useMemo(() => routineFor(s, cat), [s, cat]);
  const items = list.map(x => x.pick.item);
  const total = items.reduce((a, i) => a + (i.price ?? 0), 0);
  const isMakeup = (s.areas ?? []).includes('makeup');
  const send = () => {
    const t = more.trim(); if (!t) return;
    const r0 = lookFromText(`${s.lookText ?? ''} ${t}`);
    setRoutine(r => ({ ...r, lookText: `${r.lookText ?? ''} ${t}`.trim(), prefs: { ...(r.prefs ?? {}), ...r0.prefs }, goals: Array.from(new Set([...(r.goals ?? []), ...r0.goals])), areas: r.areas?.length ? r.areas : r0.area ? [r0.area] : [] }));
    setMore('');
  };
  const bubble = { maxWidth: 560, padding: 16, borderRadius: 22, gap: 10 };
  const T = { fontFamily: SYS ?? F.medium, fontSize: 15, lineHeight: 21, color: '#1D1D22' };

  return (
    <Shell active="build"
      footer={<View style={{ width: wide ? 560 : '100%', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, paddingLeft: 16, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)' }}>
        <TextInput value={more} onChangeText={setMore} onSubmitEditing={send} placeholder="Tell Moi more about the look" placeholderTextColor="#8A8DA0" accessibilityLabel="Tell Moi more about the look"
          style={{ flex: 1, fontFamily: F.medium, fontSize: 15, color: '#1D1D22', paddingVertical: 8, ...({ outlineStyle: 'none' } as object) }} />
        <Pressable onPress={send} accessibilityRole="button" accessibilityLabel="Send" style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#111114', alignItems: 'center', justifyContent: 'center', opacity: more.trim() ? 1 : 0.4 }}>
          <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="M12 19V5M6 11l6-6 6 6" stroke="#fff" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
        </Pressable>
      </View>}>
      <ScrollView contentContainerStyle={{ gap: 14 }}>
        {/* Their look */}
        <View style={[bubble, { alignSelf: 'flex-end', backgroundColor: '#111114' }]}>
          {session.lookPhoto ? <Image source={{ uri: session.lookPhoto }} style={{ width: 160, height: 160, borderRadius: 14 }} accessibilityLabel="Your inspiration" /> : null}
          <Text style={[T, { color: '#fff' }]}>{s.lookText || 'This look'}</Text>
        </View>
        {/* Moi's answer */}
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <Image source={crown} style={{ width: 30, height: 30, marginTop: 6 }} resizeMode="contain" />
          <View style={[bubble, { flex: 1, backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 0.5, borderColor: 'rgba(20,20,40,0.10)' }]}>
            <Text {...({ dataSet: { grad: 'title' } } as any)} style={{ fontFamily: SYS ?? F.bold, fontWeight: '700', fontSize: 20, lineHeight: 25, color: '#1D1D22' }}>You can achieve this look:</Text>
            {isMakeup && list.length ? (
              <View style={{ alignItems: 'center', gap: 8 }}>
                <ModelFace tone={pref(s, 'mk_tone')[0]} items={items} on={after} width={wide ? 280 : 230} />
                <View style={{ flexDirection: 'row', borderRadius: 999, backgroundColor: '#F1F1F4', padding: 3 }}>
                  {(['Without', 'With these'] as const).map(l => { const on = (l === 'With these') === after; return (
                    <Pressable key={l} onPress={() => setAfter(l === 'With these')} accessibilityRole="tab" accessibilityState={{ selected: on }} style={{ paddingHorizontal: 14, height: 30, borderRadius: 15, justifyContent: 'center', backgroundColor: on ? '#fff' : 'transparent' }}>
                      <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 13, color: on ? '#111114' : '#6C6A80' }}>{l}</Text>
                    </Pressable>); })}
                </View>
              </View>
            ) : null}
            {list.length ? list.map(({ step, pick }) => (
              <View key={pick.item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Bubble category={pick.item.category} item={pick.item} size={40} />
                <View style={{ flex: 1, gap: 1 }}>
                  <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 12, color: '#6C6A80' }}>{[step || CATEGORY_LABEL[pick.item.category], pick.match].filter(Boolean).join(' · ')}</Text>
                  <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 14, lineHeight: 19, color: '#1D1D22' }}>{pick.item.name}</Text>
                  {lookNote(pick.item, s) ? <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 12, lineHeight: 17, color: '#4A4858' }}>{lookNote(pick.item, s)}</Text> : null}
                </View>
                <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 14, color: '#1D1D22' }}>{pick.item.price != null ? money(pick.item.price) : ''}</Text>
              </View>
            )) : <Text style={T}>Tell me a little more, like the lip, eye or skin you want, and I’ll build it.</Text>}
            {total ? <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 14, color: '#1D1D22' }}>{`About ${money(Math.round(total))} for the full routine`}</Text> : null}
          </View>
        </View>
        {/* The ask */}
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <Image source={crown} style={{ width: 30, height: 30, marginTop: 6 }} resizeMode="contain" />
          <View style={[bubble, { flex: 1, backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 0.5, borderColor: 'rgba(20,20,40,0.10)' }]}>
            <Text style={T}>So I know what we’re working with, answer a few questions about your current routine. The more Moi knows, the better the answers.</Text>
            <Btn label="Answer a few questions" onPress={() => router.push('/routine/about')} />
          </View>
        </View>
      </ScrollView>
    </Shell>
  );
}
