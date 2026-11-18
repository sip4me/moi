import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Button, Screen, SectionCard, Sub, TopBar } from '../components/ui';
import { type CatalogProduct, PRODUCT_DATA_CREDIT, PRODUCT_DATA_URL, searchProducts } from '../lib/products';
import { useStore } from '../state/store';
import { C, F } from '../theme';

const SAMPLE = 'Water, Alcohol Denat., Polyquaternium-11, Glycerin, Dimethicone, Fragrance';

/** Debounced catalog search: our own table first, Open Beauty Facts behind it. */
function useProductSearch(q: string) {
  const [state, setState] = useState<{ results: CatalogProduct[]; loading: boolean; failed: boolean }>({ results: [], loading: false, failed: false });
  useEffect(() => {
    if (q.trim().length < 2) { setState({ results: [], loading: false, failed: false }); return; }
    const ctrl = new AbortController();
    setState(s => ({ ...s, loading: true, failed: false }));
    const t = setTimeout(() => {
      searchProducts(q, ctrl.signal)
        .then(results => setState({ results, loading: false, failed: false }))
        .catch(() => { if (!ctrl.signal.aborted) setState({ results: [], loading: false, failed: true }); });
    }, 350);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);
  return state;
}

/** Add a product: search the catalog, or paste the ingredient list from the bottle. */
export default function AddProduct() {
  const { mode, q: initial } = useLocalSearchParams<{ mode?: string; q?: string }>();
  const { plan } = useStore();
  const [q, setQ] = useState(initial ?? '');
  const [label, setLabel] = useState('');
  const { results, loading, failed } = useProductSearch(q);
  const searching = q.trim().length >= 2;
  const check = (text: string, name?: string) => router.push({ pathname: '/product-fit', params: { label: text, ...(name ? { name } : {}) } });
  if (!plan) return null;

  return (
    <Screen scroll>
      <TopBar />
      <Text style={{ fontFamily: F.semibold, fontSize: 18, color: C.ink, textAlign: 'center', marginTop: -36, marginBottom: 18 }}>Add a product</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 16, backgroundColor: C.option, paddingHorizontal: 14, gap: 10 }}>
        <Svg width={18} height={18} viewBox="0 0 24 24"><Circle cx={11} cy={11} r={6.5} stroke={C.gray} strokeWidth={2} fill="none" /><Path d="m16 16 4 4" stroke={C.gray} strokeWidth={2} strokeLinecap="round" /></Svg>
        <TextInput value={q} onChangeText={setQ} placeholder="Search a product or brand" placeholderTextColor="#ABABAB" returnKeyType="search" autoCorrect={false} autoFocus={mode !== 'label'}
          style={{ flex: 1, height: 50, fontFamily: F.regular, fontSize: 16, color: C.ink, outlineStyle: 'none' } as any} />
        {loading ? <ActivityIndicator size="small" color={C.gray} /> : q ? (
          <Pressable onPress={() => setQ('')} hitSlop={10}>{({ pressed }) => <Text style={{ fontFamily: F.medium, fontSize: 13, color: pressed ? C.ink : C.gray }}>Clear</Text>}</Pressable>
        ) : null}
      </View>

      {searching && !loading ? (
        <View style={{ marginTop: 10, gap: 8 }}>
          {results.map(p => {
            const name = [p.brand, p.name].filter(Boolean).join(' ');
            return (
              <Pressable key={p.code} onPress={() => check(p.ingredients, name)}
                style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 10, backgroundColor: pressed ? '#ECECEE' : C.option }, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden' }}>
                  {p.image_url ? <Image source={{ uri: p.image_url }} style={{ width: 48, height: 48 }} resizeMode="cover" /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  {p.brand ? <Text numberOfLines={1} style={{ fontFamily: F.semibold, fontSize: 11, letterSpacing: 0.6, color: C.gray }}>{p.brand.toUpperCase()}</Text> : null}
                  <Text numberOfLines={2} style={{ fontFamily: F.medium, fontSize: 15, color: C.ink }}>{p.name}</Text>
                </View>
                <Text style={{ fontFamily: F.semibold, fontSize: 13, color: C.ink }}>Check ›</Text>
              </Pressable>
            );
          })}
          {!results.length ? (
            <Text style={{ fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.gray2, paddingVertical: 4 }}>
              {failed ? 'Search isn’t reachable right now. You can still paste the ingredient list below.' : 'No match yet. Paste the ingredient list from the bottle below — it works for any product.'}
            </Text>
          ) : null}
          <Text onPress={() => Linking.openURL(PRODUCT_DATA_URL)} style={{ fontFamily: F.regular, fontSize: 11, color: C.gray, textDecorationLine: 'underline' }}>{PRODUCT_DATA_CREDIT}</Text>
        </View>
      ) : null}

      <Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.gray, letterSpacing: 1.4, marginTop: 24 }}>OR PASTE THE LABEL</Text>
      <TextInput value={label} onChangeText={setLabel} multiline autoFocus={mode === 'label'} placeholder="Ingredients: Water, Cetearyl Alcohol, …" placeholderTextColor="#ABABAB"
        style={{ marginTop: 10, minHeight: 110, borderRadius: 18, backgroundColor: C.option, padding: 16, fontFamily: F.regular, fontSize: 15, color: C.ink, textAlignVertical: 'top', outlineStyle: 'none' } as any} />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <Button label="Check label" disabled={!label.trim()} onPress={() => check(label)} style={{ flex: 1 }} />
        <Button label="Try a sample" variant="secondary" onPress={() => check(SAMPLE)} style={{ flex: 1 }} />
      </View>

      <SectionCard label="WHAT WE LOOK FOR" style={{ marginTop: 22 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {plan.ingredients.lookFor.length ? plan.ingredients.lookFor.map(g => <View key={g} style={{ backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}><Text style={{ fontFamily: F.medium, fontSize: 13, color: C.ink }}>{g}</Text></View>) : <Sub style={{ fontSize: 13 }}>Nothing specific for your plan.</Sub>}
        </View>
        {plan.ingredients.avoid.length ? <>
          <Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.gray, marginTop: 4 }}>AVOID</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{plan.ingredients.avoid.map(g => <View key={g} style={{ backgroundColor: C.amberSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}><Text style={{ fontFamily: F.medium, fontSize: 13, color: C.amberText }}>{g}</Text></View>)}</View>
        </> : null}
      </SectionCard>
    </Screen>
  );
}
