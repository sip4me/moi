import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { celebrate } from '../../components/routine/Celebrate';
import { ChromeButton, ChromeKey, LabelValue, SILVER, SilverCard } from '../../components/routine/Chrome';
import { Bubble, money, NeedInfo, ScoreBar, Shell, SYS, useWide } from '../../components/routine/Kit';
import { HAS_AFFILIATE, storeLinks } from '../../lib/routine/affiliate';
import { analyze } from '../../lib/routine/gaps';
import { AREA_Q, AREAS, findByKey, GOALS, hasInfo, HAIR_Q, itemKey, placeItems, pref, setRoutine, useCatalog, useRoutine, type Item } from '../../lib/routine/model';
import { fill } from '../../lib/routine/shine';
import { F } from '../../theme';

// "Your picks": Moi is not a store, so there is no checkout here. Each pick hands the shopper to the store (with
// Moi's affiliate tag once set): one clear "Buy at Amazon" key and quieter links for the others. Moi's own job stays
// here: the fit gain, saving picks to the routine, and asking "Did you buy it?" after a store was opened.

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
};

export default function Picks() {
  const s = useRoutine();
  const cat = useCatalog();
  const wide = useWide();
  const bag = s.bag.map(k => findByKey(cat, k)).filter((i): i is Item => !!i);
  const { score } = useMemo(() => analyze(s, cat), [s, cat]);
  const after = useMemo(() => analyze(s, cat, bag).score, [s, cat, bag.length]);

  if (!hasInfo(s)) return <Shell active="shop"><NeedInfo goals={s.goals.length > 0} /></Shell>;

  const area = (s.areas ?? ['hair'])[0] ?? 'hair';
  const areaLabel = AREAS.find(a => a.key === area)?.label ?? 'Hair';
  const answers = (area === 'hair'
    ? [...s.goals.filter(g => GOALS.includes(g)), ...HAIR_Q.filter(q => q.key !== 'budget').map(q => s.hair[q.key])]
    : AREA_Q.filter(q => q.area === area).flatMap(q => pref(s, q.key))
  ).concat(s.hair.budget ?? '').filter(v => v && v !== 'Nothing').join(' · ');

  const open = (i: Item, store: string, url: string) => {
    setRoutine(r => ({ ...r, opened: { ...(r.opened ?? {}), [itemKey(i)]: { store, at: Date.now() } } }));
    Linking.openURL(url);
  };
  const remove = (i: Item) => setRoutine(r => {
    const k = itemKey(i); const { [k]: _, ...opened } = r.opened ?? {};
    return { ...r, bag: r.bag.filter(x => x !== k), opened };
  });
  const bought = (i: Item) => {
    setRoutine(r => { const k = itemKey(i); const { [k]: _, ...opened } = r.opened ?? {}; return { ...placeItems(r, [i]), bag: r.bag.filter(x => x !== k), opened }; });
    celebrate('Added to your routine');
  };
  const saveAll = () => {
    setRoutine(r => ({ ...placeItems(r, bag), bag: [], opened: {} }));
    router.replace({ pathname: '/routine/done', params: { from: String(score), to: String(after), n: String(bag.length), buy: 'save' } });
  };

  const summary = (
    <SilverCard>
      <LabelValue label="Fit with these" value={`${score} → ${after}`} big />
      <ScoreBar score={score} after={after} />
    </SilverCard>
  );

  return (
    <Shell silver active="shop" side={wide ? <View style={{ paddingTop: 64 }}>{summary}</View> : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/routine/shop'))} accessibilityRole="button" accessibilityLabel="Back" hitSlop={10}
          style={({ hovered }: any) => ({ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: hovered ? 'rgba(255,255,255,0.5)' : 'transparent' })}>
          <Svg width={10} height={16} viewBox="0 0 10 16"><Path d="M8 2 2 8l6 6" stroke={SILVER.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>
        </Pressable>
        <Text {...({ dataSet: { grad: 'title' } } as any)} style={{ fontFamily: SYS ?? F.medium, fontWeight: '700', fontSize: wide ? 32 : 26, lineHeight: wide ? 38 : 31, letterSpacing: -0.7, color: SILVER.ink }}>Your picks</Text>
      </View>

      <View style={{ maxWidth: 600, gap: 18 }}>
        {bag.map(i => {
          const links = storeLinks(i);
          const main = links[0];
          const op = s.opened?.[itemKey(i)];
          return (
            <SilverCard key={itemKey(i)} style={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Bubble category={i.category} size={52} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 16, lineHeight: 21, color: SILVER.ink }}>{i.name}</Text>
                  <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 13, color: SILVER.label }}>{i.price != null ? `about ${money(i.price)}` : i.brand}</Text>
                </View>
                <Pressable onPress={() => remove(i)} accessibilityRole="button" accessibilityLabel={`Remove ${i.name}`} hitSlop={8}
                  style={({ hovered }: any) => ({ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: hovered ? '#FDE4E1' : 'transparent' })}>
                  <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M4 7h16M9 7V4.8h6V7M6.5 7l1 12.2h9l1-12.2M10 11v5.5M14 11v5.5" stroke="#D92D20" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
                </Pressable>
              </View>

              {op ? (
                // After a store was opened: did they buy it? Yes puts it in their routine.
                <View style={{ gap: 10 }}>
                  <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 13, color: SILVER.label }}>{`Opened at ${op.store} · ${ago(op.at)}. Did you buy it?`}</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <ChromeKey onPress={() => bought(i)} a11y="Yes, I bought it" style={{ minHeight: 44 }}><Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 15, color: SILVER.ink }}>Yes, add it</Text></ChromeKey>
                    <ChromeKey onPress={() => open(i, main.name, main.url)} a11y={`Open ${main.name} again`} style={{ minHeight: 44 }}><Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 15, color: '#6E6E6E' }}>Not yet</Text></ChromeKey>
                  </View>
                </View>
              ) : (
                <ChromeKey onPress={() => open(i, main.name, main.url)} a11y={`Buy at ${main.name}`} style={{ minHeight: 50 }}>
                  <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 16, color: SILVER.ink }}>{`Buy at ${main.name} ↗`}</Text>
                </ChromeKey>
              )}

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
                <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 13, color: SILVER.label }}>Also at</Text>
                {links.slice(1).map(r => (
                  // Silver accents: each store is a small chrome-bezel pill, quieter than the main key.
                  <Pressable key={r.name} {...fill('chrome-key')} onPress={() => open(i, r.name, r.url)} accessibilityRole="link" accessibilityLabel={`Buy at ${r.name}`}
                    style={{ height: 30, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DADADA', borderWidth: 1.5, borderColor: '#161616' }}>
                    <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 12, color: SILVER.ink }}>{`${r.name} ↗`}</Text>
                  </Pressable>
                ))}
              </View>
            </SilverCard>
          );
        })}
        {!bag.length ? <SilverCard><Text style={{ fontFamily: SYS ?? F.medium, fontSize: 16, color: SILVER.label }}>No picks yet.</Text></SilverCard> : null}

        <SilverCard style={{ paddingVertical: 18 }}>
          <LabelValue label={answers || areaLabel} value="Edit" onPress={() => router.push('/routine/about')} />
        </SilverCard>

        {!wide ? summary : null}
        <ChromeButton label="Save to my routine" onPress={saveAll} disabled={!bag.length} />
        <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 12, lineHeight: 18, color: '#7A7A7A', textAlign: 'center' }}>
          {`You buy from the store, at the store's price.${HAS_AFFILIATE ? ' Moi may earn a commission from store links. As an Amazon Associate, Moi earns from qualifying purchases.' : ''}`}
        </Text>
      </View>
    </Shell>
  );
}
