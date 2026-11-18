import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, Pressable, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import { Button, Screen, TopBar } from '../../components/ui';
import { goNext } from '../../data/flow';
import { PLANS, TRIAL_DAYS, startCheckout, trialEndLabel } from '../../lib/billing';
import { haptic } from '../../lib/haptics';
import { useStore } from '../../state/store';
import { C, F } from '../../theme';

const R = 130;
/** Six slices, each price twice. The spin always stops on a $19.99 slice: the offer this screen gives. */
const SLICES = [
  { price: '$29.99', fill: '#FFF4DC' },
  { price: '$19.99', fill: '#F3D58A' },
  { price: '$13.99', fill: '#F7C9D8' },
  { price: '$29.99', fill: '#FFF4DC' },
  { price: '$19.99', fill: '#F3D58A' },
  { price: '$13.99', fill: '#F7C9D8' },
];
const SEG = 360 / SLICES.length;
const WIN = [1, 4]; // the $19.99 slices
const CROWN = require('../../../assets/crown-pink.png');

/** One wedge of the wheel, from angle a0 to a1 (degrees, 0 = top, clockwise). */
function wedge(a0: number, a1: number) {
  const p = (a: number) => [R + R * Math.sin((a * Math.PI) / 180), R - R * Math.cos((a * Math.PI) / 180)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${R} ${R}L${x0} ${y0}A${R} ${R} 0 0 1 ${x1} ${y1}Z`;
}

/**
 * The exit offer after "Not now": spin the wheel for a better yearly price. Every slice is the same
 * real prize ($19.99 a year), so the spin is a playful reveal, never a promise of something else.
 */
export default function Offer() {
  const { answers, setSubscribed } = useStore();
  const fromHome = useLocalSearchParams<{ from?: string }>().from === 'home';
  const spin = useRef(new Animated.Value(0)).current;
  const [stage, setStage] = useState<'ready' | 'spinning' | 'won'>('ready');
  const [target, setTarget] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const offer = PLANS.moi_yearly_offer;
  const leave = () => (fromHome ? router.replace('/(tabs)') : goNext('paywall', answers));

  function go() {
    if (stage !== 'ready') return;
    // Bring a $19.99 slice's middle (give or take a little, so it feels natural) under the pointer.
    const i = WIN[Math.floor(Math.random() * WIN.length)];
    const jitter = (Math.random() - 0.5) * SEG * 0.5;
    setTarget(360 * 5 - (i * SEG + SEG / 2) + jitter);
    setStage('spinning');
    haptic('tap');
    Animated.timing(spin, { toValue: 1, duration: 3400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => { haptic('success'); setStage('won'); });
  }

  async function claim() {
    setBusy(true); setErr('');
    try {
      const live = await startCheckout('moi_yearly_offer');
      if (!live) { setSubscribed(true); setBusy(false); leave(); }
    } catch {
      setBusy(false); setErr('Checkout couldn’t open. Check your connection and try again.');
    }
  }

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${target}deg`] });

  return (
    <Screen footer={stage === 'won' ? <>
      <Text style={{ textAlign: 'center', fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: C.gray2, marginBottom: 10 }}>
        {TRIAL_DAYS} days free, then {offer.price} a year. Cancel before {trialEndLabel()} and you won’t be charged.
      </Text>
      <Button label={busy ? 'Opening checkout…' : `Claim ${offer.price} a year`} onPress={claim} disabled={busy} />
      {busy ? <ActivityIndicator style={{ marginTop: 8 }} color={C.gray} /> : null}
      {err ? <Text style={{ textAlign: 'center', fontFamily: F.regular, fontSize: 13, color: '#B4372B', marginTop: 8 }}>{err}</Text> : null}
      <Pressable onPress={leave} hitSlop={10} style={{ alignSelf: 'center', paddingVertical: 8 }}>
        {({ pressed }) => <Text style={{ fontFamily: F.medium, fontSize: 14, color: pressed ? C.gray : C.gray2 }}>No thanks</Text>}
      </Pressable>
    </> : <Button label={stage === 'spinning' ? 'Spinning…' : 'Spin the wheel'} onPress={go} disabled={stage !== 'ready'} />}>
      <TopBar />
      <View style={{ alignItems: 'center', gap: 8, marginTop: 4 }}>
        <Text style={{ fontFamily: F.bold, fontSize: 28, letterSpacing: -0.6, color: C.ink, textAlign: 'center' }}>{stage === 'won' ? 'You’re in luck!' : 'Wait, feeling lucky?'}</Text>
        <Text style={{ fontFamily: F.regular, fontSize: 15, lineHeight: 21, minHeight: 42, color: C.gray2, textAlign: 'center' }}>
          {stage === 'won' ? `Moi yearly for ${offer.price} instead of ${PLANS.moi_yearly.price}. This price is only on this screen.` : 'Spin once for a better price on Moi yearly.'}
        </Text>
      </View>
      <View style={{ alignItems: 'center', marginTop: 28 }}>
        {/* Pointer */}
        <Svg width={28} height={22} viewBox="0 0 28 22" style={{ marginBottom: -8, zIndex: 2 }}><Path d="M14 22L2 2h24z" fill={C.ink} /></Svg>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Svg width={R * 2} height={R * 2} viewBox={`0 0 ${R * 2} ${R * 2}`}>
            {SLICES.map((sl, i) => {
              const a0 = SEG * i, a1 = a0 + SEG, mid = (a0 + a1) / 2;
              return (
                <G key={i}>
                  <Path d={wedge(a0, a1)} fill={sl.fill} stroke="#fff" strokeWidth={2} />
                  <G rotation={mid} origin={`${R}, ${R}`}>
                    <SvgText x={R} y={50} fill={C.ink} fontSize={20} fontFamily={F.bold} textAnchor="middle">{sl.price}</SvgText>
                    <SvgText x={R} y={68} fill="#5A5A5F" fontSize={12} fontFamily={F.regular} textAnchor="middle">a year</SvgText>
                  </G>
                </G>
              );
            })}
            <Circle cx={R} cy={R} r={R - 1} fill="none" stroke="#C9A24A" strokeWidth={3} />
            <Circle cx={R} cy={R} r={26} fill="#fff" stroke="#C9A24A" strokeWidth={3} />
          </Svg>
        </Animated.View>
        {/* The brand's pink crown sits in the hub and stays upright while the wheel turns. */}
        <Image source={CROWN} accessibilityIgnoresInvertColors style={{ position: 'absolute', top: 14 + R - 15, width: 32, height: 32 * 865 / 852 - 2, alignSelf: 'center' }} resizeMode="contain" />
      </View>
    </Screen>
  );
}
