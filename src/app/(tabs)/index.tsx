import { router } from 'expo-router';
import { useState } from 'react';
import { type Day, daysUntilWash, week } from '../../data/schedule';
import { Pressable, Text, View } from 'react-native';
import { icon3d } from '../../data/icons3d';
import { HomeFeed } from '../../components/Feed';
import { GlamourEntry } from '../../components/GlamourEntry';
import { IronMaxxing } from '../../components/IronMaxxing';
import { Trending } from '../../components/Trending';
import { MomentCard } from '../../components/MomentCard';
import { WashDayArt } from '../../components/WashDayArt';
import { SegmentedTabs } from '../../components/SegmentedTabs';
import { ResetCountdown } from '../../components/ResetCountdown';
import { LockIcon, Locked, PeekRow, openPaywall } from '../../components/Peek';
import { SectionTitle, Tile } from '../../components/Tile';
import { currentMoment } from '../../data/moments';
import { TwoFrameArt } from '../../components/TwoFrameArt';
import { PINEAPPLE_ART, PINEAPPLE_TIMING } from '../../data/art';
import { haptic } from '../../lib/haptics';
import { profileFromAnswers } from '../../engine/profile';
import { useHour } from '../../lib/useHour';
import { scanStreakWeeks } from '../../data/progress';
import { DoctorNote, Glyph, Logo, MoreRow, Screen, Sub } from '../../components/ui';
import { useStore } from '../../state/store';
import { C, F, SPACE, evidenceStyle, surface } from '../../theme';

/** Peek-row widths: routine cards show the next two peeking in; wider rows show the next one. */
const CARD_W = 148;
const ROW_W = 280;

const TABS = ['Food recipes', 'Care', 'Style'];

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Home() {
  const { plan, done, todayKey, lastWash, lifeChange, scans, answers, toggleDone, subscribed } = useStore();
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
  // The hero's button opens the wash routine for the selected wash day, or the next one this week.
  const washDay = day.wash.length ? day : days.find(d => d.wash.length);
  const weekday = (d: Day) => d.date.toLocaleDateString('en-US', { weekday: 'long' });
  const washLabel = !washDay ? '' : washDay.isToday
    ? `Start wash routine · ${washDay.wash.filter(w => doneToday.includes(`wash:${w.id}`)).length}/${washDay.wash.length}`
    : `See ${weekday(washDay)}’s wash routine`;
  const nextWash = days.find(d => d.isWash && !d.isToday);
  const heroSub = pineapple ? 'Tie a loose pineapple before bed so your hair keeps its shape overnight.'
    : paused ? 'Your routine is adjusted while things change.'
    : daysLeft === 0 ? plan.washRoutine.headline
    : nextWash ? `Next wash on ${weekday(nextWash)}. Keep up the daily steps until then.` : plan.target;
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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 }}>
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

      {/* Hero: one centred card, like a feature card — object, headline, one line of context, one soft button. */}
      <View style={[surface, { marginTop: 36, borderRadius: 28, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 28, alignItems: 'center' }]}>
        {pineapple ? <TwoFrameArt spec={PINEAPPLE_ART} timing={PINEAPPLE_TIMING} width={120} /> : <WashDayArt width={120} />}
        <Text style={{ fontFamily: F.bold, fontSize: 28, lineHeight: 33, color: C.ink, letterSpacing: -0.7, textAlign: 'center', marginTop: 18 }}>{paused ? 'Wash day paused' : daysLeft === 0 ? 'Wash day today' : `Wash hair in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`}</Text>
        <Text style={{ fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: C.gray2, textAlign: 'center', marginTop: 8, paddingHorizontal: 6 }}>{heroSub}</Text>
        {washDay ? (
          <Pressable onPress={subscribed ? () => router.push({ pathname: '/wash-day', params: { day: washDay.key } }) : openPaywall} accessibilityRole="button"
            style={({ pressed }) => ({ alignSelf: 'stretch', height: 50, borderRadius: 14, marginTop: 24, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? '#E8E8EA' : '#F2F2F3' })}>
            {subscribed ? null : <LockIcon size={14} />}
            <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>{washLabel}</Text>
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

      <View style={{ marginTop: SPACE.section + 8 }}>
        <SectionTitle note={`${day.isWash ? 'Wash day · ' : ''}${plan.target}`}
          right={day.isToday ? <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.gray2, marginBottom: 2 }}>{routineItems.filter(c => doneToday.includes(c.id)).length}/{routineItems.length} today</Text> : null}>
          {day.isToday ? 'Your routine' : dayName(day)}
        </SectionTitle>
        {routineItems.length ? (
          <PeekRow itemWidth={CARD_W} gap={14}>
            {routineItems.map(c => {
              const isDone = day.isToday && doneToday.includes(c.id);
              const bedtime = pineapple && day.isToday && c.id === 'night_braid';
              return (
                <Locked key={c.id} label={c.label} radius={22}>
                  <Tile title={c.label} sub={isDone ? 'Done today' : `${c.value}${c.unit ? ` ${c.unit}` : ''}`} done={isDone}
                    image={bedtime ? undefined : icon3d(c.icon ?? c.id)}
                    art={bedtime ? <TwoFrameArt spec={PINEAPPLE_ART} timing={PINEAPPLE_TIMING} width={84} /> : undefined}
                    onPress={bedtime ? () => { if (!isDone) haptic('success'); toggleDone(c.id); } : () => router.push(c.id === 'iron_food' ? '/iron' : `/why/${c.id}`)} />
                </Locked>
              );
            })}
          </PeekRow>
        ) : <Sub style={{ fontSize: 15, paddingVertical: 12 }}>Rest day. Nothing planned.</Sub>}
        <Sub style={{ fontSize: 13, marginTop: 14 }}>{day.isToday ? 'Tap a card to see why and mark it done.' : 'A preview. It updates when you log a wash or change a card.'}</Sub>
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
