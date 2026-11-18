import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { IronMeter, MealCard } from '../components/IronMaxxing';
import { Button, Screen, Sub, TopBar } from '../components/ui';
import { IRON_RECIPES, IRON_TIPS, SLOT_LABEL, type Slot, ironDay, ironGoal } from '../data/ironRecipes';
import { haptic } from '../lib/haptics';
import { useStore } from '../state/store';
import { C, F } from '../theme';

/** The full iron-maxxing day: every slot can be swapped for another recipe from the same slot. */
export default function Iron() {
  const { todayKey, answers, done, toggleDone, onboarded } = useStore();
  const isDone = (done[todayKey] ?? []).includes('iron_food');
  const base = ironDay(todayKey).meals;
  const [picks, setPicks] = useState<Record<string, string>>({});
  const meals = base.map(m => IRON_RECIPES.find(r => r.id === picks[m.slot]) ?? m);
  const mg = Math.round(meals.reduce((t, m) => t + m.mg, 0));
  const swap = (slot: Slot, current: string) => {
    const options = IRON_RECIPES.filter(r => r.slot === slot);
    const next = options[(options.findIndex(r => r.id === current) + 1) % options.length];
    haptic('select');
    setPicks(p => ({ ...p, [slot]: next.id }));
  };
  return (
    <Screen scroll footer={onboarded ? <Button label={isDone ? 'Done today ✓ · Undo' : 'I ate iron-rich today'} variant={isDone ? 'secondary' : 'primary'} onPress={() => { if (!isDone) haptic('success'); toggleDone('iron_food'); }} /> : undefined}>
      <TopBar />
      <Text style={{ fontFamily: F.bold, fontSize: 28, letterSpacing: -0.5, color: C.ink }}>Iron-maxxing</Text>
      <Sub style={{ marginTop: 6 }}>Four ways to eat iron today, each paired so your body absorbs more of it.</Sub>
      <View style={{ marginTop: 14 }}><IronMeter mg={mg} target={ironGoal(answers)} /></View>
      {meals.map(m => (
        <View key={m.slot} style={{ marginTop: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>{SLOT_LABEL[m.slot]}</Text>
            <Pressable onPress={() => swap(m.slot, m.id)} hitSlop={8}
              style={({ pressed }) => ({ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: pressed ? C.pressed : C.option })}>
              <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.ink }}>Swap ↻</Text>
            </Pressable>
          </View>
          <MealCard meal={m} hideSlot />
        </View>
      ))}
      <View style={{ marginTop: 22, borderRadius: 18, padding: 14, backgroundColor: C.option, gap: 6 }}>
        {IRON_TIPS.map(t => <Text key={t} style={{ fontFamily: F.regular, fontSize: 13, lineHeight: 19, color: C.ink }}>•  {t}</Text>)}
      </View>
    </Screen>
  );
}
