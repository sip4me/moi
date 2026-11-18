import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, Text, View } from 'react-native';
import { Button, Screen, Sub, Title, TopBar } from '../../components/ui';
import { firstStep } from '../../data/flow';

const HEAD = 'They say hair is everything. Isn’t that why we care so much?';
const BODY = 'Longggg luscious hair or voluminous locks could be the result of genetics or consistent routines. We’ll never know! But we do know starting gets us closer to our dream hair goals.';

/** Milliseconds per character, and the beat between the headline and the body. */
const HEAD_MS = 32;
const BODY_MS = 16;
const BEAT_MS = 500;

/**
 * Shown after the splash: the headline types out, then the body, then Continue fades in.
 * The untyped rest of each line is drawn in transparent ink so the layout never jumps.
 * Tapping anywhere finishes the typing; with Reduce Motion on, everything shows at once.
 */
export default function Intro() {
  const [n, setN] = useState(0);
  const total = HEAD.length + BODY.length;
  const done = n >= total;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then(r => { if (alive && r) setN(total); }).catch(() => {});
    return () => { alive = false; };
  }, [total]);

  useEffect(() => {
    if (done) { Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }).start(); return; }
    const ms = n < HEAD.length ? HEAD_MS : n === HEAD.length ? BEAT_MS : BODY_MS;
    const t = setTimeout(() => setN(v => v + 1), ms);
    return () => clearTimeout(t);
  }, [n, done, fade]);

  const head = HEAD.slice(0, Math.min(n, HEAD.length));
  const body = BODY.slice(0, Math.max(0, n - HEAD.length));
  const caret = <Text style={{ opacity: 0.35 }}>|</Text>;

  return (
    <Screen footer={
      <Animated.View style={{ opacity: fade }} pointerEvents={done ? 'auto' : 'none'}>
        <Button label="Continue" onPress={() => router.push(firstStep())} />
      </Animated.View>
    }>
      <TopBar />
      <Pressable style={{ flex: 1, justifyContent: 'center' }} onPress={() => setN(total)} accessible={false}>
        <View accessible accessibilityLabel={`${HEAD} ${BODY}`}>
          <Title size={32}>
            {head}{n < HEAD.length ? caret : null}<Text style={{ color: 'transparent' }}>{HEAD.slice(head.length)}</Text>
          </Title>
          <Sub style={{ marginTop: 18, fontSize: 17, lineHeight: 25 }}>
            {body}{n >= HEAD.length && !done ? caret : null}<Text style={{ color: 'transparent' }}>{BODY.slice(body.length)}</Text>
          </Sub>
        </View>
      </Pressable>
    </Screen>
  );
}
