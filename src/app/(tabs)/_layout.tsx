import { router, Tabs } from 'expo-router';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
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
              <Pressable key={r.key} onPress={() => go(r.name)} style={({ pressed }) => ({ flex: 1, minWidth: 0, alignItems: 'center', paddingVertical: 7, borderRadius: 999, backgroundColor: on ? '#F0F0F0' : pressed ? '#E6E6E6' : 'transparent' })}>
                <Svg width={22} height={22} viewBox="0 0 24 24">{ICON[r.name]?.(col)}</Svg>
                <Text style={{ fontFamily: on ? F.semibold : F.medium, fontSize: narrow ? 10 : 11, color: col, marginTop: 3 }}>{LABEL[r.name]}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={() => router.push('/(tabs)/products')} style={({ pressed }) => ({ width: fab, height: fab, borderRadius: fab / 2, backgroundColor: pressed ? '#2E2E2E' : C.ink, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } })} accessibilityLabel="Scan">
          <Svg width={24} height={24} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" /></Svg>
        </Pressable>
      </View>
    </View>
    </>
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
