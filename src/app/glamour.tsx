import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Platform, Pressable, Share, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { GLAMOUR, type GlamourCard, todaysGlamour } from '../data/glamour';
import { haptic } from '../lib/haptics';
import { useStore } from '../state/store';
import { F } from '../theme';

const PLUM = '#2E1F4A', MAUVE = '#6A4FB0', HEART = '#8E6FD8', CARD = '#F6F2FF';

const Heart = ({ filled, size = 22 }: { filled?: boolean; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M12 20.5s-7.5-4.4-9.3-9.2C1.4 7.7 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.2 4.3 6.8-1.8 4.8-9.3 9.2-9.3 9.2Z" fill={filled ? HEART : 'none'} stroke={HEART} strokeWidth={2} strokeLinejoin="round" /></Svg>
);
const ShareIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" stroke={PLUM} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
);
const Circle = ({ children, onPress, label }: { children: React.ReactNode; onPress: () => void; label: string }) => (
  <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={8}
    style={({ pressed }) => ({ width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? '#ECE6FA' : 'rgba(255,255,255,0.55)', transform: [{ scale: pressed ? 0.94 : 1 }] })}>
    {children}
  </Pressable>
);

function CardFace({ card, saved, onSave, onShare }: { card: GlamourCard; saved: boolean; onSave: () => void; onShare: () => void }) {
  return (
    <View style={{ flex: 1, padding: 22 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Circle onPress={onSave} label={saved ? 'Unsave' : 'Save'}><Heart filled={saved} /></Circle>
        <Circle onPress={onShare} label="Share"><ShareIcon /></Circle>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 6, gap: 26 }}>
        <Text style={{ fontFamily: F.glam, fontSize: 28, lineHeight: 36, color: PLUM, textAlign: 'center' }}>{card.line}</Text>
        <Text style={{ fontFamily: F.semibold, fontSize: 12, letterSpacing: 3, color: MAUVE, textAlign: 'center' }}>{card.tag.toUpperCase()}</Text>
      </View>
    </View>
  );
}

