import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { BLUE, Btn, Heading, iconFor, Label, PickerSheet, Pill, ScoreBar, Segmented, Shell, st, Timeline, useWide } from '../../components/routine/Kit';
import { icon3d } from '../../data/icons3d';
import { analyze, buildNew, KIND_COLOR, KIND_LABEL } from '../../lib/routine/gaps';
import { CATEGORY_LABEL, DAYS, defaultOccasion, newStepId, OCCASION_ICON, OCCASIONS, setRoutine, useCatalog, useRoutine, type RoutineState, type Step } from '../../lib/routine/model';
import { C, F } from '../../theme';

type Where = { list: 'wash' | 'every' } | { list: 'occ'; occ: string };
const ORDER = ['pre_wash', 'shampoo', 'clarifying', 'anti_dandruff', 'swim', 'bond_builder', 'conditioner', 'deep_conditioner', 'leave_in', 'heat_protectant', 'styler', 'oil', 'scalp_treatment'];

function update(s: RoutineState, w: Where, fn: (steps: Step[]) => Step[]): RoutineState {
  if (w.list === 'occ') return { ...s, occ: { ...s.occ, [w.occ]: fn(s.occ[w.occ] ?? defaultOccasion(w.occ)) } };
  return { ...s, [w.list]: fn(s[w.list]) };
}

