import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Screen, Sub, Title, TopBar } from '../components/ui';
import { useStore } from '../state/store';
import { C, F } from '../theme';

const TYPES = ['Traveling', 'Protective style', 'Swim season', 'Sick or recovering', 'New baby', 'Busy stretch', 'New cut or color', 'New medication'];
const DUR: [string, number | null][] = [['3 days', 3], ['1 week', 7], ['2 weeks', 14], ['6 weeks', 42], ['Until I end it', null]];
const PREVIEW: Record<string, { add: string[]; pause: string[] }> = {
  'Traveling': { add: ['Travel-size leave-in after every wash'], pause: ['Hair mask', 'Scalp massage reminders'] },
  'Protective style': { add: ['Scalp rinse · 2×/wk', 'Oil on edges · every evening', 'Loose at the edges'], pause: ['Wash day reminders', 'Heat max'] },
  'Swim season': { add: ['Before swim: wet + oil', 'Rinse right after the pool'], pause: [] },
  'Sick or recovering': { add: ['Gentle wash only when you feel up to it'], pause: ['All reminders except one a day'] },
  'New baby': { add: ['Shedding 2–4 months after birth is common and usually recovers'], pause: ['Anything over 5 minutes'] },
  'Busy stretch': { add: ['Only your top 2 cards'], pause: ['Extras and tips'] },
  'New cut or color': { add: ['Hair mask · 2×/wk', 'Heat max 280°F'], pause: [] },
  'New medication': { add: ['Ask your doctor whether shedding is a known side effect'], pause: [] },
};

export default function Change() {
  const { setLifeChange, lifeChange } = useStore();
  const [type, setType] = useState<string | null>(lifeChange?.type ?? null);
  const [dur, setDur] = useState<number | null | undefined>(undefined);
  const ready = type && dur !== undefined;
  const save = () => {
    const start = new Date(); const end = dur ? new Date(start.getTime() + dur * 86400000) : null;
    setLifeChange({ type: type!, label: type === 'Protective style' ? 'Protective style in' : type!, startsAt: start.toISOString(), endsAt: end ? end.toISOString() : null });
    router.back();
  };
  const p = type ? PREVIEW[type] : null;
  return (
    <Screen scroll footer={<Button label="Save change" disabled={!ready} onPress={save} />}>
      <TopBar />
      <Title size={26} style={{ marginTop: 16 }}>What’s changing?</Title>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
        {TYPES.map(t => (
          <Pressable key={t} onPress={() => setType(t)} style={({ pressed }) => ({ width: '48%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 15, backgroundColor: type === t ? C.ink : pressed ? C.pressed : C.card })}>
            <Text style={{ fontFamily: F.medium, fontSize: 14, color: type === t ? '#fff' : C.ink }}>{t}</Text>
          </Pressable>
        ))}
      </View>
      <Title size={22} style={{ marginTop: 24 }}>For how long?</Title>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {DUR.map(([l, d]) => (
          <Pressable key={l} onPress={() => setDur(d)} style={({ pressed }) => ({ borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: dur === d ? C.ink : pressed ? C.pressed : '#fff', borderWidth: dur === d ? 0 : 1, borderColor: '#E3E3E6' })}>
            <Text style={{ fontFamily: F.medium, fontSize: 14, color: dur === d ? '#fff' : C.ink }}>{l}</Text>
          </Pressable>
        ))}
      </View>
      {p ? (
        <View style={{ marginTop: 22, backgroundColor: C.card, borderRadius: 20, padding: 16, gap: 8 }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 13, color: C.ink, letterSpacing: 1 }}>HOW YOUR PLAN CHANGES</Text>
          {p.add.map(a => <Text key={a} style={{ fontFamily: F.regular, fontSize: 14, color: C.ink }}><Text style={{ color: C.greenText, fontFamily: F.bold }}>+  </Text>{a}</Text>)}
          {p.pause.map(a => <Text key={a} style={{ fontFamily: F.regular, fontSize: 14, color: C.gray, textDecorationLine: 'line-through' }}>–  {a}</Text>)}
          <Sub style={{ fontSize: 12 }}>Reminders update automatically, with a heads-up 2 days before it ends.</Sub>
        </View>
      ) : null}
    </Screen>
  );
}
