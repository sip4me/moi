import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { C, F } from '../theme';

const pad = (n: number) => String(n).padStart(2, '0');

/** Bottom of Home: time until the daily routine resets at local midnight, with how much of today has passed. */
export function ResetCountdown() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const left = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  const passed = (now.getTime() - start.getTime()) / (midnight.getTime() - start.getTime());
  const h = Math.floor(left / 3600), m = Math.floor((left % 3600) / 60), s = left % 60;
  return (
    <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 8 }} accessibilityRole="timer" accessibilityLabel={`Your goal resets in ${h} hours and ${m} minutes`}>
      <Text style={{ fontFamily: F.semibold, fontSize: 10, letterSpacing: 2, color: C.gray }}>YOUR GOAL RESETS IN</Text>
      <Text style={{ fontFamily: F.display, fontSize: 34, lineHeight: 40, letterSpacing: 2, color: C.ink, marginTop: 4, fontVariant: ['tabular-nums'] }}>{pad(h)}:{pad(m)}:{pad(s)}</Text>
      <View style={{ width: '44%', height: 4, borderRadius: 2, backgroundColor: '#EFEFF1', marginTop: 10, overflow: 'hidden' }}>
        <View style={{ width: `${Math.max(2, Math.round(passed * 100))}%`, height: 4, borderRadius: 2, backgroundColor: '#E9A8BF' }} />
      </View>
    </View>
  );
}
