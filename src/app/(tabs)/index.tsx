import { router } from 'expo-router';
import { useState } from 'react';
import { type Day, daysUntilWash, week } from '../../data/schedule';
import { Image, Pressable, Text, View } from 'react-native';
import { icon3d } from '../../data/icons3d';
import { HomeFeed } from '../../components/Feed';
import { GlamourEntry } from '../../components/GlamourEntry';
import { IronMaxxing } from '../../components/IronMaxxing';
import { Trending } from '../../components/Trending';
import { MomentCard } from '../../components/MomentCard';
import { WashDayArt } from '../../components/WashDayArt';
import { SegmentedTabs } from '../../components/SegmentedTabs';
import { Locked, PeekRow } from '../../components/Peek';
import { currentMoment } from '../../data/moments';
import { TwoFrameArt } from '../../components/TwoFrameArt';
import { PINEAPPLE_ART, PINEAPPLE_TIMING } from '../../data/art';
import { haptic } from '../../lib/haptics';
import { profileFromAnswers } from '../../engine/profile';
import { useHour } from '../../lib/useHour';
import { scanStreakWeeks } from '../../data/progress';
import { DoctorNote, Glyph, Logo, MoreRow, RecCard, Screen, Sub } from '../../components/ui';
import { useStore } from '../../state/store';
import { C, F, evidenceStyle } from '../../theme';

/** Peek-row widths: routine cards show the next two peeking in; wider rows show the next one. */
const CARD_W = 150;
const ROW_W = 270;

