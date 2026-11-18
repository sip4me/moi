import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { Screen, Sub, Title, TopBar } from '../components/ui';
import { feed } from '../data/feed';
import { useStore } from '../state/store';
import { C, F } from '../theme';

export default function Saved() {
  const { saved } = useStore();
  const cards = feed().flatMap(s => s.cards).filter(c => saved.includes(c.id));
  return (
    <Screen scroll>
      <TopBar />
      <Title size={26} style={{ marginTop: 16 }}>Saved styles</Title>
      <Sub style={{ marginTop: 6 }}>Ideas you saved from Home.</Sub>
      <View style={{ gap: 10, marginTop: 18 }}>
        {cards.length ? cards.map(c => (
          <Pressable key={c.id} onPress={() => router.push(`/feed/${c.id}`)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, padding: 10, backgroundColor: pressed ? C.pressed : C.card, borderWidth: 1, borderColor: C.line })}>
            <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>{c.image ? <Image source={c.image} resizeMode="contain" style={{ width: 46, height: 46 }} /> : null}</View>
            <Text style={{ flex: 1, fontFamily: F.semibold, fontSize: 15, color: C.ink }}>{c.title}</Text>
          </Pressable>
        )) : <Sub style={{ fontSize: 14 }}>Tap a card on Home and choose Save to keep it here.</Sub>}
      </View>
    </Screen>
  );
}
