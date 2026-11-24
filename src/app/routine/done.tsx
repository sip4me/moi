import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { celebrate } from '../../components/routine/Celebrate';
import { GlassCard } from '../../components/routine/Glass';
import { Btn, Shell, st } from '../../components/routine/Kit';
import { enablePush } from '../../lib/push';
import { setRoutine, useRoutine } from '../../lib/routine/model';
import { C, F } from '../../theme';

const crown = require('../../../assets/crown-pink.png');
const ARing = Animated.createAnimatedComponent(Circle);

/**
 * After checkout: the win. The fit ring counts up from the old score to the new one, then two one-tap
 * opt-ins that keep people coming back: routine reminders and price-drop alerts on what they just bought.
 */
export default function Done() {
  const p = useLocalSearchParams<{ from?: string; to?: string; n?: string; buy?: string }>();
  const s = useRoutine();
  const from = Number(p.from ?? 0), to = Number(p.to ?? from), n = Number(p.n ?? 0);
  const v = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(from);
  const [remind, setRemind] = useState(true);
  const [alerts, setAlerts] = useState(true);
  const [note, setNote] = useState('');

  useEffect(() => {
    const id = v.addListener(({ value }) => setShown(Math.round(from + (to - from) * value)));
    Animated.timing(v, { toValue: 1, duration: 1400, delay: 300, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(() => { if (to > from) celebrate(`Fit ${from} → ${to}`, true); });
    return () => v.removeListener(id);
  }, []);

  const R = 64, L = 2 * Math.PI * R;
  const dash = v.interpolate({ inputRange: [0, 1], outputRange: [L * (1 - from / 100), L * (1 - to / 100)] });

  const turnOn = async () => {
    setRoutine(r => ({ ...r, prefs: { ...(r.prefs ?? {}), alerts: [alerts ? 'price' : '', remind ? 'reminders' : ''].filter(Boolean) } }));
    if (remind || alerts) {
      const res = await enablePush().catch(() => 'unsupported' as const);
      if (res === 'needs-home-screen') return setNote('Add Moi to your home screen first, then turn alerts on from there.');
      if (res === 'denied') return setNote('Notifications are blocked in your browser settings.');
      if (res === 'unsupported') setNote('This browser can’t show notifications. We’ll show alerts in the app.');
    }
    router.replace({ pathname: '/routine/build', params: { area: (s.areas ?? ['hair'])[0] ?? 'hair' } });
  };

  const opt = (on: boolean, set: (b: boolean) => void, title: string, sub: string, icon: string) => (
    <Pressable onPress={() => set(!on)} accessibilityRole="switch" accessibilityState={{ checked: on }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: on ? '#F5F6FD' : '#fff', borderWidth: 1.5, borderColor: on ? '#8F99E6' : '#E3E5EB' }}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>{title}</Text>
        <Text style={st.meta}>{sub}</Text>
      </View>
      <View style={{ width: 40, height: 24, borderRadius: 12, backgroundColor: on ? '#6E7BD9' : '#D5D8DE', padding: 3, alignItems: on ? 'flex-end' : 'flex-start' }}>
        <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' }} />
      </View>
    </Pressable>
  );

  return (
    <Shell glass active="shop">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }}>
        <GlassCard solid style={{ width: '100%', maxWidth: 440, alignItems: 'center', gap: 16, paddingVertical: 28 }}>
          <Image source={crown} style={{ width: 56, height: 56, transform: [{ rotate: '-12deg' }] }} resizeMode="contain" />
          <Text style={{ fontFamily: F.display, fontSize: 32, lineHeight: 36, color: C.ink }}>You’re set</Text>
          <View style={{ width: 150, height: 150, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={150} height={150} style={{ position: 'absolute' }}>
              <Circle cx={75} cy={75} r={R} stroke="#E2E4EA" strokeWidth={10} fill="none" />
              <ARing cx={75} cy={75} r={R} stroke="#6E7BD9" strokeWidth={10} fill="none" strokeLinecap="round" strokeDasharray={`${L} ${L}`} strokeDashoffset={dash as any} transform="rotate(-90 75 75)" />
            </Svg>
            <Text style={{ fontFamily: F.display, fontSize: 44, lineHeight: 48, color: C.ink }}>{shown}</Text>
            <Text style={st.meta}>routine fit</Text>
          </View>
          <Text style={[st.sub, { textAlign: 'center' }]}>{`${n} pick${n === 1 ? '' : 's'} added to your routine'.'`}</Text>
          <View style={{ alignSelf: 'stretch', gap: 10 }}>
            {opt(remind, setRemind, 'Routine reminders', 'Morning and evening, two taps a day', '⏰')}
            {opt(alerts, setAlerts, 'Price-drop alerts', `On ${n === 1 ? 'this pick' : `these ${n} picks`}`, '↓')}
          </View>
          {note ? <Text style={[st.meta, { textAlign: 'center', color: '#B42318' }]}>{note}</Text> : null}
          <Btn label={remind || alerts ? 'Turn on' : 'Done'} onPress={turnOn} glow style={{ alignSelf: 'stretch' }} />
          <Pressable onPress={() => router.replace({ pathname: '/routine/build', params: { area: (s.areas ?? ['hair'])[0] ?? 'hair' } })} accessibilityRole="button" hitSlop={8}><Text style={{ fontFamily: F.semibold, fontSize: 14, color: '#5B67C9' }}>Maybe later</Text></Pressable>
        </GlassCard>
      </View>
    </Shell>
  );
}
