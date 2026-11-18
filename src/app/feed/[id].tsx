import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '../../components/ui';
import { feed } from '../../data/feed';
import { useStore } from '../../state/store';
import { C, F } from '../../theme';

export function generateStaticParams() {
  return feed().flatMap(s => s.cards.map(c => ({ id: c.id })));
}

/** Bottom sheet for a feed card: why it helps and how to do it. */
export default function FeedDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const card = feed().flatMap(s => s.cards).find(c => c.id === id);
  const { saved, toggleSaved } = useStore();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));
  if (!card) return null;
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end', alignItems: 'center' }}>
      <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={close} accessibilityLabel="Close" />
      <View style={{ width: '100%', maxWidth: 430, maxHeight: '92%', backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' }}>
        {/* Cover */}
        <View style={{ height: 210, backgroundColor: card.bg, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', top: 10, alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.15)' }} />
          {card.image ? <Image source={card.image} resizeMode="contain" style={{ width: 170, height: 170, opacity: card.locked ? 0.6 : 1 }} /> : null}
          <Pressable onPress={close} hitSlop={10} accessibilityLabel="Close" style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 15, color: C.ink }}>✕</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 34, gap: 14 }}>
        <Text style={{ fontFamily: F.bold, fontSize: 24, letterSpacing: -0.4, color: C.ink }}>{card.title}</Text>
        {card.locked ? (
          <Text style={{ fontFamily: F.regular, fontSize: 15, lineHeight: 22, color: C.gray2 }}>This one is part of Moi’s full plan. Unlocking isn’t switched on in the test build yet.</Text>
        ) : (
          <>
            {card.why ? <Text style={{ fontFamily: F.regular, fontSize: 15, lineHeight: 22, color: C.gray2 }}>{card.why}</Text> : null}
            <View style={{ gap: 10 }}>
              {card.steps?.map((s, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}><Text style={{ fontFamily: F.semibold, fontSize: 12, color: '#fff' }}>{i + 1}</Text></View>
                  <Text style={{ flex: 1, fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: C.ink }}>{s}</Text>
                </View>
              ))}
            </View>
          </>
        )}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
          {card.locked ? null : <Button label={saved.includes(card.id) ? 'Saved ✓' : 'Save'} variant="secondary" onPress={() => toggleSaved(card.id)} style={{ flex: 1 }} />}
          <Button label="Got it" onPress={close} style={{ flex: 1 }} />
        </View>
        </ScrollView>
      </View>
    </View>
  );
}
