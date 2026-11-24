import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, Pressable, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMembers } from '../../lib/routine/access';
import { Logo } from '../../components/ui';
import { haptic } from '../../lib/haptics';
import { fill } from '../../lib/routine/shine';
import { session, setRoutine } from '../../lib/routine/model';
import { lookFromText } from '../../lib/routine/looks';
import { takeProductPhoto } from '../../lib/routine/capture';
import { useStore } from '../../state/store';
import { C, F } from '../../theme';

const crownArt = require('../../../assets/crown-pink.png');

/** The front page on warm paper: the crowned Moi wordmark, "beauty is genius" in vermilion, and a gold coin arrow into Routine. */
/** Counts up from 0 to the live number, then follows it as it grows. */
function useCountUp(target: number | null) {
  const [n, setN] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (target == null) return;
    const start = from.current, t0 = Date.now(), dur = start === 0 ? 1400 : 600;
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      const v = Math.round(start + (target - start) * e);
      setN(v); from.current = v;
      if (p >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [target]);
  return n;
}

const COIN_CROWN = require('../../../assets/coin-seal.png');

export default function Welcome() {
  const members = useMembers();
  const shown = useCountUp(members);
  const logo = useRef(new Animated.Value(0)).current;
  const line = useRef(new Animated.Value(0)).current;
  const arrow = useRef(new Animated.Value(0)).current;
  const nudge = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  // "beauty is genius" drifts gently up and down.
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  useEffect(() => {
    Animated.sequence([
      Animated.timing(logo, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(line, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(arrow, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(nudge, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(nudge, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])).start();
    });
  }, []);
  const rise = (v: Animated.Value) => ({ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] });
  // First time through on this visit, the answers open empty; coming back later keeps them for editing.
  const go = () => {
    haptic();
    const fresh = !session.started; session.started = true;
    setRoutine(r => ({ ...r, welcomed: true, ...(fresh ? { goals: [], hair: {}, areas: [], prefs: {}, started: false } : {}) }));
    router.push('/routine/about'); // push, so the browser's Back returns here
  };
  // "Copy a look": describe it or add a photo, then sign up and the routine starts from it.
  const [look, setLook] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const { account } = useStore();
  // On a computer, a photo can also be dropped onto the prompt box.
  const dropRef = useRef<View>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = dropRef.current as unknown as HTMLElement | null;
    if (!el?.addEventListener) return;
    const over = (e: DragEvent) => e.preventDefault();
    const drop = (e: DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer?.files?.[0];
      if (f && f.type.startsWith('image/')) { haptic('select'); setPhoto(URL.createObjectURL(f)); }
    };
    el.addEventListener('dragover', over); el.addEventListener('drop', drop);
    return () => { el.removeEventListener('dragover', over); el.removeEventListener('drop', drop); };
  }, []);
  const addPhoto = async () => { const uri = await takeProductPhoto(true); if (uri) { haptic('select'); setPhoto(uri); } };
  const start = () => {
    if (!look.trim() && !photo) return;
    haptic('success');
    session.started = true;
    const r0 = lookFromText(look);
    session.lookPhoto = photo ?? undefined;
    setRoutine(r => ({ ...r, welcomed: true, started: false, lookText: look.trim() || undefined, areas: r0.area ? [r0.area] : [], prefs: r0.prefs, goals: r0.goals, hair: {} }));
    const next = '/routine/about';
    if (account && !account.anonymous) router.push(next);
    else router.push({ pathname: '/sign-in', params: { mode: 'signup', next } });
  };
  const { width: W, height: H } = useWindowDimensions();
  const cw = Math.min(340, W - 56), ch = Math.min(540, Math.max(440, H * 0.64));
  const back = useRef(new Animated.Value(0)).current;
  // The circles behind the glass drift very slowly, so the colour under the card shifts a little.
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(back, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(back, { toValue: 0, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  const drift = (dx: number, dy: number) => ({ transform: [{ translateX: back.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) }, { translateY: back.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) }] });
  const orb = (size: number, left: number, top: number, id: string, a: string, b: string, dx: number, dy: number) => (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left, top, width: size, height: size }, drift(dx, dy)]}>
      <Svg width={size} height={size}>
        <Defs><LinearGradient id={id} x1="0.2" y1="0" x2="0.8" y2="1"><Stop offset="0" stopColor={a} /><Stop offset="1" stopColor={b} /></LinearGradient></Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
  const cx = W / 2 - cw / 2, cy = H / 2 - ch / 2;
  return (
    <View {...fill('glass-bg')} style={{ flex: 1, backgroundColor: '#B7AFC2' }}>
      {/* Colour behind the glass: crimson to amber top left, mauve to sage right, coral bottom left. */}
      {orb(cw * 0.72, cx - cw * 0.26, cy - ch * 0.1, 'o1', '#E8A06B', '#C8164E', 10, 8)}
      {orb(cw * 0.66, Math.min(cx + cw * 0.62, W - cw * 0.66 * 0.62), cy + ch * 0.24, 'o2', '#C996A8', '#5E9468', -8, 10)}
      {orb(cw * 0.46, cx - cw * 0.04, cy + ch * 0.74, 'o3', '#F4A38C', '#E06B4F', 8, -6)}
      <SafeAreaView style={{ flex: 1, zIndex: 2 }}>
        {members != null ? (
          <Animated.View {...fill('glass-bar')} style={[{ position: 'absolute', top: 14, right: 16, zIndex: 3, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingLeft: 8, paddingRight: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)' }, rise(arrow)]} accessibilityLabel={`${members} people building routines`}>
            <Image source={COIN_CROWN} style={{ width: 30, height: 30 }} resizeMode="contain" />
            <View>
              <Text style={{ fontFamily: F.display, fontSize: 22, lineHeight: 24, color: C.ink, fontVariant: ['tabular-nums'] }}>{shown.toLocaleString()}</Text>
              <Text style={{ fontFamily: F.medium, fontSize: 11, color: '#4A4F63', letterSpacing: 0.2 }}>building routines</Text>
            </View>
          </Animated.View>
        ) : null}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View {...fill('glass-card')} style={[{ width: cw, height: ch, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.28)', padding: 16, justifyContent: 'space-between' }, rise(logo)]}>
            <View />
            <View style={{ alignItems: 'center' }}>
              <Logo size={76} color={C.ink} />
              <Animated.Text style={[{ fontFamily: F.display, fontSize: 24, lineHeight: 30, letterSpacing: 0.2, color: '#9E3550', marginTop: 14, transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] }, { opacity: line }]}>beauty is genius</Animated.Text>
              <Animated.Text style={[{ fontFamily: F.medium, fontSize: 16, lineHeight: 22, color: '#2A2F45', marginTop: 6 }, { opacity: line }]}>Yours is a routine you love.</Animated.Text>
            </View>
            {/* Lovable-style prompt: describe a look or add a photo, then go. */}
            <Animated.View style={[{ gap: 10 }, rise(arrow)]}>
              <View ref={dropRef} {...fill('glass-bar')} style={{ borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.75)', backgroundColor: 'rgba(255,255,255,0.72)', padding: 12, gap: 10 }}>
                <TextInput value={look} onChangeText={setLook} placeholder="Describe a look you love, or add a photo" placeholderTextColor="#8A8DA0" multiline
                  accessibilityLabel="Describe a look you love" onSubmitEditing={start} blurOnSubmit
                  style={{ minHeight: 52, fontFamily: F.medium, fontSize: 16, lineHeight: 22, color: C.ink, paddingHorizontal: 4, paddingTop: 2, ...({ outlineStyle: 'none' } as object) }} />
                {photo ? (
                  <View style={{ alignSelf: 'flex-start' }}>
                    <Image source={{ uri: photo }} style={{ width: 72, height: 72, borderRadius: 14 }} accessibilityLabel="Your look photo" />
                    <Pressable onPress={() => setPhoto(null)} accessibilityRole="button" accessibilityLabel="Remove photo" hitSlop={8}
                      style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#111114', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 12, lineHeight: 14 }}>✕</Text>
                    </Pressable>
                  </View>
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Pressable onPress={addPhoto} accessibilityRole="button" accessibilityLabel={photo ? 'Change photo' : 'Upload an image of a look'}
                    style={({ hovered }: any) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(20,20,40,0.12)', backgroundColor: hovered ? '#F4F4F7' : '#fff' })}>
                    <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5zM4 16l4.5-4.5 3.5 3.5 2.5-2.5L20 18M15.5 8.5h.01" stroke="#2A2F45" strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
                    <Text style={{ fontFamily: F.semibold, fontSize: 13, color: '#2A2F45' }}>{photo ? 'Change image' : 'Upload image'}</Text>
                  </Pressable>
                  <View style={{ flex: 1 }} />
                  <Pressable {...fill('chrome-key')} onPress={start} accessibilityRole="button" accessibilityLabel="Build my routine from this look" disabled={!look.trim() && !photo}
                    style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DADADA', borderWidth: 1.5, borderColor: '#161616', opacity: look.trim() || photo ? 1 : 0.45 }}>
                    <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M12 19V5M6 11l6-6 6 6" stroke="#111114" strokeWidth={2.1} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
                  </Pressable>
                </View>
              </View>
              <Pressable onPress={go} accessibilityRole="button" accessibilityLabel="Or start with a few questions" hitSlop={8} style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontFamily: F.semibold, fontSize: 13, letterSpacing: 0.4, color: '#2A2F45' }}>Or answer a few questions</Text>
                <Animated.View style={{ transform: [{ translateX: nudge.interpolate({ inputRange: [0, 1], outputRange: [-2, 2] }) }] }}>
                  <Svg width={14} height={14} viewBox="0 0 24 24"><Path d="M5 12h13M13 6l6 6-6 6" stroke="#2A2F45" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
                </Animated.View>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </View>
        <Text style={{ textAlign: 'center', paddingBottom: 18, fontFamily: F.medium, fontSize: 12, letterSpacing: 0.4, color: 'rgba(255,255,255,0.82)' }}>© 2026 Moi</Text>
      </SafeAreaView>
    </View>
  );
}
