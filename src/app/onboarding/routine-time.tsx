import { useRef, useState } from 'react';
import { PanResponder, Text, View } from 'react-native';
import { StepScreen } from '../../components/onboarding';
import { haptic } from '../../lib/haptics';
import { useStore } from '../../state/store';
import { C, F } from '../../theme';

/** Stops from 5 minutes to 5 hours; finer where most people land. */
const STOPS = [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300];
const KNOB = 28;

export const formatMinutes = (m: number) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} h`);

export default function RoutineTime() {
  const { answers, setAnswer } = useStore();
  const initial = Math.max(0, STOPS.indexOf(answers.timeBudget ?? 15));
  const [i, setI] = useState(initial === -1 ? 2 : initial);
  const [width, setWidth] = useState(0);
  const track = useRef({ x: 0, w: 0 });
  const last = useRef(i);

  const pick = (x: number) => {
    const { w } = track.current;
    if (!w) return;
    const k = Math.round(Math.max(0, Math.min(1, x / w)) * (STOPS.length - 1));
    if (k !== last.current) { last.current = k; setI(k); haptic('select'); }
  };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    // Children ignore touches, so locationX is measured from the track's own left edge.
    onPanResponderGrant: e => { track.current.x = e.nativeEvent.pageX - e.nativeEvent.locationX; pick(e.nativeEvent.locationX); },
    onPanResponderMove: (e, g) => pick(g.moveX - track.current.x),
  })).current;

  const value = STOPS[i];
  const pos = (i / (STOPS.length - 1)) * width;
  return (
    <StepScreen step="routine-time" title="How much time can you give your hair?" beforeNext={() => setAnswer('timeBudget', value)}>
      <View style={{ flex: 1, justifyContent: 'center', gap: 22 }}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.gray2 }}>Time per day</Text>
          <Text style={{ fontFamily: F.bold, fontSize: 40, color: C.ink, letterSpacing: -1 }}>{formatMinutes(value)}</Text>
        </View>
        <View
          {...pan.panHandlers}
          accessibilityRole="adjustable"
          accessibilityLabel="Time per day"
          accessibilityValue={{ text: formatMinutes(value) }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={e => setI(k => Math.max(0, Math.min(STOPS.length - 1, k + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))}
          onLayout={e => { const w = e.nativeEvent.layout.width; setWidth(w); track.current.w = w; }}
          style={{ height: 44, justifyContent: 'center' }}>
          <View pointerEvents="none" style={{ height: 4, borderRadius: 2, backgroundColor: '#E3E3E6' }} />
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, width: pos, height: 4, borderRadius: 2, backgroundColor: C.ink }} />
          <View pointerEvents="none" style={{ position: 'absolute', left: pos - KNOB / 2, width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6 }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {['5 min', '1 h', '5 h'].map(t => <Text key={t} style={{ fontFamily: F.regular, fontSize: 12, color: C.gray2 }}>{t}</Text>)}
        </View>
        <View style={{ alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: value === 15 ? C.option : 'transparent' }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 12, color: value === 15 ? C.ink : 'transparent' }}>Recommended</Text>
        </View>
      </View>
    </StepScreen>
  );
}
