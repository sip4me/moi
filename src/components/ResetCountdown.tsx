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
    <View style={{ alignItems: 'center', marginTop: 56, marginBottom: 12 }} accessibilityRole="timer" accessibilityLabel={`Your routine resets in ${h} hours and ${m} minutes`}>
      <Text style={{ fontFamily: F.semibold, fontSize: 12, letterSpacing: 2.4, color: C.gray }}>YOUR ROUTINE RESETS IN</Text>
      <Text style={{ fontFamily: F.display, fontSize: 64, lineHeight: 72, letterSpacing: 3, color: C.ink, marginTop: 6, fontVariant: ['tabular-nums'] }}>{pad(h)}:{pad(m)}:{pad(s)}</Text>
      <View style={{ width: '62%', height: 5, borderRadius: 3, backgroundColor: '#EFEFF1', marginTop: 14, overflow: 'hidden' }}>
        <View style={{ width: `${Math.max(2, Math.round(passed * 100))}%`, height: 5, borderRadius: 3, backgroundColor: '#E9A8BF' }} />
      </View>
    </View>
  );
}
