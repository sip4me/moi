import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { BLUE, Btn, ChipBtn, Heading, InputsPanel, LivePanel, PlusDot, iconFor, Label, PickerSheet, Pill, ScoreBar, Segmented, Shell, st, Timeline, useWide } from '../../components/routine/Kit';
import { icon3d } from '../../data/icons3d';
import { analyze, buildNew, KIND_COLOR, KIND_LABEL } from '../../lib/routine/gaps';
import { AREAS, BEAUTY_ROUTINES, CATEGORY_LABEL, DAYS, defaultBeauty, defaultOccasion, newStepId, OCCASION_ICON, OCCASIONS, setRoutine, useCatalog, useRoutine, type RoutineState, type Step } from '../../lib/routine/model';
import { C, F } from '../../theme';

type Where = { list: 'wash' | 'every' } | { list: 'occ'; occ: string } | { list: 'beauty'; key: string };
const ORDER = ['pre_wash', 'shampoo', 'clarifying', 'anti_dandruff', 'swim', 'bond_builder', 'conditioner', 'deep_conditioner', 'leave_in', 'heat_protectant', 'styler', 'oil', 'scalp_treatment'];

const keyOf = (w: Where) => (w.list === 'occ' ? `occ:${w.occ}` : w.list === 'beauty' ? `b:${w.key}` : w.list);

/** Changing a routine reopens it, so it has to be submitted again. */
function update(s: RoutineState, w: Where, fn: (steps: Step[]) => Step[]): RoutineState {
  const submitted = { ...(s.submitted ?? {}), [keyOf(w)]: false };
  if (w.list === 'occ') return { ...s, submitted, occ: { ...s.occ, [w.occ]: fn(s.occ[w.occ] ?? defaultOccasion(w.occ)) } };
  if (w.list === 'beauty') return { ...s, submitted, beauty: { ...(s.beauty ?? {}), [w.key]: fn(s.beauty?.[w.key] ?? defaultBeauty(w.key)) } };
  return { ...s, submitted, [w.list]: fn(s[w.list]) };
}

