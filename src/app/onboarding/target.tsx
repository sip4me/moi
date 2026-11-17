import { useRef, useState } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent, ScrollView, type ScrollViewInstance, Text, View } from 'react-native';
import { StepScreen } from '../../components/onboarding';
import { GOAL_COPY, primaryGoal } from '../../data/goals';
import { profileFromAnswers, useStore } from '../../state/store';
import { C, F } from '../../theme';

const STEP_PX = 56;   // distance between whole numbers on the ruler
const MINOR = 4;      // minor ticks between them

export default function Target() {
  const { answers, setAnswer } = useStore();
  const t = GOAL_COPY[primaryGoal(answers)].target;
  const baseline = profileFromAnswers(answers).baseline as Record<string, number>;
  const now = t ? baseline[t.metric] : 0;
  // Scores can only go down from today's; length goes up from zero.
  const max = t?.metric === 'lengthCm' ? t.max : Math.max(t?.min ?? 1, (now ?? 10) - 1);
  const min = t?.min ?? 1;
  const suggested = t?.metric === 'lengthCm' ? 3 : Math.max(min, Math.round(now / 2));
  const [value, setValue] = useState<number>(typeof answers.target === 'number' ? answers.target : suggested);
  const [width, setWidth] = useState(0);
  const ref = useRef<ScrollViewInstance>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  if (!t) return null;

  const count = max - min;
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const v = Math.max(min, Math.min(max, min + Math.round(x / STEP_PX)));
    setValue(v);
    clearTimeout(settle.current);
    settle.current = setTimeout(() => ref.current?.scrollTo({ x: (v - min) * STEP_PX, animated: true }), 90);
  };

  return (
    <StepScreen step="target" title="What is your target?" beforeNext={() => setAnswer('target', value)}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.gray2 }}>{t.label}</Text>
        <Text style={{ fontFamily: F.bold, fontSize: 40, color: C.ink, letterSpacing: -1 }}>
          {t.metric === 'lengthCm' ? `+${value} cm` : `${value} ${t.unit}`}
        </Text>
        <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray }}>
          {t.metric === 'lengthCm' ? 'Over the next 12 weeks' : `${t.scoreLabel} · now ${now} / 10`}
        </Text>
        <View style={{ alignSelf: 'stretch', height: 64, marginTop: 24 }} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
          {width ? (
            <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}
              snapToInterval={STEP_PX} decelerationRate="fast"
              onLayout={() => ref.current?.scrollTo({ x: (value - min) * STEP_PX, animated: false })}
              contentContainerStyle={{ paddingHorizontal: width / 2, alignItems: 'center' }}>
              {Array.from({ length: count * (MINOR + 1) + 1 }, (_, i) => {
                const major = i % (MINOR + 1) === 0;
                return <View key={i} style={{ width: STEP_PX / (MINOR + 1), alignItems: 'flex-start' }}>
                  <View style={{ width: 1.5, height: major ? 34 : 18, backgroundColor: major ? '#9A9A9A' : '#CFCFD4', marginLeft: -0.75 }} />
                </View>;
              })}
            </ScrollView>
          ) : null}
          <View pointerEvents="none" style={{ position: 'absolute', left: width / 2 - 1.5, top: 8, width: 3, height: 48, borderRadius: 2, backgroundColor: C.ink }} />
        </View>
      </View>
    </StepScreen>
  );
}
