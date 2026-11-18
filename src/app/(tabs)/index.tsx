import { router } from 'expo-router';
import { useState } from 'react';
import { type Day, calendar, daysUntilWash, week } from '../../data/schedule';
import { HomeCalendar } from '../../components/HomeCalendar';
import { Image, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { icon3d } from '../../data/icons3d';
import { HomeFeed } from '../../components/Feed';
import { GlamourEntry } from '../../components/GlamourEntry';
import { IronMaxxing } from '../../components/IronMaxxing';
import { Trending } from '../../components/Trending';
import { MomentCard } from '../../components/MomentCard';
import { WashDayArt } from '../../components/WashDayArt';
import { SegmentedTabs } from '../../components/SegmentedTabs';
import { ResetCountdown } from '../../components/ResetCountdown';
import { CoinDrop, TokenBag } from '../../components/TokenBag';
import { RecStack, type RecItem } from '../../components/RecStack';
import type { Card } from '../../engine/planEngine';
import { LockIcon, Locked, PeekRow, openPaywall } from '../../components/Peek';
import { SectionTitle, Tile } from '../../components/Tile';
import { currentMoment } from '../../data/moments';
import { TwoFrameArt } from '../../components/TwoFrameArt';
import { PINEAPPLE_ART, PINEAPPLE_TIMING } from '../../data/art';
import { haptic } from '../../lib/haptics';
import { profileFromAnswers } from '../../engine/profile';
import { useHour } from '../../lib/useHour';
import { scanStreakWeeks } from '../../data/progress';
import { DoctorNote, Glyph, Logo, MoreRow, Screen, Seal, Sub } from '../../components/ui';
import { useStore } from '../../state/store';
import { C, F, SPACE, evidenceStyle, surface } from '../../theme';

/** Peek-row widths: routine cards show the next two peeking in; wider rows show the next one. */
const CARD_W = 148;
const NIGHT = new Set(['satin', 'night_braid', 'wind_down', 'ends_oil', 'loose_styles', 'pillowcase']);
/** A plan card as a notification in the routine stack. */
const toRec = (c: Card, bedtime = false): RecItem => ({
  id: c.id, label: c.label, sub: `${c.value}${c.unit ? ` ${c.unit}` : ''}`, icon: c.icon ?? c.id, pineapple: bedtime,
  when: bedtime ? 'Before bed' : NIGHT.has(c.id) ? 'Tonight' : c.minutes ? `${c.minutes} min` : 'Today',
  body: [{ text: c.why }],
  link: c.id === 'iron_food' ? { label: 'See today’s meals', href: '/iron' } : { label: 'Why it works', href: `/why/${c.id}` },
});
const ROW_W = 280;

const TABS = ['Food recipes', 'Care', 'Style'];

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Home() {
  const { plan, done, todayKey, lastWash, lifeChange, scans, answers, toggleDone, subscribed } = useStore();
  const hour = useHour();
  const [selected, setSelected] = useState(todayKey);
  const [tab, setTab] = useState(0);
  const [routineY, setRoutineY] = useState(0);
  const { height } = useWindowDimensions();
  if (!plan) return null;
  const streakWeeksN = scanStreakWeeks(scans);
  const paused = !!lifeChange && (lifeChange.type === 'Protective style' || lifeChange.type === 'Sick or recovering');
  const days = week(plan, lastWash, todayKey, paused);
  const cal = calendar(plan, lastWash, todayKey, paused);
  const day = cal.find(d => d.key === selected) ?? days[0];
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
  // The hero's button opens the wash routine for the selected wash day, or the next one this week.
  const washDay = day.wash.length ? day : days.find(d => d.wash.length);
  const weekday = (d: Day) => d.date.toLocaleDateString('en-US', { weekday: 'long' });
  const washLabel = !washDay ? '' : washDay.isToday
    ? `Start routine · ${washDay.wash.filter(w => doneToday.includes(`wash:${w.id}`)).length}/${washDay.wash.length}`
    : 'See routine';
  const nextWash = days.find(d => d.isWash && !d.isToday);
  const heroSub = pineapple ? 'Tie a loose pineapple before bed so your hair keeps its shape overnight.'
    : paused ? 'Your routine is adjusted while things change.'
    : daysLeft === 0 ? plan.washRoutine.headline
    : nextWash ? `Next wash on ${weekday(nextWash)}. Keep up daily care until then.` : plan.target;
  const dayName = (d: Day) => (d.isToday ? 'Today' : d.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }));
  return (
    <Screen scroll tab="index" overlay={<CoinDrop />} stops={routineY ? [0, routineY - 16] : undefined}>
      {/* zIndex keeps the coin that drops into the token bag above the rest of the page. */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <Logo size={36} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TokenBag />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.line }}>
          <Glyph name="flame" color="#F08A24" size={16} />
          <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>{streakDays}</Text>
          <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.gray }}>{streakDays === 1 ? 'day' : 'days'}</Text>
        </View>
        </View>
      </View>

      {/* The calendar: scrolls sideways through past and coming days, or opens the full month. */}
      <HomeCalendar days={cal} done={done} selected={selected} onSelect={setSelected} />

      {/* Hero, right under the calendar: the wash-day animation, the countdown, one line of fine print
          and a button into the wash routine (shown as notifications). No card, so it stays light. */}
      <View style={{ marginTop: 18, alignItems: 'center' }}>
        {pineapple ? <TwoFrameArt spec={PINEAPPLE_ART} timing={PINEAPPLE_TIMING} width={104} /> : <WashDayArt width={104} />}
        <Text style={{ fontFamily: F.bold, fontSize: 24, lineHeight: 28, color: C.ink, letterSpacing: -0.5, textAlign: 'center', marginTop: 10 }}>{paused ? 'Wash day paused' : daysLeft === 0 ? 'Wash day today' : `Wash hair in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`}</Text>
        <Text style={{ fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: C.gray, textAlign: 'center', marginTop: 4, paddingHorizontal: 24 }}>{heroSub}</Text>
        {washDay ? (
          <Pressable onPress={subscribed ? () => router.push({ pathname: '/wash-day', params: { day: washDay.key } }) : openPaywall} accessibilityRole="button"
            style={({ pressed }) => ({ height: 42, paddingHorizontal: 22, borderRadius: 999, marginTop: 14, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? '#2E2E2E' : C.ink, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
            {subscribed ? null : <LockIcon size={13} color="#fff" />}
            <Text style={{ fontFamily: F.semibold, fontSize: 15, color: '#fff' }}>{washLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {moment && !pineapple ? <MomentCard moment={moment} onDone={() => toggleDone(moment.doneId)} /> : null}
      {lifeChange ? (
        <Pressable onPress={() => router.push('/(tabs)/profile')} style={{ marginTop: 24, backgroundColor: C.goldSoft, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#F1DDAA' }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.ink }}>{lifeChange.label}</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 12, color: '#7A6A4A', marginTop: 2 }}>{lifeChange.endsAt ? `Until ${new Date(lifeChange.endsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Until you end it'} · your routine is adjusted</Text>
        </Pressable>
      ) : null}

      {/* Scrolling down settles here: Your routine fills the screen and the top scrolls away. */}
      <View onLayout={e => setRoutineY(e.nativeEvent.layout.y)}
        style={{ marginTop: SPACE.section + 8, minHeight: height - 120 }}>
        <SectionTitle note={`${day.isWash ? 'Wash day · ' : ''}${plan.target}`}
          right={day.isToday ? <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.gray2, marginBottom: 2 }}>{routineItems.filter(c => doneToday.includes(c.id)).length}/{routineItems.length} today</Text> : null}>
          {day.isToday ? 'Your routine' : dayName(day)}
        </SectionTitle>
        {routineItems.length ? (
          <Locked radius={30} label="Your daily recs">
            <RecStack items={routineItems.map(c => toRec(c, pineapple && day.isToday && c.id === 'night_braid'))}
              done={day.isToday ? doneToday : (done[day.key] ?? [])} canCheck={day.isToday} dayLabel={dayName(day)}
              onToggle={id => toggleDone(id)} />
          </Locked>
        ) : <Sub style={{ fontSize: 15, paddingVertical: 12 }}>Rest day. Nothing planned.</Sub>}
      </View>

      {/* Everything else, sorted into three tabs: food, care and style. */}
      <View style={{ marginTop: SPACE.section }}>
        <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} />
      </View>
      <View style={{ marginTop: 28, gap: SPACE.section }}>
      {tab === 0 ? <IronMaxxing /> : null}
      {tab === 1 ? <>
        {plan.learn.length ? (
          <View>
            <SectionTitle>Worth knowing</SectionTitle>
            <PeekRow itemWidth={ROW_W} gap={14}>{plan.learn.map(l => <Locked key={l.id} label={l.label} radius={18}><DoctorNote id={l.id} label={l.label} why={l.why} onPress={() => router.push(`/why/${l.id}`)} /></Locked>)}</PeekRow>
          </View>
        ) : null}
        {plan.extras.length ? (
          <View>
            <SectionTitle>More you can try</SectionTitle>
            <PeekRow itemWidth={ROW_W} gap={14}>
              {plan.extras.map(c => (
                <Locked key={c.id} label={c.label} radius={18}>
                  <MoreRow id={c.id} label={c.label} meta={`${c.value}${c.unit ? ' ' + c.unit : ''} · ${evidenceStyle[c.evidence ?? 'early'].label.toLowerCase()}`} onPress={() => router.push(`/why/${c.id}`)} />
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
      </View>
      <ResetCountdown />
    </Screen>
  );
}