export default function Build() {
  const s = useRoutine();
  const cat = useCatalog();
  const wide = useWide();
  const [tab, setTab] = useState('Wash day');
  const areas = s.areas ?? ['hair'];
  const param = useLocalSearchParams<{ area?: string }>().area;
  const [areaTab, setAreaTab] = useState<string>(param ?? areas[0] ?? 'hair');
  useEffect(() => { if (param) setAreaTab(param); }, [param]);
  const area = areas.includes(areaTab as any) ? areaTab : areas[0] ?? 'hair';
  const routinesOf = (a: string) => BEAUTY_ROUTINES.filter(r => r.area === a);
  const [btab, setBtab] = useState<Record<string, string>>({});
  const [editDays, setEditDays] = useState(false);
  const [open, setOpen] = useState<{ w: Where; id: string } | null>(null);
  const { score, gaps } = useMemo(() => analyze(s, cat), [s, cat]);

  // "Build me a new one": fill a routine with the best pick for every step their goals need.
  useEffect(() => {
    if (s.mode !== 'new' || s.built || !cat.products.length || !s.goals.length || !areas.includes('hair')) return;
    const plan = buildNew(s, cat);
    const mk = (label: string, cat: string, item?: any): Step => ({ id: newStepId(), label, hint: cat, item });
    const wash = plan.filter(p => !['satin_pillowcase', 'bonnet', 'swim_cap', 'swim'].includes(p.g.fills[0]))
      .sort((a, b) => ORDER.indexOf(a.g.fills[0]) - ORDER.indexOf(b.g.fills[0]))
      .map(p => mk(p.g.title, p.g.fills[0]));
    const night = plan.find(p => ['satin_pillowcase', 'bonnet'].includes(p.g.fills[0]));
    setRoutine(r => ({ ...r, built: true, wash: wash.length ? wash : r.wash, every: night ? [mk('Night', night.g.fills[0])] : r.every }));
  }, [s.mode, s.built, cat, s.goals.length]);

  const stepsAt = (w: Where): Step[] => (w.list === 'occ' ? (s.occ[w.occ] ?? []) : w.list === 'beauty' ? (s.beauty?.[w.key] ?? []) : s[w.list]);
  const openStep = open ? stepsAt(open.w).find(x => x.id === open.id) ?? null : null;
  const edit = (fn: (st: Step) => Step) => open && setRoutine(r => update(r, open.w, steps => steps.map(x => (x.id === open.id ? fn(x) : x))));
  const addStep = (w: Where) => {
    const st: Step = { id: newStepId(), label: 'New step', hint: w.list === 'beauty' ? (defaultBeauty(w.key)[0]?.hint ?? 'moisturizer') : 'leave_in' };
    setRoutine(r => update(r, w, steps => [...steps, st]));
    setOpen({ w, id: st.id });
  };
  const removeStep = () => { if (!open) return; const o = open; setOpen(null); setRoutine(r => update(r, o.w, steps => steps.filter(x => x.id !== o.id))); };

  const list = (w: Where, steps: Step[]) => (
    <Timeline steps={steps} onOpen={x => setOpen({ w, id: x.id })} submitted={!!s.submitted?.[keyOf(w)]}
      onSubmit={() => setRoutine(r => ({ ...r, submitted: { ...(r.submitted ?? {}), [keyOf(w)]: true } }))}
      extra={<View style={{ paddingBottom: 12 }}><Pressable onPress={() => addStep(w)} style={({ hovered }: { pressed: boolean; hovered?: boolean }) => ({ marginLeft: 26, paddingHorizontal: 6, paddingVertical: 6, alignSelf: 'flex-start', borderRadius: 10, borderWidth: 1.5, borderColor: hovered ? '#7E3A4C' : 'transparent', backgroundColor: hovered ? '#F6E7E6' : 'transparent' })}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><PlusDot size={28} /><Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>Add another step</Text></View></Pressable></View>} />
  );

  const dayNames = s.washDays.map(i => DAYS[i]).join(', ') || 'none yet';
  const rs = routinesOf(area);
  const rkey = btab[area] && rs.some(r => r.key === btab[area]) ? btab[area] : rs[0]?.key;
  const beautyBody = rkey ? (
    <View style={{ gap: 20 }}>
      {rs.length > 1 ? <View style={{ maxWidth: 420 }}><Segmented options={rs.map(r => r.label)} value={rs.find(r => r.key === rkey)!.label} onChange={l => setBtab(b => ({ ...b, [area]: rs.find(r => r.label === l)!.key }))} /></View> : null}
      {list({ list: 'beauty', key: rkey }, s.beauty?.[rkey] ?? defaultBeauty(rkey))}
    </View>
  ) : null;
  const hairBody = tab === 'Wash day' ? (
    <View style={{ gap: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={[st.meta, { flex: 1, fontSize: 14, color: C.gray2 }]}>{`Wash days: ${dayNames}`}</Text>
        <ChipBtn label={editDays ? 'Done' : 'Change days'} tone={editDays ? 'dark' : 'default'} icon={editDays ? 'check' : 'calendar'} iconOnly={editDays} onPress={() => setEditDays(v => !v)} />
      </View>
      {editDays ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {DAYS.map((d, i) => {
            const on = s.washDays.includes(i);
            return (
              <Pressable key={d} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => setRoutine(r => ({ ...r, washDays: on ? r.washDays.filter(x => x !== i) : [...r.washDays, i].sort() }))}
                style={({ hovered }: { pressed: boolean; hovered?: boolean }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: hovered ? (on ? '#3F72D9' : '#ECEDEF') : on ? BLUE : '#fff', borderWidth: 1.5, borderColor: hovered ? '#7E3A4C' : on ? BLUE : '#E3E5E8' })}>
                <Text style={{ fontFamily: F.semibold, fontSize: 12, color: on ? '#fff' : C.gray2 }}>{d.slice(0, 2)}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <View style={{ height: 1, backgroundColor: '#E6E8EB' }} accessibilityElementsHidden importantForAccessibility="no" />
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
      {s.occasions.length === 0 ? <Text style={st.sub}>Add moments that are hard on hair, like swimming or sleep.</Text> : null}
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
  const body = area === 'hair' ? hairBody : beautyBody;
  const idx = Math.max(0, areas.indexOf(area as any));
  const nextArea = areas[idx + 1];
  const areaLabel = (a: string) => AREAS.find(x => x.key === a)?.label ?? a;

  return (
    <Shell active="build" step={areas.length > 1 ? `Routine ${idx + 1} of ${areas.length}` : '2 of 3'} side={wide ? <View style={{ gap: 28 }}><LivePanel score={score} gaps={gaps} onOpen={() => router.push('/routine/gaps')} /><View style={{ height: 1, backgroundColor: '#EEF0F3' }} /><InputsPanel s={s} /></View> : undefined}
      footer={<Btn label={nextArea ? `Next: ${areaLabel(nextArea).toLowerCase()} routine` : wide ? 'See my gaps' : `See my gaps · fit ${score}`} onPress={() => (nextArea ? router.push({ pathname: '/routine/build', params: { area: nextArea } }) : router.push('/routine/gaps'))} />}>
      <Heading title={`${s.mode === 'new' ? 'Your new' : 'Your'} ${area === 'hair' ? 'hair' : areaLabel(area).toLowerCase()} routine`} sub={s.mode === 'new' ? 'Steps your answers need. Add or skip each.' : 'Add what you use, in order. Skip any step.'} />
      {areas.length > 1 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {AREAS.filter(x => areas.includes(x.key)).map(x => <Pill key={x.key} label={x.label} on={area === x.key} onPress={() => router.setParams({ area: x.key })} />)}
        </View>
      ) : null}
      {area === 'hair' ? <View style={{ maxWidth: 420 }}><Segmented options={['Wash day', 'Everyday', 'Occasions']} value={tab} onChange={setTab} /></View> : null}
      {s.mode === 'new' && areas.includes('hair') && !s.goals.length ? <Text style={st.sub}>Pick your goals first.</Text> : null}
      {body}
      <PickerSheet step={openStep} onClose={() => setOpen(null)}
        onPick={item => { edit(x => ({ ...x, item: { ...item, addedAt: Date.now() }, skipped: false, label: x.label === 'New step' ? CATEGORY_LABEL[item.category] ?? x.label : x.label })); if (item.kind !== 'custom' || item.tags.length) setOpen(null); }}
        onRemove={() => (openStep?.item ? edit(x => ({ ...x, item: undefined })) : removeStep())}
        onRename={label => edit(x => ({ ...x, label }))}
        onSkip={() => { edit(x => ({ ...x, skipped: !x.skipped, item: x.skipped ? x.item : undefined })); setOpen(null); }} />
    </Shell>
  );
}
