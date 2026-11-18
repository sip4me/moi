import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Day } from '../data/schedule';
import { haptic } from '../lib/haptics';
import { C, F, surface } from '../theme';
import { Seal } from './ui';

const web = Platform.OS === 'web';
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW1 = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const monthName = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const Chevron = ({ dir, color = C.ink }: { dir: 'left' | 'right' | 'down' | 'up'; color?: string }) => {
  const d = { left: 'M15 5l-7 7 7 7', right: 'M9 5l7 7-7 7', down: 'M5 9l7 7 7-7', up: 'M5 15l7-7 7 7' }[dir];
  return <Svg width={14} height={14} viewBox="0 0 24 24"><Path d={d} stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
};

/** One day's mark: the gold seal once a past (or today's) day has a check-in, otherwise the date in a ring. */
function DayMark({ d, did, on, size = 36 }: { d: Day; did: boolean; on: boolean; size?: number }) {
  if (did && !d.isToday) return <Seal size={size} />;
  const past = !d.isToday && d.date.getTime() < Date.now() - 86400000 / 2 && !did;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center',
      borderWidth: on || d.isToday ? 2 : 1.5, borderColor: on || d.isToday ? C.gold : '#E3E3E6', borderStyle: on || d.isToday ? 'solid' : 'dashed',
      backgroundColor: d.isWash ? '#EEF3FD' : 'transparent' }}>
      <Text style={{ fontFamily: F.medium, fontSize: 14, color: past ? C.gray : C.ink }}>{d.date.getDate()}</Text>
    </View>
  );
}

/**
 * The Home calendar: a sideways-scrolling strip of days (a week fits on screen, months of history and
 * plan either side) that opens today with the two days before it showing, plus a full month view.
 * Days with a check-in wear the gold seal.
 */
