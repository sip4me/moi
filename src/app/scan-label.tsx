import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Text, TextInput, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Button, Screen, Sub, TopBar } from '../components/ui';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { FOOD_DATA_CREDIT, type ScannedFood, foodByBarcode, ironFromLabel, ironVerdict } from '../lib/foodScan';
import { ironTarget } from '../data/ironRecipes';
import { useStore } from '../state/store';
import { haptic } from '../lib/haptics';
import { canScanLabels, extractIngredients, productByBarcode, readBarcode, readText } from '../lib/labelScan';
import { type CatalogProduct, PRODUCT_DATA_CREDIT } from '../lib/products';
import { C, F } from '../theme';

type State =
  | { step: 'start' }
  | { step: 'working'; photo: string; label: string; progress?: number }
  | { step: 'product'; photo: string; product: CatalogProduct }
  | { step: 'text'; photo: string; text: string; confident: boolean; note?: string }
  | { step: 'food'; photo: string; food: ScannedFood; fromBarcode: boolean }
  | { step: 'error'; photo?: string; message: string };

const Frame = () => (
  <Svg width={180} height={130} viewBox="0 0 180 130">
    <Rect x={30} y={8} width={120} height={114} rx={18} fill="#fff" stroke="#E3E3E6" strokeWidth={2} />
    <Rect x={48} y={26} width={84} height={8} rx={4} fill="#E9E9EB" />
    <Rect x={48} y={42} width={70} height={6} rx={3} fill="#EFEFF1" />
    <Rect x={48} y={54} width={78} height={6} rx={3} fill="#EFEFF1" />
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => <Rect key={i} x={52 + i * 7.5} y={78} width={i % 3 ? 3 : 5} height={28} fill={C.ink} />)}
    <Path d="M14 30V16a8 8 0 0 1 8-8h14M144 8h14a8 8 0 0 1 8 8v14M166 100v14a8 8 0 0 1-8 8h-14M36 122H22a8 8 0 0 1-8-8v-14" stroke={C.ink} strokeWidth={3} fill="none" strokeLinecap="round" />
  </Svg>
);

const MODES = ['Hair product', 'Iron food'];

/**
 * Scan: photograph a hair product (found by barcode, or its ingredient list is read) or a food
 * (found by barcode in Open Food Facts, or "Iron" is read off its Nutrition Facts panel).
 */
