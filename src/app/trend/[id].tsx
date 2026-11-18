import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { Screen, Sub, TopBar } from '../../components/ui';
import { icon3d } from '../../data/icons3d';
import { TRENDS } from '../../data/trends';
import { profileFromAnswers } from '../../engine/profile';
import { useStore } from '../../state/store';
import { C, F } from '../../theme';

/** One trending style: what to buy (product types), how to do it, and a note if it works against your goal. */
export default function TrendScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { answers } = useStore();
  const t = TRENDS.find(x => x.id === id);
  if (!t) return null;
  const p = profileFromAnswers(answers);
  const note = t.care?.when(p) ? t.care.note : null;
  return (
    <Screen scroll>
      <TopBar />
      <View style={{ alignItems: 'center', marginTop: -8 }}>
        <View style={{ width: 170, height: 170, borderRadius: 40, backgroundColor: C.option, alignItems: 'center', justifyContent: 'center' }}>
          <Image source={icon3d(t.icon)} style={{ width: 150, height: 150 }} resizeMode="contain" />
        </View>
      </View>
      <Text style={{ fontFamily: F.bold, fontSize: 28, letterSpacing: -0.5, color: C.ink, textAlign: 'center', marginTop: 14 }}>{t.name}</Text>
      <Sub style={{ textAlign: 'center', marginTop: 6 }}>{t.blurb}</Sub>
      {note ? (
        <View style={{ marginTop: 16, borderRadius: 18, padding: 14, backgroundColor: C.amberSoft }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 13, color: C.amberText }}>For your hair</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.amberText, marginTop: 2 }}>{note}</Text>
        </View>
      ) : null}

      <Text style={{ fontFamily: F.bold, fontSize: 18, color: C.ink, marginTop: 24, marginBottom: 10 }}>What you’ll need</Text>
      <View style={{ gap: 8 }}>
        {t.products.map(x => (
          <View key={x.type} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 14, backgroundColor: C.option }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>{x.type}</Text>
              <Text style={{ fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: C.gray2, marginTop: 2 }}>{x.why}</Text>
            </View>
            <Pressable onPress={() => router.push({ pathname: '/add-product', params: { q: x.search } })} accessibilityRole="button" accessibilityLabel={`Find a ${x.type}`}
              style={({ pressed }) => [{ borderRadius: 999, paddingHorizontal: 14, height: 34, justifyContent: 'center', backgroundColor: pressed ? '#2E2E2E' : C.ink }, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
              <Text style={{ fontFamily: F.semibold, fontSize: 13, color: '#fff' }}>Find one</Text>
            </Pressable>
          </View>
        ))}
      </View>
      <Text style={{ fontFamily: F.regular, fontSize: 12, lineHeight: 17, color: C.gray, marginTop: 8 }}>“Find one” searches products and scores each against your hair before you buy.</Text>

      <Text style={{ fontFamily: F.bold, fontSize: 18, color: C.ink, marginTop: 24, marginBottom: 8 }}>How to do it</Text>
      {t.steps.map((s, i) => (
        <View key={s} style={{ flexDirection: 'row', gap: 12, paddingVertical: 8 }}>
          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: F.semibold, fontSize: 13, color: '#fff' }}>{i + 1}</Text></View>
          <Text style={{ flex: 1, fontFamily: F.regular, fontSize: 15, lineHeight: 22, color: C.ink }}>{s}</Text>
        </View>
      ))}
    </Screen>
  );
}
