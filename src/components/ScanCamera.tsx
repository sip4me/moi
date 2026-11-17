import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Ellipse, Line, Path } from 'react-native-svg';
import { ANGLES, type Angle, saveScan } from '../lib/scans';
import { F } from '../theme';

const GUIDE: Record<Angle, React.ReactNode> = {
  hairline: <><Ellipse cx={100} cy={120} rx={80} ry={105} stroke="#fff" strokeWidth={2} strokeDasharray="6 7" fill="none" /><Path d="M38 70c30-45 94-45 124 0" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" /></>,
  crown: <><Ellipse cx={100} cy={120} rx={88} ry={88} stroke="#fff" strokeWidth={2} strokeDasharray="6 7" fill="none" /><Ellipse cx={100} cy={120} rx={14} ry={14} stroke="#fff" strokeWidth={2.5} fill="none" /></>,
  part: <><Ellipse cx={100} cy={120} rx={80} ry={105} stroke="#fff" strokeWidth={2} strokeDasharray="6 7" fill="none" /><Line x1={100} y1={30} x2={100} y2={210} stroke="#fff" strokeWidth={3} strokeLinecap="round" /></>,
};

/**
 * A scan: three guided photos. The system camera (or file picker on desktop) takes each
 * shot; this screen shows which angle is next and keeps the framing guide in view.
 * Photos upload to the person's private folder; `onDone` gets how many were taken.
 */
export function ScanCamera({ onDone, onClose, onSkip, startFromLibrary }: { onDone: (taken: number) => void; onClose: () => void; onSkip?: () => void; startFromLibrary?: boolean }) {
  const [i, setI] = useState(0);
  const [photos, setPhotos] = useState<Partial<Record<Angle, string>>>({});
  const [busy, setBusy] = useState(false);
  const angle = ANGLES[i];
  const opened = useRef(false);
  useEffect(() => { if (startFromLibrary && !opened.current) { opened.current = true; shoot(true); } }); // eslint-disable-line react-hooks/exhaustive-deps
  const current = photos[angle.id];

  async function shoot(fromLibrary = false) {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, cameraType: angle.id === 'hairline' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back };
    const res = fromLibrary ? await ImagePicker.launchImageLibraryAsync(opts) : await ImagePicker.launchCameraAsync(opts).catch(() => ImagePicker.launchImageLibraryAsync(opts));
    if (res.canceled || !res.assets?.[0]) return;
    setPhotos(p => ({ ...p, [angle.id]: res.assets[0].uri }));
  }

  async function advance() {
    if (i < ANGLES.length - 1) return setI(i + 1);
    setBusy(true);
    await saveScan(photos);
    setBusy(false);
    onDone(Object.keys(photos).length);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 16 }}>
        <View style={{ height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close"><Text style={{ color: '#fff', fontSize: 22 }}>✕</Text></Pressable>
          <Text style={{ fontFamily: F.semibold, fontSize: 15, color: '#fff' }}>{angle.title} · {i + 1} of {ANGLES.length}</Text>
          {onSkip ? <Pressable onPress={onSkip} hitSlop={12}><Text style={{ fontFamily: F.medium, fontSize: 14, color: '#BDBDBD' }}>Skip</Text></Pressable> : <View style={{ width: 28 }} />}
        </View>

        <View style={{ flex: 1, borderRadius: 28, backgroundColor: '#2A2A2A', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          {current ? <Image source={{ uri: current }} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" /> : null}
          <Svg width={200} height={240} viewBox="0 0 200 240">{GUIDE[angle.id]}</Svg>
          <View style={{ position: 'absolute', bottom: 22, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 }}>
            <Text style={{ fontFamily: F.medium, fontSize: 13, color: '#fff' }}>{current ? 'Looks good? Tap Next' : angle.guide}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14 }}>
          {ANGLES.map((a, k) => <View key={a.id} style={{ width: k === i ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: k === i ? '#fff' : '#666' }} />)}
        </View>

        <View style={{ height: 120, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 }}>
          <Pressable onPress={() => shoot(true)} hitSlop={10} accessibilityLabel="Upload a photo" style={{ width: 56 }}><Text style={{ fontFamily: F.medium, fontSize: 13, color: '#fff' }}>Upload</Text></Pressable>
          <Pressable onPress={() => (current ? advance() : shoot())} disabled={busy} accessibilityLabel={current ? 'Next' : 'Take photo'}
            style={({ pressed }) => ({ width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', opacity: pressed || busy ? 0.6 : 1 })}>
            {current ? <Text style={{ fontFamily: F.semibold, fontSize: 15, color: '#fff' }}>{i < ANGLES.length - 1 ? 'Next' : busy ? '…' : 'Done'}</Text> : <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff' }} />}
          </Pressable>
          <Pressable onPress={() => shoot()} hitSlop={10} disabled={!current} style={{ width: 56, alignItems: 'flex-end' }}><Text style={{ fontFamily: F.medium, fontSize: 13, color: current ? '#fff' : 'transparent' }}>Retake</Text></Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
