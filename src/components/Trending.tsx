import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { icon3d } from '../data/icons3d';
import { trendsFor } from '../data/trends';
import { profileFromAnswers } from '../engine/profile';
import { useStore } from '../state/store';
import { C, F } from '../theme';
import { Locked, PeekRow } from './Peek';

/** Home → Trending styles: what's in now, best matches for your texture first. */
export function Trending() {
  const { answers } = useStore();
  const p = profileFromAnswers(answers);
  const trends = trendsFor(p);
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <Text style={{ fontFamily: F.bold, fontSize: 19, letterSpacing: -0.3, color: C.ink }}>Trending styles</Text>
        <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray2 }}>Winter 2026</Text>
      </View>
      <PeekRow itemWidth={148} gap={10}>
        {trends.map(t => {
          const match = t.bestFor.length === 0 || t.bestFor.includes(p.texture);
          return (
            <Locked key={t.id} radius={22} label={t.name}>
            <Pressable onPress={() => router.push(`/trend/${t.id}`)} accessibilityRole="button" accessibilityLabel={`${t.name}, ${t.products.length} products`}
              style={({ pressed }) => [{ borderRadius: 22, padding: 10, backgroundColor: pressed ? '#ECECEE' : C.option }, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
              <View style={{ height: 120, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                <Image source={icon3d(t.icon)} style={{ width: 104, height: 104 }} resizeMode="contain" />
                {match ? <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: C.greenSoft, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 }}><Text style={{ fontFamily: F.semibold, fontSize: 10, color: C.greenText }}>Your texture</Text></View> : null}
              </View>
              <Text numberOfLines={1} style={{ fontFamily: F.semibold, fontSize: 14, color: C.ink, marginTop: 8 }}>{t.name}</Text>
              <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray2, marginTop: 1 }}>{t.products.length} products you’d need</Text>
            </Pressable>
            </Locked>
          );
        })}
      </PeekRow>
    </View>
  );
}
