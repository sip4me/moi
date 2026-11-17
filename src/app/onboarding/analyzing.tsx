import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { routeFor } from '../../data/flow';
import { Screen, Seal, Sub, Title, TopBar } from '../../components/ui';
import { C, F } from '../../theme';

const STEPS = ['Reading your answers', 'Matching your hair type', 'Checking what fits your time', 'Building your daily plan'];

export default function Analyzing() {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= STEPS.length) { const t = setTimeout(() => router.replace(routeFor('plan')), 500); return () => clearTimeout(t); }
    const t = setTimeout(() => setN(n + 1), 700);
    return () => clearTimeout(t);
  }, [n]);
  return (
    <Screen>
      <TopBar progress={0.92} />
      <View style={{ flex: 1, justifyContent: 'center', gap: 24 }}>
        <Title style={{ textAlign: 'center' }}>We’re setting{'\n'}everything up for you</Title>
        <Sub style={{ textAlign: 'center' }}>Using your answers. Your first scan will sharpen it.</Sub>
        <View style={{ gap: 10, marginTop: 8 }}>
          {STEPS.map((s, i) => (
            <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 16, padding: 14 }}>
              {i < n ? <Seal size={24} /> : i === n ? <ActivityIndicator color={C.ink} /> : <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D6D6D9' }} />}
              <Text style={{ fontFamily: F.medium, fontSize: 15, color: i <= n ? C.ink : '#ABABAB' }}>{s}</Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}
