import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { BLUE, Btn, GapCard, Heading, iconFor, Label, money, Pill, ProductCard, Shell, st, useWide, WhereToBuy } from '../../components/routine/Kit';
import { analyze, picksFor, type GapKind } from '../../lib/routine/gaps';
import { CATEGORY_LABEL, itemKey, setRoutine, useCatalog, useRoutine } from '../../lib/routine/model';
import { C, F } from '../../theme';

const FILTERS: { key: 'all' | GapKind; label: string }[] = [{ key: 'all', label: 'All' }, { key: 'step', label: 'Steps' }, { key: 'clash', label: 'Ingredients' }, { key: 'tool', label: 'Tools' }, { key: 'budget', label: 'Budget' }];

export default function Gaps() {
  const s = useRoutine();
  const cat = useCatalog();
  const wide = useWide();
  const params = useLocalSearchParams<{ g?: string }>();
  const { score, gaps } = useMemo(() => analyze(s, cat), [s, cat]);
  const [filter, setFilter] = useState<'all' | GapKind>('all');
  const [sel, setSel] = useState<string | undefined>(params.g);
  const shown = gaps.filter(g => filter === 'all' || g.kind === filter);
  const selected = gaps.find(g => g.id === sel) ?? (wide ? shown[0] : undefined);
  const picks = selected ? picksFor(selected, s, cat, 3) : [];
  const toggleBag = (k: string) => setRoutine(r => ({ ...r, bag: r.bag.includes(k) ? r.bag.filter(x => x !== k) : [...r.bag, k] }));
  const goals = s.goals.length ? s.goals.join(' and ') : 'your hair';
  const title = gaps.length ? `${gaps.length} gap${gaps.length === 1 ? '' : 's'} for ${goals}` : `No gaps for ${goals}`;
  const top = picks[0];

  const detail = top && selected ? (
    <View style={{ gap: 16 }}>
      <Label>{`Top pick for ${selected.title.toLowerCase()}`}</Label>
      <View style={{ height: 200, borderRadius: 24, backgroundColor: '#FFF8E8', alignItems: 'center', justifyContent: 'center' }}><Image source={iconFor(top.item.category)} style={{ width: 150, height: 150 }} /></View>
      <View style={{ alignSelf: 'flex-start', backgroundColor: '#E5F4EA', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}><Text style={{ fontFamily: F.semibold, fontSize: 12, color: '#1E7B45' }}>{top.fit}% match for you</Text></View>
      <View style={{ gap: 4 }}>
        <Text style={st.meta}>{top.item.brand || CATEGORY_LABEL[top.item.category]}</Text>
        <Text style={[st.h1, { fontSize: 24, lineHeight: 28 }]}>{top.item.name}</Text>
        {top.item.price ? <Text style={[st.meta, { color: C.gray2 }]}>{`About ${money(top.item.price)}`}</Text> : null}
      </View>
      <Label>Where to buy</Label>
      <WhereToBuy item={top.item} />
      <Btn label={s.bag.includes(itemKey(top.item)) ? 'In your bag ✓' : 'Add to bag'} onPress={() => toggleBag(itemKey(top.item))} />
      {picks.length > 1 ? <Pressable onPress={() => router.push('/routine/shop')}><Text style={{ fontFamily: F.semibold, color: BLUE, fontSize: 14, textAlign: 'center' }}>{`See ${picks.length - 1} more option${picks.length > 2 ? 's' : ''}`}</Text></Pressable> : null}
    </View>
  ) : selected ? <Text style={st.sub}>We don't have a pick for this yet. Our database is growing every day.</Text> : null;

  return (
    <Shell active="gaps" step="3 of 3" side={wide ? detail : undefined}
      footer={wide ? undefined : <Btn label={gaps.length ? 'Shop to fill these gaps' : 'Back to my routine'} onPress={() => router.push(gaps.length ? '/routine/shop' : '/routine/build')} />}>
      <Heading title={title} sub={gaps.length ? 'Judged against the goals, hair and routines you entered.' : 'Your routine covers everything your goals need.'}
        right={<View style={{ alignSelf: wide ? 'flex-end' : 'flex-start', backgroundColor: '#EAF1FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 }}><Text style={{ fontFamily: F.semibold, fontSize: 14, color: BLUE }}>{`Routine fit ${score}`}</Text></View>} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {FILTERS.map(f => { const n = f.key === 'all' ? gaps.length : gaps.filter(g => g.kind === f.key).length; return n || f.key === 'all' ? <Pill key={f.key} label={`${f.label} ${n}`} on={filter === f.key} onPress={() => setFilter(f.key)} /> : null; })}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {shown.map(g => {
          const p = picksFor(g, s, cat, 3);
          const from = p.length ? Math.min(...p.map(x => x.item.price ?? 999)) : 0;
          const open = !wide && sel === g.id;
          return (
            <View key={g.id} style={{ width: wide ? '48%' : '100%', flexGrow: wide ? 1 : 0, gap: 12 }}>
              <GapCard gap={g} selected={selected?.id === g.id && wide} onPress={() => setSel(open ? undefined : g.id)} cta={p.length ? (open ? 'Hide picks' : `See ${p.length} pick${p.length === 1 ? '' : 's'}`) : undefined} price={from && from < 999 ? `from about ${money(from)}` : undefined} />
              {open ? <View style={{ flexDirection: 'row', gap: 12 }}>{p.map((x, i) => <ProductCard key={x.item.id} item={x.item} fit={x.fit} best={i === 0} inBag={s.bag.includes(itemKey(x.item))} onAdd={() => toggleBag(itemKey(x.item))} />)}</View> : null}
            </View>
          );
        })}
      </View>
      {!gaps.length ? <Btn kind="secondary" label="Edit my routine" onPress={() => router.push('/routine/build')} /> : null}
    </Shell>
  );
}
