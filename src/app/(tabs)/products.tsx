import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { checkLabel } from '../../engine/planEngine';
import { Button, Screen, SectionCard, Sub, Title } from '../../components/ui';
import { rules, useStore } from '../../state/store';
import { C, F } from '../../theme';

const SAMPLE = 'Water, Alcohol Denat., Polyquaternium-11, Glycerin, Dimethicone, Fragrance';

const Chip = ({ t, bg, fg }: { t: string; bg: string; fg: string }) => <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}><Text style={{ fontFamily: F.medium, fontSize: 13, color: fg }}>{t}</Text></View>;

export default function Products() {
  const { plan } = useStore();
  const [label, setLabel] = useState('');
  const [res, setRes] = useState<{ good: string[]; watchOut: string[] } | null>(null);
  if (!plan) return null;
  return (
    <Screen scroll>
      <Title>Products</Title>
      <Sub style={{ marginTop: 6 }}>Paste a product’s ingredient list and we’ll check it against your plan.</Sub>
      <TextInput value={label} onChangeText={t => { setLabel(t); setRes(null); }} multiline placeholder="Water, Cetearyl Alcohol, …" placeholderTextColor="#ABABAB"
        style={{ marginTop: 16, minHeight: 120, borderRadius: 18, backgroundColor: C.option, padding: 16, fontFamily: F.regular, fontSize: 15, color: C.ink, textAlignVertical: 'top' }} />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <Button label="Check label" disabled={!label.trim()} onPress={() => setRes(checkLabel(label, plan, rules))} style={{ flex: 1 }} />
        <Button label="Try a sample" variant="secondary" onPress={() => { setLabel(SAMPLE); setRes(checkLabel(SAMPLE, plan, rules)); }} style={{ flex: 1 }} />
      </View>
      {res ? (
        <SectionCard style={{ marginTop: 16 }}>
          <Text style={{ fontFamily: F.bold, fontSize: 20, color: C.ink }}>{res.watchOut.length ? 'Use with care' : res.good.length ? 'Good fit' : 'Nothing stood out'}</Text>
          {res.good.length ? <><Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.gray }}>GOOD FOR YOU</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{res.good.map(g => <Chip key={g} t={g} bg={C.greenSoft} fg={C.greenText} />)}</View></> : null}
          {res.watchOut.length ? <><Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.gray }}>WATCH OUT</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{res.watchOut.map(g => <Chip key={g} t={g} bg={C.amberSoft} fg={C.amberText} />)}</View></> : null}
        </SectionCard>
      ) : null}
      <SectionCard label="WHAT WE LOOK FOR" style={{ marginTop: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{plan.ingredients.lookFor.length ? plan.ingredients.lookFor.map(g => <Chip key={g} t={g} bg="#fff" fg={C.ink} />) : <Sub style={{ fontSize: 13 }}>Nothing specific for your plan.</Sub>}</View>
        {plan.ingredients.avoid.length ? <><Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.gray, marginTop: 4 }}>AVOID</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{plan.ingredients.avoid.map(g => <Chip key={g} t={g} bg={C.amberSoft} fg={C.amberText} />)}</View></> : null}
      </SectionCard>
    </Screen>
  );
}
