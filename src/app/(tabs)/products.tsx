import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { fitLabel } from '../../engine/planEngine';
import { Button, Chip as Pill, Screen, SectionCard, Sub, Title } from '../../components/ui';
import { rules, useStore } from '../../state/store';
import { C, F } from '../../theme';

const SAMPLE = 'Water, Alcohol Denat., Polyquaternium-11, Glycerin, Dimethicone, Fragrance';

const Chip = ({ t, bg, fg }: { t: string; bg: string; fg: string }) => <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}><Text style={{ fontFamily: F.medium, fontSize: 13, color: fg }}>{t}</Text></View>;

const VERDICT_TONE: Record<string, [string, string]> = {
  'Great fit': [C.greenSoft, C.greenText], 'Good fit': [C.greenSoft, C.greenText],
  'Use with care': [C.amberSoft, C.amberText], 'Not for you': ['#FDECEC', '#B42318'],
};

export default function Products() {
  const { plan, shelf, checked } = useStore();
  const [label, setLabel] = useState('');
  const [tab, setTab] = useState<'shelf' | 'scanned'>('shelf');
  if (!plan) return null;
  const check = (text: string) => router.push({ pathname: '/product-fit', params: { label: text } });
  return (
    <Screen scroll>
      <Title>Products</Title>
      <Sub style={{ marginTop: 6 }}>Every ingredient checked against your hair profile.</Sub>

      <View style={{ flexDirection: 'row', gap: 6, marginTop: 16 }}>
        <Pill label={`In my routine (${shelf.length})`} on={tab === 'shelf'} onPress={() => setTab('shelf')} />
        <Pill label={`Scanned (${checked.length})`} on={tab === 'scanned'} onPress={() => setTab('scanned')} />
      </View>
      <View style={{ gap: 10, marginTop: 12 }}>
        {(tab === 'shelf' ? shelf.map(x => ({ key: x.id, name: x.name, label: x.label, params: { id: x.id } }))
          : checked.map(x => ({ key: x.at, name: new Date(x.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), label: x.label, params: { label: x.label } }))
        ).map(item => {
          const fit = fitLabel(item.label, plan, rules);
          const [bg, fg] = VERDICT_TONE[fit.verdict];
          return (
            <Pressable key={item.key} onPress={() => router.push({ pathname: '/product-fit', params: item.params })}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 14, backgroundColor: pressed ? C.pressed : C.card, borderWidth: 1, borderColor: C.line })}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>{item.name}</Text>
                <Text numberOfLines={1} style={{ fontFamily: F.regular, fontSize: 12, color: C.gray, marginTop: 2 }}>{item.label}</Text>
              </View>
              <View style={{ backgroundColor: bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' }}>
                <Text style={{ fontFamily: F.bold, fontSize: 14, color: fg }}>{fit.score}/10</Text>
                <Text style={{ fontFamily: F.medium, fontSize: 10, color: fg }}>{fit.verdict}</Text>
              </View>
            </Pressable>
          );
        })}
        {(tab === 'shelf' ? shelf : checked).length ? null : (
          <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.gray2, paddingVertical: 8 }}>
            {tab === 'shelf' ? 'Check a label below, then add it to your routine.' : 'Labels you check show up here.'}
          </Text>
        )}
      </View>

      <Text style={{ fontFamily: F.semibold, fontSize: 13, color: C.ink, letterSpacing: 1.5, marginTop: 22 }}>CHECK A LABEL</Text>
      <TextInput value={label} onChangeText={setLabel} multiline placeholder="Paste the ingredient list: Water, Cetearyl Alcohol, …" placeholderTextColor="#ABABAB"
        style={{ marginTop: 10, minHeight: 110, borderRadius: 18, backgroundColor: C.option, padding: 16, fontFamily: F.regular, fontSize: 15, color: C.ink, textAlignVertical: 'top', outlineStyle: 'none' } as any} />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <Button label="Check label" disabled={!label.trim()} onPress={() => check(label)} style={{ flex: 1 }} />
        <Button label="Try a sample" variant="secondary" onPress={() => check(SAMPLE)} style={{ flex: 1 }} />
      </View>

      <SectionCard label="WHAT WE LOOK FOR" style={{ marginTop: 22 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{plan.ingredients.lookFor.length ? plan.ingredients.lookFor.map(g => <Chip key={g} t={g} bg="#fff" fg={C.ink} />) : <Sub style={{ fontSize: 13 }}>Nothing specific for your plan.</Sub>}</View>
        {plan.ingredients.avoid.length ? <><Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.gray, marginTop: 4 }}>AVOID</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{plan.ingredients.avoid.map(g => <Chip key={g} t={g} bg={C.amberSoft} fg={C.amberText} />)}</View></> : null}
      </SectionCard>
    </Screen>
  );
}
