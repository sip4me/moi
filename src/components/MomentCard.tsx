import { Pressable, Text, View } from 'react-native';
import { OIL_ART, OIL_TIMING, PINEAPPLE_ART, PINEAPPLE_TIMING } from '../data/art';
import type { Moment } from '../data/moments';
import { haptic } from '../lib/haptics';
import { C, CONTENT_INDENT, F } from '../theme';
import { TwoFrameArt } from './TwoFrameArt';

const THEME = {
  'pineapple': { bg: '#EEEAF6', ink: '#3B3357', sub: '#5E567A' },
  'oil-wash': { bg: '#F3EEE1', ink: C.ink, sub: '#6B6252' },
  'oil-workout': { bg: '#F3EEE1', ink: C.ink, sub: '#6B6252' },
} as const;

/** A timely nudge with its animation: night pineapple, pre-wash oil, or oil before a workout. */
export function MomentCard({ moment, onDone }: { moment: Moment; onDone: () => void }) {
  const t = THEME[moment.kind];
  const night = moment.kind === 'pineapple';
  return (
    <View style={{ marginTop: 24, marginHorizontal: CONTENT_INDENT, borderRadius: 24, backgroundColor: t.bg, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <TwoFrameArt spec={night ? PINEAPPLE_ART : OIL_ART} timing={night ? PINEAPPLE_TIMING : OIL_TIMING} width={112} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 10, letterSpacing: 1.6, color: t.sub }}>{moment.eyebrow}</Text>
        <Text style={{ fontFamily: F.bold, fontSize: 17, letterSpacing: -0.2, color: t.ink }}>{moment.title}</Text>
        <Text style={{ fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: t.sub }}>{moment.body}</Text>
        <Pressable onPress={() => { haptic('success'); onDone(); }} accessibilityRole="button" hitSlop={6}
          style={({ pressed }) => ({ alignSelf: 'flex-start', marginTop: 6, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: pressed ? '#2E2E2E' : C.ink, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
          <Text style={{ fontFamily: F.semibold, fontSize: 13, color: '#fff' }}>{moment.cta}</Text>
        </Pressable>
      </View>
    </View>
  );
}
