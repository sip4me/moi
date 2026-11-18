import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { coinSvg } from '../data/tokenArt';
import { TOKEN_BAG_SVG } from '../data/tokenBag';
import { getFalling, onCoin, onFalling, setFalling, takeCoins } from '../lib/coinDrops';
import { haptic } from '../lib/haptics';
import { useStore } from '../state/store';
import { C, F } from '../theme';

const COIN = `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">${coinSvg('crown')}</svg>`;

/** Your coin total: one gold coin for every daily rec you've checked off, minus any still falling. */
function useCoins() {
  const { done } = useStore();
  const total = Object.values(done).reduce((n, ids) => n + ids.length, 0);
  const [air, setAir] = useState(getFalling());
  useEffect(() => onFalling(setAir), []);
  return { total, shown: Math.max(0, total - air) };
}

function Pill({ children, onPress, label }: { children: React.ReactNode; onPress?: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: pressed ? '#F7F7F8' : '#fff', borderRadius: 999, paddingLeft: 6, paddingRight: 12, paddingVertical: 2, borderWidth: 1, borderColor: C.line, transform: [{ scale: pressed ? 0.96 : 1 }] })}>
      {children}
    </Pressable>
  );
}

/** Home header: the toy token bag and your coin count. Tap to see your tokens on Progress. */
export function TokenBag() {
  const { total, shown } = useCoins();
  return (
    <Pill onPress={() => router.push('/(tabs)/progress')} label={`${total} coins. One for every daily step you check off.`}>
      <SvgXml xml={TOKEN_BAG_SVG} width={30} height={30} />
      <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink, minWidth: 10 }}>{shown}</Text>
    </Pill>
  );
}

/**
 * The coin drop: after you check off a daily rec, a copy of the bag floats in at the top right
 * (wherever you've scrolled), each coin spins down into it, the bag bounces, the count ticks up,
 * and the bag slides away again. Render it once on Home, outside the scrolling content.
 */
export function CoinDrop() {
  const { shown } = useCoins();
  const show = useRef(new Animated.Value(0)).current;
  const drop = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const busy = useRef(false);
  const focused = useRef(false);

  const play = useCallback((n: number) => {
    if (n <= 0) return;
    busy.current = true;
    setFalling(getFalling() + n);
    Animated.timing(show, { toValue: 1, duration: 260, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }).start();
    const one = (left: number) => {
      drop.setValue(0);
      Animated.timing(drop, { toValue: 1, duration: 640, delay: 120, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
        haptic('tap');
        setFalling(getFalling() - 1);
        bounce.setValue(0);
        Animated.sequence([
          Animated.timing(bounce, { toValue: 1, duration: 110, useNativeDriver: true }),
          Animated.spring(bounce, { toValue: 0, friction: 4, tension: 160, useNativeDriver: true }),
        ]).start();
        if (left > 1) setTimeout(() => one(left - 1), 80);
        else setTimeout(() => Animated.timing(show, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => { busy.current = false; }), 700);
      });
    };
    one(n);
  }, [show, drop, bounce]);

  // Coins earned on other screens drop in when you come back to Home…
  useFocusEffect(useCallback(() => {
    focused.current = true;
    const t = setTimeout(() => { if (!busy.current) play(takeCoins()); }, 300);
    return () => { focused.current = false; clearTimeout(t); };
  }, [play]));
  // …and ones checked right here on Home drop in straight away.
  useEffect(() => onCoin(() => { if (focused.current && !busy.current) setTimeout(() => play(takeCoins()), 120); }), [play]);

  const panel = {
    opacity: show,
    transform: [{ translateX: show.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }, { scale: show.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
  };
  const coin = {
    opacity: drop.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] }),
    transform: [
      { translateX: drop.interpolate({ inputRange: [0, 1], outputRange: [-46, 0] }) },
      { translateY: drop.interpolate({ inputRange: [0, 0.45, 1], outputRange: [96, 26, 2] }) },
      { rotate: drop.interpolate({ inputRange: [0, 1], outputRange: ['-220deg', '0deg'] }) },
      { scale: drop.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1.3, 0.95, 0.45] }) },
    ],
  };
  const bag = { transform: [{ scale: bounce.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] }) }, { translateY: bounce.interpolate({ inputRange: [0, 1], outputRange: [0, 1.5] }) }] };

  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 12, right: 16, zIndex: 50, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, borderRadius: 999 }, panel]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 999, paddingLeft: 8, paddingRight: 14, paddingVertical: 4, borderWidth: 1, borderColor: C.line }}>
        <View style={{ width: 36, height: 36 }}>
          <Animated.View style={bag}><SvgXml xml={TOKEN_BAG_SVG} width={36} height={36} /></Animated.View>
          <Animated.View style={[{ position: 'absolute', left: 6, top: 4, width: 26, height: 26 }, coin]}><SvgXml xml={COIN} width={26} height={26} /></Animated.View>
        </View>
        <Text style={{ fontFamily: F.bold, fontSize: 18, color: C.ink }}>{shown}</Text>
        <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.gray }}>+1</Text>
      </View>
    </Animated.View>
  );
}