/** Remind yourself of your glamour: today's five cards as a swipeable deck. Swipe or tap for the next. */
export default function Glamour() {
  const { todayKey, saved, toggleSaved } = useStore();
  const { width } = useWindowDimensions();
  const [showSaved, setShowSaved] = useState(false);
  const deck = useMemo(() => (showSaved ? GLAMOUR.filter(g => saved.includes(`glam:${g.id}`)) : todaysGlamour(todayKey)), [showSaved, saved, todayKey]);
  const [i, setI] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(0)).current; // 0 → 1 as the next card rises into place
  const busy = useRef(false);
  const cardW = Math.min(width - 48, 420);
  const done = i >= deck.length;

  const next = (dir: 1 | -1 = 1) => {
    if (busy.current || done) return;
    busy.current = true; haptic('select');
    Animated.parallel([
      Animated.timing(x, { toValue: dir * (width + 80), duration: 320, easing: Easing.in(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(lift, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }),
    ]).start(() => { x.setValue(0); lift.setValue(0); setI(n => n + 1); busy.current = false; });
  };
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderMove: (_e, g) => x.setValue(g.dx),
    onPanResponderRelease: (_e, g) => {
      if (Math.abs(g.dx) > 90 || Math.abs(g.vx) > 0.6) next(g.dx > 0 ? 1 : -1);
      else Animated.spring(x, { toValue: 0, useNativeDriver: Platform.OS !== 'web', bounciness: 8 }).start();
    },
  })).current;

  const share = async (c: GlamourCard) => {
    const message = `“${c.line}” — ${c.tag}. Remind yourself of your glamour with Moi.`;
    try {
      if (Platform.OS === 'web' && (navigator as any).share) await (navigator as any).share({ text: message });
      else await Share.share({ message });
    } catch { /* cancelled */ }
  };
  const save = (c: GlamourCard) => { haptic(saved.includes(`glam:${c.id}`) ? 'select' : 'success'); toggleSaved(`glam:${c.id}`); };
  const rotate = x.interpolate({ inputRange: [-width, 0, width], outputRange: ['-14deg', '0deg', '14deg'] });
  const behind = (depth: number) => ({
    transform: [
      { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [depth * 16, (depth - 1) * 16] }) },
      { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1 - depth * 0.05, 1 - (depth - 1) * 0.05] }) },
    ],
  });

  return (
    <View style={{ flex: 1 }}>
      <Svg style={{ position: 'absolute', width: '100%', height: '100%' }}>
        <Defs><LinearGradient id="glam" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#F1ECFF" /><Stop offset="0.45" stopColor="#DCD0FB" /><Stop offset="1" stopColor="#B9A3F0" /></LinearGradient></Defs>
        <Rect width="100%" height="100%" fill="url(#glam)" />
      </Svg>
      <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 24 }} edges={['top', 'bottom']}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8 }}>
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} accessibilityLabel="Close" hitSlop={10}
            style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.45)' })}>
            <Svg width={14} height={14} viewBox="0 0 24 24"><Path d="M5 5l14 14M19 5 5 19" stroke={PLUM} strokeWidth={2.6} strokeLinecap="round" /></Svg>
          </Pressable>
          <Pressable onPress={() => { haptic('select'); setShowSaved(v => !v); setI(0); }} accessibilityLabel={showSaved ? 'Show today’s cards' : 'Show saved cards'}
            style={({ pressed }) => ({ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: showSaved ? '#fff' : pressed ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.5)' })}>
            <Heart filled size={24} />
          </Pressable>
        </View>
        <Text style={{ fontFamily: F.glam, fontSize: 40, lineHeight: 46, letterSpacing: -0.2, color: PLUM, marginTop: 6 }}>{showSaved ? 'Your saved\nglamour' : 'Remind yourself\nof your glamour'}</Text>
        <Text style={{ fontFamily: F.semibold, fontSize: 12, letterSpacing: 3.2, color: MAUVE, marginTop: 14 }}>{showSaved ? `${deck.length} SAVED` : 'COME BACK ONCE DAILY'}</Text>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 30 }}>
          <View style={{ width: cardW, height: Math.min(cardW * 1.08, 460) }}>
            {done || !deck.length ? (
              <View style={{ flex: 1, borderRadius: 40, borderWidth: 8, borderColor: '#fff', backgroundColor: CARD, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 }}>
                <Text style={{ fontFamily: F.glam, fontSize: 26, lineHeight: 34, color: PLUM, textAlign: 'center' }}>{deck.length ? 'You’re glowing.\nCome back tomorrow for more.' : 'Tap the heart on any card to keep it here.'}</Text>
                {deck.length ? (
                  <Pressable onPress={() => { haptic('select'); setI(0); }} style={({ pressed }) => ({ marginTop: 6, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: pressed ? '#DED3F7' : '#ECE5FB' })}>
                    <Text style={{ fontFamily: F.semibold, fontSize: 12, letterSpacing: 2.4, color: MAUVE }}>READ AGAIN</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <>
                {/* The stack: up to two cards peeking out below, rising as the top card flies off. */}
                {[2, 1].map(depth => (i + depth < deck.length ? (
                  <Animated.View key={`b${depth}`} style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 40, borderWidth: 8, borderColor: '#fff', backgroundColor: depth === 1 ? '#EEE8FD' : '#E5DCFA' }, behind(depth)]} />
                ) : null))}
                <Animated.View {...pan.panHandlers}
                  style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 40, borderWidth: 8, borderColor: '#fff', backgroundColor: CARD,
                    shadowColor: '#6A4FB0', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, transform: [{ translateX: x }, { rotate }] }}>
                  <Pressable style={{ flex: 1 }} onPress={() => next(1)} accessibilityHint="Shows the next card">
                    <CardFace card={deck[i]} saved={saved.includes(`glam:${deck[i].id}`)} onSave={() => save(deck[i])} onShare={() => share(deck[i])} />
                  </Pressable>
                </Animated.View>
              </>
            )}
          </View>
          {!done && deck.length ? (
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 44 }}>
              {deck.map((g, k) => <View key={g.id} style={{ width: k === i ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: k === i ? PLUM : 'rgba(46,31,74,0.25)' }} />)}
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}
