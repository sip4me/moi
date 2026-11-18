import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { type FeedCard, type FeedSection, type RecordCard, feed, records } from '../data/feed';
import { C, F } from '../theme';
import { Chip } from './ui';
import { LockIcon as Lock, Locked, PeekRow } from './Peek';

const GOLD = '#C9A86A';
const CARD_W = 128;
const CARD_H = 164;


function Card({ card }: { card: FeedCard }) {
  return (
    <Pressable onPress={() => router.push(`/feed/${card.id}`)} accessibilityRole="button" accessibilityLabel={card.locked ? `${card.title}, locked` : card.title}
      style={({ pressed }) => ({ width: CARD_W, height: CARD_H, borderRadius: 18, padding: 3, borderWidth: card.featured ? 1.5 : 1, borderColor: card.featured ? GOLD : C.line, backgroundColor: '#fff', transform: [{ scale: pressed ? 0.97 : 1 }] })}>
      <View style={{ flex: 1, borderRadius: 14, backgroundColor: card.bg, overflow: 'hidden', padding: 10 }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 13, lineHeight: 16, color: C.ink, width: 96 }}>{card.title}</Text>
        {card.image ? <Image source={card.image} resizeMode="contain" style={{ position: 'absolute', right: 4, bottom: 4, width: 88, height: 96, opacity: card.locked ? 0.55 : 1 }} /> : null}
        {card.locked ? (
          <View style={{ position: 'absolute', left: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Lock /><Text style={{ fontFamily: F.semibold, fontSize: 11, color: C.ink }}>Unlock</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function Record({ r }: { r: RecordCard }) {
  const fg = r.dark ? '#fff' : C.ink;
  return (
    <View style={{ width: CARD_W, height: CARD_H, borderRadius: 18, padding: 3, borderWidth: r.featured ? 1.5 : 1, borderColor: r.featured ? GOLD : C.line, backgroundColor: '#fff' }}
      accessibilityLabel={`${r.value}, ${r.label}${r.source ? `. Source: ${r.source}` : ''}`}>
      <View style={{ flex: 1, borderRadius: 14, backgroundColor: r.bg, overflow: 'hidden', padding: 10 }}>
        <Text style={{ fontFamily: F.bold, fontSize: 22, letterSpacing: -0.5, color: fg }}>{r.value}</Text>
        <Text style={{ fontFamily: F.medium, fontSize: 12, lineHeight: 15, color: fg, marginTop: 2, width: 90 }}>{r.label}</Text>
        {r.image ? <Image source={r.image} resizeMode="contain" style={{ position: 'absolute', right: 2, bottom: 2, width: 84, height: 84 }} /> : null}
      </View>
    </View>
  );
}

function Header({ title, note }: { title: string; note?: string }) {
  return (
    <Text style={{ fontFamily: F.semibold, fontSize: 17, color: C.ink, marginTop: 26, marginBottom: 10 }}>
      {title}{note ? <Text style={{ fontFamily: F.regular, color: C.gray }}> · {note}</Text> : null}
    </Text>
  );
}

const Row = ({ children }: { children: React.ReactNode }) => <PeekRow itemWidth={CARD_W} gap={10}>{children}</PeekRow>;

function Section({ s }: { s: FeedSection }) {
  const [filter, setFilter] = useState(s.filters?.[0]);
  const cards = s.filters && filter ? s.cards.filter(c => c.locked || c.tags?.includes(filter)) : s.cards;
  return (
    <View>
      <Header title={s.title} note={s.note} />
      {s.filters ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {s.filters.map(f => <Chip key={f} label={f} on={f === filter} onPress={() => setFilter(f)} />)}
        </View>
      ) : null}
      <Row>{cards.map(c => c.locked ? <Card key={c.id} card={c} /> : <Locked key={c.id} radius={18} label={c.title}><Card card={c} /></Locked>)}</Row>
    </View>
  );
}

/** The scrolling feed under "Your routine" on Home. */
export function HomeFeed({ streakWeeks }: { streakWeeks: number }) {
  return (
    <View>
      {feed().map(s => <Section key={s.id} s={s} />)}
      <Header title="Hair records" />
      <Row>{records(streakWeeks).map(r => <Locked key={r.id} radius={18} label={r.label}><Record r={r} /></Locked>)}</Row>
    </View>
  );
}
