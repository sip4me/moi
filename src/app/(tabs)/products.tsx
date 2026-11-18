import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Screen, Sub, Title } from '../../components/ui';
import { KIND, kindOf } from '../../data/productKind';
import { washInterval } from '../../data/schedule';
import { fitLabel } from '../../engine/planEngine';
import { haptic } from '../../lib/haptics';
import { rules, useStore } from '../../state/store';
import { C, F } from '../../theme';

const VERDICT: Record<string, { bg: string; fg: string }> = {
  'Great fit': { bg: C.greenSoft, fg: C.greenText }, 'Good fit': { bg: C.greenSoft, fg: C.greenText },
  'Use with care': { bg: C.amberSoft, fg: C.amberText }, 'Not for you': { bg: '#FDECEC', fg: '#B42318' },
};

/** Small bottle in the category colour, on a white tile (Figma 05 · Products). */
export function Bottle({ tint, size = 56 }: { tint: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 28 28">
        <Rect x={10} y={1.5} width={8} height={4} rx={1.2} fill={tint} opacity={0.55} />
        <Rect x={6.5} y={6.5} width={15} height={20} rx={3.5} fill={tint} />
        <Rect x={9.5} y={13} width={9} height={5.5} rx={1.4} fill="#fff" opacity={0.9} />
      </Svg>
    </View>
  );
}

const ScanIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M8 9v6M11 9v6M14 9v6M17 9v6" stroke={color} strokeWidth={1.9} fill="none" strokeLinecap="round" /></Svg>
);

/**
 * Button states on this page (all from one pattern): default, pressed (darker fill and a 0.98 squeeze),
 * focused (keyboard outline on web), and disabled where an action isn't available yet.
 */
const squeeze = (pressed: boolean) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] });

function Tabs({ value, onChange, counts }: { value: 'shelf' | 'scanned'; onChange: (v: 'shelf' | 'scanned') => void; counts: [number, number] }) {
  const tabs = [['shelf', `In my routine (${counts[0]})`], ['scanned', `Scanned (${counts[1]})`]] as const;
  return (
    <View style={{ flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: C.option, borderRadius: 999, padding: 3 }} accessibilityRole="tablist">
      {tabs.map(([k, label]) => {
        const on = k === value;
        return (
          <Pressable key={k} onPress={() => { if (!on) { haptic('select'); onChange(k); } }} accessibilityRole="tab" accessibilityState={{ selected: on }}
            style={({ pressed }) => ({ height: 34, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center', backgroundColor: on ? (pressed ? '#2E2E2E' : C.ink) : pressed ? '#E6E6E8' : 'transparent' })}>
            <Text style={{ fontFamily: F.medium, fontSize: 14, color: on ? '#fff' : C.gray2 }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ProductRow({ name, label, caption, usage, tint, onPress }: { name: string; label: string; caption: string; usage: string; tint: string; onPress: () => void }) {
  const { plan } = useStore();
  const fit = fitLabel(label, plan!, rules);
  const tone = VERDICT[fit.verdict];
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${name}, ${fit.score} out of 10, ${fit.verdict}`}
      style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20, padding: 12, backgroundColor: pressed ? '#ECECEE' : C.option }, squeeze(pressed)]}>
      <Bottle tint={tint} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 11, letterSpacing: 0.8, color: C.gray }}>{caption}</Text>
        <Text numberOfLines={1} style={{ fontFamily: F.medium, fontSize: 16, color: C.ink, marginTop: 1 }}>{name}</Text>
        <Text numberOfLines={1} style={{ fontFamily: F.regular, fontSize: 13, color: C.gray2, marginTop: 1 }}>{usage}</Text>
      </View>
      <View style={{ minWidth: 76, borderRadius: 12, paddingVertical: 7, paddingHorizontal: 10, alignItems: 'center', backgroundColor: tone.bg }}>
        <Text style={{ fontFamily: F.bold, fontSize: 16, color: tone.fg }}>{fit.score}/10</Text>
        <Text style={{ fontFamily: F.medium, fontSize: 11, color: tone.fg }}>{fit.verdict}</Text>
      </View>
    </Pressable>
  );
}

export default function Products() {
  const { plan, shelf, checked } = useStore();
  const [tab, setTab] = useState<'shelf' | 'scanned'>('shelf');
  if (!plan) return null;
  const every = washInterval(plan);

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title>Products</Title>
        <Pressable onPress={() => router.push({ pathname: '/add-product', params: { mode: 'label' } })} accessibilityRole="button" accessibilityLabel="Scan a product label"
          style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 7, height: 38, paddingHorizontal: 15, borderRadius: 999, backgroundColor: pressed ? '#2E2E2E' : C.ink }, squeeze(pressed)]}>
          <ScanIcon color="#fff" /><Text style={{ fontFamily: F.semibold, fontSize: 15, color: '#fff' }}>Scan</Text>
        </Pressable>
      </View>
      <Sub style={{ marginTop: 4, fontSize: 14 }}>Every ingredient checked against your hair profile.</Sub>

      <View style={{ marginTop: 14 }}><Tabs value={tab} onChange={setTab} counts={[shelf.length, checked.length]} /></View>

      <View style={{ gap: 10, marginTop: 12 }}>
        {tab === 'shelf'
          ? shelf.map(x => {
            const k = KIND[kindOf(x.name, x.label)];
            return <ProductRow key={x.id} name={x.name} label={x.label} caption={k.caption} tint={k.tint} usage={k.usage(every)} onPress={() => router.push({ pathname: '/product-fit', params: { id: x.id } })} />;
          })
          : checked.map(x => {
            const k = KIND[kindOf('', x.label)];
            return <ProductRow key={x.at} name={x.label.split(',').slice(0, 2).join(', ')} label={x.label} caption={`SCANNED · ${new Date(x.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}`} tint={k.tint} usage="Not in your routine" onPress={() => router.push({ pathname: '/product-fit', params: { label: x.label } })} />;
          })}

        {tab === 'scanned' && !checked.length ? <Sub style={{ fontSize: 14, textAlign: 'center', paddingVertical: 8 }}>Labels you scan or search show up here.</Sub> : null}

        <Pressable onPress={() => router.push('/add-product')} accessibilityRole="button"
          style={({ pressed }) => [{ height: 52, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: pressed ? '#BDBDC2' : '#D6D6D9', alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? C.option : 'transparent' }, squeeze(pressed)]}>
          <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.gray2 }}>+  Add a product to your routine</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
