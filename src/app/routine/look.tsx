import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Btn, Bubble, money, Shell, SYS, useWide } from '../../components/routine/Kit';
import { analyze, profileOf, rankPicks, tailoredBeauty, type Gap } from '../../lib/routine/gaps';
import { lookFromText, lookNote } from '../../lib/routine/looks';
import { BEAUTY_ROUTINES, CATEGORY_LABEL, pref, session, setRoutine, useCatalog, useRoutine, type Item, type RoutineState } from '../../lib/routine/model';
import { readLook } from '../../lib/routine/readLook';
import { F } from '../../theme';

const crown = require('../../../assets/crown-pink.png');

/** The steps a look needs (makeup: its face, eye and lip routines): the best product in budget for each, plus the next-best for swapping. */
function routineFor(s: RoutineState, cat: ReturnType<typeof useCatalog>) {
  const { score } = analyze(s, cat);
  const max = profileOf(s).budgetMax;
  const keep = (i: Item) => i.price == null || max > 999 || i.price <= max;
  const keys = BEAUTY_ROUTINES.filter(r => (s.areas ?? []).includes(r.area)).map(r => r.key);
  const steps = keys.flatMap(k => tailoredBeauty(s, k));
  const seen = new Set<string>();
  type Pick = ReturnType<typeof rankPicks>[number];
  const out: { step: string; pick: Pick; alts: Pick[] }[] = [];
  const used = new Set<string>();
  const add = (step: string, g: Gap) => {
    const all = rankPicks(g, s, cat, score, i => keep(i) && !used.has(i.id ?? ''), 5);
    if (!all.length) return;
    const chosen = all.find(p => p.item.id === s.lookPicks?.[step]) ?? all[0];
    used.add(chosen.item.id ?? '');
    out.push({ step, pick: chosen, alts: all.filter(p => p !== chosen).sort((x, y) => (y.look ?? 0) - (x.look ?? 0)).slice(0, 3) });
  };
  for (const st of steps) {
    const c = st.hint ?? '';
    if (!c || seen.has(`${c}:${st.label}`)) continue;
    seen.add(`${c}:${st.label}`);
    add(st.label, { id: `look_${c}_${st.label}`, kind: 'step', title: st.label, why: '', fills: [c], weight: 1 } as Gap);
  }
  // Hair (or anything without look steps): their gaps, best pick each.
  if (!out.length) for (const g of analyze(s, cat).gaps.slice(0, 5)) add(g.title, g);
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
  const [more, setMore] = useState('');
  const [swap, setSwap] = useState(false);
  const choose = (step: string, id?: string) => { if (id) setRoutine(r => ({ ...r, lookPicks: { ...(r.lookPicks ?? {}), [step]: id } })); };
  // Read their inspiration (photo, or the description) with Claude once per look.
  const [reading, setReading] = useState(false);
  const [note, setNote] = useState('');
  useEffect(() => {
    const key = session.lookPhoto ?? s.lookText ?? '';
    if (!key || session.lookReadFor === key) return;
    session.lookReadFor = key;
    const alive = true;
    setReading(true);
    readLook(session.lookPhoto, s.lookText).then(r => {
      if (!alive) return;
      setReading(false);
      if (!r.ok) {
        setNote(r.why === 'limit' ? `You’ve used today’s ${r.limit} photo reads, so Moi matched from your description. More tomorrow.` : r.why === 'none' && session.lookPhoto ? 'I couldn’t find a beauty look in that photo, so I matched from your description.' : '');
        return;
      }
      const L = r.look;
      setRoutine(x => ({
        ...x,
        lookRead: { name: L.name, area: L.area, summary: L.summary, steps: L.steps ?? [], hair_notes: L.hair_notes },
        lookText: x.lookText || L.name,
        areas: Array.from(new Set([...(x.areas ?? []), L.area])),
        prefs: { ...(x.prefs ?? {}), ...(L.face_look ? { mk_face_look: [L.face_look] } : {}), ...(L.eye_look ? { mk_eye_look: [L.eye_look] } : {}), ...(L.lip_look ? { mk_lip_look: [L.lip_look] } : {}) },
        goals: Array.from(new Set([...(x.goals ?? []), ...(L.hair_goals ?? [])])),
        lookPicks: {},
      }));
    }).catch(() => { if (alive) setReading(false); });
  }, [s.lookText]); // eslint-disable-line react-hooks/exhaustive-deps
  const tip = (category: string) => s.lookRead?.steps.find(x => x.category === category)?.how;
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
  const bubble = { maxWidth: 520, padding: 14, borderRadius: 20, gap: 9 };
  const T = { fontFamily: SYS ?? F.medium, fontSize: 14, lineHeight: 20, color: '#1D1D22' };

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
            <Text {...({ dataSet: { grad: 'title' } } as any)} style={{ fontFamily: SYS ?? F.bold, fontWeight: '700', fontSize: 17, lineHeight: 22, color: '#1D1D22' }}>You can achieve this look:</Text>
            {s.lookRead && !reading ? (
              <View style={{ gap: 2 }}>
                <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '700', fontSize: 14, color: '#1D1D22' }}>{s.lookRead.name}</Text>
                <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 13, lineHeight: 18, color: '#4A4858' }}>{s.lookRead.summary}</Text>
              </View>
            ) : null}
            {note ? <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 12, lineHeight: 17, color: '#6C6A80' }}>{note}</Text> : null}
            {reading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
                <ActivityIndicator color="#6C6A80" />
                <Text style={T}>{session.lookPhoto ? 'Reading your photo: colours, finishes and steps…' : 'Reading your look…'}</Text>
              </View>
            ) : list.length ? list.map(({ step, pick, alts }) => (
              <View key={step} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Bubble category={pick.item.category} item={pick.item} size={34} />
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 11, color: '#6C6A80' }}>{[step || CATEGORY_LABEL[pick.item.category], pick.match].filter(Boolean).join(' · ')}</Text>
                    <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 13, lineHeight: 17, color: '#1D1D22' }}>{pick.item.name}</Text>
                    {!swap && (tip(pick.item.category) ?? lookNote(pick.item, s)) ? <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 11, lineHeight: 15, color: '#4A4858' }}>{tip(pick.item.category) ?? lookNote(pick.item, s)}</Text> : null}
                  </View>
                  <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 13, color: '#1D1D22' }}>{pick.item.price != null ? money(pick.item.price) : ''}</Text>
                </View>
                {/* Substitutes: the next products most likely to give the look, best first; tap to swap. */}
                {swap && alts.length ? (
                  <View style={{ marginLeft: 44, gap: 4 }}>
                    {alts.map(a => (
                      <Pressable key={a.item.id} onPress={() => choose(step, a.item.id)} accessibilityRole="button" accessibilityLabel={`Use ${a.item.name} instead`}
                        style={({ hovered }: any) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 12, backgroundColor: hovered ? '#F1F1F4' : '#F7F7F9' })}>
                        <Bubble category={a.item.category} item={a.item} size={24} />
                        <Text numberOfLines={2} style={{ flex: 1, fontFamily: SYS ?? F.medium, fontSize: 12, lineHeight: 16, color: '#1D1D22' }}>{a.item.name}</Text>
                        {a.look != null ? <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 11, color: a.look >= 80 ? '#1E7B45' : '#6C6A80' }}>{`${a.look}% look match`}</Text> : null}
                        <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 12, color: '#6C6A80' }}>{a.item.price != null ? money(a.item.price) : ''}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            )) : <Text style={T}>Tell me a little more, like the lip, eye or skin you want, and I’ll build it.</Text>}
            {total && !reading ? <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 13, color: '#1D1D22' }}>{`About ${money(Math.round(total))} for the full routine`}</Text> : null}
            {!reading && list.some(x => x.alts.length) ? (
              <Pressable onPress={() => setSwap(v => !v)} accessibilityRole="button" hitSlop={6} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(20,20,40,0.14)', backgroundColor: '#fff' }}>
                <Svg width={14} height={14} viewBox="0 0 24 24"><Path d="M7 7h11l-3-3M17 17H6l3 3" stroke="#2A2F45" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
                <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 12, color: '#2A2F45' }}>{swap ? 'Done substituting' : 'Substitute recommended products'}</Text>
              </Pressable>
            ) : null}
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
