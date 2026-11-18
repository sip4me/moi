import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Screen, TopBar } from '../../components/ui';
import { icon3d } from '../../data/icons3d';
import { IRON_RECIPES, SLOT_LABEL } from '../../data/ironRecipes';
import { haptic } from '../../lib/haptics';
import { C, F } from '../../theme';

/** One iron-rich recipe: ingredients you can tick off while shopping, then the steps. */
export default function Recipe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = IRON_RECIPES.find(x => x.id === id);
  const [have, setHave] = useState<number[]>([]);
  if (!r) return null;
  return (
    <Screen scroll>
      <TopBar />
      <View style={{ alignItems: 'center', marginTop: -8 }}>
        <View style={{ width: 132, height: 132, borderRadius: 36, backgroundColor: '#FBF3F0', alignItems: 'center', justifyContent: 'center' }}>
          <Image source={icon3d(r.icon)} style={{ width: 104, height: 104 }} resizeMode="contain" />
        </View>
      </View>
      <Text style={{ fontFamily: F.semibold, fontSize: 12, letterSpacing: 1, color: '#A0584A', textAlign: 'center', marginTop: 14 }}>{SLOT_LABEL[r.slot].toUpperCase()}</Text>
      <Text style={{ fontFamily: F.bold, fontSize: 26, lineHeight: 30, letterSpacing: -0.4, color: C.ink, textAlign: 'center', marginTop: 4 }}>{r.name}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 12 }}>
        {[`≈ ${r.mg} mg iron`, `${r.minutes} min`, r.plant ? 'Plant-based' : 'Contains meat'].map(t => (
          <View key={t} style={{ backgroundColor: C.option, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}><Text style={{ fontFamily: F.medium, fontSize: 13, color: C.ink }}>{t}</Text></View>
        ))}
      </View>
      <View style={{ marginTop: 18, borderRadius: 18, padding: 14, backgroundColor: C.greenSoft }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 13, color: C.greenText }}>Absorption boost</Text>
        <Text style={{ fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.greenText, marginTop: 2 }}>{r.boost}</Text>
      </View>

      <Text style={{ fontFamily: F.bold, fontSize: 18, color: C.ink, marginTop: 24, marginBottom: 8 }}>Ingredients</Text>
      {r.ingredients.map((x, i) => {
        const on = have.includes(i);
        return (
          <Pressable key={x} onPress={() => { haptic('select'); setHave(h => (on ? h.filter(k => k !== i) : [...h, i])); }} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderColor: C.line, opacity: pressed ? 0.6 : 1 })}>
            <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: on ? 0 : 1.5, borderColor: '#D5D5D8', backgroundColor: on ? C.ink : '#fff', alignItems: 'center', justifyContent: 'center' }}>
              {on ? <Text style={{ color: '#fff', fontSize: 12, fontFamily: F.bold }}>✓</Text> : null}
            </View>
            <Text style={{ flex: 1, fontFamily: F.regular, fontSize: 15, lineHeight: 20, color: on ? C.gray : C.ink, textDecorationLine: on ? 'line-through' : 'none' }}>{x}</Text>
          </Pressable>
        );
      })}

      <Text style={{ fontFamily: F.bold, fontSize: 18, color: C.ink, marginTop: 24, marginBottom: 8 }}>Steps</Text>
      {r.steps.map((x, i) => (
        <View key={x} style={{ flexDirection: 'row', gap: 12, paddingVertical: 8 }}>
          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: F.semibold, fontSize: 13, color: '#fff' }}>{i + 1}</Text></View>
          <Text style={{ flex: 1, fontFamily: F.regular, fontSize: 15, lineHeight: 22, color: C.ink }}>{x}</Text>
        </View>
      ))}
      <Text style={{ fontFamily: F.regular, fontSize: 11, lineHeight: 16, color: C.gray, marginTop: 20 }}>Iron amounts are estimates from USDA data. If you’re shedding a lot, ask your doctor for a ferritin test before taking supplements.</Text>
    </Screen>
  );
}
