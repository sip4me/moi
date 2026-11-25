import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Shell, SYS, useWide } from '../../components/routine/Kit';
import shades from '../../lib/routine/shades.json';
import { findFace, render, type Layers, type Pt } from '../../lib/routine/tryon';
import { F } from '../../theme';

/** Test page (not linked yet): makeup painted on the person's own photo, on the device. */

const DICT = new Map((shades as { shades: { w: string; hex: string }[] }).shades.map(s => [s.w, s.hex]));
const hex = (w: string, fb: string) => DICT.get(w) ?? fb;

const LOOKS: { name: string; L: Layers }[] = [
  { name: 'Soft glam', L: { lips: hex('rose', '#B5656B'), blush: hex('soft pink', '#E8A0A6'), bronzer: hex('bronze', '#A8693C'), shadow: hex('taupe', '#8B7B6B'), liner: hex('brown', '#4A3022'), highlight: true } },
  { name: 'Bold lip', L: { lips: hex('true red', '#C41E3A'), liner: hex('black', '#1A1A1A'), wing: true } },
  { name: 'Smudged kohl', L: { lips: hex('nude', '#B98A78'), shadow: hex('dark brown', '#4A2F24'), liner: hex('dark brown', '#3B2418') } },
  { name: 'Toasty', L: { lips: hex('terracotta', '#B5583C'), blush: hex('terracotta', '#C96A4A'), bronzer: hex('bronze', '#A8693C'), shadow: hex('copper', '#B06A3B') } },
  { name: 'Glossy', L: { lips: hex('pink', '#D9718A'), lipGloss: true, blush: hex('pink', '#E89AAE'), highlight: true } },
];
const LIP_SWATCHES = ['nude', 'rose', 'mauve', 'berry', 'true red', 'orange red', 'terracotta', 'plum', 'pink', 'brick'].map(w => ({ w, c: hex(w, '#B5656B') }));
const SAMPLES = ['Fair', 'Light', 'Medium', 'Tan', 'Deep', 'Rich'];
const STRENGTH = { Light: 0.45, Medium: 0.7, Full: 1 } as const;

