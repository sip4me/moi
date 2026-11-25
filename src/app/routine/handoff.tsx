import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { celebrate } from '../../components/routine/Celebrate';
import { AffiliateNote, Btn, Bubble, money, Shell, SYS, useWide } from '../../components/routine/Kit';
import { logClick, storeLinks } from '../../lib/routine/affiliate';
import { lookNote } from '../../lib/routine/looks';
import { findByKey, itemKey, placeItems, setRoutine, useCatalog, useRoutine, type Item } from '../../lib/routine/model';
import { F } from '../../theme';

/**
 * While the store's checkout is open in its own tab, Moi waits here: what they're buying, where, and one tap
 * to confirm the order so it goes straight into their routine. Moi never sees the card.
 */
export default function Handoff() {
  const { k, store, url } = useLocalSearchParams<{ k?: string; store?: string; url?: string }>();
  const s = useRoutine();
  const cat = useCatalog();
  const wide = useWide();
  const items = (k ?? '').split(',').map(x => findByKey(cat, x)).filter((i): i is Item => !!i);
  const where = store || (items[0] ? storeLinks(items[0])[0]?.name : '') || 'the store';
  const again = url || (items[0] ? storeLinks(items[0])[0]?.url : '');

  const placed = () => {
    const keys = new Set(items.map(itemKey));
    setRoutine(r => {
      const opened = Object.fromEntries(Object.entries(r.opened ?? {}).filter(([x]) => !keys.has(x)));
      return { ...placeItems(r, items), bag: r.bag.filter(x => !keys.has(x)), opened };
    });
    celebrate(items.length > 1 ? `${items.length} added to your routine` : 'Added to your routine', true);
    router.replace('/routine/build');
  };

  const t = { fontFamily: SYS ?? F.medium, fontSize: 14, lineHeight: 20, color: '#4A4858' };
  const lock = <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" stroke="#6C6A80" strokeWidth={1.8} fill="none" strokeLinejoin="round" /></Svg>;

  const summary = (
    <View style={{ gap: 14 }}>
      {items.map(i => (
        <View key={itemKey(i)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 0.5, borderColor: 'rgba(20,20,40,0.10)' }}>
          <Bubble category={i.category} item={i} size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 12, letterSpacing: 1, color: '#8E8E93', textTransform: 'uppercase' }}>{i.brand}</Text>
            <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 14, lineHeight: 19, color: '#1D1D22' }}>{i.name}</Text>
            {i.price != null ? <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 13, color: '#6C6A80' }}>{`about ${money(i.price)}`}</Text> : null}
          </View>
        </View>
      ))}
      <View style={{ gap: 12, padding: 18, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 1, borderColor: '#C9C1EC' }}>
        <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '700', fontSize: 15, color: '#1D1D22' }}>Goes straight to your routine</Text>
        <View style={{ padding: 14, borderRadius: 16, backgroundColor: '#EEEAFB' }}>
          <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 14, lineHeight: 20, color: '#4B3F99' }}>{items[0] && lookNote(items[0], s) ? `${lookNote(items[0], s)} Once you confirm, Moi adds it to your routine and updates your fit.` : 'Once you confirm, Moi adds it to your routine and updates your fit.'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{lock}<Text style={[t, { fontSize: 13, flex: 1 }]}>{`Paid securely to ${where}. Moi never sees your card without permission.`}</Text></View>
        <AffiliateNote />
      </View>
    </View>
  );

  return (
    <Shell active="shop" side={wide ? summary : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{lock}<Text style={[t, { fontSize: 14 }]}>{`Secure checkout · ${where}`}</Text></View>
      <View style={{ alignItems: 'center', gap: 14, paddingVertical: wide ? 60 : 24 }}>
        <Text {...({ dataSet: { grad: 'title' } } as any)} style={{ fontFamily: SYS ?? F.bold, fontWeight: '700', fontSize: wide ? 24 : 21, lineHeight: wide ? 29 : 25, letterSpacing: -0.6, color: '#1D1D22', textAlign: 'center' }}>{`Your ${where} checkout is open`}</Text>
        <Text style={[t, { textAlign: 'center', maxWidth: 420 }]}>{`Finish paying at ${where} in the other tab, then come back and confirm your order here.`}</Text>
        <View style={{ width: '100%', maxWidth: 360, gap: 12, alignItems: 'center', paddingTop: 6 }}>
          <View style={{ width: '100%' }}><Btn label="I placed my order" onPress={placed} /></View>
          {again ? <Pressable onPress={() => { items.forEach(i => logClick({ brand: i.brand, product: i.name, productId: i.id, store: where, source: 'handoff', tagged: where === 'Amazon' })); Linking.openURL(again); }} accessibilityRole="link" hitSlop={8}><Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 15, color: '#111114', textDecorationLine: 'underline' }}>Open checkout again</Text></Pressable> : null}
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/routine/checkout'))} accessibilityRole="button" hitSlop={8}><Text style={[t, { fontSize: 14 }]}>Not yet, back to my picks</Text></Pressable>
        </View>
      </View>
      {wide ? null : summary}
    </Shell>
  );
}
