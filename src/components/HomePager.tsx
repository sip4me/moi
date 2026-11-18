import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Modal, Platform, Pressable, ScrollView, Text, View, type ScrollViewInstance } from 'react-native';
import { icon3d } from '../data/icons3d';
import { haptic } from '../lib/haptics';
import { onScrollTop } from '../lib/scrollTop';
import { C, F } from '../theme';

const web = Platform.OS === 'web';
export type HomePage = { key: string; title: string; icon: string; summary: string; content: React.ReactNode };

/**
 * Home as a few calm screens instead of one endless scroll: swipe sideways between them (dots show
 * where you are), or press and hold anywhere to see every screen at once and tap the one you want.
 */
export function HomePager({ pages }: { pages: HomePage[] }) {
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);
  const [page, setPage] = useState(0);
  const [overview, setOverview] = useState(false);
  const pager = useRef<ScrollViewInstance>(null);
  const scrollers = useRef<(ScrollViewInstance | null)[]>([]);
  const pageRef = useRef(0);
  pageRef.current = page;
  // The dots fade out after a second on a screen, and come back while you swipe or land somewhere new.
  const dots = useRef(new Animated.Value(1)).current;
  const [dotsOn, setDotsOn] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showDots = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setDotsOn(true);
    Animated.timing(dots, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    hideTimer.current = setTimeout(() => {
      Animated.timing(dots, { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => setDotsOn(false));
    }, 1000);
  };
  useEffect(() => { showDots(); return () => { if (hideTimer.current) clearTimeout(hideTimer.current); }; }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (i: number, animated = true) => {
    pager.current?.scrollTo({ x: i * w, animated });
    setPage(i);
  };
  // Tapping Home in the tab bar: back to the top of this screen, or to the first screen if already there.
  useEffect(() => onScrollTop('index', () => {
    const i = pageRef.current;
    if (i > 0) { go(0); return; }
    scrollers.current[0]?.scrollTo({ y: 0, animated: true });
  }), [w]); // eslint-disable-line react-hooks/exhaustive-deps

  const hold = () => { haptic('select'); setOverview(true); };

  return (
    <View style={{ flex: 1 }} onLayout={e => { setW(e.nativeEvent.layout.width); setH(e.nativeEvent.layout.height); }}>
      {w && h ? (
        <ScrollView ref={pager} horizontal pagingEnabled showsHorizontalScrollIndicator={false} scrollEventThrottle={32}
          onScroll={e => {
            const x = e.nativeEvent.contentOffset.x;
            if (Math.abs(x - pageRef.current * w) > 4) showDots(); // mid-swipe: show where you're heading
            const i = Math.round(x / w);
            if (i !== pageRef.current) { setPage(i); haptic('tap'); }
          }}
          style={{ flex: 1 }} contentContainerStyle={{ height: h }}>
          {pages.map((p, i) => (
            // Each screen is exactly one screen tall, so its own content scrolls up and down inside it.
            <View key={p.key} style={{ width: w, height: h }}>
              <ScrollView ref={r => { scrollers.current[i] = r; }} showsVerticalScrollIndicator={false} style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 150 }}>
                {/* Press and hold any empty part of a screen to see them all. */}
                <Pressable onLongPress={hold} delayLongPress={450} accessibilityHint="Press and hold to see all Home screens"
                  style={web ? ({ cursor: 'default', userSelect: 'none' } as any) : undefined}>
                  {p.content}
                </Pressable>
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {/* Where you are: one dot per screen and its name, just above the tab bar. Tap a dot to jump. */}
      <Animated.View pointerEvents={dotsOn ? 'box-none' : 'none'} style={{ position: 'absolute', left: 0, right: 0, bottom: 98, alignItems: 'center', opacity: dots }}>
        <Pressable onLongPress={hold} delayLongPress={300} onPress={hold} accessibilityRole="button" accessibilityLabel={`Screen ${page + 1} of ${pages.length}, ${pages[page]?.title}. Tap to see all screens.`}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.92)',
            shadowColor: '#1E2430', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }}>
          {pages.map((p, i) => (
            <View key={p.key} style={{ width: i === page ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === page ? C.ink : '#C9CCD1' }} />
          ))}
          <Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.ink, marginLeft: 4 }}>{pages[page]?.title}</Text>
        </Pressable>
      </Animated.View>

      <Overview open={overview} pages={pages} current={page} onClose={() => setOverview(false)} onPick={i => { setOverview(false); setTimeout(() => go(i), 60); }} />
    </View>
  );
}

/** Every Home screen at once, as cards: tap one to open it. */
function Overview({ open, pages, current, onClose, onPick }: { open: boolean; pages: HomePage[]; current: number; onClose: () => void; onPick: (i: number) => void }) {
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!open) return;
    pop.setValue(0);
    Animated.timing(pop, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [open, pop]);
  if (!open) return null;
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={[{ flex: 1, backgroundColor: 'rgba(232,234,238,0.78)', justifyContent: 'center', paddingHorizontal: 20 }, web && ({ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any)]}>
        <Animated.View style={{ maxWidth: 430, width: '100%', alignSelf: 'center', opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1] }) }] }}>
          <Text style={{ fontFamily: F.bold, fontSize: 24, letterSpacing: -0.4, color: C.ink, textAlign: 'center' }}>Your Home screens</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.gray2, textAlign: 'center', marginTop: 6 }}>Tap one to go there. Swipe sideways any time.</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 28 }}>
            {pages.map((p, i) => (
              <Pressable key={p.key} onPress={() => { haptic('select'); onPick(i); }} accessibilityRole="button" accessibilityState={{ selected: i === current }} accessibilityLabel={`${p.title}: ${p.summary}`}
                style={({ pressed }) => ({ flex: 1, aspectRatio: 0.56, borderRadius: 24, backgroundColor: '#fff', padding: 12, alignItems: 'center', justifyContent: 'center', gap: 10,
                  borderWidth: i === current ? 2 : 0, borderColor: C.ink,
                  shadowColor: '#1E2430', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, transform: [{ scale: pressed ? 0.96 : 1 }] })}>
                <Image source={icon3d(p.icon)} style={{ width: 58, height: 58 }} resizeMode="contain" />
                <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.ink, textAlign: 'center' }}>{p.title}</Text>
                <Text numberOfLines={3} style={{ fontFamily: F.regular, fontSize: 12, lineHeight: 16, color: C.gray, textAlign: 'center' }}>{p.summary}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 22 }}>
            {pages.map((p, i) => <View key={p.key} style={{ width: i === current ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === current ? C.ink : '#C9CCD1' }} />)}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
