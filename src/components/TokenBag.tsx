import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { TOKEN_BAG_SVG } from '../data/tokenBag';
import { TOKENS, loadBuddyStreaks, tokensFor } from '../lib/buddies';
import { C, F } from '../theme';

/** Home header: the toy token bag and how many of the 16 tokens you've collected. Tap to see them. */
export function TokenBag() {
  const [earned, setEarned] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    loadBuddyStreaks().then(s => { if (alive) setEarned(tokensFor(s).filter(t => t.earned).length); }).catch(() => { if (alive) setEarned(0); });
    return () => { alive = false; };
  }, []);
  const n = earned ?? 0;
  return (
    <Pressable onPress={() => router.push('/(tabs)/progress')} accessibilityRole="button" accessibilityLabel={`${n} of ${TOKENS.length} tokens collected`} hitSlop={6}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: pressed ? '#F7F7F8' : '#fff', borderRadius: 999, paddingLeft: 6, paddingRight: 12, paddingVertical: 2, borderWidth: 1, borderColor: C.line, transform: [{ scale: pressed ? 0.96 : 1 }] })}>
      <SvgXml xml={TOKEN_BAG_SVG} width={30} height={30} />
      <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>{n}</Text>
    </Pressable>
  );
}
