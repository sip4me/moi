import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { icon3d } from '../data/icons3d';
import { trendsFor } from '../data/trends';
import { profileFromAnswers } from '../engine/profile';
import { useStore } from '../state/store';
import { C, F } from '../theme';
import { Locked, PeekRow } from './Peek';
import { SectionTitle, Tile } from './Tile';

/** Home → Trending styles: what's in now, best matches for your texture first. */
export function Trending() {
  const { answers } = useStore();
  const p = profileFromAnswers(answers);
  const trends = trendsFor(p);
  return (
    <View>
      <SectionTitle right={<Text style={{ fontFamily: F.regular, fontSize: 14, color: C.gray2, marginBottom: 3 }}>Winter 2026</Text>}>Trending styles</SectionTitle>
      <PeekRow itemWidth={148} gap={14}>
        {trends.map(t => {
          const match = t.bestFor.length === 0 || t.bestFor.includes(p.texture);
          return (
            <Locked key={t.id} radius={22} label={t.name}>
              <Tile image={icon3d(t.icon)} imageSize={112} height={140} title={t.name} sub={`${t.products.length} products you’d need`} onPress={() => router.push(`/trend/${t.id}`)}
                badge={match ? <View style={{ backgroundColor: C.greenSoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}><Text style={{ fontFamily: F.semibold, fontSize: 11, color: C.greenText }}>Your texture</Text></View> : undefined} />
            </Locked>
          );
        })}
      </PeekRow>
    </View>
  );
}
