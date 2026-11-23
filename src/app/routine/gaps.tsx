import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { BLUE, Btn, ChipBtn, GapCard, Heading, iconFor, InputsPanel, money, st, NeedInfo, Pill, ProductCard, Shell, useWide, WhereToBuy } from '../../components/routine/Kit';
import { GlassCard } from '../../components/routine/Glass';
import { useAccess } from '../../lib/routine/access';
import { analyze, KIND_COLOR, picksFor, type GapKind } from '../../lib/routine/gaps';
import { hasInfo, itemKey, setRoutine, useCatalog, useRoutine } from '../../lib/routine/model';
import { C, F } from '../../theme';

const FILTERS: { key: 'all' | GapKind; label: string }[] = [{ key: 'all', label: 'All' }, { key: 'step', label: 'Steps' }, { key: 'clash', label: 'Ingredients' }, { key: 'tool', label: 'Tools' }, { key: 'budget', label: 'Budget' }];

export default function Gaps() {
  const s = useRoutine();
  const cat = useCatalog();
  const wide = useWide();
  const params = useLocalSearchParams<{ g?: string }>();
  const { score, gaps } = useMemo(() => analyze(s, cat), [s, cat]);
  const [filter, setFilter] = useState<'all' | GapKind>('all');
  const [open, setOpen] = useState<string | undefined>(params.g);
  const [where, setWhere] = useState<string | undefined>();
  const access = useAccess();
  const toggleBag = (k: string) => setRoutine(r => ({ ...r, bag: r.bag.includes(k) ? r.bag.filter(x => x !== k) : [...r.bag, k] }));

  if (!hasInfo(s)) return <Shell active="gaps"><NeedInfo goals={s.goals.length > 0} /></Shell>;
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
  const goals = s.goals.join(' and ');
  const kinds = FILTERS.filter(f => f.key === 'all' || gaps.some(g => g.kind === f.key));
  return (
    <Shell active="gaps" step="3 of 3" side={wide ? <InputsPanel s={s} /> : undefined}
      footer={gaps.length ? <Btn label="Shop the fixes" onPress={() => router.push('/routine/shop')} /> : <Btn kind="secondary" label="Edit routine" onPress={() => router.push('/routine/build')} />}>
      <Heading title={gaps.length ? `${gaps.length} gap${gaps.length === 1 ? '' : 's'} for ${goals}` : 'No gaps. Nice routine.'}
        sub={`Routine fit ${score} of 100.`} />
      {kinds.length > 2 ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{kinds.map(f => <Pill key={f.key} label={f.label} on={filter === f.key} onPress={() => setFilter(f.key)} />)}</View> : null}
      <View style={{ gap: 12, maxWidth: 720 }}>
        {shown.map(g => {
          const p = picksFor(g, s, cat, 3);
          const priced = p.filter(x => x.item.price != null);
          const from = priced.length ? Math.min(...priced.map(x => x.item.price!)) : null;
          const isOpen = open === g.id;
          return (
            <View key={g.id} style={{ gap: 12 }}>
              <GapCard gap={g} selected={isOpen} onPress={() => setOpen(isOpen ? undefined : g.id)} cta={p.length ? (isOpen ? 'Hide picks' : 'See picks') : undefined} price={from != null ? `from about ${money(from)}` : undefined} />
              {isOpen ? (
                <View style={{ gap: 12, paddingLeft: wide ? 16 : 0 }}>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {p.map((x, i) => <ProductCard key={x.item.id} item={x.item} fit={x.fit} why={x.why} best={i === 0} inBag={s.bag.includes(itemKey(x.item))} onAdd={() => toggleBag(itemKey(x.item))} />)}
                    {wide && p.length < 3 ? Array.from({ length: 3 - p.length }).map((_, i) => <View key={i} style={{ flex: 1 }} />) : null}
                  </View>
                  {p[0] ? (where === g.id ? <WhereToBuy item={p[0].item} /> : <ChipBtn label="Where to buy" icon="store" onPress={() => setWhere(g.id)} />) : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </Shell>
  );
}
