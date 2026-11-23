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
  const [editDays, setEditDays] = useState(false);
  const [open, setOpen] = useState<{ w: Where; id: string } | null>(null);
  const { score, gaps } = useMemo(() => analyze(s, cat), [s, cat]);

  // "Build me a new one": fill a routine with the best pick for every step their goals need.
  useEffect(() => {
    if (s.mode !== 'new' || s.built || !cat.products.length || !s.goals.length) return;
    const plan = buildNew(s, cat);
    const mk = (label: string, cat: string, item?: any): Step => ({ id: newStepId(), label, hint: cat, item });
    const wash = plan.filter(p => !['satin_pillowcase', 'bonnet', 'swim_cap', 'swim'].includes(p.g.fills[0]))
      .sort((a, b) => ORDER.indexOf(a.g.fills[0]) - ORDER.indexOf(b.g.fills[0]))
      .map(p => mk(p.g.title, p.g.fills[0]));
    const night = plan.find(p => ['satin_pillowcase', 'bonnet'].includes(p.g.fills[0]));
    setRoutine(r => ({ ...r, built: true, wash: wash.length ? wash : r.wash, every: night ? [mk('Night', night.g.fills[0])] : r.every }));
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
      <Pressable onPress={() => addStep(w)} style={({ hovered }: { pressed: boolean; hovered?: boolean }) => ({ marginLeft: 26, paddingHorizontal: 6, paddingVertical: 6, alignSelf: 'flex-start', borderRadius: 10, borderWidth: 1.5, borderColor: hovered ? C.ink : 'transparent', backgroundColor: hovered ? '#ECEDEF' : 'transparent' })}><Text style={{ fontFamily: F.semibold, fontSize: 15, color: BLUE }}>+ Add another step</Text></Pressable>
    </View>
  );

  const dayNames = s.washDays.map(i => DAYS[i]).join(', ') || 'none yet';
  const body = tab === 'Wash day' ? (
    <View style={{ gap: 20 }}>
      <Pressable onPress={() => setEditDays(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={st.meta}>{`Wash days: ${dayNames}`}</Text>
        <Text style={{ fontFamily: F.semibold, fontSize: 13, color: BLUE }}>{editDays ? 'Done' : 'Change'}</Text>
      </Pressable>
      {editDays ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {DAYS.map((d, i) => {
            const on = s.washDays.includes(i);
            return (
              <Pressable key={d} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => setRoutine(r => ({ ...r, washDays: on ? r.washDays.filter(x => x !== i) : [...r.washDays, i].sort() }))}
                style={({ hovered }: { pressed: boolean; hovered?: boolean }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: hovered ? (on ? '#3F72D9' : '#ECEDEF') : on ? BLUE : '#fff', borderWidth: 1.5, borderColor: hovered ? C.ink : on ? BLUE : '#E3E5E8' })}>
                <Text style={{ fontFamily: F.semibold, fontSize: 12, color: on ? '#fff' : C.gray2 }}>{d.slice(0, 2)}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
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

  return (
    <Shell active="build" step="2 of 3"
      footer={wide
        ? <><Text style={[st.meta, { flex: 1 }]}>{`Routine fit ${score} · ${gaps.length} gap${gaps.length === 1 ? '' : 's'} so far`}</Text><Btn label="See my gaps" onPress={() => router.push('/routine/gaps')} /></>
        : <Btn label={`See my gaps · fit ${score}`} onPress={() => router.push('/routine/gaps')} />}>
      <Heading title={s.mode === 'new' ? 'Your new routine' : 'Your routine'} sub={s.mode === 'new' ? 'These are the steps your goals need. Add what you use, or skip any step.' : 'Add products in the order you use them. Skip any step you don\u2019t do.'} />
      <View style={{ maxWidth: 420 }}><Segmented options={['Wash day', 'Everyday', 'Occasions']} value={tab} onChange={setTab} /></View>
      {s.mode === 'new' && !s.goals.length ? <Text style={st.sub}>Pick your goals first so we know what to build.</Text> : null}
      {body}
      <PickerSheet step={openStep} onClose={() => setOpen(null)}
        onPick={item => { edit(x => ({ ...x, item, skipped: false, label: x.label === 'New step' ? CATEGORY_LABEL[item.category] ?? x.label : x.label })); if (item.kind !== 'custom' || item.tags.length) setOpen(null); }}
        onRemove={() => (openStep?.item ? edit(x => ({ ...x, item: undefined })) : removeStep())}
        onRename={label => edit(x => ({ ...x, label }))}
        onSkip={() => { edit(x => ({ ...x, skipped: !x.skipped, item: x.skipped ? x.item : undefined })); setOpen(null); }} />
    </Shell>
  );
}