export function HomeCalendar({ days, done, selected, onSelect }: { days: Day[]; done: Record<string, string[]>; selected: string; onSelect: (key: string) => void }) {
  const scroller = useRef<ScrollViewInstance>(null);
  const [w, setW] = useState(0);
  const [first, setFirst] = useState(0);
  const [open, setOpen] = useState(false);
  const cell = w / 7;
  const todayIdx = Math.max(0, days.findIndex(d => d.isToday));
  const didOn = (d: Day) => (done[d.key] ?? []).length > 0;

  // Opens with today third in the row, so the two days before it are visible. Coming back from the
  // month view, the picked day takes that third spot instead.
  const selIdx = days.findIndex(d => d.key === selected);
  const anchor = Math.max(0, Math.min(days.length - 7, (selIdx < 0 ? todayIdx : selIdx) - 2));
  const anchorRef = useRef(anchor);
  anchorRef.current = anchor;
  useEffect(() => {
    if (!cell || open) return;
    const x = anchorRef.current * cell;
    requestAnimationFrame(() => scroller.current?.scrollTo({ x, animated: false }));
    setFirst(anchorRef.current);
  }, [cell, open]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => cell && setFirst(Math.round(e.nativeEvent.contentOffset.x / cell));
  const label = monthName((days[Math.min(days.length - 1, first + 3)] ?? days[0]).date);

  return (
    <View style={{ marginTop: 20 }} onLayout={e => setW(e.nativeEvent.layout.width)}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>{open ? '' : label}</Text>
        <Pressable onPress={() => { haptic('tap'); setOpen(o => !o); }} hitSlop={8} accessibilityRole="button" accessibilityLabel={open ? 'Show week' : 'Show full calendar'}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: pressed ? '#F1F2F4' : '#FFFFFF', shadowColor: '#1E2430', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } })}>
          <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.ink }}>{open ? 'Week' : 'Month'}</Text>
          <Chevron dir={open ? 'up' : 'down'} />
        </Pressable>
      </View>

      {open ? <MonthGrid days={days} done={done} selected={selected} onPick={k => { onSelect(k); setOpen(false); }} /> : null}

      <ScrollView ref={scroller} horizontal showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={32}
        snapToInterval={web ? undefined : cell || undefined} decelerationRate="fast"
        style={[{ flexGrow: 0, display: open ? 'none' : 'flex' }, web && ({ scrollSnapType: 'x mandatory' } as any)]}>
        {days.map(d => {
          const on = d.key === selected;
          return (
            <Pressable key={d.key} onPress={() => { haptic('tap'); onSelect(d.key); }} accessibilityRole="tab" accessibilityState={{ selected: on }}
              accessibilityLabel={`${d.isToday ? 'Today' : d.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}${didOn(d) ? ', done' : ''}${d.isWash ? ', wash day' : ''}`}
              style={[{ width: cell || 50, alignItems: 'center' }, web && ({ scrollSnapAlign: 'start' } as any)]}>
              <View style={{ width: Math.min(48, (cell || 50) - 2), alignItems: 'center', gap: 5, paddingVertical: 6, borderRadius: 14, backgroundColor: on ? '#fff' : 'transparent', shadowColor: '#000', shadowOpacity: on ? 0.08 : 0, shadowRadius: 8 }}>
                <Text style={{ fontFamily: on || d.isToday ? F.semibold : F.regular, fontSize: 12, color: C.ink }}>{d.isToday ? 'Today' : DOW[d.date.getDay()]}</Text>
                <DayMark d={d} did={didOn(d)} on={on} />
                <View style={{ height: 6, flexDirection: 'row', gap: 2 }}>
                  {d.isWash ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.blue }} /> : null}
                  {d.items.length > (d.isWash ? 1 : 0) && !didOn(d) ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#CFC9BD' }} /> : null}
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** The whole month at a glance: seals on days with check-ins, a gold ring on today, blue dots on wash days. */
function MonthGrid({ days, done, selected, onPick }: { days: Day[]; done: Record<string, string[]>; selected: string; onPick: (key: string) => void }) {
  const byKey = useMemo(() => new Map(days.map(d => [d.key, d])), [days]);
  const today = days.find(d => d.isToday)?.date ?? new Date();
  const [m, setM] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const firstDay = days[0].date, lastDay = days[days.length - 1].date;
  const canPrev = new Date(m.getFullYear(), m.getMonth(), 0) >= new Date(firstDay.getFullYear(), firstDay.getMonth(), 1);
  const canNext = new Date(m.getFullYear(), m.getMonth() + 1, 1) <= lastDay;
  const lead = m.getDay();
  const count = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const cells: (Day | number | null)[] = [...Array(lead).fill(null)];
  for (let n = 1; n <= count; n++) {
    const dt = new Date(m.getFullYear(), m.getMonth(), n, 12);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
    cells.push(byKey.get(key) ?? n);
  }
  while (cells.length % 7) cells.push(null);
  const Arrow = ({ dir, on, go }: { dir: 'left' | 'right'; on: boolean; go: () => void }) => (
    <Pressable disabled={!on} onPress={go} hitSlop={8} accessibilityLabel={dir === 'left' ? 'Previous month' : 'Next month'}
      style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', opacity: on ? 1 : 0.3 }}>
      <Chevron dir={dir} />
    </Pressable>
  );
  return (
    <View style={[surface, { borderRadius: 22, padding: 14, marginBottom: 4 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Arrow dir="left" on={canPrev} go={() => setM(new Date(m.getFullYear(), m.getMonth() - 1, 1))} />
        <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>{monthName(m)}</Text>
        <Arrow dir="right" on={canNext} go={() => setM(new Date(m.getFullYear(), m.getMonth() + 1, 1))} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        {DOW1.map((l, i) => <Text key={i} style={{ flex: 1, textAlign: 'center', fontFamily: F.medium, fontSize: 12, color: C.gray, marginBottom: 6 }}>{l}</Text>)}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {cells.slice(r * 7, r * 7 + 7).map((c, i) => (
            <View key={i} style={{ flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' }}>
              {c === null ? null : typeof c === 'number' ? (
                <Text style={{ fontFamily: F.regular, fontSize: 14, color: '#C4C4C8' }}>{c}</Text>
              ) : (
                <Pressable onPress={() => onPick(c.key)} accessibilityRole="button" accessibilityLabel={c.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  style={{ alignItems: 'center', gap: 2 }}>
                  <View style={{ borderRadius: 20, padding: 1, backgroundColor: c.key === selected ? '#F4F4F4' : 'transparent' }}>
                    <DayMark d={c} did={(done[c.key] ?? []).length > 0} on={c.key === selected} size={34} />
                  </View>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      ))}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Seal size={16} /><Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray2 }}>Done</Text></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#EEF3FD', borderWidth: 1, borderColor: '#D5E0F7' }} /><Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray2 }}>Wash day</Text></View>
      </View>
    </View>
  );
}
