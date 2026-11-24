import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { BLUE, Btn, ChipBtn, GapBall, GapCard, Heading, SYS, iconFor, InputsPanel, money, st, NeedInfo, Pill, PickBubble, Shell, useWide, WhereToBuy } from '../../components/routine/Kit';
import { icon3d } from '../../data/icons3d';
import { GlassCard } from '../../components/routine/Glass';
import { celebrate } from '../../components/routine/Celebrate';
import { useAccess } from '../../lib/routine/access';
import { analyze, gapArea, KIND_COLOR, picksFor, rankPicks, type Gap, type GapKind } from '../../lib/routine/gaps';
import { AREAS, hasInfo, hasInput, itemKey, setRoutine, useCatalog, useRoutine } from '../../lib/routine/model';
import { C, F } from '../../theme';

const FILTERS: { key: 'all' | GapKind; label: string }[] = [{ key: 'all', label: 'All' }, { key: 'step', label: 'Steps' }, { key: 'clash', label: 'Ingredients' }, { key: 'tool', label: 'Tools' }, { key: 'budget', label: 'Budget' }];

export default function Gaps() {
  const s = useRoutine();
  const cat = useCatalog();
  const wide = useWide();
  const params = useLocalSearchParams<{ g?: string }>();
  const { score, gaps: found } = useMemo(() => analyze(s, cat), [s, cat]);
  // No empty recommendations: a gap shows only if there is a product to fix it (clashes carry their own advice).
  const gaps = useMemo(() => found.filter(g => g.kind === 'clash' || picksFor(g, s, cat, 1).length > 0), [found, s, cat]);
  const [filter, setFilter] = useState<'all' | GapKind>('all');
  const [open, setOpen] = useState<string | undefined>(params.g);
  const [where, setWhere] = useState<string | undefined>();
  const access = useAccess();
  const toggleBag = (k: string) => { if (!s.bag.includes(k)) celebrate('Added to bag'); setBag(k); };
  const setBag = (k: string) => setRoutine(r => ({ ...r, bag: r.bag.includes(k) ? r.bag.filter(x => x !== k) : [...r.bag, k] }));

  if (!hasInfo(s)) return <Shell active="gaps"><NeedInfo goals={s.goals.length > 0} /></Shell>;
  if (!hasInput(s)) return <Shell active="gaps"><NeedInfo goals /></Shell>;
  // Paywall: the gaps themselves are shown, the fixes and product picks need a plan.
  if (!access.ok && !access.loading) {
    const top = [...gaps].sort((x, y) => y.weight - x.weight).slice(0, 3);
    return (
      <Shell glass active="gaps" step="3 of 3">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 24 }}>
          <GlassCard style={{ width: '100%', maxWidth: 420, alignItems: 'center', gap: 18, paddingVertical: 32, paddingHorizontal: 24 }}>
            {/* The top three gaps as overlapping circles, like a cover of the report. */}
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              {(top.length ? top : [null]).map((g, i) => (
                <View key={g?.id ?? i} style={{ width: 76, height: 76, borderRadius: 38, marginLeft: i ? -18 : 0, backgroundColor: '#fff', borderWidth: 3, borderColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', shadowColor: '#283050', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, zIndex: 3 - i }}>
                  <Image source={iconFor(g?.fills[0])} style={{ width: 52, height: 52 }} />
                </View>
              ))}
            </View>
            <Text style={{ fontFamily: F.display, fontSize: 32, lineHeight: 36, color: C.ink, textAlign: 'center' }}>{gaps.length ? `We found ${gaps.length} gap${gaps.length === 1 ? '' : 's'}` : 'No gaps found'}</Text>
            {top.length ? (
              <View style={{ alignSelf: 'stretch', gap: 10 }}>
                {top.map(g => (
                  <View key={g.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.6)' }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: KIND_COLOR[g.kind].fg }} />
                    <Text style={{ flex: 1, fontFamily: F.semibold, fontSize: 15, color: C.ink }}>{g.title}</Text>
                  </View>
                ))}
                {gaps.length > 3 ? <Text style={[st.meta, { textAlign: 'center' }]}>{`+${gaps.length - 3} more in your report`}</Text> : null}
              </View>
            ) : <Text style={[st.sub, { textAlign: 'center' }]}>Your routine covers your goals.</Text>}
            <Btn label="Save my routines" onPress={() => router.push('/routine/plans')} style={{ alignSelf: 'stretch' }} />
            <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={8}>
              <Text style={{ fontFamily: F.semibold, fontSize: 15, color: '#5B67C9' }}>Not now</Text>
            </Pressable>
          </GlassCard>
        </View>
      </Shell>
    );
  }

  const shown = gaps.filter(g => filter === 'all' || g.kind === filter);
  const groups = AREAS.filter(a => (s.areas ?? ['hair']).includes(a.key)).map(a => ({ ...a, gaps: shown.filter(g => gapArea(g) === a.key) })).filter(x => x.gaps.length);
  const area = (s.areas ?? ['hair'])[0] ?? 'hair';
  const goals = area === 'hair' && s.goals.length ? `for ${s.goals.join(' and ')}` : `in your ${area} routine`;
  const kinds = FILTERS.filter(f => f.key === 'all' || gaps.some(g => g.kind === f.key));
  return (
    <Shell active="gaps" step="3 of 3" side={wide ? <InputsPanel s={s} /> : undefined}
      footer={gaps.length ? <Btn label="Shop the fixes" onPress={() => router.push('/routine/shop')} /> : <Btn kind="secondary" label="Edit routine" onPress={() => router.push('/routine/build')} />}>
      {/* Big, bold system sans with tight tracking, as in the glass-ball reference. */}
      <View style={{ gap: 10 }}>
        <Text {...({ dataSet: { grad: 'title' } } as any)} style={{ fontFamily: SYS ?? F.bold, fontWeight: '700', fontSize: wide ? 32 : 26, lineHeight: wide ? 38 : 31, letterSpacing: -0.7, color: '#111114' }}>{gaps.length ? `${gaps.length} gap${gaps.length === 1 ? '' : 's'} ${goals}` : 'No gaps. Nice routine.'}</Text>
        <Text style={{ fontFamily: SYS ?? F.regular, fontWeight: '400', fontSize: 15, lineHeight: 21, color: '#6E6E78' }}>{`Fit ${score} of 100. Tap a gap for picks.`}</Text>
      </View>
      {kinds.length > 2 ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{kinds.map(f => <Pill key={f.key} label={f.label} on={filter === f.key} onPress={() => setFilter(f.key)} />)}</View> : null}
      <View style={{ gap: 28, maxWidth: 720 }}>
        {groups.map(grp => {
          const sel = grp.gaps.find(g => g.id === open);
          const p = sel ? rankPicks(sel, s, cat, score) : [];
          return (
            <View key={grp.key} style={{ gap: 14 }}>
              {groups.length > 1 ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 4 }}><Image source={icon3d(grp.icon)} style={{ width: 26, height: 26 }} /><Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 18, color: '#1D1D22', flex: 1 }}>{grp.label}</Text><Text style={{ fontFamily: SYS ?? F.medium, fontSize: 13, color: '#8A8A93' }}>{`${grp.gaps.length} gap${grp.gaps.length === 1 ? '' : 's'}`}</Text></View> : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                {grp.gaps.map(g => {
                  const pr = picksFor(g, s, cat, 3).filter(x => x.item.price != null);
                  const from = pr.length ? Math.min(...pr.map(x => x.item.price!)) : null;
                  return <GapBall key={g.id} gap={g} selected={open === g.id} onPress={() => setOpen(open === g.id ? undefined : g.id)} price={from != null ? `from ${money(from)}` : undefined} />;
                })}
              </View>
              {sel && p.length ? (
                <View style={{ gap: 12, padding: 16, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 0.5, borderColor: 'rgba(20,20,40,0.10)' }}>
                  <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 17, letterSpacing: -0.3, color: '#1D1D22' }}>{`Picks for ${sel.title.toLowerCase()}`}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    {p.map((x: any) => <PickBubble key={x.item.id} item={x.item} fit={x.fit} gain={x.gain} badge={x.badge} why={x.why} inBag={s.bag.includes(itemKey(x.item))} onAdd={() => toggleBag(itemKey(x.item))} />)}
                  </View>
                  {where === sel.id ? <WhereToBuy item={p[0].item} /> : <ChipBtn label="Where to buy" icon="store" onPress={() => setWhere(sel.id)} />}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </Shell>
  );
}
