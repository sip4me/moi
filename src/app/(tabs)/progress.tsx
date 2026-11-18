import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { Chip, Screen, SectionCard, Sub, Title } from '../../components/ui';
import { healthScore, scanStreakWeeks } from '../../data/progress';
import { ANGLES, type Angle, loadScanSessions, type ScanSession } from '../../lib/scans';
import { useStore } from '../../state/store';
import { C, F } from '../../theme';

const GOAL = 85;
const RANGES = { '4W': 28, '12W': 84, '6M': 182, All: Infinity } as const;
type Range = keyof typeof RANGES;
const short = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function Trend({ points }: { points: { at: string; score: number }[] }) {
  const W = 300, H = 120, pad = 10;
  const lo = Math.min(GOAL, ...points.map(p => p.score)) - 10, hi = 100;
  const t0 = new Date(points[0].at).getTime(), t1 = Math.max(t0 + 1, new Date(points[points.length - 1].at).getTime());
  const xy = points.map(p => [pad + ((new Date(p.at).getTime() - t0) / (t1 - t0)) * (W - pad * 2), pad + (1 - (p.score - lo) / (hi - lo)) * (H - pad * 2)]);
  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const goalY = pad + (1 - (GOAL - lo) / (hi - lo)) * (H - pad * 2);
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs><LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={C.ink} stopOpacity={0.12} /><Stop offset="1" stopColor={C.ink} stopOpacity={0} /></LinearGradient></Defs>
      <Line x1={pad} x2={W - pad} y1={goalY} y2={goalY} stroke={C.gold} strokeWidth={1.2} strokeDasharray="4 4" />
      {xy.length > 1 ? <Path d={`${line} L${xy[xy.length - 1][0]} ${H} L${xy[0][0]} ${H} Z`} fill="url(#fill)" /> : null}
      <Path d={line} stroke={C.ink} strokeWidth={2} fill="none" strokeLinejoin="round" />
      {xy.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={i === xy.length - 1 ? 4.5 : 3} fill="#fff" stroke={C.ink} strokeWidth={2} />)}
    </Svg>
  );
}

export default function Progress() {
  const { plan, done, scans } = useStore();
  const [range, setRange] = useState<Range>('12W');
  const [angle, setAngle] = useState<Angle>('crown');
  const [sessions, setSessions] = useState<ScanSession[] | null>(null);
  useEffect(() => { loadScanSessions().then(setSessions).catch(() => setSessions([])); }, [scans.length]);

  const history = useMemo(() => [...scans].reverse().map(s => ({ at: s.at, score: healthScore(s.metrics) })), [scans]);
  const since = Date.now() - RANGES[range] * 86400000;
  const shown = history.filter(p => new Date(p.at).getTime() >= since);
  const latest = history[history.length - 1];
  const change = shown.length > 1 ? shown[shown.length - 1].score - shown[0].score : 0;
  const streak = scanStreakWeeks(scans);
  const withAngle = (sessions ?? []).filter(s => s.photos[angle]);
  const first = withAngle[0], last = withAngle[withAngle.length - 1];
  const days = Object.entries(done).filter(([, v]) => v.length).sort(([a], [b]) => b.localeCompare(a)).slice(0, 7);

  return (
    <Screen scroll>
      <Title>Progress</Title>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <SectionCard style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray }}>Hair health</Text>
          <Text style={{ fontFamily: F.bold, fontSize: 26, color: C.ink }}>{latest?.score ?? '—'}<Text style={{ fontFamily: F.regular, fontSize: 13, color: C.gray }}>/100</Text></Text>
          <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.gray2 }}>Goal {GOAL}</Text>
        </SectionCard>
        <SectionCard style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray }}>Scan streak</Text>
          <Text style={{ fontFamily: F.bold, fontSize: 26, color: C.ink }}>{streak} <Text style={{ fontFamily: F.semibold, fontSize: 16 }}>{streak === 1 ? 'week' : 'weeks'}</Text></Text>
          <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.gray2 }}>Next scan: Sun</Text>
        </SectionCard>
      </View>

      <SectionCard style={{ marginTop: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>Hair health</Text>
          {shown.length > 1 ? <Text style={{ fontFamily: F.semibold, fontSize: 12, color: change >= 0 ? C.greenText : C.red }}>{change >= 0 ? '↑' : '↓'} {Math.abs(change)} pts</Text> : null}
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>{(Object.keys(RANGES) as Range[]).map(r => <Chip key={r} label={r} on={r === range} onPress={() => setRange(r)} />)}</View>
        {shown.length ? (
          <>
            <Trend points={shown} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: F.regular, fontSize: 11, color: C.gray }}>{short(shown[0].at)}</Text>
              <Text style={{ fontFamily: F.regular, fontSize: 11, color: C.gold }}>Goal {GOAL}</Text>
              <Text style={{ fontFamily: F.regular, fontSize: 11, color: C.gray }}>{short(shown[shown.length - 1].at)}</Text>
            </View>
          </>
        ) : <Sub style={{ fontSize: 14 }}>Your trend appears after your first scan. Tap + and choose Scan hair.</Sub>}
      </SectionCard>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 10 }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 17, color: C.ink }}>Photo progress</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>{ANGLES.map(a => <Chip key={a.id} label={a.title} on={a.id === angle} onPress={() => setAngle(a.id)} />)}</View>
      </View>
      {first && last ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[first, last].map((s, i) => (
            <View key={s.id + i} style={{ flex: 1, aspectRatio: 0.85, borderRadius: 18, overflow: 'hidden', backgroundColor: '#111' }}>
              <Image source={{ uri: s.photos[angle] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <View style={{ position: 'absolute', left: 8, bottom: 8, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ fontFamily: F.semibold, fontSize: 11, color: C.ink }}>{withAngle.length > 1 ? short(s.at) : 'First scan'}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Pressable onPress={() => router.push('/scan')} style={({ pressed }) => ({ borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D6D6D9', padding: 22, alignItems: 'center', backgroundColor: pressed ? C.pressed : 'transparent' })}>
          <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>{sessions === null ? 'Loading photos…' : 'Take your first scan'}</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.gray2, marginTop: 4 }}>Photos from the same angle line up here so you can compare.</Text>
        </Pressable>
      )}

      <SectionCard label="ROUTINE DAYS" style={{ marginTop: 22 }}>
        {days.length ? days.map(([d, ids]) => (
          <View key={d} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.ink }}>{new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
            <Text style={{ fontFamily: F.regular, fontSize: 15, color: C.gray2 }}>{ids.length} of {plan?.cards.length ?? ids.length} done</Text>
          </View>
        )) : <Sub style={{ fontSize: 14 }}>Mark a routine card done on Home and it shows up here.</Sub>}
      </SectionCard>
    </Screen>
  );
}
