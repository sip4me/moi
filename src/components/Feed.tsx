import { router } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { type FeedCard, type FeedSection, type RecordCard, feed, records } from '../data/feed';
import { C, CONTENT_INDENT, F, SPACE } from '../theme';
import { Chip } from './ui';
import { LockIcon as Lock, Locked, PeekRow, usePageInset } from './Peek';
import { SectionTitle, Tile } from './Tile';

const CARD_W = 148;
const CARD_H = 140;


function Card({ card }: { card: FeedCard }) {
  return (
    <Tile image={card.image} imageSize={108} height={CARD_H} title={card.title} onPress={() => router.push(`/feed/${card.id}`)}
      label={card.locked ? `${card.title}, locked` : card.title}
      badge={card.locked ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}><Lock /><Text style={{ fontFamily: F.semibold, fontSize: 11, color: C.ink }}>Unlock</Text></View> : undefined} />
  );
}

function Record({ r }: { r: RecordCard }) {
  const fg = r.dark ? '#fff' : C.ink;
  return (
    <View style={{ height: CARD_H + 46, borderRadius: 22, backgroundColor: r.bg, overflow: 'hidden', padding: 14 }}
      accessibilityLabel={`${r.value}, ${r.label}${r.source ? `. Source: ${r.source}` : ''}`}>
      <Text style={{ fontFamily: F.bold, fontSize: 24, letterSpacing: -0.6, color: fg }}>{r.value}</Text>
      <Text style={{ fontFamily: F.medium, fontSize: 13, lineHeight: 17, color: fg, marginTop: 4, width: 104 }}>{r.label}</Text>
      {r.image ? <Image source={r.image} resizeMode="contain" style={{ position: 'absolute', right: 6, bottom: 6, width: 92, height: 92 }} /> : null}
    </View>
  );
}

const Header = ({ title, note }: { title: string; note?: string }) => (
  <SectionTitle right={note ? <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.gray2, marginBottom: 3 }}>{note}</Text> : undefined}>{title}</SectionTitle>
);

const Row = ({ children }: { children: React.ReactNode }) => <PeekRow itemWidth={CARD_W} gap={14}>{children}</PeekRow>;

function Section({ s }: { s: FeedSection }) {
  const [filter, setFilter] = useState(s.filters?.[0]);
  const inset = usePageInset();
  const cards = s.filters && filter ? s.cards.filter(c => c.locked || c.tags?.includes(filter)) : s.cards;
  return (
    <View>
      <Header title={s.title} note={s.note} />
      {s.filters ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -inset, marginBottom: 16, flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: inset + CONTENT_INDENT, gap: 8 }}>
          {s.filters.map(f => <Chip key={f} label={f} on={f === filter} onPress={() => setFilter(f)} />)}
        </ScrollView>
      ) : null}
      <Row>{cards.map(c => c.locked ? <Card key={c.id} card={c} /> : <Locked key={c.id} radius={22} label={c.title}><Card card={c} /></Locked>)}</Row>
    </View>
  );
}

/** Feed sections for a Home tab: `only` picks sections by id; `withRecords` adds Hair records at the end. */
export function HomeFeed({ streakWeeks, only, withRecords }: { streakWeeks: number; only?: string[]; withRecords?: boolean }) {
  return (
    <View style={{ gap: SPACE.section }}>
      {feed().filter(s => !only || only.includes(s.id)).map(s => <Section key={s.id} s={s} />)}
      {withRecords ? (
        <View>
          <Header title="Hair records" />
          <Row>{records(streakWeeks).map(r => <Locked key={r.id} radius={22} label={r.label}><Record r={r} /></Locked>)}</Row>
        </View>
      ) : null}
    </View>
  );
}
