import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Btn, Heading, Label, Pill, Shell, st, useWide } from '../../components/routine/Kit';
import { GlassCard } from '../../components/routine/Glass';
import { icon3d } from '../../data/icons3d';
import { haptic } from '../../lib/haptics';
import { AREA_Q, AREAS, GOALS, HAIR_Q, pref, session, setRoutine, useRoutine, type Area } from '../../lib/routine/model';
import { fill } from '../../lib/routine/shine';
import { C, F } from '../../theme';

/**
 * Right after the welcome screen: which routines the person wants (hair, skin, makeup, body), then a few quick
 * questions for each one they pick. Next comes "check my routine or build a new one".
 */
export default function About() {
  const s = useRoutine();
  const wide = useWide();
  const areas = s.areas ?? [];
  const on = (a: Area) => areas.includes(a);
  // One routine type at a time: picking one replaces the other.
  const toggleArea = (a: Area) => { haptic('select'); setRoutine(r => ({ ...r, areas: on(a) ? [] : [a] })); };

  const [warn, setWarn] = useState(false);
  const group = (key: string, label: string, opts: string[], has: (o: string) => boolean, press: (o: string) => void) => (
    <View key={key} style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Label>{label}</Label>{warn && !opts.some(has) ? <Text style={{ fontFamily: F.semibold, fontSize: 12, color: '#B42318' }}>Pick one</Text> : null}</View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{opts.map(o => <Pill key={o} label={o} on={has(o)} onPress={() => press(o)} />)}</View>
    </View>
  );
  const setPref = (key: string, o: string, max = 1) => setRoutine(r => {
    const cur = r.prefs?.[key] ?? [];
    // "Nothing" stands alone: picking it clears the rest, picking anything else clears it.
    const rest = cur.filter(x => x !== 'Nothing');
    const next = cur.includes(o) ? cur.filter(x => x !== o) : o === 'Nothing' ? ['Nothing'] : max === 1 ? [o] : rest.length >= max ? rest : [...rest, o];
    return { ...r, prefs: { ...(r.prefs ?? {}), [key]: next } };
  });
  const toggleGoal = (g: string) => setRoutine(r => ({ ...r, goals: r.goals.includes(g) ? r.goals.filter(x => x !== g) : r.goals.length >= 3 ? r.goals : [...r.goals, g] }));
  const hairQ = (key: keyof typeof s.hair, label: string, opts: string[]) => group(`h_${key}`, label, opts, o => s.hair[key] === o, o => setRoutine(r => ({ ...r, hair: { ...r.hair, [key]: r.hair[key] === o ? undefined : o } })));

  const section = (a: (typeof AREAS)[number]) => (
    <GlassCard solid key={a.key} style={{ gap: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Image source={icon3d(a.icon)} style={{ width: 30, height: 30 }} />
        <Text style={{ fontFamily: F.semibold, fontSize: 17, color: C.ink }}>{a.label}</Text>
      </View>
      {a.key === 'hair' ? (
        <>
          {group('goals', 'Goals · up to 3', GOALS, o => s.goals.includes(o), toggleGoal)}
          {HAIR_Q.filter(q => q.key !== 'budget').map(q => hairQ(q.key, q.label, q.options))}
        </>
      ) : AREA_Q.filter(q => q.area === a.key).map(q => group(q.key, q.label, q.options, o => pref(s, q.key).includes(o), o => setPref(q.key, o, q.max ?? 1)))}
    </GlassCard>
  );

  const budget = HAIR_Q.find(q => q.key === 'budget')!;
  // Every section needs at least one answer.
  const missing = !areas.length ? ['Routine type'] : [
    ...(on('hair') ? [...(s.goals.length ? [] : ['Goals']), ...HAIR_Q.filter(q => q.key !== 'budget' && !s.hair[q.key]).map(q => q.label)] : []),
    ...AREA_Q.filter(q => on(q.area) && !pref(s, q.key).length).map(q => q.label.replace(/ · .*/, '')),
    ...(s.hair.budget ? [] : ['Monthly budget']),
  ];
  const ready = missing.length === 0;
  const next = () => {
    if (!ready) { haptic('select'); setWarn(true); return; }
    // Came from a look: they're telling Moi their current routine, so skip the choice and go add what they use.
    if (s.lookText) {
      session.chose = true;
      setRoutine(r => ({ ...r, started: true, mode: 'check' }));
      router.push({ pathname: '/routine/build', params: { area: (s.areas ?? ['hair'])[0] ?? 'hair' } });
      return;
    }
    setRoutine(r => ({ ...r, started: true })); router.push('/routine');
  };
  const label = 'Next';

  return (
    <Shell glass active="goals" step="1 of 3" hideNav={!wide && !s.started} footer={<View style={{ gap: 8, width: wide ? undefined : '100%', alignItems: wide ? 'flex-end' : 'stretch' }}>
        {warn && !ready ? <View accessibilityRole="alert" style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#FEF3F2', borderWidth: 1, borderColor: '#FECDCA', maxWidth: 520 }}><Text style={{ fontFamily: F.semibold, fontSize: 13, color: '#B42318', flexShrink: 1 }}>{`Answer every section to continue: ${missing.join(', ')}.`}</Text></View> : null}
        <Btn label={label} onPress={next} glow={ready} />
      </View>}>
      <GlassCard solid style={{ gap: 18, maxWidth: 800 }}>
      <Heading title="Make a routine for" sub="Pick one. Then a few quick questions." />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {AREAS.map(a => {
          const sel = on(a.key);
          return (
            <Pressable key={a.key} {...fill(sel ? 'pearl-on' : 'pearl')} onPress={() => toggleArea(a.key)} accessibilityRole="radio" accessibilityState={{ checked: sel }} accessibilityLabel={`${a.label} routine`}
              style={({ hovered }: { hovered?: boolean }) => ({ width: wide ? 172 : '47%', flexGrow: wide ? 0 : 1, borderRadius: 22, paddingVertical: 18, paddingHorizontal: 16, gap: 10, alignItems: 'center', backgroundColor: '#fff', borderWidth: 2, borderColor: sel ? '#6E7BD9' : hovered ? '#C9CEF0' : 'transparent' })}>
              <View style={{ position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: sel ? '#6E7BD9' : '#D5D8DE', backgroundColor: sel ? '#6E7BD9' : '#fff', alignItems: 'center', justifyContent: 'center' }}>
                {sel ? <Text style={{ color: '#fff', fontSize: 12, fontFamily: F.semibold, lineHeight: 14 }}>{'✓'}</Text> : null}
              </View>
              <Image source={icon3d(a.icon)} style={{ width: 56, height: 56 }} />
              <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>{a.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {!areas.length ? <Text style={st.sub}>Tap one to start.</Text> : null}
      </GlassCard>
      {AREAS.filter(a => on(a.key)).map(section)}
      {areas.length ? <GlassCard solid style={{ gap: 12 }}>{group('budget', 'Monthly budget', budget.options, o => s.hair.budget === o, o => setRoutine(r => ({ ...r, hair: { ...r.hair, budget: r.hair.budget === o ? undefined : o } })))}</GlassCard> : null}
    </Shell>
  );
}
