import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Bubble, Shell, SYS, TypingDots, useWide } from '../../components/routine/Kit';
import { logClick, openStore, storeLinks, withUtm } from '../../lib/routine/affiliate';
import { takeProductPhoto } from '../../lib/routine/capture';
import { sendChat, type ChatMsg, type MoiCard } from '../../lib/routine/chat';
import { shrink } from '../../lib/routine/readLook';
import { getRoutine, itemKey, placeItems, setRoutine, type Area, type Item } from '../../lib/routine/model';
import { applyAnswer, type Question } from '../../lib/routine/questions';
import { shadeOf } from '../../lib/routine/shade';
import { F } from '../../theme';

const crown = require('../../../assets/crown-pink.png');
let uid = 0;
// Compare a question with Moi's sentence, ignoring case, punctuation and curly quotes.
const norm = (t: string) => t.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z' ]/g, '').replace(/^(and|so|ok|okay) /, '').trim();
const id = () => `m${Date.now()}_${uid++}`;

// The conversation lives for the visit, so leaving and coming back keeps it.
const START: ChatMsg = { id: 'hello', role: 'moi', text: 'Hi, I’m Moi. Let’s build a routine you love. What are we working on?', local: 'area' };
let kept: ChatMsg[] = [START];
// The routine types Moi specialises in. Four map onto routine areas; the rest guide the chat and web finds.
const TYPES: { label: string; area?: Area }[] = [
  { label: 'Skincare', area: 'skin' }, { label: 'Makeup', area: 'makeup' }, { label: 'Haircare', area: 'hair' }, { label: 'Fragrance' },
  { label: 'Bath & body', area: 'body' }, { label: 'Tools & devices' }, { label: 'Wellness' },
];