export default function TryOn() {
  const wide = useWide();
  const holder = useRef<any>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const [pts, setPts] = useState<Pt[] | null>(null);
  const [msg, setMsg] = useState('Upload a front-facing selfie, or try a sample face.');
  const [look, setLook] = useState(0);
  const [lip, setLip] = useState<string | null>(null);
  const [on, setOn] = useState(true);
  const [str, setStr] = useState<keyof typeof STRENGTH>('Medium');
  const [loaded, setLoaded] = useState(false);
  const W = wide ? 420 : 330;

  // The canvas is a plain DOM element inside the React Native Web view.
  useEffect(() => {
    if (Platform.OS !== 'web' || !holder.current) return;
    const el: HTMLElement = holder.current as HTMLElement;
    const c = document.createElement('canvas');
    c.style.width = '100%'; c.style.borderRadius = '22px'; c.style.display = 'block';
    el.appendChild(c); canvas.current = c;
    return () => { c.remove(); };
  }, []);

  const layers: Layers = { ...LOOKS[look].L, ...(lip ? { lips: lip } : {}) };
  // An untouched copy of the photo, so every redraw starts from the original.
  const base = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = canvas.current, b = base.current;
    if (!c || !b || !loaded) return;
    render(c.getContext('2d')!, b, pts, layers, on, STRENGTH[str]);
  }, [pts, on, str, loaded, look, lip]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = async (src: string) => {
    setMsg('Finding your face…'); setPts(null); setLoaded(false);
    const i = new Image(); i.crossOrigin = 'anonymous';
    await new Promise<void>((ok, bad) => { i.onload = () => ok(); i.onerror = () => bad(); i.src = src; }).catch(() => null);
    if (!i.naturalWidth) { setMsg('That photo couldn’t be opened. Try a JPG or PNG.'); return; }
    // Work at up to 900 px wide: sharp enough, fast on phones.
    const s = Math.min(1, 900 / i.naturalWidth);
    const b = document.createElement('canvas'); b.width = Math.round(i.naturalWidth * s); b.height = Math.round(i.naturalHeight * s);
    b.getContext('2d')!.drawImage(i, 0, 0, b.width, b.height);
    base.current = b;
    const c = canvas.current!; c.width = b.width; c.height = b.height;
    try {
      const p = await findFace(b);
      setPts(p);
      setMsg(p ? '' : 'No face found. Try a front-facing photo in good light, with your hair off your face.');
    } catch { setMsg('The face finder couldn’t load. Check your connection and try again.'); }
    setLoaded(true);
  };

  const pick = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.setAttribute('capture', 'user');
    input.onchange = () => { const f = input.files?.[0]; if (f) open(URL.createObjectURL(f)); };
    input.click();
  };

  const chip = (label: string, active: boolean, onPress: () => void) => (
    <Pressable key={label} onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }}
      style={{ paddingHorizontal: 14, height: 34, borderRadius: 17, justifyContent: 'center', backgroundColor: active ? '#111114' : 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: active ? '#111114' : 'rgba(255,255,255,0.8)' }}>
      <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 13, color: active ? '#fff' : '#111114' }}>{label}</Text>
    </Pressable>
  );
  const label = { fontFamily: SYS ?? F.semibold, fontWeight: '600' as const, fontSize: 12, letterSpacing: 0.5, color: '#4A4858', textTransform: 'uppercase' as const };

  if (Platform.OS !== 'web') return <Shell glass><Text>Try-on works in the browser for now.</Text></Shell>;
  return (
    <Shell glass>
      <View style={{ gap: 14, maxWidth: 460, alignSelf: 'center', width: '100%' }}>
        <View style={{ gap: 4 }}>
          <Text {...({ dataSet: { grad: 'title' } } as any)} style={{ fontFamily: SYS ?? F.bold, fontWeight: '700', fontSize: 24, color: '#111114' }}>Try it on</Text>
          <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 13, color: '#4A4858' }}>Test version. Your photo stays on this device.</Text>
        </View>

        <View style={{ padding: 10, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.38)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)', ...({ backdropFilter: 'blur(22px)' } as any) }}>
          <View ref={holder} style={{ width: '100%', maxWidth: W, alignSelf: 'center', minHeight: loaded ? undefined : 120 }} />
          {msg ? <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 13, lineHeight: 18, color: '#4A4858', textAlign: 'center', padding: 10 }}>{msg}</Text> : null}
          {loaded && pts ? (
            <View style={{ flexDirection: 'row', alignSelf: 'center', marginTop: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.7)', padding: 3 }}>
              {(['Before', 'After'] as const).map(l => { const a = (l === 'After') === on; return (
                <Pressable key={l} onPress={() => setOn(l === 'After')} accessibilityRole="tab" accessibilityState={{ selected: a }} style={{ paddingHorizontal: 18, height: 32, borderRadius: 16, justifyContent: 'center', backgroundColor: a ? '#111114' : 'transparent' }}>
                  <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 13, color: a ? '#fff' : '#111114' }}>{l}</Text>
                </Pressable>); })}
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {chip(loaded ? 'New selfie' : 'Upload a selfie', false, pick)}
        </View>
        <Text style={label}>Sample faces</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {SAMPLES.map(t => chip(t, false, () => open(`/try/${t.toLowerCase()}.jpg`)))}
        </ScrollView>

        <Text style={label}>Look</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {LOOKS.map((l, n) => chip(l.name, look === n, () => { setLook(n); setLip(null); }))}
        </ScrollView>

        <Text style={label}>Lip shade</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {LIP_SWATCHES.map(s => { const a = (lip ?? layers.lips) === s.c; return (
            <Pressable key={s.w} onPress={() => setLip(s.c)} accessibilityRole="button" accessibilityLabel={s.w}
              style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: s.c, borderWidth: a ? 3 : 1.5, borderColor: a ? '#111114' : 'rgba(255,255,255,0.9)' }} />); })}
        </ScrollView>

        <Text style={label}>Strength</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>{(Object.keys(STRENGTH) as (keyof typeof STRENGTH)[]).map(k => chip(k, str === k, () => setStr(k)))}</View>
      </View>
    </Shell>
  );
}