export default function Build() {
  const s = useRoutine();
  const cat = useCatalog();
  const wide = useWide();
  const [tab, setTab] = useState('Wash day');
  const [open, setOpen] = useState<{ w: Where; id: string } | null>(null);
  const { score, gaps } = useMemo(() => analyze(s, cat), [s, cat]);

  // "Build me a new one": fill a routine with the best pick for every step their goals need.
  useEffect(() => {
    if (s.mode !== 'new' || s.built || !cat.products.length || !s.goals.length) return;
    const plan = buildNew(s, cat);
    const mk = (label: string, cat: string, item?: any): Step => ({ id: newStepId(), label, hint: cat, item });
    const wash = plan.filter(p => !['satin_pillowcase', 'bonnet', 'swim_cap', 'swim'].includes(p.g.fills[0]))
      .sort((a, b) => ORDER.indexOf(a.g.fills[0]) - ORDER.indexOf(b.g.fills[0]))
      .map(p => mk(p.g.title, p.g.fills[0], p.item));
    const night = plan.find(p => ['satin_pillowcase', 'bonnet'].includes(p.g.fills[0]));
    setRoutine(r => ({ ...r, built: true, wash: wash.length ? wash : r.wash, every: night ? [mk('Night', night.g.fills[0], night.item)] : r.every }));
  }, [s.mode, s.built, cat, s.goals.length]);

  const openStep = open ? (open.w.list === 'occ' ? (s.occ[open.w.occ] ?? []) : s[open.w.list]).find(x => x.id === open.id) ?? null : null;
  const edit = (fn: (st: Step) => Step) => open && setRoutine(r => update(r, open.w, steps => steps.map(x => (x.id === open.id ? fn(x) : x))));
  const addStep = (w: Where) => {
    const st: Step = { id: newStepId(), label: 'New step', hint: 'leave_in' };
    setRoutine(r => update(r, w, steps => [...steps, st]));
    setOpen({ w, id: st.id });
  };
  const removeStep = () => { if (!open) return; const o = open; setOpen(null); setRoutine(r => update(r, o.w, steps => steps.filter(x => x.id !== o.id))); };

  const list = (w: Where, steps: Step[]) => (
    <View style={{ gap: 4 }}>
      <Timeline steps={steps} onOpen={x => setOpen({ w, id: x.id })} />
      <Pressable onPress={() => addStep(w)} style={{ paddingLeft: 32, paddingVertical: 6 }}><Text style={{ fontFamily: F.semibold, fontSize: 15, color: BLUE }}>+ Add another step</Text></Pressable>
    </View>
  );

  const body = tab === 'Wash day' ? (
    <View style={{ gap: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: wide ? 8 : 0, justifyContent: wide ? 'flex-start' : 'space-between' }}>
        {DAYS.map((d, i) => {
          const on = s.washDays.includes(i);
          return (
            <Pressable key={d} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => setRoutine(r => ({ ...r, washDays: on ? r.washDays.filter(x => x !== i) : [...r.washDays, i].sort() }))}
              style={{ width: 44, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: on ? '#EAF1FF' : 'transparent' }}>
              <Text style={{ fontFamily: on ? F.semibold : F.medium, fontSize: 13, color: on ? BLUE : C.gray }}>{d}</Text>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: on ? BLUE : '#D9DDE2' }} />
            </Pressable>
          );
        })}
      </View>
      <Label>{`${s.washDays.length} wash day${s.washDays.length === 1 ? '' : 's'} a week · ${s.wash.length} steps`}</Label>
      {list({ list: 'wash' }, s.wash)}
    </View>
  ) : tab === 'Everyday' ? (
    <View style={{ gap: 20 }}><Label>Between washes</Label>{list({ list: 'every' }, s.every)}</View>
  ) : (
    <View style={{ gap: 28 }}>
      <View style={{ gap: 12 }}>
        <Label>Add an occasion</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {OCCASIONS.map(o => <Pill key={o} label={o} on={s.occasions.includes(o)} onPress={() => setRoutine(r => r.occasions.includes(o) ? { ...r, occasions: r.occasions.filter(x => x !== o) } : { ...r, occasions: [...r.occasions, o], occ: { ...r.occ, [o]: r.occ[o] ?? defaultOccasion(o) } })} />)}
        </View>
      </View>
      {s.occasions.length === 0 ? <Text style={st.sub}>Pick the moments that are hard on your hair, like swimming or sleep. Each gets its own short routine.</Text> : null}
      {s.occasions.map(o => (
        <View key={o} style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Image source={icon3d(OCCASION_ICON[o] ?? 'drop')} style={{ width: 36, height: 36 }} /></View>
            <Text style={{ fontFamily: F.semibold, fontSize: 17, color: C.ink }}>{o}</Text>
          </View>
          {list({ list: 'occ', occ: o }, s.occ[o] ?? [])}
        </View>
      ))}
    </View>
  );

  const live = (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={{ fontFamily: F.bold, fontSize: 40, color: C.ink }}>{score}</Text>
        <View><Text style={st.meta}>Routine fit</Text><Text style={[st.meta, { fontFamily: F.regular }]}>Updates as you add</Text></View>
      </View>
      <ScoreBar score={score} />
      <Label>{gaps.length ? `${gaps.length} gap${gaps.length === 1 ? '' : 's'} so far` : 'No gaps. Nice routine.'}</Label>
      {gaps.slice(0, 6).map(g => (
        <Pressable key={g.id} onPress={() => router.push({ pathname: '/routine/gaps', params: { g: g.id } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: KIND_COLOR[g.kind].bg, alignItems: 'center', justifyContent: 'center' }}><Image source={iconFor(g.fills[0])} style={{ width: 32, height: 32 }} /></View>
          <View style={{ flex: 1 }}><Text style={{ fontFamily: F.semibold, fontSize: 12, color: KIND_COLOR[g.kind].fg }}>{KIND_LABEL[g.kind]}</Text><Text style={st.cardTitle}>{g.title}</Text></View>
        </Pressable>
      ))}
      <Btn label="See full gap report" onPress={() => router.push('/routine/gaps')} />
    </View>
  );

  const summary = `Wash day ${s.wash.filter(x => x.item).length} · Everyday ${s.every.filter(x => x.item).length} · Occasions ${s.occasions.length}`;
  return (
    <Shell active="build" step="2 of 3" side={wide ? live : undefined}
      footer={wide ? undefined : <><Btn label={`See my gaps · fit ${score}`} onPress={() => router.push('/routine/gaps')} /><Text style={[st.meta, { textAlign: 'center', fontSize: 12 }]}>{summary}</Text></>}>
      <Heading title={s.mode === 'new' ? 'Your new routine' : 'Your routine'} sub={s.mode === 'new' ? 'We picked a product for every step your goals need. Tap a step to swap it.' : 'Add each product in the order you use it. Leave a step empty if you skip it.'}
        right={wide ? <View style={{ width: 380 }}><Segmented options={['Wash day', 'Everyday', 'Occasions']} value={tab} onChange={setTab} /></View> : undefined} />
      {!wide ? <Segmented options={['Wash day', 'Everyday', 'Occasions']} value={tab} onChange={setTab} /> : null}
      {s.mode === 'new' && !s.goals.length ? <Text style={st.sub}>Pick your goals first so we know what to build.</Text> : null}
      {body}
      <PickerSheet step={openStep} onClose={() => setOpen(null)}
        onPick={item => { edit(x => ({ ...x, item, label: x.label === 'New step' ? CATEGORY_LABEL[item.category] ?? x.label : x.label })); setOpen(null); }}
        onRemove={() => (openStep?.item ? edit(x => ({ ...x, item: undefined })) : removeStep())}
        onRename={label => edit(x => ({ ...x, label }))} />
    </Shell>
  );
}
