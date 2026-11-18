import { router, Tabs } from 'expo-router';
import { haptic } from '../../lib/haptics';
import { scrollTop } from '../../lib/scrollTop';
import { useState } from 'react';
import { Modal, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useStore } from '../../state/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { C, F } from '../../theme';

const ICON: Record<string, (c: string) => React.ReactNode> = {
  index: c => <Path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8Z" fill={c} />,
  progress: c => <><Rect x={4} y={13} width={4} height={7} rx={1} fill={c} /><Rect x={10} y={9} width={4} height={11} rx={1} fill={c} /><Rect x={16} y={5} width={4} height={15} rx={1} fill={c} /></>,
  products: c => <><Rect x={8} y={8} width={8} height={13} rx={2} stroke={c} strokeWidth={2} fill="none" /><Path d="M10 4h4v4h-4z" fill={c} /></>,
  profile: c => <><Circle cx={12} cy={8} r={4} stroke={c} strokeWidth={2} fill="none" /><Path d="M5 20c1-4 4-6 7-6s6 2 7 6" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round" /></>,
};
const LABEL: Record<string, string> = { index: 'Home', progress: 'Progress', products: 'Products', profile: 'Profile' };

function TabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const narrow = useWindowDimensions().width < 360;
  const fab = narrow ? 54 : 62;
  // Expo Router's tab bar props don't always include navigation on web, so route by path.
  const [menu, setMenu] = useState(false);
  const go = (name: string) => (navigation?.navigate ? navigation.navigate(name) : router.navigate((name === 'index' ? '/(tabs)' : `/(tabs)/${name}`) as any));
  return (
    <>
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 + insets.bottom }}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 10 10">
        <Defs><LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#fff" stopOpacity="0" /><Stop offset="0.55" stopColor="#fff" stopOpacity="0.92" /><Stop offset="1" stopColor="#fff" stopOpacity="1" /></LinearGradient></Defs>
        <Rect x="0" y="0" width="10" height="10" fill="url(#fade)" />
      </Svg>
    </View>
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom, 12), alignItems: 'center' }} pointerEvents="box-none">
      <View style={{ width: '100%', maxWidth: 430, flexDirection: 'row', alignItems: 'center', paddingHorizontal: narrow ? 12 : 20, gap: narrow ? 8 : 12 }} pointerEvents="box-none">
        <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#fff', borderRadius: 999, padding: 6, gap: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}>
          {state.routes.map((r: any, i: number) => {
            const on = state.index === i; const col = on ? C.ink : '#8F8F8F';
            return (
              <Pressable key={r.key} onPress={() => { if (on) { haptic('select'); scrollTop(r.name); } else go(r.name); }} style={({ pressed }) => ({ flex: 1, minWidth: 0, alignItems: 'center', paddingVertical: 7, borderRadius: 999, backgroundColor: on ? '#F0F0F0' : pressed ? '#E6E6E6' : 'transparent' })}>
                <Svg width={22} height={22} viewBox="0 0 24 24">{ICON[r.name]?.(col)}</Svg>
                <Text style={{ fontFamily: on ? F.semibold : F.medium, fontSize: narrow ? 10 : 11, color: col, marginTop: 3 }}>{LABEL[r.name]}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={() => setMenu(true)} style={({ pressed }) => ({ width: fab, height: fab, borderRadius: fab / 2, backgroundColor: pressed ? '#2E2E2E' : C.ink, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } })} accessibilityLabel="Scan">
          <Svg width={24} height={24} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" /></Svg>
        </Pressable>
      </View>
    </View>
    <ScanMenu open={menu} onClose={() => setMenu(false)} />
    </>
  );
}

const MENU = [
  { id: 'hair', title: 'Scan hair', sub: '3 angles · about a minute', icon: 'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z' },
  { id: 'product', title: 'Scan product', sub: 'Ingredient label', icon: 'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 9v6M11 9v6M14 9v6M16.5 9v6' },
  { id: 'upload', title: 'Upload photo', sub: 'From your library', icon: 'M5 5h14v14H5zM5 15l4-4 4 4 2-2 4 4M14.5 9.5h.01' },
  { id: 'log', title: 'Log routine', sub: 'Wash, style or treatment', icon: 'M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5' },
] as const;

/** "What do you want to scan?" — the sheet behind the + button (Figma 02 · Scan menu). */
function ScanMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { logWash } = useStore();
  const pick = (id: (typeof MENU)[number]['id']) => {
    onClose();
    if (id === 'hair') router.push('/scan');
    if (id === 'upload') router.push({ pathname: '/scan', params: { from: 'library' } });
    if (id === 'product') router.push('/(tabs)/products');
    if (id === 'log') { logWash(); router.navigate('/(tabs)'); }
  };
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end', alignItems: 'center', padding: 12 }}>
        <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 406, backgroundColor: '#fff', borderRadius: 28, padding: 16, gap: 12, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
            <Text style={{ fontFamily: F.semibold, fontSize: 17, color: C.ink }}>What do you want to scan?</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close" style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#F2F2F4', alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={12} height={12} viewBox="0 0 12 12"><Path d="M2 2l8 8M10 2l-8 8" stroke={C.ink} strokeWidth={1.8} strokeLinecap="round" /></Svg>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {MENU.map(m => (
              <Pressable key={m.id} onPress={() => pick(m.id)} style={({ pressed }) => ({ width: '48%', flexGrow: 1, height: 118, borderRadius: 20, padding: 14, justifyContent: 'space-between', backgroundColor: pressed ? C.pressed : C.card })}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                  <Svg width={20} height={20} viewBox="0 0 24 24"><Path d={m.icon} stroke={C.ink} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
                </View>
                <View>
                  <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>{m.title}</Text>
                  <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray2, marginTop: 2 }}>{m.sub}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={p => <TabBar {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#fff' } } as any}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="products" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
