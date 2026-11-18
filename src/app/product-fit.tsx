import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Button, Screen, TopBar } from '../components/ui';
import { fitLabel } from '../engine/planEngine';
import { rules, useStore } from '../state/store';
import { C, F } from '../theme';

const TONE = {
  'Great fit': { bg: C.greenSoft, fg: C.greenText, ring: C.green },
  'Good fit': { bg: C.greenSoft, fg: C.greenText, ring: C.green },
  'Use with care': { bg: C.amberSoft, fg: C.amberText, ring: C.gold },
  'Not for you': { bg: '#FDECEC', fg: '#B42318', ring: C.red },
} as const;

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={64} height={64} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={32} cy={32} r={r} stroke="#fff" strokeWidth={5} fill="none" />
        <Circle cx={32} cy={32} r={r} stroke={color} strokeWidth={5} fill="none" strokeDasharray={`${(score / 10) * c} ${c}`} strokeLinecap="round" />
      </Svg>
      <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.ink }}>{score}/10</Text>
    </View>
  );
}

/** Product fit: one label scored against the plan, explained ingredient by ingredient. */
export default function ProductFit() {
  const { id, label: rawLabel, name: given } = useLocalSearchParams<{ id?: string; label?: string; name?: string }>();
  const { plan, shelf, addToShelf, removeFromShelf, addChecked } = useStore();
  const saved = shelf.find(x => x.id === id);
  const label = saved?.label ?? rawLabel ?? '';
  const [name, setName] = useState(given ?? '');
  useEffect(() => { if (!saved && label) addChecked(label); }, [label]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!plan || !label) return null;
  const fit = fitLabel(label, plan, rules);
  const tone = TONE[fit.verdict];

  return (
    <Screen scroll footer={saved
      ? <Button label="Remove from my routine" variant="ghost" onPress={() => { removeFromShelf(saved.id); router.back(); }} />
      : <Button label="Add to my routine" disabled={!name.trim()} onPress={() => { addToShelf({ name: name.trim(), label }); router.replace('/(tabs)/products'); }} />}>
      <TopBar />
      <Text style={{ fontFamily: F.semibold, fontSize: 18, color: C.ink, textAlign: 'center', marginTop: -36, marginBottom: 20 }}>Product fit</Text>
      {saved ? <Text style={{ fontFamily: F.bold, fontSize: 22, color: C.ink, marginBottom: 14 }}>{saved.name}</Text> : (
        <TextInput value={name} onChangeText={setName} placeholder="Name this product" placeholderTextColor="#ABABAB"
          style={{ height: 52, borderRadius: 16, backgroundColor: C.option, paddingHorizontal: 16, fontFamily: F.semibold, fontSize: 17, color: C.ink, marginBottom: 14, outlineStyle: 'none' } as any} />
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: tone.bg, borderRadius: 20, padding: 16 }}>
        <ScoreRing score={fit.score} color={tone.ring} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.bold, fontSize: 17, color: C.ink }}>{fit.verdict}</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: tone.fg, marginTop: 2 }}>{fit.summary}</Text>
        </View>
      </View>
      <Text style={{ fontFamily: F.bold, fontSize: 17, color: C.ink, marginTop: 22, marginBottom: 8 }}>Key ingredients</Text>
      {fit.ingredients.length ? (
        <View style={{ backgroundColor: C.card, borderRadius: 18 }}>
          {fit.ingredients.map((x, i) => (
            <View key={x.name + i} style={{ flexDirection: 'row', gap: 12, padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: '#E6E6E8' }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: x.status === 'good' ? C.greenSoft : C.amberSoft }}>
                <Text style={{ fontFamily: F.bold, fontSize: 12, color: x.status === 'good' ? C.greenText : C.amberText }}>{x.status === 'good' ? '✓' : '!'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.ink }}>{x.name}</Text>
                <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray2, marginTop: 2 }}>{x.why}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.gray2 }}>None of the ingredients matched what your plan looks for or avoids.</Text>}
    </Screen>
  );
}
