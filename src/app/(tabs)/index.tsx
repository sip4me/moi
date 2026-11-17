import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { CardGrid, DoctorNote, Glyph, Logo, MoreRow, RecCard, Screen, SectionCard, Sub } from '../../components/ui';
import { useStore } from '../../state/store';
import { C, F, evidenceStyle } from '../../theme';

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Home() {
  const { plan, done, todayKey, lastWash, logWash, lifeChange } = useStore();
  if (!plan) return null;
  const now = new Date();
  const week = [...Array(7)].map((_, i) => { const d = new Date(now); d.setDate(now.getDate() - now.getDay() + i); return d; });
  const doneToday = done[todayKey] ?? [];
  const streakDays = Object.values(done).filter(v => v.length).length;
  const washCard = plan.cards.find(c => c.id === 'wash_interval');
  const interval = typeof washCard?.value === 'number' ? washCard.value : Number(plan.extras.find(c => c.id === 'wash_interval')?.value ?? 3);
  const since = lastWash ? Math.floor((new Date(todayKey).getTime() - new Date(lastWash).getTime()) / 86400000) : -1;
  const safeInterval = Number.isFinite(interval) && interval > 0 ? interval : 3;
  const daysLeft = since < 0 ? safeInterval : Math.max(0, safeInterval - since);
  const paused = lifeChange && (lifeChange.type === 'Protective style' || lifeChange.type === 'Sick or recovering');
  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo size={36} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.line }}>
          <Glyph name="flame" color="#F08A24" size={16} />
          <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>{streakDays}</Text>
          <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.gray }}>{streakDays === 1 ? 'day' : 'days'}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
        {week.map(d => {
          const key = d.toISOString().slice(0, 10); const isToday = key === todayKey; const did = (done[key] ?? []).length > 0;
          return (
            <View key={key} style={{ flex: 1, maxWidth: 46, alignItems: 'center', gap: 6, paddingVertical: 6, borderRadius: 14, backgroundColor: isToday ? '#fff' : 'transparent', shadowColor: '#000', shadowOpacity: isToday ? 0.08 : 0, shadowRadius: 8 }}>
              <Text style={{ fontFamily: isToday ? F.semibold : F.regular, fontSize: 13, color: d > now ? '#ABABAB' : C.ink }}>{DAY[d.getDay()]}</Text>
              <View style={{ width: 34, height: 34, borderRadius: 17, borderWidth: isToday ? 2 : 1.5, borderColor: isToday ? C.gold : did ? C.ink : '#E3E3E6', borderStyle: did || isToday ? 'solid' : 'dashed', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: F.medium, fontSize: 14, color: d > now ? '#ABABAB' : C.ink }}>{d.getDate()}</Text>
              </View>
            </View>
          );
        })}
      </View>
      <View style={{ alignItems: 'center', marginTop: 20, gap: 6 }}>
        <Svg width={120} height={70} viewBox="0 0 120 70">
          {[[30, 40, 16], [55, 28, 20], [82, 40, 15], [44, 18, 8], [72, 14, 9]].map(([x, y, r], i) => <Circle key={i} cx={x} cy={y} r={r} stroke={C.ink} strokeWidth={2} fill="#fff" />)}
          <Path d="M10 62h100" stroke={C.ink} strokeWidth={2} strokeLinecap="round" />
        </Svg>
        <Text style={{ fontFamily: F.bold, fontSize: 30, color: C.ink, letterSpacing: -0.6 }}>{paused ? 'Wash day paused' : daysLeft === 0 ? 'Wash day today' : `Wash hair in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`}</Text>
        <Pressable onPress={logWash} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: pressed ? '#2E2E2E' : C.ink, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9, marginTop: 6 })}>
          <Glyph id="wash_interval" color="#fff" size={16} /><Text style={{ fontFamily: F.semibold, fontSize: 14, color: '#fff' }}>{since === 0 ? 'Washed today ✓' : 'Log wash'}</Text>
        </Pressable>
      </View>
      {lifeChange ? (
        <Pressable onPress={() => router.push('/(tabs)/profile')} style={{ marginTop: 18, backgroundColor: C.goldSoft, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#F1DDAA' }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.ink }}>{lifeChange.label}</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 12, color: '#7A6A4A', marginTop: 2 }}>{lifeChange.endsAt ? `Until ${new Date(lifeChange.endsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Until you end it'} · your routine is adjusted</Text>
        </Pressable>
      ) : null}
      <View style={{ marginTop: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View><Text style={{ fontFamily: F.semibold, fontSize: 19, color: C.ink }}>Your routine</Text><Sub style={{ fontSize: 12 }}>{plan.target}</Sub></View>
        <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.gray2 }}>{doneToday.length}/{plan.cards.length} today</Text>
      </View>
      <SectionCard style={{ marginTop: 10 }}>
        <CardGrid>{plan.cards.map(c => <RecCard key={c.id} id={c.id} label={c.label} value={c.value} unit={c.unit} done={doneToday.includes(c.id)} onPress={() => router.push(`/why/${c.id}`)} />)}</CardGrid>
        <Sub style={{ fontSize: 12, textAlign: 'center' }}>Tap a card to see why and mark it done.</Sub>
      </SectionCard>
      {plan.learn.length ? <View style={{ gap: 8, marginTop: 14 }}>{plan.learn.map(l => <DoctorNote key={l.id} id={l.id} label={l.label} why={l.why} onPress={() => router.push(`/why/${l.id}`)} />)}</View> : null}
      {plan.extras.length ? (
        <View style={{ gap: 8, marginTop: 16 }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>More you can try</Text>
          {plan.extras.map(c => <MoreRow key={c.id} id={c.id} label={c.label} meta={`${c.value}${c.unit ? ' ' + c.unit : ''} · ${evidenceStyle[c.evidence ?? 'early'].label.toLowerCase()}`} onPress={() => router.push(`/why/${c.id}`)} />)}
        </View>
      ) : null}
    </Screen>
  );
}
