import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { haptic } from '../lib/haptics';
import { C, F } from '../theme';

const MIN_S = 20; // shortest recording that counts
const MAX_S = 300; // stops on its own after 5 minutes

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/**
 * Record yourself breathing for a coin. The orb swells with your breath (the mic's loudness). Nothing is
 * uploaded or saved: the audio is thrown away the moment you submit, Moi only notes that you did it.
 * Where the mic isn't available it falls back to a breathe-along timer.
 */
export function BreathRecorder({ onSubmit, disabled }: { onSubmit: () => void; disabled?: boolean }) {
  const [stage, setStage] = useState<'idle' | 'rec' | 'denied'>('idle');
  const [secs, setSecs] = useState(0);
  const [heard, setHeard] = useState(false);
  const level = useRef(new Animated.Value(0)).current;
  const stop = useRef<() => void>(() => {});
  useEffect(() => () => stop.current(), []);

  async function start() {
    haptic('tap');
    setSecs(0); setHeard(false);
    const t0 = Date.now();
    const tick = setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      setSecs(s);
      if (s >= MAX_S) finish();
    }, 250);
    let cleanup = () => clearInterval(tick);
    const md = Platform.OS === 'web' && typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
    if (md?.getUserMedia) {
      try {
        const stream = await md.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } as MediaTrackConstraints });
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx: AudioContext = new Ctx();
        const an = ctx.createAnalyser(); an.fftSize = 1024;
        ctx.createMediaStreamSource(stream).connect(an);
        const buf = new Uint8Array(an.fftSize);
        let raf = 0;
        const loop = () => {
          an.getByteTimeDomainData(buf);
          let sum = 0; for (const v of buf) sum += (v - 128) ** 2;
          const rms = Math.sqrt(sum / buf.length) / 128;
          const l = Math.min(1, rms * 9);
          level.setValue(l);
          if (l > 0.12) setHeard(true);
          raf = requestAnimationFrame(loop);
        };
        loop();
        cleanup = () => { clearInterval(tick); cancelAnimationFrame(raf); stream.getTracks().forEach(tr => tr.stop()); ctx.close().catch(() => {}); level.setValue(0); };
      } catch {
        clearInterval(tick);
        setStage('denied');
        return;
      }
    } else {
      // No mic here: breathe along with a slow pulse instead.
      setHeard(true);
      const pulse = Animated.loop(Animated.sequence([
        Animated.timing(level, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(level, { toValue: 0.1, duration: 6000, useNativeDriver: true }),
      ]));
      pulse.start();
      cleanup = () => { clearInterval(tick); pulse.stop(); level.setValue(0); };
    }
    stop.current = cleanup;
    setStage('rec');
  }

  function finish() { stop.current(); stop.current = () => {}; setStage('idle'); }

  const ready = secs >= MIN_S && heard;
  const submit = () => { finish(); haptic('success'); onSubmit(); };
  const scale = level.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.25] });

  if (stage === 'denied') {
    return (
      <View style={box}>
        <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>Microphone is off</Text>
        <Text style={{ fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: C.gray2, marginTop: 4 }}>Allow the microphone for Moi in your browser settings, then try again.</Text>
        <Pressable onPress={() => setStage('idle')} style={{ marginTop: 10, alignSelf: 'flex-start' }}><Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.ink, textDecorationLine: 'underline' }}>Try again</Text></Pressable>
      </View>
    );
  }

  if (stage === 'rec') {
    return (
      <View style={[box, { alignItems: 'center', gap: 10 }]}>
        <View style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{ position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: '#D9CCFB', opacity: 0.55, transform: [{ scale }] }} />
          <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#8B6CF6', alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={26} height={26} viewBox="0 0 24 24"><Rect x={9} y={3} width={6} height={11} rx={3} fill="#fff" /><Path d="M6 11a6 6 0 0 0 12 0M12 17v4" stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" /></Svg>
          </View>
        </View>
        <Text style={{ fontFamily: F.bold, fontSize: 22, color: C.ink, fontVariant: ['tabular-nums'] }}>{fmt(secs)}</Text>
        <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.gray2, textAlign: 'center' }}>
          {secs < MIN_S ? `Breathe in for 4, out for 6. ${MIN_S - secs}s to go.` : heard ? 'Lovely. Keep going, or submit when you’re ready.' : 'We can’t hear you yet. Breathe a little closer to the mic.'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch' }}>
          <Pressable onPress={finish} style={({ pressed }) => [btn, { flex: 1, backgroundColor: pressed ? '#EDEDF0' : '#F4F4F6' }]}><Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>Cancel</Text></Pressable>
          <Pressable onPress={submit} disabled={!ready} style={({ pressed }) => [btn, { flex: 1.4, backgroundColor: ready ? (pressed ? '#2E2E2E' : C.ink) : '#CFCFD4' }]}><Text style={{ fontFamily: F.semibold, fontSize: 15, color: '#fff' }}>Submit for a coin</Text></Pressable>
        </View>
      </View>
    );
  }

  return (
    <Pressable onPress={start} disabled={disabled} accessibilityRole="button" accessibilityLabel="Record your breathing"
      style={({ pressed }) => [box, { flexDirection: 'row', alignItems: 'center', gap: 12, opacity: disabled ? 0.6 : 1, backgroundColor: pressed ? '#F1F1F4' : 'rgba(255,255,255,0.85)' }]}>
      <Svg width={30} height={30} viewBox="0 0 30 30"><Circle cx={15} cy={15} r={15} fill="#8B6CF6" /><Rect x={12} y={7} width={6} height={10} rx={3} fill="#fff" /><Path d="M9.5 14.5a5.5 5.5 0 0 0 11 0M15 20v3" stroke="#fff" strokeWidth={1.8} fill="none" strokeLinecap="round" /></Svg>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>Record your breathing</Text>
        <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray }}>At least {MIN_S} seconds. Never saved or uploaded.</Text>
      </View>
    </Pressable>
  );
}

const box = { marginTop: 18, padding: 14, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: '#ECECF0' } as const;
const btn = { height: 46, borderRadius: 999, alignItems: 'center', justifyContent: 'center' } as const;