export default function ScanLabel() {
  const params = useLocalSearchParams<{ mode?: string; proof?: string }>();
  const [mode, setMode] = useState(params.mode === 'food' ? 1 : 0);
  const food = mode === 1;
  const [s, setS] = useState<State>({ step: 'start' });
  const { answers, done, todayKey, toggleDone } = useStore();
  const need = ironTarget(answers);
  const ironDone = (done[todayKey] ?? []).includes('iron_food');
  // Opened from a rec that asks for a product scan: a successful scan ticks that rec (and drops a coin).
  const proof = params.proof;
  const proven = !!proof && (done[todayKey] ?? []).includes(proof);
  const scanned = s.step === 'product' || s.step === 'food';
  useEffect(() => { if (proof && scanned && !proven) toggleDone(proof); }, [proof, scanned, proven, toggleDone]);

  async function scanFood(photo: string) {
    try {
      setS({ step: 'working', photo, label: 'Looking for a barcode…' });
      const code = await readBarcode(photo).catch(() => null);
      if (code) {
        setS({ step: 'working', photo, label: 'Found a barcode. Looking it up…' });
        const f = await foodByBarcode(code).catch(() => null);
        if (f) { haptic('success'); return setS({ step: 'food', photo, food: f, fromBarcode: true }); }
      }
      setS({ step: 'working', photo, label: 'Reading the Nutrition Facts…', progress: 0 });
      const raw = await readText(photo, p => setS(prev => (prev.step === 'working' ? { ...prev, progress: p } : prev)));
      const found = ironFromLabel(raw);
      if (!found) return setS({ step: 'error', photo, message: 'We couldn’t find iron on this label. Snap the Nutrition Facts panel so the “Iron” line is sharp and in frame.' });
      haptic('success');
      setS({ step: 'food', photo, food: { name: 'This food', serving: found.serving, ironMg: found.ironMg, basis: 'serving' }, fromBarcode: false });
    } catch {
      setS({ step: 'error', photo, message: 'Something went wrong reading the photo. Check your connection and try again.' });
    }
  }

  async function pick(fromLibrary: boolean) {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.9 };
    const res = fromLibrary ? await ImagePicker.launchImageLibraryAsync(opts) : await ImagePicker.launchCameraAsync(opts).catch(() => ImagePicker.launchImageLibraryAsync(opts));
    if (res.canceled || !res.assets?.[0]) return;
    const photo = res.assets[0].uri;
    if (food) {
      if (!canScanLabels) return setS({ step: 'error', photo, message: 'Food scanning works in the web app for now. Check the “Iron” line on the Nutrition Facts panel: 20% or more is iron-rich.' });
      return scanFood(photo);
    }
    if (!canScanLabels) return setS({ step: 'text', photo, text: '', confident: false, note: 'Type or paste the ingredients from the photo.' });

    try {
      setS({ step: 'working', photo, label: 'Looking for a barcode…' });
      const code = await readBarcode(photo).catch(() => null);
      let offline = false;
      if (code) {
        setS({ step: 'working', photo, label: 'Found a barcode. Looking it up…' });
        const product = await productByBarcode(code).catch(() => { offline = true; return null; });
        if (product?.ingredients) { haptic('success'); return setS({ step: 'product', photo, product }); }
      }
      setS({ step: 'working', photo, label: 'Reading the ingredient list…', progress: 0 });
      const raw = await readText(photo, p => setS(prev => (prev.step === 'working' ? { ...prev, progress: p } : prev)));
      const { text, confident } = extractIngredients(raw);
      if (text.length < 15) return setS({ step: 'error', photo, message: code ? 'We found the barcode but couldn’t look it up, and there’s no readable ingredient list in this photo. Check your connection, or take a close photo of the ingredient list.' : 'We couldn’t find a barcode or read an ingredient list. Try a closer, well-lit photo of the back label.' });
      haptic('success');
      setS({ step: 'text', photo, text, confident, note: !code ? undefined : offline ? 'We couldn’t look up the barcode right now, so we read the label instead.' : 'This product isn’t in our database yet, so we read the label instead.' });
    } catch {
      setS({ step: 'error', photo, message: 'Something went wrong reading the photo. Check your connection and try again.' });
    }
  }

  const check = (label: string, name?: string) => router.replace({ pathname: '/product-fit', params: { label, ...(name ? { name } : {}) } });
  const photo = 'photo' in s ? s.photo : undefined;

  return (
    <Screen scroll footer={
      s.step === 'start' ? <View style={{ gap: 10 }}><Button label="Take a photo" onPress={() => pick(false)} /><Button label="Upload a photo" variant="secondary" onPress={() => pick(true)} /></View>
        : s.step === 'working' ? <Button label={s.label} loading disabled />
        : s.step === 'product' ? <View style={{ gap: 10 }}><Button label="Check fit for my hair" onPress={() => check(s.product.ingredients, [s.product.brand, s.product.name].filter(Boolean).join(' '))} /><Button label="Scan another" variant="ghost" onPress={() => setS({ step: 'start' })} /></View>
        : s.step === 'food' ? <View style={{ gap: 10 }}><Button label={ironDone ? 'Counted toward today ✓' : 'Count toward today’s iron'} variant={ironDone ? 'secondary' : 'primary'} onPress={() => { if (!ironDone) { haptic('success'); toggleDone('iron_food'); } }} /><Button label="Scan another food" variant="ghost" onPress={() => setS({ step: 'start' })} /></View>
        : s.step === 'text' ? <View style={{ gap: 10 }}><Button label="Check fit for my hair" disabled={s.text.trim().length < 10} onPress={() => check(s.text)} /><Button label="Retake photo" variant="ghost" onPress={() => setS({ step: 'start' })} /></View>
        : <View style={{ gap: 10 }}><Button label="Try again" onPress={() => setS({ step: 'start' })} />{food ? <Button label="See iron-rich meals" variant="ghost" onPress={() => router.replace('/iron')} /> : <Button label="Paste the label instead" variant="ghost" onPress={() => router.replace({ pathname: '/add-product', params: { mode: 'label' } })} />}</View>
    }>
      <TopBar />
      <Text style={{ fontFamily: F.semibold, fontSize: 18, color: C.ink, textAlign: 'center', marginTop: -36, marginBottom: 18 }}>{food ? 'Scan a food' : 'Scan a product'}</Text>
      {s.step === 'start' ? <View style={{ marginBottom: 8 }}><SegmentedTabs tabs={MODES} value={mode} onChange={setMode} /></View> : null}

      {s.step === 'start' ? (
        <View style={{ alignItems: 'center', gap: 14, marginTop: 20 }}>
          <Frame />
          <Text style={{ fontFamily: F.bold, fontSize: 24, letterSpacing: -0.4, color: C.ink, textAlign: 'center' }}>{food ? 'Snap the Nutrition Facts' : 'Snap the back of the bottle'}</Text>
          <Sub style={{ textAlign: 'center' }}>{food ? 'We’ll find the food by barcode, or read its iron right from the label, and show how much of your daily need it covers. Your photo stays on your phone.' : 'We’ll find it by barcode, or read the ingredient list right from the label. Your photo stays on your phone.'}</Sub>
          <View style={{ alignSelf: 'stretch', marginTop: 8, borderRadius: 18, padding: 14, backgroundColor: C.option, gap: 6 }}>
            {(food ? ['Get the barcode or the whole Nutrition Facts panel in frame', 'Make sure the “Iron” line is sharp', 'Good light, no glare on shiny packaging'] : ['Get the barcode or the whole ingredient list in frame', 'Good light, no glare on shiny bottles', 'Hold steady and close — text should be sharp']).map(t => (
              <Text key={t} style={{ fontFamily: F.regular, fontSize: 13, lineHeight: 19, color: C.ink }}>•  {t}</Text>
            ))}
          </View>
        </View>
      ) : null}

      {photo ? (
        <View style={{ height: s.step === 'text' || s.step === 'food' ? 150 : 260, borderRadius: 22, overflow: 'hidden', backgroundColor: '#0A0A0A', marginTop: 6 }}>
          <Image source={{ uri: photo }} style={{ width: '100%', height: '100%', opacity: s.step === 'working' ? 0.55 : 1 }} resizeMode="cover" />
          {s.step === 'working' && s.progress !== undefined ? (
            <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' }}>
              <View style={{ width: `${Math.round(s.progress * 100)}%`, height: 6, borderRadius: 3, backgroundColor: '#fff' }} />
            </View>
          ) : null}
        </View>
      ) : null}

      {s.step === 'working' ? <Sub style={{ textAlign: 'center', marginTop: 14 }}>{s.label}</Sub> : null}

      {s.step === 'product' ? (
        <View style={{ marginTop: 16, borderRadius: 20, padding: 14, backgroundColor: C.option, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: '#fff', overflow: 'hidden' }}>
            {s.product.image_url ? <Image source={{ uri: s.product.image_url }} style={{ width: 56, height: 56 }} /> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.semibold, fontSize: 11, letterSpacing: 0.8, color: C.greenText }}>FOUND IT</Text>
            {s.product.brand ? <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.gray }}>{s.product.brand}</Text> : null}
            <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>{s.product.name}</Text>
          </View>
        </View>
      ) : null}
      {s.step === 'product' ? <Text style={{ fontFamily: F.regular, fontSize: 11, color: C.gray, marginTop: 8 }}>{PRODUCT_DATA_CREDIT}</Text> : null}

      {s.step === 'food' ? (() => {
        const v = ironVerdict(s.food.ironMg);
        const share = Math.round((s.food.ironMg / need) * 100);
        const tone = v.tone === 'green' ? { bg: C.greenSoft, fg: C.greenText } : v.tone === 'amber' ? { bg: C.amberSoft, fg: C.amberText } : { bg: '#F2F2F3', fg: C.gray2 };
        return (
          <View style={{ marginTop: 16, gap: 12 }}>
            <View style={{ borderRadius: 22, padding: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, gap: 10 }}>
              <View style={{ alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: tone.bg }}><Text style={{ fontFamily: F.semibold, fontSize: 12, color: tone.fg }}>{v.label}</Text></View>
              {s.food.brand ? <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.gray }}>{s.food.brand}</Text> : null}
              <Text style={{ fontFamily: F.bold, fontSize: 20, letterSpacing: -0.3, color: C.ink, marginTop: -6 }}>{s.food.name}</Text>
              <View>
                <Text style={{ fontFamily: F.bold, fontSize: 34, letterSpacing: -0.8, color: C.ink }}>{s.food.ironMg} mg<Text style={{ fontFamily: F.regular, fontSize: 15, letterSpacing: 0, color: C.gray }}> iron {s.food.basis === 'serving' ? 'per serving' : 'per 100 g'}</Text></Text>
                {s.food.basis === 'serving' && s.food.serving ? <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.gray }}>Serving: {s.food.serving}</Text> : null}
              </View>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: '#F0F0F2', overflow: 'hidden' }}><View style={{ width: `${Math.min(100, share)}%`, height: 8, borderRadius: 4, backgroundColor: '#C2493D' }} /></View>
              <Text style={{ fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.gray2 }}>About {share}% of your daily {need} mg.</Text>
            </View>
            <Text style={{ fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.gray2 }}>Tip: eat it with something rich in vitamin C, like citrus, berries or peppers, so your body absorbs more of the iron. Have tea or coffee an hour apart.</Text>
            {s.fromBarcode ? <Text style={{ fontFamily: F.regular, fontSize: 11, color: C.gray }}>{FOOD_DATA_CREDIT}</Text> : <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray }}>Read from the label. Double-check the number against the package.</Text>}
          </View>
        );
      })() : null}

      {s.step === 'text' ? (
        <View style={{ marginTop: 16, gap: 8 }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>{s.confident ? 'Here’s what we read' : 'Check what we read'}</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: C.gray2 }}>{s.note ?? (s.confident ? 'Fix anything that looks off, then check it.' : 'We couldn’t spot the “Ingredients” heading, so tidy this up to just the ingredient list.')}</Text>
          <TextInput value={s.text} onChangeText={text => setS({ ...s, text })} multiline
            style={{ minHeight: 160, borderRadius: 18, backgroundColor: C.option, padding: 16, fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: C.ink, textAlignVertical: 'top', outlineStyle: 'none' } as any} />
        </View>
      ) : null}

      {s.step === 'error' ? (
        <View style={{ marginTop: 16, borderRadius: 18, padding: 14, backgroundColor: '#FDECEC' }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 14, color: '#B42318' }}>Couldn’t read that one</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 13, lineHeight: 19, color: '#B42318', marginTop: 2 }}>{s.message}</Text>
        </View>
      ) : null}
    </Screen>
  );
}
