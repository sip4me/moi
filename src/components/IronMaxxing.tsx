import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { icon3d } from '../data/icons3d';
import { type IronRecipe, SLOT_LABEL, ironDay, ironTarget } from '../data/ironRecipes';
import { useStore } from '../state/store';
import Svg, { Path } from 'react-native-svg';
import { C, F, surface } from '../theme';
import { Locked, PeekRow, openPaywall } from './Peek';
import { SectionTitle, Tile } from './Tile';

/** Progress bar toward the day's iron target, with the meals' total. */
export function IronMeter({ mg, target }: { mg: number; target: number }) {
  const pct = Math.min(1, mg / target);
  return (
    <View style={{ gap: 6 }}>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: '#F1E3DF', overflow: 'hidden' }}>
        <View style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 4, backgroundColor: '#C2493A' }} />
      </View>
      <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray2 }}>
        ≈ {mg} mg from today’s plan · your daily need is about {target} mg{pct >= 1 ? ' ✓' : ''}
      </Text>
    </View>
  );
}

export function MealCard({ meal, onPress, hideSlot }: { meal: IronRecipe; onPress?: () => void; hideSlot?: boolean }) {
  return (
    <Pressable onPress={onPress ?? (() => router.push(`/recipe/${meal.id}`))} accessibilityRole="button" accessibilityLabel={`${SLOT_LABEL[meal.slot]}: ${meal.name}, about ${meal.mg} milligrams of iron`}
      style={({ pressed }) => [surface, { width: '100%', borderRadius: 22, padding: 14, backgroundColor: pressed ? '#FAFAFA' : '#fff' }, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      {hideSlot ? null : <Text style={{ fontFamily: F.semibold, fontSize: 11, letterSpacing: 0.8, color: '#A0584A' }}>{SLOT_LABEL[meal.slot].toUpperCase()}</Text>}
      <Image source={icon3d(meal.icon)} resizeMode="contain" style={{ width: 64, height: 64, alignSelf: 'center', marginVertical: 6 }} />
      <Text numberOfLines={2} style={{ fontFamily: F.semibold, fontSize: 14, lineHeight: 18, color: C.ink, minHeight: 36 }}>{meal.name}</Text>
      <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.gray2, marginTop: 4 }}>{meal.mg} mg iron · {meal.minutes} min</Text>
    </Pressable>
  );
}

/** Home → Iron-maxxing: today's four iron-rich meals and snacks, and how close they get to the daily need. */
export function IronMaxxing() {
  const { todayKey, answers, subscribed } = useStore();
  const { meals, mg } = ironDay(todayKey);
  const target = ironTarget(answers);
  return (
    <View>
      <SectionTitle right={
        <Pressable onPress={subscribed ? () => router.push('/iron') : openPaywall} hitSlop={10}>
          {({ pressed }) => <Text style={{ fontFamily: F.semibold, fontSize: 15, color: pressed ? C.gray : C.ink, textDecorationLine: 'underline', marginBottom: 3 }}>Full day</Text>}
        </Pressable>}>Iron-maxxing</SectionTitle>
      <Text style={{ fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: C.gray2 }}>Low iron is one of the most common, fixable causes of shedding. Here’s how to eat for it today.</Text>
      <View style={{ marginTop: 14, marginBottom: 20 }}><IronMeter mg={mg} target={target} /></View>
      <PeekRow itemWidth={148} gap={14}>
        {meals.map(m => (
          <Locked key={m.id} radius={22} label={m.name}>
            <Tile image={icon3d(m.icon)} eyebrow={SLOT_LABEL[m.slot].toUpperCase()} title={m.name} sub={`${m.mg} mg iron · ${m.minutes} min`} onPress={() => router.push(`/recipe/${m.id}`)} />
          </Locked>
        ))}
      </PeekRow>
      <Pressable onPress={subscribed ? () => router.push({ pathname: '/scan-label', params: { mode: 'food' } }) : openPaywall} accessibilityRole="button"
        style={({ pressed }) => ({ marginTop: 18, height: 50, borderRadius: 14, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? '#E8E8EA' : '#F2F2F3' })}>
        <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 9v6M11 9v6M14 9v6M17 9v6" stroke={C.ink} strokeWidth={1.8} fill="none" strokeLinecap="round" /></Svg>
        <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>Scan a food’s iron</Text>
      </Pressable>
    </View>
  );
}
