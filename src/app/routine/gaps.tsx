import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { BLUE, Btn, ChipBtn, GapCard, Heading, money, NeedInfo, Pill, ProductCard, Shell, useWide, WhereToBuy } from '../../components/routine/Kit';
import { useAccess } from '../../lib/routine/access';
import { analyze, picksFor, type GapKind } from '../../lib/routine/gaps';
import { hasInfo, itemKey, setRoutine, useCatalog, useRoutine } from '../../lib/routine/model';
import { Text } from 'react-native';
import { F } from '../../theme';

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
    const plans = () => router.push('/routine/plans');
    return (
      <Shell active="gaps" step="3 of 3" footer={<Btn label="Claim your crown to see the fixes" onPress={plans} />}>
        <Heading title={gaps.length ? `${gaps.length} gap${gaps.length === 1 ? '' : 's'} for ${s.goals.join(' and ')}` : 'No gaps. Nice routine.'} sub="Unlock the fix for each gap and the products matched to your goals." />
        <View style={{ gap: 12, maxWidth: 720 }}>{gaps.map(g => <GapCard key={g.id} gap={g} onPress={plans} cta="Unlock fix" />)}</View>
      </Shell>
    );
  }

  const shown = gaps.filter(g => filter === 'all' || g.kind === filter);
  const goals = s.goals.join(' and ');
  const kinds = FILTERS.filter(f => f.key === 'all' || gaps.some(g => g.kind === f.key));
  return (
    <Shell active="gaps" step="3 of 3"
      footer={gaps.length ? <Btn label="Shop to fill these gaps" onPress={() => router.push('/routine/shop')} /> : <Btn kind="secondary" label="Edit my routine" onPress={() => router.push('/routine/build')} />}>
      <Heading title={gaps.length ? `${gaps.length} gap${gaps.length === 1 ? '' : 's'} for ${goals}` : 'No gaps. Nice routine.'}
        sub={`Routine fit ${score}. Judged against your goals, hair and the routines you entered.`} />
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
                  {p[0] ? (where === g.id ? <WhereToBuy item={p[0].item} /> : <ChipBtn label="Where to buy the top pick" onPress={() => setWhere(g.id)} />) : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </Shell>
  );
}
