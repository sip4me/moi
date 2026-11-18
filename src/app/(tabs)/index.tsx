import { router } from 'expo-router';
import { useState } from 'react';
import { type Day, calendar, daysUntilWash, week } from '../../data/schedule';
import { HomeCalendar } from '../../components/HomeCalendar';
import { Image, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { icon3d } from '../../data/icons3d';
import { HomeFeed } from '../../components/Feed';
import { IronMaxxing } from '../../components/IronMaxxing';
import { Trending } from '../../components/Trending';
import { MomentCard } from '../../components/MomentCard';
import { WashDayArt } from '../../components/WashDayArt';
import { BrowseRow, CategoryPills, RecipeCards, SearchBar } from '../../components/Explore';
import { SLOT_LABEL, type Slot, ironGoal } from '../../data/ironRecipes';
import { ResetCountdown } from '../../components/ResetCountdown';
import { CoinDrop, TokenBag } from '../../components/TokenBag';
import { RecStack, type RecItem } from '../../components/RecStack';
import { HomePager } from '../../components/HomePager';
import { GoalBullseye } from '../../components/GoalBullseye';
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
import { C, CONTENT_INDENT as INDENT, F, SPACE, evidenceStyle, surface } from '../../theme';

/** Peek-row widths: routine cards show the next two peeking in; wider rows show the next one. */
const CARD_W = 148;
const NIGHT = new Set(['satin', 'night_braid', 'wind_down', 'ends_oil', 'loose_styles', 'pillowcase']);
/** Recs that ask for proof before the coin: a breathing recording, a photo, or a product scan. */
const PROOF: Record<string, RecItem['proof']> = {
  calm: { kind: 'voice', ask: 'Record at least 20 seconds of slow breathing to earn your coin.' },
  night_braid: { kind: 'photo', ask: 'Snap your braid or pineapple to earn your coin.' },
  loose_styles: { kind: 'photo', ask: 'Snap today’s loose style to earn your coin.' },
  soft_ties: { kind: 'photo', ask: 'Snap your soft tie or scrunchie to earn your coin.' },
  satin: { kind: 'photo', ask: 'Snap your satin pillowcase or bonnet to earn your coin.' },
  iron_food: { kind: 'photo', ask: 'Snap one of today’s iron-rich meals to earn your coin.' },
  sun_cover: { kind: 'photo', ask: 'Snap your hat or UV spray to earn your coin.' },
  leave_in: { kind: 'scan', ask: 'Scan the leave-in you used to earn your coin.' },
  ends_oil: { kind: 'scan', ask: 'Scan the oil you used to earn your coin.' },
  heat_protect: { kind: 'scan', ask: 'Scan your heat protectant to earn your coin.' },
  rosemary: { kind: 'scan', ask: 'Scan your rosemary oil to earn your coin.' },
  dry_shampoo: { kind: 'scan', ask: 'Scan your dry shampoo to earn your coin.' },
};
/** A plan card as a notification in the routine stack. */
const toRec = (c: Card, bedtime = false): RecItem => {
  const sub = `${c.value}${c.unit ? ` ${c.unit}` : ''}`.trim();
  const mins = c.minutes ? `${c.minutes} min` : 'Today';
  return {
  id: c.id, label: c.label, sub, icon: c.icon ?? c.id, pineapple: bedtime,
  when: bedtime ? 'Before bed' : NIGHT.has(c.id) ? 'Tonight' : mins === sub ? 'Today' : mins,
  body: [{ text: c.why }], proof: PROOF[c.id],
  link: c.id === 'iron_food' ? { label: 'See today’s meals', href: '/iron' } : { label: 'Why it works', href: `/why/${c.id}` },
  };
};
const ROW_W = 280;

const TABS = [{ label: 'Care', icon: 'cat_care' }, { label: 'Style', icon: 'cat_style' }];
const MEALS: Slot[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_ICON: Record<Slot, string> = { breakfast: 'meal_breakfast', lunch: 'meal_lunch', dinner: 'meal_dinner', snack: 'meal_snack' };
/** The meal coming up next, so Food opens on something useful right now. */
const nextMeal = (h: number): Slot => (h < 11 ? 'breakfast' : h < 15 ? 'lunch' : h < 17 ? 'snack' : 'dinner');

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Home() {
  const { plan, done, todayKey, lastWash, lifeChange, scans, answers, toggleDone, subscribed, ironLog } = useStore();
  const hour = useHour();
  const [selected, setSelected] = useState(todayKey);
  const [tab, setTab] = useState(0);
  const [meal, setMeal] = useState<Slot | null>(null);
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
  const nextWash = days.find(d => d.isWash && !d.isToday);
  const heroSub = pineapple ? 'Tie a loose pineapple before bed so your hair keeps its shape overnight.'
    : paused ? 'Your routine is adjusted while things change.'
    : daysLeft === 0 ? plan.washRoutine.headline
    : nextWash ? `Next wash on ${weekday(nextWash)}. Keep up daily care until then.` : plan.target;
  const dayName = (d: Day) => (d.isToday ? 'Today' : d.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }));
  const ironEaten = (ironLog[todayKey] ?? []).reduce((n, x) => n + x.mg, 0);
  const left = routineItems.filter(c => !doneToday.includes(c.id)).length;
  const PageTitle = ({ children, note }: { children: string; note: string }) => (
    <View style={{ marginBottom: 28 }}>
      <Text style={{ fontFamily: F.bold, fontSize: 32, letterSpacing: -0.8, color: C.ink }}>{children}</Text>
      <Text style={{ fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: C.gray2, marginTop: 6 }}>{note}</Text>
    </View>
  );

  // Home is three calm screens: swipe between them, or press and hold to see them all.
  const today = (
    <>
          {/* zIndex keeps the coin that drops into the token bag above the rest of the page. */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
            <Logo size={36} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TokenBag />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, shadowColor: '#1E2430', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
              <Glyph name="flame" color="#F08A24" size={16} />
              <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>{streakDays}</Text>
              <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.gray }}>{streakDays === 1 ? 'day' : 'days'}</Text>
            </View>
            </View>
          </View>

          {/* The calendar: scrolls sideways through past and coming days, or opens the full month. */}
          <HomeCalendar days={cal} done={done} selected={selected} onSelect={setSelected} />

          {/* Hero, right under the calendar: the wash-day animation, the countdown and one line of fine print.
              No card and no button, so it stays light; the wash routine opens from Your goal on wash day. */}
          {/* Flo-like air: a big gap under the calendar, a large headline, then room before the next chunk. */}
          <View style={{ marginTop: 48, alignItems: 'center' }}>
            {pineapple ? <TwoFrameArt spec={PINEAPPLE_ART} timing={PINEAPPLE_TIMING} width={96} /> : <WashDayArt width={96} />}
            <Text style={{ fontFamily: F.bold, fontSize: 38, lineHeight: 44, color: C.ink, letterSpacing: -1, textAlign: 'center', marginTop: 16, paddingHorizontal: 16 }}>{paused ? 'Wash day paused' : daysLeft === 0 ? 'Wash day today' : `Wash hair in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`}</Text>
            <Text style={{ fontFamily: F.regular, fontSize: 16, lineHeight: 23, color: C.gray2, textAlign: 'center', marginTop: 14, paddingHorizontal: 28 }}>{heroSub}</Text>
          </View>
          <View style={{ height: 24 }} />
          {moment && !pineapple ? <MomentCard moment={moment} onDone={() => toggleDone(moment.doneId)} /> : null}
          {lifeChange ? (
            <Pressable onPress={() => router.push('/(tabs)/profile')} style={{ marginTop: 24, marginHorizontal: INDENT, backgroundColor: C.goldSoft, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#F1DDAA' }}>
              <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.ink }}>{lifeChange.label}</Text>
              <Text style={{ fontFamily: F.regular, fontSize: 12, color: '#7A6A4A', marginTop: 2 }}>{lifeChange.endsAt ? `Until ${new Date(lifeChange.endsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Until you end it'} · your routine is adjusted</Text>
            </Pressable>
          ) : null}

          <View style={{ marginTop: 56 }}>
            {/* My goals · Today: the 3D bullseye (its arrow keeps landing dead centre) and the goal. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }} accessibilityRole="header" accessibilityLabel={`My goals, ${day.isToday ? 'today' : dayName(day)}: ${plan.target}`}>
              <GoalBullseye size={46} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.bold, fontSize: 24, letterSpacing: -0.5, color: C.ink }}>My goals · {day.isToday ? 'Today' : day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                <Text numberOfLines={1} style={{ fontFamily: F.regular, fontSize: 14, color: C.gray2, marginTop: 2 }}>{day.isWash ? 'Wash day · ' : ''}{plan.target}</Text>
              </View>
            </View>
            {/* Wash day only: the one primary action, opening the wash routine (as notifications). */}
            {day.wash.length ? (
              <Pressable onPress={subscribed ? () => router.push({ pathname: '/wash-day', params: { day: day.key } }) : openPaywall} accessibilityRole="button"
                style={({ pressed }) => ({ marginHorizontal: INDENT, marginBottom: 16, height: 50, borderRadius: 999, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? '#2E2E2E' : C.ink, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
                {subscribed ? null : <LockIcon size={13} color="#fff" />}
                <Text style={{ fontFamily: F.semibold, fontSize: 16, color: '#fff' }}>{day.isToday ? `Start wash routine · ${day.wash.filter(w => doneToday.includes(`wash:${w.id}`)).length}/${day.wash.length}` : `See ${weekday(day)}’s wash routine`}</Text>
              </Pressable>
            ) : null}
            {routineItems.length ? (
              <Locked radius={30} label="Your daily recs" style={{ marginHorizontal: INDENT }}>
                <RecStack items={routineItems.map(c => toRec(c, pineapple && day.isToday && c.id === 'night_braid'))}
                  done={day.isToday ? doneToday : (done[day.key] ?? [])} canCheck={day.isToday} dayLabel={dayName(day)}
                  onToggle={id => toggleDone(id)} />
              </Locked>
            ) : <Sub style={{ fontSize: 15, paddingVertical: 12, marginHorizontal: INDENT }}>Rest day. Nothing planned.</Sub>}
          </View>

      <ResetCountdown />
    </>
  );
  const search = (
    <>
      <Text style={{ fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: C.gray2, marginBottom: 20 }}>Browse care and style</Text>
      <View style={{ marginHorizontal: INDENT }}><SearchBar /></View>
      <View style={{ marginTop: 20 }}><CategoryPills items={TABS} value={tab} onChange={setTab} /></View>
      <View style={{ marginTop: SPACE.section, gap: SPACE.section }}>
          {tab === 0 ? <>
            <BrowseRow title="Care essentials" items={[
              { key: 'wash', label: 'Wash routine', icon: 'care_shower', onPress: () => router.push(washDay ? { pathname: '/wash-day', params: { day: washDay.key } } : '/wash-day') },
              { key: 'products', label: 'My products', icon: 'cat_care', onPress: () => router.push('/(tabs)/products') },
              { key: 'scan', label: 'Check a label', icon: 'leave_in', onPress: () => router.push('/scan-label') },
              { key: 'glamour', label: 'Glamour', icon: 'mirror', onPress: () => router.push('/glamour') },
              { key: 'saved', label: 'Saved', icon: 'satin', onPress: () => router.push('/saved') },
            ]} />
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
            <HomeFeed streakWeeks={streakWeeksN} only={['care', 'rituals']} />
          </> : null}
          {tab === 1 ? <>
            <Trending />
            <HomeFeed streakWeeks={streakWeeksN} only={['styles']} withRecords />
          </> : null}
      </View>
    </>
  );
  const food = (
    <>
      <PageTitle note="Iron-rich recipes and today’s iron, for stronger strands.">Food</PageTitle>
      <View style={{ gap: SPACE.section }}>
            <BrowseRow title="Browse by meal" selected={meal ?? nextMeal(hour)} onPick={k => setMeal(k as Slot)}
              items={MEALS.map(m => ({ key: m, label: SLOT_LABEL[m], icon: MEAL_ICON[m] }))} />
            <RecipeCards slot={meal ?? nextMeal(hour)} />
            <IronMaxxing />
      </View>
    </>
  );

  return (
    <Screen tab="index" overlay={<CoinDrop />} style={{ paddingHorizontal: 0, paddingTop: 0 }}>
      <HomePager pages={[
        { key: 'today', title: 'Today', icon: 'goal_target', summary: left ? `${left} recs left for today’s goal` : 'Today’s goal is met', content: today },
        { key: 'search', title: 'Search', icon: 'cat_care', summary: 'Search Moi, care and style', content: search },
        { key: 'food', title: 'Food', icon: 'cat_food', summary: `${+ironEaten.toFixed(1)} of ${ironGoal(answers)} mg iron today`, content: food },
      ]} />
    </Screen>
  );
}
