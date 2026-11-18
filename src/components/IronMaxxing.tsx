import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { icon3d } from '../data/icons3d';
import { type IronRecipe, SLOT_LABEL, ironDay, ironTarget } from '../data/ironRecipes';
import { useStore } from '../state/store';
import { C, F } from '../theme';
import { Locked, PeekRow, openPaywall } from './Peek';

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
      style={({ pressed }) => [{ width: '100%', borderRadius: 20, padding: 12, backgroundColor: pressed ? '#F6ECE8' : '#fff', borderWidth: 1, borderColor: '#F0E2DD' }, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
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
    <View style={{ marginTop: 22, borderRadius: 24, padding: 16, backgroundColor: '#FBF3F0', gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Image source={icon3d('food_spinach')} style={{ width: 28, height: 28 }} resizeMode="contain" />
          <Text style={{ fontFamily: F.bold, fontSize: 19, letterSpacing: -0.3, color: C.ink }}>Iron-maxxing</Text>
        </View>
        <Pressable onPress={subscribed ? () => router.push('/iron') : openPaywall} hitSlop={10}>
          {({ pressed }) => <Text style={{ fontFamily: F.semibold, fontSize: 14, color: pressed ? C.gray : C.ink, textDecorationLine: 'underline' }}>Full day</Text>}
        </Pressable>
      </View>
      <Text style={{ fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: C.gray2 }}>Low iron is one of the most common, fixable causes of shedding. Here’s how to eat for it today.</Text>
      <IronMeter mg={mg} target={target} />
      <PeekRow itemWidth={150} gap={10} inset={16}>
        {meals.map(m => <Locked key={m.id} radius={20} label={m.name}><MealCard meal={m} /></Locked>)}
      </PeekRow>
    </View>
  );
}
