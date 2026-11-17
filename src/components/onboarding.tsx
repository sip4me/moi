import { useEffect, useRef } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent, Pressable, ScrollView, type ScrollViewInstance, Text, View } from 'react-native';
import type { StepKey } from '../data/flow';
import { useStep } from '../state/useStep';
import { C, F } from '../theme';
import { Button, Screen, Sub, Title, TopBar } from './ui';

/** The frame most onboarding screens share: back + progress, a title block, and Continue at the bottom. */
export function StepScreen({ step, title, sub, children, cta = 'Continue', disabled, onNext, beforeNext, secondary, scroll }: {
  step: StepKey; title?: React.ReactNode; sub?: string; children?: React.ReactNode; cta?: string; disabled?: boolean;
  /** Replaces the default "go to the next step". */ onNext?: () => void;
  /** Runs before moving on, e.g. to save a default the person accepted without touching it. */ beforeNext?: () => void; secondary?: { label: string; onPress: () => void }; scroll?: boolean;
}) {
  const { progress, next } = useStep(step);
  return (
    <Screen scroll={scroll} footer={<>
      <Button label={cta} disabled={disabled} onPress={() => { beforeNext?.(); (onNext ?? next)(); }} />
      {secondary ? <Button label={secondary.label} variant="ghost" onPress={secondary.onPress} /> : null}
    </>}>
      <TopBar progress={progress} />
      {title ? (
        <View style={{ marginTop: 20, gap: 8 }}>
          {typeof title === 'string' ? <Title>{title}</Title> : title}
          {sub ? <Sub>{sub}</Sub> : null}
        </View>
      ) : null}
      {children}
    </Screen>
  );
}

/** Rounded grey card used for charts and comparisons. */
export function InfoCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[{ backgroundColor: C.card, borderRadius: 24, padding: 18 }, style]}>{children}</View>;
}

const ROW = 44;
const VISIBLE = 7;

/**
 * iOS-style picker column. Scrolls and snaps on touch, and every row is also tappable,
 * so it works the same with a mouse on the web.
 */
export function Wheel({ items, value, onChange, label, width }: { items: string[]; value: number; onChange: (i: number) => void; label?: string; width?: number }) {
  const ref = useRef<ScrollViewInstance>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scrollTo = (i: number, animated = true) => ref.current?.scrollTo({ y: i * ROW, animated });

  useEffect(() => () => clearTimeout(settle.current), []);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    clearTimeout(settle.current);
    // Settle after the scroll stops; covers mouse wheels on web where momentum events don't fire.
    settle.current = setTimeout(() => {
      const i = Math.max(0, Math.min(items.length - 1, Math.round(y / ROW)));
      scrollTo(i);
      if (i !== value) onChange(i);
    }, 90);
  };

  return (
    <View style={{ width, flex: width ? undefined : 1, alignItems: 'stretch' }}>
      {label ? <Text style={{ textAlign: 'center', fontFamily: F.semibold, fontSize: 14, color: C.ink, marginBottom: 6 }}>{label}</Text> : null}
      <View style={{ height: ROW * VISIBLE }}>
        <View pointerEvents="none" style={{ position: 'absolute', left: 4, right: 4, top: ROW * 3, height: ROW, borderRadius: 12, backgroundColor: C.option }} />
        <ScrollView ref={ref} onLayout={() => scrollTo(value, false)} onScroll={onScroll} scrollEventThrottle={32}
          snapToInterval={ROW} decelerationRate="fast" showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: ROW * 3 }}>
          {items.map((t, i) => {
            const d = Math.abs(i - value);
            return (
              <Pressable key={t + i} onPress={() => { scrollTo(i); onChange(i); }} style={{ height: ROW, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: d === 0 ? F.semibold : F.regular, fontSize: d === 0 ? 17 : 15, color: C.ink, opacity: d === 0 ? 1 : d === 1 ? 0.75 : d === 2 ? 0.5 : 0.3 }}>{t}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}