/** Build a routine in conversation: tap answers save into the routine, product cards add to it. */
export default function Chat() {
  const wide = useWide();
  const [msgs, setMsgs] = useState<ChatMsg[]>(kept);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [multi, setMulti] = useState<string[]>([]);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const scroll = useRef<any>(null);
  useEffect(() => { kept = msgs; setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 60); }, [msgs]);

  // Sends the conversation so far (plus the new message) to Moi.
  const ask = async (show: string, said: string, after?: ChatMsg[], photo?: { uri: string; data: string }) => {
    const base = [...(after ?? msgs), { id: id(), role: 'user' as const, text: show, ...(photo ? { photo: photo.uri } : {}) }];
    setMsgs(base); setBusy(true); setMulti([]);
    const history = base.map((m, n) => ({ role: m.role === 'user' ? 'user' as const : 'assistant' as const, text: n === base.length - 1 ? said : m.local === 'photo' ? '' : m.text })).filter(m => m.text);
    const r = await sendChat(history, getRoutine(), photo?.data).catch(() => ({ ok: false as const, why: 'error' as const }));
    setBusy(false);
    if (!r.ok) {
      const t = r.why === 'limit' ? `You’ve used today’s ${'limit' in r ? r.limit : ''} chats. Moi resets tomorrow, and Royal members get far more.` : r.why === 'off' ? 'Chat isn’t switched on yet.' : 'I couldn’t answer just now. Try again in a moment.';
      setMsgs(m => [...m, { id: id(), role: 'moi', text: t }]);
      return;
    }
    if (r.save.length) setRoutine(x => r.save.reduce((acc, a) => applyAnswer(acc, a.key, a.value), x));
    setMsgs(m => {
      const next = [...m, { id: id(), role: 'moi' as const, text: r.text, ask: r.ask, cards: r.cards }];
      // After the first picks, invite an inspiration photo to refine them (once).
      if (r.cards.length && !m.some(x => x.cards?.length) && !m.some(x => x.local === 'photo') && !photo) next.push({ id: id(), role: 'moi', text: 'Feel free to send me an inspiration picture, and I’ll refine these to match the look.', local: 'photo' });
      return next;
    });
  };
  const sendPhoto = async () => {
    if (busy) return;
    const uri = await takeProductPhoto(true);
    if (!uri) return;
    const data = await shrink(uri);
    if (!data) { setMsgs(m => [...m, { id: id(), role: 'moi', text: 'That photo couldn’t be opened. Try a JPG or PNG.' }]); return; }
    ask('', 'Here’s my inspiration photo. Read the look and refine my picks to match it.', undefined, { uri, data });
  };

  // Opening question: pick any of the routine types, then Start. A category tab can open the chat with one picked.
  const { type: preset } = useLocalSearchParams<{ type?: string }>();
  const [types, setTypes] = useState<string[]>(() => (preset && TYPES.some(t => t.label === preset) ? [preset] : []));
  const toggleType = (l: string) => setTypes(t => (t.includes(l) ? t.filter(x => x !== l) : [...t, l]));
  const startTypes = () => {
    if (!types.length) return;
    const picked = TYPES.filter(t => types.includes(t.label));
    const area = picked.find(t => t.area)?.area;
    setRoutine(r => ({ ...r, welcomed: true, ...(area ? { areas: [area] } : {}), prefs: { ...(r.prefs ?? {}), interests: picked.map(t => t.label) } }));
    const list = picked.map(t => t.label.toLowerCase());
    ask(picked.map(t => t.label).join(', '), `I want help with my ${list.length > 1 ? `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}` : list[0]} routine.`);
    setTypes([]);
  };
  const answer = (q: Question, value: string) => {
    if ((q.max ?? 1) > 1 && value !== 'Nothing' && value !== 'Explore with Moi') { setMulti(m => (m.includes(value) ? m.filter(x => x !== value) : [...m, value].slice(-(q.max ?? 1)))); return; }
    setRoutine(r => applyAnswer(r, q.key, value));
    ask(value, `${q.q} ${value}`);
  };
  const answerMany = (q: Question) => {
    if (!multi.length) return;
    setRoutine(r => multi.reduce((acc, v) => applyAnswer(acc, q.key, v), r));
    ask(multi.join(', '), `${q.q} ${multi.join(', ')}`);
  };
  const send = () => { const t = text.trim(); if (!t || busy) return; setText(''); ask(t, t); };

  // Adding a card puts it into the matching step of their routine (lip combo, hair routine…).
  const add = (c: MoiCard) => {
    const it: Item = c.source === 'moi' ? c.item : { kind: 'custom', brand: c.brand, name: c.name, category: c.category ?? 'other', tags: [] } as Item;
    setRoutine(r => placeItems(r, [it]));
    setAdded(a => ({ ...a, [c.source === 'moi' ? itemKey(c.item) : c.url]: true }));
  };
  const host = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'the brand’s site'; } };

  // Two products at a time; "See more" opens the rest of that message's picks.
  const [more, setMore] = useState<Record<string, boolean>>({});
  const ring = (focused?: boolean) => (focused ? ({ outlineStyle: 'solid', outlineWidth: 2, outlineColor: '#5F4FC4', outlineOffset: 2 } as any) : null);
  const T = { fontFamily: SYS ?? F.medium, fontSize: 14, lineHeight: 20, color: '#1D1D22' };
  const chip = (label: string, on: boolean, onPress: () => void, dark?: boolean) => (
    <Pressable key={label} onPress={onPress} disabled={busy} accessibilityRole="button" accessibilityState={{ selected: on }}
      style={({ hovered, pressed, focused }: any) => ({ paddingHorizontal: 14, height: 34, borderRadius: 17, justifyContent: 'center', opacity: busy ? 0.45 : 1, backgroundColor: on || dark ? (hovered && !busy ? '#2A2A30' : '#111114') : pressed ? '#E9E9EE' : hovered && !busy ? '#F4F4F6' : '#FFFFFF', borderWidth: 1, borderColor: on || dark ? '#111114' : hovered && !busy ? 'rgba(17,17,20,0.32)' : 'rgba(17,17,20,0.16)', transform: [{ scale: pressed ? 0.97 : 1 }], ...ring(focused) })}>
      <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 13, color: on || dark ? '#fff' : '#111114' }}>{label}</Text>
    </Pressable>
  );
  const small = (label: string, onPress: () => void, a11y?: string, done?: boolean) => (
    <Pressable onPress={onPress} disabled={done} accessibilityRole="button" accessibilityLabel={a11y ?? label} accessibilityState={{ disabled: !!done }}
      style={({ hovered, pressed, focused }: any) => ({ paddingHorizontal: 12, height: 32, borderRadius: 16, justifyContent: 'center', backgroundColor: done ? '#E5F4EA' : pressed ? '#DADDE2' : hovered ? '#E6E8EB' : '#F1F3F5', borderWidth: 1, borderColor: done ? '#CDEBD6' : hovered ? 'rgba(17,17,20,0.22)' : 'rgba(20,20,40,0.10)', transform: [{ scale: pressed ? 0.97 : 1 }], ...ring(focused) })}>
      <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 12, color: done ? '#1E7B45' : '#111114' }}>{label}</Text>
    </Pressable>
  );

  // ── Recommendation card: swatch, step · shade match, name, why; a store link and an add button. ──
  const COLOUR = ['lips', 'lip_gloss', 'blush', 'bronzer', 'highlighter', 'eyeshadow', 'eyeliner', 'brows', 'foundation', 'concealer', 'powder'];
  const swatch = (hex: string | undefined, category: string, item?: any) => hex
    ? <View accessibilityElementsHidden importantForAccessibility="no" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: hex, borderWidth: 1, borderColor: 'rgba(17,17,20,0.08)' }} />
    : <Bubble category={category} item={item} size={40} />;
  const linkBtn = (label: string, onPress: () => void) => (
    <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={label.replace(' ↗', '')} accessibilityHint="Opens in a new tab"
      style={({ hovered, pressed, focused }: any) => ({ flex: 1, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, backgroundColor: pressed ? '#EDEDF1' : hovered ? '#F6F6F8' : '#FFFFFF', borderWidth: 1, borderColor: hovered ? 'rgba(17,17,20,0.35)' : 'rgba(17,17,20,0.18)', transform: [{ scale: pressed ? 0.98 : 1 }], ...ring(focused) })}>
      <Text numberOfLines={1} style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 13, color: '#111114' }}>{label}</Text>
    </Pressable>
  );
  const addBtn = (done: boolean, onPress: () => void) => (
    <Pressable onPress={onPress} disabled={done} accessibilityRole="button" accessibilityLabel={done ? 'Added to my routine' : 'Add to my routine'} accessibilityState={{ disabled: done }}
      style={({ hovered, pressed, focused }: any) => ({ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? '#E5F4EA' : pressed ? '#EDEDF1' : hovered ? '#F6F6F8' : '#FFFFFF', borderWidth: 1, borderColor: done ? '#B9E2C6' : hovered ? 'rgba(17,17,20,0.35)' : 'rgba(17,17,20,0.18)', transform: [{ scale: pressed ? 0.95 : 1 }], ...ring(focused) })}>
      <Svg width={16} height={16} viewBox="0 0 24 24">
        {done ? <Path d="M5 12.5l4.5 4.5L19 7.5" stroke="#1E7B45" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          : <Path d="M12 5v14M5 12h14" stroke="#111114" strokeWidth={2.2} strokeLinecap="round" />}
      </Svg>
    </Pressable>
  );
  const meta = (step?: string | null, match?: string | null, web?: boolean) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {step || match ? <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 12, color: '#5B5F6B' }}>{[step, match ? `Shade: ${match}` : null].filter(Boolean).join(' · ')}</Text> : null}
      {web ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: '#F0F1F4' }}>
          <Svg width={11} height={11} viewBox="0 0 24 24"><Path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-9 9h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" stroke="#5B5F6B" strokeWidth={1.8} fill="none" /></Svg>
          <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 11, color: '#4A4E59' }}>From the web</Text>
        </View>
      ) : null}
    </View>
  );
  const card = (c: MoiCard, n: number) => {
    const web = c.source === 'web';
    const item = c.source === 'moi' ? c.item : null;
    const category = item ? item.category : (c as any).category ?? 'other';
    const hex = item ? (COLOUR.includes(item.category) ? shadeOf(item) : undefined) : (c as any).shade_hex ?? undefined;
    const name = item ? item.name : `${(c as any).brand} ${(c as any).name}`;
    const key = item ? itemKey(item) : (c as any).url;
    const done = !!added[key];
    let link: React.ReactElement | null = null;
    if (item) {
      const l = storeLinks(item)[0];
      if (l) link = linkBtn(`Buy at ${l.name} ↗`, () => openStore(item, l, 'chat'));
    } else if (c.source === 'web') {
      link = c.amazon ? linkBtn('Buy at Amazon ↗', () => { logClick({ brand: c.brand, product: c.name, store: 'Amazon', source: 'chat', web: true, tagged: true }); Linking.openURL(c.url); })
        : linkBtn(c.official ? 'See it at the brand’s site ↗' : `See it at ${host(c.url)} ↗`, () => { logClick({ brand: c.brand, product: c.name, store: host(c.url), source: 'chat', web: true }); Linking.openURL(withUtm(c.url)); });
    }
    const canAdd = !!item || !!(c as any).category;
    return (
      <View key={n} style={{ gap: 10, paddingTop: n ? 14 : 2, borderTopWidth: n ? 1 : 0, borderTopColor: 'rgba(17,17,20,0.08)' }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          {swatch(hex, category, item ?? undefined)}
          <View style={{ flex: 1, gap: 2 }}>
            {meta(c.step, c.shadeMatch, web)}
            <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '700', fontSize: 14, lineHeight: 18, color: '#111114' }}>{name}</Text>
            <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 13, lineHeight: 17, color: '#4A4858' }}>{c.why}</Text>
          </View>
        </View>
        {link || canAdd ? <View style={{ flexDirection: 'row', gap: 8 }}>{link ?? <View style={{ flex: 1 }} />}{canAdd ? addBtn(done, () => add(c)) : null}</View> : null}
      </View>
    );
  };

  const last = msgs[msgs.length - 1];
  return (
    <Shell glass active="build"
      footer={<View style={{ width: wide ? 560 : '100%', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, paddingLeft: 16, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.88)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)' }}>
        <Pressable onPress={sendPhoto} disabled={busy} accessibilityRole="button" accessibilityLabel="Send an inspiration photo" accessibilityState={{ disabled: busy }} hitSlop={6}
          style={({ hovered, pressed, focused }: any) => ({ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? '#DADDE2' : hovered && !busy ? '#E6E8EB' : '#F1F3F5', opacity: busy ? 0.45 : 1, marginLeft: -6, ...ring(focused) })}>
          <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M4 7h3l2-2h6l2 2h3v12H4z" stroke="#111114" strokeWidth={1.8} fill="none" strokeLinejoin="round" /><Path d="M12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="#111114" strokeWidth={1.8} fill="none" /></Svg>
        </Pressable>
        <TextInput value={text} onChangeText={setText} onSubmitEditing={send} placeholder="Ask Moi anything about your routine" placeholderTextColor="#8A8DA0" accessibilityLabel="Message Moi"
          style={{ flex: 1, fontFamily: F.medium, fontSize: 15, color: '#1D1D22', paddingVertical: 8, ...({ outlineStyle: 'none' } as object) }} />
        <Pressable onPress={send} disabled={!text.trim() || busy} accessibilityRole="button" accessibilityLabel="Send" accessibilityState={{ disabled: !text.trim() || busy }}
          style={({ hovered, pressed, focused }: any) => ({ width: 38, height: 38, borderRadius: 19, backgroundColor: hovered && text.trim() && !busy ? '#2A2A30' : '#111114', alignItems: 'center', justifyContent: 'center', opacity: text.trim() && !busy ? 1 : 0.3, transform: [{ scale: pressed ? 0.94 : 1 }], ...ring(focused) })}>
          <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="M12 19V5M6 11l6-6 6 6" stroke="#fff" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
        </Pressable>
      </View>}>
      <ScrollView ref={scroll} contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
        {msgs.map(m => m.role === 'user' ? (
          <View key={m.id} style={{ alignSelf: 'flex-end', maxWidth: '80%', gap: 6, padding: m.photo ? 6 : 0, paddingVertical: m.photo ? 6 : 10, paddingHorizontal: m.photo ? 6 : 14, borderRadius: 18, backgroundColor: '#111114' }}>
            {m.photo ? <Image source={{ uri: m.photo }} style={{ width: 170, height: 170, borderRadius: 14 }} accessibilityLabel="Your inspiration photo" /> : null}
            {m.text ? <Text style={[T, { color: '#fff' }]}>{m.text}</Text> : null}
          </View>
        ) : (
          <View key={m.id} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <Image source={crown} style={{ width: 28, height: 28, marginTop: 4 }} resizeMode="contain" />
            <View style={{ flex: 1, gap: 12, padding: 16, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(17,17,20,0.10)' }}>
              {m.text ? <Text style={T}>{m.text}</Text> : null}
              {m.cards?.length ? <View style={{ gap: 14 }}>{(more[m.id] ? m.cards : m.cards.slice(0, 2)).map(card)}
                {m.cards.length > 2 ? (
                  <Pressable onPress={() => setMore(x => ({ ...x, [m.id]: !x[m.id] }))} accessibilityRole="button" accessibilityState={{ expanded: !!more[m.id] }}
                    accessibilityLabel={more[m.id] ? 'Show fewer products' : `See ${m.cards.length - 2} more product${m.cards.length - 2 === 1 ? '' : 's'}`}
                    style={({ hovered, pressed, focused }: any) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 12, backgroundColor: pressed ? '#E9E9EE' : hovered ? '#F1F1F4' : '#F6F6F8', borderWidth: 1, borderColor: 'rgba(17,17,20,0.10)', ...ring(focused) })}>
                    <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 13, color: '#111114' }}>{more[m.id] ? 'Show less' : `See ${m.cards.length - 2} more`}</Text>
                    <Svg width={14} height={14} viewBox="0 0 24 24" style={{ transform: [{ rotate: more[m.id] ? '180deg' : '0deg' }] }}><Path d="M6 9.5l6 6 6-6" stroke="#111114" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
                  </Pressable>
                ) : null}<Text style={{ fontFamily: F.regular, fontSize: 11, lineHeight: 15, color: '#6C6F7A' }}>{`${m.cards.some(x => x.source === 'moi' || (x as any).amazon) ? 'As an Amazon Associate, Moi earns from qualifying purchases. ' : ''}${m.cards.some(x => x.source === 'web') ? 'Web finds aren’t checked by Moi; the brand’s site has the current details.' : 'The store shows the current price.'}`}</Text></View> : null}
              {/* Tap answers: only on the latest message. */}
              {m.local === 'photo' ? <View style={{ flexDirection: 'row' }}>{chip('Upload inspiration', false, sendPhoto, true)}</View> : null}
              {m === last && m.local === 'area' ? (
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {TYPES.map(t => chip(t.label, types.includes(t.label), () => toggleType(t.label)))}
                    {types.length ? chip('Start', false, startTypes, true) : null}
                  </View>
                  <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 11, color: '#6C6A80' }}>Pick as many as you like</Text>
                </View>
              ) : null}
              {m === last && m.ask ? (
                <View style={{ gap: 8 }}>
                  {!norm(m.text).includes(norm(m.ask.q)) ? <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 13, color: '#111114' }}>{m.ask.q}</Text> : null}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {m.ask.options.map(o => chip(o, multi.includes(o), () => answer(m.ask!, o)))}
                    {(m.ask.max ?? 1) > 1 && multi.length ? chip('Done', false, () => answerMany(m.ask!), true) : null}
                  </View>
                  {(m.ask.max ?? 1) > 1 ? <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 11, color: '#6C6A80' }}>{`Pick up to ${m.ask.max}`}</Text> : null}
                </View>
              ) : null}
            </View>
          </View>
        ))}
        {busy ? (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <Image source={crown} style={{ width: 28, height: 28, marginTop: 4 }} resizeMode="contain" />
            <View style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.88)', borderWidth: 0.5, borderColor: 'rgba(20,20,40,0.10)' }}>
              <TypingDots />
            </View>
          </View>
        ) : null}

      </ScrollView>
    </Shell>
  );
}
