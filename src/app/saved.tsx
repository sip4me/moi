import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { Screen, Sub, Title, TopBar } from '../components/ui';
import { feed } from '../data/feed';
import { icon3d } from '../data/icons3d';
import { IRON_RECIPES } from '../data/ironRecipes';
import { useStore } from '../state/store';
import { C, F } from '../theme';

export default function Saved() {
  const { saved } = useStore();
  const ideas = feed().flatMap(s => s.cards).filter(c => saved.includes(c.id))
    .map(c => ({ id: c.id, title: c.title, image: c.image, bg: c.bg, href: `/feed/${c.id}` }));
  const recipes = IRON_RECIPES.filter(r => saved.includes(`recipe:${r.id}`))
    .map(r => ({ id: r.id, title: r.name, image: icon3d(r.icon), bg: '#FFF3DE', href: `/recipe/${r.id}` }));
  const cards = [...recipes, ...ideas];
  return (
    <Screen scroll>
      <TopBar />
      <Title size={26} style={{ marginTop: 16 }}>Saved</Title>
      <Sub style={{ marginTop: 6 }}>Recipes and ideas you saved from Home.</Sub>
      <View style={{ gap: 10, marginTop: 18 }}>
        {cards.length ? cards.map(c => (
          <Pressable key={c.id} onPress={() => router.push(c.href as never)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, padding: 10, backgroundColor: pressed ? C.pressed : C.card })}>
            <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>{c.image ? <Image source={c.image} resizeMode="contain" style={{ width: 46, height: 46 }} /> : null}</View>
            <Text style={{ flex: 1, fontFamily: F.semibold, fontSize: 15, color: C.ink }}>{c.title}</Text>
          </Pressable>
        )) : <Sub style={{ fontSize: 14 }}>Tap the heart on a recipe, or Save on an idea, to keep it here.</Sub>}
      </View>
    </Screen>
  );
}
