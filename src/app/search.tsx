import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchIcon } from '../components/Explore';
import { feed } from '../data/feed';
import { icon3d } from '../data/icons3d';
import { IRON_RECIPES, SLOT_LABEL } from '../data/ironRecipes';
import { TRENDS } from '../data/trends';
import { haptic } from '../lib/haptics';
import { useStore } from '../state/store';
import { C, F, TILE } from '../theme';

type Hit = { key: string; title: string; sub: string; icon?: string; image?: any; href: string };

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
/** Every word typed must appear somewhere in the title or details. */
const matches = (q: string, ...fields: (string | undefined)[]) => {
  const hay = norm(fields.filter(Boolean).join(' '));
  return norm(q).split(/\s+/).filter(Boolean).every(w => hay.includes(w));
};

const SUGGEST = ['Iron', 'Breakfast', 'Frizz', 'Satin', 'Braids', 'Oil'];

/** Search Moi: your routine, recipes, styles, ideas and your products, all from one box. */
export default function Search() {
  const { plan, shelf } = useStore();
  const [q, setQ] = useState('');
  const insets = useSafeAreaInsets();

  const groups = useMemo(() => {
    if (!q.trim()) return [];
    const routine: Hit[] = [...(plan?.cards ?? []), ...(plan?.extras ?? [])].filter(c => matches(q, c.label, c.why, String(c.value), c.unit))
      .map(c => ({ key: `c${c.id}`, title: c.label, sub: `${c.value}${c.unit ? ` ${c.unit}` : ''}`.trim(), icon: c.icon ?? c.id, href: c.id === 'iron_food' ? '/iron' : `/why/${c.id}` }));
    const learn: Hit[] = (plan?.learn ?? []).filter(l => matches(q, l.label, l.why))
      .map(l => ({ key: `l${l.id}`, title: l.label, sub: 'Worth knowing', icon: 'learn', href: `/why/${l.id}` }));
    const recipes: Hit[] = IRON_RECIPES.filter(r => matches(q, r.name, SLOT_LABEL[r.slot], r.boost, 'iron recipe food', r.ingredients.join(' ')))
      .map(r => ({ key: `r${r.id}`, title: r.name, sub: `${SLOT_LABEL[r.slot]} · ${r.mg} mg iron · ${r.minutes} min`, icon: r.icon, href: `/recipe/${r.id}` }));
    const styles: Hit[] = TRENDS.filter(t => matches(q, t.name, 'style hairstyle trend'))
      .map(t => ({ key: `t${t.id}`, title: t.name, sub: 'Trending style', icon: t.icon, href: `/trend/${t.id}` }));
    const ideas: Hit[] = feed().flatMap(s => s.cards.map(c => ({ c, s }))).filter(({ c, s }) => matches(q, c.title, c.why, s.title, (c.tags ?? []).join(' '), (c.steps ?? []).join(' ')))
      .map(({ c, s }) => ({ key: `f${c.id}`, title: c.title, sub: s.title, image: c.image, href: `/feed/${c.id}` }));
    const products: Hit[] = shelf.filter(x => matches(q, x.name, x.label))
      .map(x => ({ key: `p${x.id}`, title: x.name, sub: 'On your shelf', icon: 'cat_care', href: `/product-fit?id=${x.id}` }));
    // Title matches first, then ones that only match in the details.
    const rank = (h: Hit[]) => [...h].sort((a, b) => Number(!matches(q, a.title)) - Number(!matches(q, b.title)));
    return ([['Your goal', rank([...routine, ...learn])], ['Recipes', rank(recipes)], ['Styles', rank(styles)], ['Ideas', rank(ideas)], ['Your products', rank(products)]] as [string, Hit[]][])
      .filter(([, h]) => h.length);
  }, [q, plan, shelf]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ width: '100%', maxWidth: 430, alignSelf: 'center', flex: 1, paddingHorizontal: 20, paddingTop: insets.top + 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, borderRadius: 999, paddingHorizontal: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EBEBEE', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}>
            <SearchIcon />
            <TextInput autoFocus value={q} onChangeText={setQ} placeholder="Search Moi" placeholderTextColor="#8E8E93" returnKeyType="search"
              accessibilityLabel="Search Moi" style={{ flex: 1, minWidth: 0, width: '100%', fontFamily: F.medium, fontSize: 16, color: C.ink, outlineStyle: 'none' } as any} />
            {q ? <Pressable onPress={() => setQ('')} hitSlop={10} accessibilityLabel="Clear search"><Text style={{ fontFamily: F.semibold, fontSize: 13, color: C.gray }}>Clear</Text></Pressable> : null}
          </View>
          <Pressable onPress={close} hitSlop={8} accessibilityRole="button"><Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>Cancel</Text></Pressable>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: 22, paddingBottom: 40 }}>
          {!q.trim() ? (
            <View>
              <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink, marginBottom: 12 }}>Try searching for</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {SUGGEST.map(sgt => (
                  <Pressable key={sgt} onPress={() => { haptic('tap'); setQ(sgt); }}
                    style={({ pressed }) => ({ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: '#E4E4E7', backgroundColor: pressed ? '#F4F4F5' : '#fff' })}>
                    <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.ink }}>{sgt}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : groups.length ? groups.map(([title, hits]) => (
            <View key={title} style={{ marginBottom: 24 }}>
              <Text style={{ fontFamily: F.bold, fontSize: 18, color: C.ink, marginBottom: 8 }}>{title}</Text>
              {hits.slice(0, 8).map(h => (
                <Pressable key={h.key} onPress={() => router.push(h.href as never)} accessibilityRole="button" accessibilityLabel={`${h.title}, ${h.sub}`}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8, opacity: pressed ? 0.6 : 1 })}>
                  <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: TILE, alignItems: 'center', justifyContent: 'center' }}>
                    {h.icon || h.image ? <Image source={h.image ?? icon3d(h.icon!)} style={{ width: 40, height: 40 }} resizeMode="contain" /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>{h.title}</Text>
                    <Text numberOfLines={1} style={{ fontFamily: F.regular, fontSize: 13, color: C.gray2, marginTop: 1 }}>{h.sub}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )) : (
            <View style={{ alignItems: 'center', paddingTop: 30, gap: 6 }}>
              <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>No matches for “{q.trim()}”</Text>
              <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.gray2, textAlign: 'center' }}>Try a product, an ingredient, a meal or a style.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
