import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { C, F } from '../theme';

const LANGS: { code: string; name: string; ready: boolean }[] = [
  { code: 'EN', name: 'English', ready: true },
  { code: 'ES', name: 'Español', ready: false },
  { code: 'FR', name: 'Français', ready: false },
  { code: 'PT', name: 'Português', ready: false },
  { code: 'DE', name: 'Deutsch', ready: false },
];

const Globe = () => (
  <Svg width={13} height={13} viewBox="0 0 16 16">
    <Circle cx={8} cy={8} r={6.6} stroke={C.ink} strokeWidth={1.4} fill="none" />
    <Path d="M1.6 8h12.8M8 1.4c2 2 2 11.2 0 13.2M8 1.4c-2 2-2 11.2 0 13.2" stroke={C.ink} strokeWidth={1.2} fill="none" />
  </Svg>
);

/** Figma 02 · Language pill: top-right on the splash. Only English is translated so far; the rest show "Soon". */
export function LanguagePill() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable onPress={() => setOpen(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Language: English"
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 28, borderRadius: 14, backgroundColor: pressed ? '#E3E3E6' : '#F2F2F4' })}>
        <Globe />
        <Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.ink, letterSpacing: 0.4 }}>EN</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(10,10,10,0.35)', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36, width: '100%', maxWidth: 480, alignSelf: 'center' }}>
            <Text style={{ fontFamily: F.bold, fontSize: 20, color: C.ink, marginBottom: 12 }}>Language</Text>
            {LANGS.map(l => (
              <Pressable key={l.code} disabled={!l.ready} onPress={() => setOpen(false)}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EFEFF1', opacity: pressed ? 0.6 : 1 })}>
                <Text style={{ flex: 1, fontFamily: F.medium, fontSize: 16, color: l.ready ? C.ink : C.gray }}>{l.name}</Text>
                {l.ready
                  ? <Svg width={16} height={12} viewBox="0 0 16 12"><Path d="M1.5 6.5 6 11 14.5 1.5" stroke={C.ink} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
                  : <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.gray }}>Soon</Text>}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
