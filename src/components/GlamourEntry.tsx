import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { todaysGlamour } from '../data/glamour';
import { useStore } from '../state/store';
import { F } from '../theme';

/** Home → a peek at today's first glamour card; opens the full deck. */
export function GlamourEntry() {
  const { todayKey } = useStore();
  const first = todaysGlamour(todayKey)[0];
  return (
    <Pressable onPress={() => router.push('/glamour')} accessibilityRole="button" accessibilityLabel="Remind yourself of your glamour"
      style={({ pressed }) => ({ marginTop: 22, borderRadius: 26, overflow: 'hidden', transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      <Svg style={{ position: 'absolute', width: '100%', height: '100%' }}>
        <Defs><LinearGradient id="glamEntry" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#F8E6DF" /><Stop offset="1" stopColor="#E3B5C6" /></LinearGradient></Defs>
        <Rect width="100%" height="100%" fill="url(#glamEntry)" />
      </Svg>
      <View style={{ padding: 18, gap: 10 }}>
        <Text style={{ fontFamily: F.display, fontSize: 28, lineHeight: 30, color: '#3A1F2B' }}>Remind yourself{'\n'}of your glamour</Text>
        <Text style={{ fontFamily: F.semibold, fontSize: 11, letterSpacing: 2.6, color: '#7A3E5C' }}>5 NEW CARDS TODAY</Text>
        <View style={{ marginTop: 4, borderRadius: 22, borderWidth: 5, borderColor: '#fff', backgroundColor: '#FBF1EE', padding: 16 }}>
          <Text numberOfLines={3} style={{ fontFamily: F.displayItalic, fontSize: 20, lineHeight: 25, color: '#3A1F2B', textAlign: 'center' }}>{first.line}</Text>
          <Text style={{ fontFamily: F.semibold, fontSize: 10, letterSpacing: 2.2, color: '#7A3E5C', textAlign: 'center', marginTop: 10 }}>TAP TO OPEN THE DECK</Text>
        </View>
      </View>
    </Pressable>
  );
}
