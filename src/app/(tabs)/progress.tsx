import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { JointStreaks } from '../../components/JointStreaks';
import { Screen, Title } from '../../components/ui';
import { healthScore, scanStreakWeeks } from '../../data/progress';
import { haptic } from '../../lib/haptics';
import { loadScanSessions, type ScanSession } from '../../lib/scans';
import { useStore } from '../../state/store';
import { SectionTitle } from '../../components/Tile';
import { C, F, SPACE, surface } from '../../theme';

const GOAL = 85;
const RANGES = { '4W': 28, '12W': 84, '6M': 182, All: Infinity } as const;
type Range = keyof typeof RANGES;
const DAY = 86400000;
const short = (t: number | string) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const CROWN = require('../../../assets/crown-pink.png');

const card = { ...surface, padding: 18 } as const;
const Pill = ({ children, tone = 'white' }: { children: React.ReactNode; tone?: 'white' | 'green' }) => (
  <View style={{ alignSelf: 'flex-start', backgroundColor: tone === 'green' ? C.greenSoft : '#F2F2F3', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 }}>
    <Text style={{ fontFamily: F.semibold, fontSize: 12, color: tone === 'green' ? C.greenText : C.ink }}>{children}</Text>
  </View>
);

/** Segmented control: grey track, the active option a solid black pill (Figma 04 · Progress). */
function Segmented<T extends string>({ options, value, onChange }: { options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: '#E9E9EB', borderRadius: 999, padding: 3 }}>
      {options.map(o => (
        <Pressable key={o} onPress={() => { haptic('select'); onChange(o); }} accessibilityRole="tab" accessibilityState={{ selected: o === value }}
          style={{ paddingHorizontal: 14, height: 32, borderRadius: 999, justifyContent: 'center', backgroundColor: o === value ? C.ink : 'transparent' }}>
          <Text style={{ fontFamily: F.medium, fontSize: 14, color: o === value ? '#fff' : C.gray2 }}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Smooth line through the points (Catmull-Rom → cubic Bézier). */
const smooth = (xy: number[][]) => xy.reduce((d, [x, y], i) => {
  if (!i) return `M${x} ${y}`;
  const [x0, y0] = xy[i - 2] ?? xy[i - 1], [x1, y1] = xy[i - 1], [x3, y3] = xy[i + 1] ?? [x, y];
  return `${d} C${x1 + (x - x0) / 6} ${y1 + (y - y0) / 6} ${x - (x3 - x1) / 6} ${y - (y3 - y1) / 6} ${x} ${y}`;
}, '');

function Trend({ points, from, to }: { points: { t: number; score: number }[]; from: number; to: number }) {
  const W = 310, H = 130, padX = 8, top = 22, bottom = 10;
  const lo = Math.min(GOAL, ...points.map(p => p.score)) - 12, hi = Math.max(GOAL + 3, ...points.map(p => p.score));
  const X = (t: number) => padX + ((t - from) / Math.max(1, to - from)) * (W - padX * 2);
  const Y = (s: number) => top + (1 - (s - lo) / (hi - lo)) * (H - top - bottom);
  const xy = points.map(p => [+X(p.t).toFixed(1), +Y(p.score).toFixed(1)]);
  const line = smooth(xy);
  const goalY = Y(GOAL);
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <Defs><LinearGradient id="trend" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={C.ink} stopOpacity={0.14} /><Stop offset="1" stopColor={C.ink} stopOpacity={0.02} /></LinearGradient></Defs>
      <Line x1={0} x2={W} y1={goalY} y2={goalY} stroke={C.gold} strokeWidth={1.2} strokeDasharray="4 4" />
      {xy.length > 1 ? <Path d={`${line} L${xy[xy.length - 1][0]} ${H} L${xy[0][0]} ${H} Z`} fill="url(#trend)" /> : null}
      <Path d={line} stroke={C.ink} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      {xy.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={i === xy.length - 1 ? 5 : 3.5} fill="#fff" stroke={C.ink} strokeWidth={2} />)}
    </Svg>
  );
}

function PhotoTile({ session, label }: { session?: ScanSession; label: string }) {
  const uri = session && (session.photos.crown ?? Object.values(session.photos)[0]);
  return (
    <View style={{ flex: 1, aspectRatio: 1.13, borderRadius: 22, overflow: 'hidden', backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' }}>
      {uri ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        : <Image source={CROWN} style={{ width: 54, height: 54, opacity: 0.9 }} resizeMode="contain" />}
      <View style={{ position: 'absolute', left: 10, bottom: 10, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.ink }}>{label}</Text>
      </View>
    </View>
  );
}

export default function Progress() {
  const { scans } = useStore();
  const [range, setRange] = useState<Range>('12W');
  const [sessions, setSessions] = useState<ScanSession[] | null>(null);
  useEffect(() => { loadScanSessions().then(setSessions).catch(() => setSessions([])); }, [scans.length]);

  const history = useMemo(() => [...scans].reverse().map(s => ({ t: new Date(s.at).getTime(), score: healthScore(s.metrics) })), [scans]);
  const now = Date.now();
  const from = range === 'All' ? (history[0]?.t ?? now - 84 * DAY) : now - RANGES[range] * DAY;
  const shown = history.filter(p => p.t >= from);
  const latest = history[history.length - 1];
  const change = shown.length > 1 ? shown[shown.length - 1].score - shown[0].score : 0;
  const streak = scanStreakWeeks(scans);
  const ticks = [0, 1, 2, 3].map(i => from + ((now - from) * i) / 3);
  const withPhotos = (sessions ?? []).filter(s => Object.keys(s.photos).length);
  const first = withPhotos[0], last = withPhotos[withPhotos.length - 1];

  return (
    <Screen scroll tab="progress">
      <Title>Progress</Title>

      <View style={{ flexDirection: 'row', gap: 14, marginTop: 24 }}>
        <View style={[card, { flex: 1, gap: 6 }]}>
          <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.gray2 }}>Hair health</Text>
          <Text style={{ fontFamily: F.bold, fontSize: 30, letterSpacing: -0.6, color: C.ink }}>{latest?.score ?? '—'}<Text style={{ fontFamily: F.regular, fontSize: 15, color: C.gray }}> /100</Text></Text>
          <Pill>Goal {GOAL}</Pill>
        </View>
        <View style={[card, { flex: 1, gap: 6 }]}>
          <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.gray2 }}>Scan streak</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Image source={CROWN} style={{ width: 30, height: 30 }} resizeMode="contain" />
            <Text numberOfLines={1} style={{ fontFamily: F.bold, fontSize: 30, letterSpacing: -0.6, color: C.ink }}>{streak}<Text style={{ fontFamily: F.regular, fontSize: 15, letterSpacing: 0, color: C.gray }}> {streak === 1 ? 'week' : 'weeks'}</Text></Text>
          </View>
          <Pill>Next scan: Sun</Pill>
        </View>
      </View>

      <View style={{ marginTop: SPACE.section }}>
      <SectionTitle right={shown.length > 1 ? <Pill tone={change >= 0 ? 'green' : 'white'}>{change >= 0 ? '↑' : '↓'} {Math.abs(change)} pts</Pill> : undefined}>Hair health trend</SectionTitle>
      <View style={[card, { gap: 16 }]}>
        <Segmented options={Object.keys(RANGES) as Range[]} value={range} onChange={setRange} />
        <View>
          <Text style={{ position: 'absolute', right: 2, top: 0, fontFamily: F.medium, fontSize: 12, color: C.gold }}>Goal {GOAL}</Text>
          {shown.length ? <Trend points={shown} from={from} to={now} /> : (
            <View style={{ height: 130, justifyContent: 'center' }}>
              <View style={{ position: 'absolute', left: 0, right: 0, top: 30, borderTopWidth: 1.2, borderColor: C.gold, borderStyle: 'dashed' }} />
              <Text style={{ fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.gray2, textAlign: 'center', paddingHorizontal: 16 }}>Your trend appears after your first scan. Tap + and choose Scan hair.</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {ticks.map(t => <Text key={t} style={{ fontFamily: F.regular, fontSize: 12, color: C.gray }}>{short(t)}</Text>)}
        </View>
      </View>
      </View>

      <View style={{ marginTop: SPACE.section }}>
        <SectionTitle right={first && last && first !== last ? (
          <Pressable onPress={() => router.push('/compare')} hitSlop={10}>
            <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink, textDecorationLine: 'underline', marginBottom: 3 }}>Compare</Text>
          </Pressable>
        ) : undefined}>Photo progress</SectionTitle>
      </View>
      {first ? (
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <PhotoTile session={first} label={short(first.at)} />
          {last !== first ? <PhotoTile session={last} label={short(last.at)} /> : <PhotoTile label="Next scan" />}
        </View>
      ) : (
        <Pressable onPress={() => router.push('/scan')} style={{ flexDirection: 'row', gap: 14 }}>
          <PhotoTile label={sessions === null ? 'Loading…' : 'First scan'} />
          <PhotoTile label="In 2 weeks" />
        </Pressable>
      )}
      <JointStreaks />
    </Screen>
  );
}
