import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Text, TextInput, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Button, Screen, Sub, TopBar } from '../components/ui';
import { haptic } from '../lib/haptics';
import { canScanLabels, extractIngredients, productByBarcode, readBarcode, readText } from '../lib/labelScan';
import { type CatalogProduct, PRODUCT_DATA_CREDIT } from '../lib/products';
import { C, F } from '../theme';

type State =
  | { step: 'start' }
  | { step: 'working'; photo: string; label: string; progress?: number }
  | { step: 'product'; photo: string; product: CatalogProduct }
  | { step: 'text'; photo: string; text: string; confident: boolean; note?: string }
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

/** Products → Scan: photograph a bottle; we find it by barcode or read its ingredient list. */
export default function ScanLabel() {
  const [s, setS] = useState<State>({ step: 'start' });

  async function pick(fromLibrary: boolean) {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.9 };
    const res = fromLibrary ? await ImagePicker.launchImageLibraryAsync(opts) : await ImagePicker.launchCameraAsync(opts).catch(() => ImagePicker.launchImageLibraryAsync(opts));
    if (res.canceled || !res.assets?.[0]) return;
    const photo = res.assets[0].uri;
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
        : s.step === 'text' ? <View style={{ gap: 10 }}><Button label="Check fit for my hair" disabled={s.text.trim().length < 10} onPress={() => check(s.text)} /><Button label="Retake photo" variant="ghost" onPress={() => setS({ step: 'start' })} /></View>
        : <View style={{ gap: 10 }}><Button label="Try again" onPress={() => setS({ step: 'start' })} /><Button label="Paste the label instead" variant="ghost" onPress={() => router.replace({ pathname: '/add-product', params: { mode: 'label' } })} /></View>
    }>
      <TopBar />
      <Text style={{ fontFamily: F.semibold, fontSize: 18, color: C.ink, textAlign: 'center', marginTop: -36, marginBottom: 18 }}>Scan a product</Text>

      {s.step === 'start' ? (
        <View style={{ alignItems: 'center', gap: 14, marginTop: 20 }}>
          <Frame />
          <Text style={{ fontFamily: F.bold, fontSize: 24, letterSpacing: -0.4, color: C.ink, textAlign: 'center' }}>Snap the back of the bottle</Text>
          <Sub style={{ textAlign: 'center' }}>We’ll find it by barcode, or read the ingredient list right from the label. Your photo stays on your phone.</Sub>
          <View style={{ alignSelf: 'stretch', marginTop: 8, borderRadius: 18, padding: 14, backgroundColor: C.option, gap: 6 }}>
            {['Get the barcode or the whole ingredient list in frame', 'Good light, no glare on shiny bottles', 'Hold steady and close — text should be sharp'].map(t => (
              <Text key={t} style={{ fontFamily: F.regular, fontSize: 13, lineHeight: 19, color: C.ink }}>•  {t}</Text>
            ))}
          </View>
        </View>
      ) : null}

      {photo ? (
        <View style={{ height: s.step === 'text' ? 150 : 260, borderRadius: 22, overflow: 'hidden', backgroundColor: '#0A0A0A', marginTop: 6 }}>
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