const TABS = ['Food recipes', 'Care', 'Style'];

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Home() {
  const { plan, done, todayKey, lastWash, lifeChange, scans, answers, toggleDone } = useStore();
  const hour = useHour();
  const [selected, setSelected] = useState(0);
  const [tab, setTab] = useState(0);
  if (!plan) return null;
  const streakWeeksN = scanStreakWeeks(scans);
  const paused = !!lifeChange && (lifeChange.type === 'Protective style' || lifeChange.type === 'Sick or recovering');
  const days = week(plan, lastWash, todayKey, paused);
  const day = days[selected] ?? days[0];
  const doneToday = done[todayKey] ?? [];
  const streakDays = Object.values(done).filter(v => v.length).length;
  const since = lastWash ? Math.round((new Date(todayKey).getTime() - new Date(lastWash).getTime()) / 86400000) : -1;
  const daysLeft = daysUntilWash(plan, lastWash, todayKey);
  // A timely nudge: pineapple at night, pre-wash oil on wash day, oil before a workout ahead of wash day.
  const moment = plan ? currentMoment({ hour, plan, profile: profileFromAnswers(answers), washToday: days[0]?.isWash ?? false, washTomorrow: days[1]?.isWash ?? false, washedToday: since === 0, doneToday }) : null;
  // Bedtime: the pineapple takes the animation spot at the top, and shows small in today's routine row.
  const pineapple = moment?.kind === 'pineapple';
  const routineItems = pineapple && day.isToday && !day.items.some(c => c.id === 'night_braid')
    ? [{ id: 'night_braid', icon: 'night_braid', label: 'Pineapple', value: 'Before bed', unit: '' } as (typeof day.items)[number], ...day.items]
    : day.items;
  const dayName = (d: Day) => (d.isToday ? 'Today' : d.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }));
  return (
    <Screen scroll tab="index">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo size={36} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.line }}>
          <Glyph name="flame" color="#F08A24" size={16} />
          <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>{streakDays}</Text>
          <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.gray }}>{streakDays === 1 ? 'day' : 'days'}</Text>
        </View>
      </View>

      {/* The next seven days. Each day shows a drop on wash days and how many steps are planned. */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
        {days.map((d, i) => {
          const on = i === selected;
          const did = (done[d.key] ?? []).length > 0;
          return (
            <Pressable key={d.key} onPress={() => setSelected(i)} accessibilityRole="tab" accessibilityState={{ selected: on }}
              accessibilityLabel={`${dayName(d)}${d.isWash ? ', wash day' : ''}, ${d.items.length} steps`}
              style={{ flex: 1, maxWidth: 48, alignItems: 'center', gap: 5, paddingVertical: 6, borderRadius: 14, backgroundColor: on ? '#fff' : 'transparent', shadowColor: '#000', shadowOpacity: on ? 0.08 : 0, shadowRadius: 8 }}>
              <Text style={{ fontFamily: on ? F.semibold : F.regular, fontSize: 12, color: C.ink }}>{d.isToday ? 'Today' : DAY[d.date.getDay()]}</Text>
              <View style={{ width: 34, height: 34, borderRadius: 17, borderWidth: on ? 2 : 1.5, borderColor: on ? C.gold : did ? C.ink : '#E3E3E6', borderStyle: did || on ? 'solid' : 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: d.isWash ? '#EEF3FD' : 'transparent' }}>
                <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.ink }}>{d.date.getDate()}</Text>
              </View>
              <View style={{ height: 6, flexDirection: 'row', gap: 2 }}>
                {d.isWash ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.blue }} /> : null}
                {d.items.length > (d.isWash ? 1 : 0) ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#CFC9BD' }} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={{ alignItems: 'center', marginTop: 20, gap: 6 }}>
        {pineapple ? <TwoFrameArt spec={PINEAPPLE_ART} timing={PINEAPPLE_TIMING} width={128} /> : <WashDayArt width={128} />}
        <Text style={{ fontFamily: F.bold, fontSize: 30, color: C.ink, letterSpacing: -0.6 }}>{paused ? 'Wash day paused' : daysLeft === 0 ? 'Wash day today' : `Wash hair in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`}</Text>
      </View>
      {moment && !pineapple ? <MomentCard moment={moment} onDone={() => toggleDone(moment.doneId)} /> : null}
      {lifeChange ? (
        <Pressable onPress={() => router.push('/(tabs)/profile')} style={{ marginTop: 18, backgroundColor: C.goldSoft, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#F1DDAA' }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.ink }}>{lifeChange.label}</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 12, color: '#7A6A4A', marginTop: 2 }}>{lifeChange.endsAt ? `Until ${new Date(lifeChange.endsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Until you end it'} · your routine is adjusted</Text>
        </Pressable>
      ) : null}
      <View style={{ marginTop: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View><Text style={{ fontFamily: F.semibold, fontSize: 19, color: C.ink }}>{day.isToday ? 'Your routine' : dayName(day)}</Text><Sub style={{ fontSize: 12 }}>{day.isWash ? 'Wash day · ' : ''}{plan.target}</Sub></View>
        {day.isToday ? <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.gray2 }}>{routineItems.filter(c => doneToday.includes(c.id)).length}/{routineItems.length} today</Text> : null}
      </View>
      {day.wash.length ? (
        <Locked radius={24} label={plan.washRoutine.headline} style={{ marginTop: 10 }}>
        <Pressable onPress={() => router.push({ pathname: '/wash-day', params: { day: day.key } })}
          style={({ pressed }) => ({ borderRadius: 24, padding: 16, backgroundColor: pressed ? '#E4ECFB' : '#EEF3FD' })}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink, flex: 1 }}>{plan.washRoutine.headline}</Text>
            <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.gray2 }}>{day.isToday ? `${day.wash.filter(w => doneToday.includes(`wash:${w.id}`)).length}/${day.wash.length}` : `${day.wash.length} steps`} ›</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {day.wash.map(w => (
              <View key={w.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 999, paddingLeft: 4, paddingRight: 10, paddingVertical: 3 }}>
                <Image source={icon3d(w.icon)} style={{ width: 22, height: 22 }} resizeMode="contain" />
                <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.ink, textDecorationLine: doneToday.includes(`wash:${w.id}`) ? 'line-through' : 'none' }}>{w.title}</Text>
              </View>
            ))}
          </View>
        </Pressable>
        </Locked>
      ) : null}
      {/* Routine cards in a peek row: the first sits on the page margin, the rest peek in from the right. */}
      <View style={{ marginTop: 12 }}>
        {routineItems.length ? (
          <PeekRow itemWidth={CARD_W}>
            {routineItems.map(c => (
              <Locked key={c.id} label={c.label}>
                <View style={{ borderRadius: 16, borderWidth: 1, borderColor: C.line, overflow: 'hidden' }}>
                  {pineapple && day.isToday && c.id === 'night_braid'
                    ? <RecCard id={c.id} label={c.label} value={c.value} unit={c.unit} done={doneToday.includes(c.id)}
                        art={<TwoFrameArt spec={PINEAPPLE_ART} timing={PINEAPPLE_TIMING} width={64} />}
                        onPress={() => { if (!doneToday.includes(c.id)) haptic('success'); toggleDone(c.id); }} />
                    : <RecCard id={c.id} icon={c.icon} label={c.label} value={c.value} unit={c.unit} done={day.isToday && doneToday.includes(c.id)} onPress={() => router.push(c.id === 'iron_food' ? '/iron' : `/why/${c.id}`)} />}
                </View>
              </Locked>
            ))}
          </PeekRow>
        ) : <Sub style={{ fontSize: 14, textAlign: 'center', paddingVertical: 12 }}>Rest day. Nothing planned.</Sub>}
        <Sub style={{ fontSize: 12, textAlign: 'center', marginTop: 10 }}>{day.isToday ? 'Tap a card to see why and mark it done.' : 'A preview. It updates when you log a wash or change a card.'}</Sub>
      </View>
      {/* Everything else, sorted into three tabs: food, care and style. */}
      <View style={{ marginTop: 26 }}>
        <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} />
      </View>
      {tab === 0 ? <IronMaxxing /> : null}
      {tab === 1 ? <>
        {plan.learn.length ? (
          <View style={{ marginTop: 18 }}>
            <PeekRow itemWidth={ROW_W}>{plan.learn.map(l => <Locked key={l.id} label={l.label}><DoctorNote id={l.id} label={l.label} why={l.why} onPress={() => router.push(`/why/${l.id}`)} /></Locked>)}</PeekRow>
          </View>
        ) : null}
        {plan.extras.length ? (
          <View style={{ gap: 8, marginTop: 18 }}>
            <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>More you can try</Text>
            <PeekRow itemWidth={ROW_W}>
              {plan.extras.map(c => (
                <Locked key={c.id} label={c.label} radius={14}>
                  <View style={{ borderRadius: 14, borderWidth: 1, borderColor: C.line, overflow: 'hidden' }}>
                    <MoreRow id={c.id} label={c.label} meta={`${c.value}${c.unit ? ' ' + c.unit : ''} · ${evidenceStyle[c.evidence ?? 'early'].label.toLowerCase()}`} onPress={() => router.push(`/why/${c.id}`)} />
                  </View>
                </Locked>
              ))}
            </PeekRow>
          </View>
        ) : null}
        <GlamourEntry />
        <HomeFeed streakWeeks={streakWeeksN} only={['care', 'rituals']} />
      </> : null}
      {tab === 2 ? <>
        <Trending />
        <HomeFeed streakWeeks={streakWeeksN} only={['styles']} withRecords />
      </> : null}
    </Screen>
  );
}
