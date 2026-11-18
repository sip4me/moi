import { router } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { icon3d } from '../data/icons3d';
import { IRON_RECIPES, SLOT_LABEL, type Slot } from '../data/ironRecipes';
import * as ImagePicker from 'expo-image-picker';
import { haptic } from '../lib/haptics';
import { handOffPhoto } from '../lib/photoHandoff';
import { useStore } from '../state/store';
import { C, CONTENT_INDENT, F, TILE } from '../theme';
import { Locked, PeekRow, usePageInset } from './Peek';
import { SectionTitle } from './Tile';

/**
 * Airbnb-style category pills: raised white chips with a 3D object and a label, sharing one row.
 * The picked one gets an ink outline and bold label; the others stay quiet.
 */
export function CategoryPills({ items, value, onChange }: { items: { label: string; icon: string }[]; value: number; onChange: (i: number) => void }) {
  const pad = usePageInset();
  return (
    // Fits one row on most phones; on very narrow ones it scrolls sideways (like Airbnb) instead of cutting labels.
    <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist" style={{ marginHorizontal: -pad, flexGrow: 0 }}
      contentContainerStyle={{ paddingHorizontal: pad + CONTENT_INDENT, paddingVertical: 4, gap: 8 }}>
      {items.map((t, i) => {
        const on = i === value;
        return (
          <Pressable key={t.label} onPress={() => { if (!on) { haptic('select'); onChange(i); } }} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={t.label}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 5, height: 50, paddingLeft: 7, paddingRight: 13, borderRadius: 999,
              backgroundColor: pressed ? '#F7F7F7' : '#fff', borderWidth: on ? 1.5 : 1, borderBottomWidth: on ? 1.5 : 3,
              borderColor: on ? C.ink : '#E7E7E9', borderBottomColor: on ? C.ink : '#DEDEE1',
              shadowColor: '#000', shadowOpacity: on ? 0.1 : 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
              transform: [{ translateY: pressed ? 1 : 0 }],
            })}>
            <Image source={icon3d(t.icon)} style={{ width: 28, height: 28 }} resizeMode="contain" />
            <Text numberOfLines={1} style={{ fontFamily: on ? F.semibold : F.medium, fontSize: 14.5, letterSpacing: -0.1, color: on ? C.ink : '#5E5E63' }}>{t.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** A row of square 3D tiles with the label underneath (like Airbnb's "Services" row). */
export function BrowseRow({ title, items, selected, onPick }: {
  title: string; items: { key: string; label: string; icon: string; onPress?: () => void }[]; selected?: string; onPick?: (key: string) => void;
}) {
  return (
    <View>
      <SectionTitle>{title}</SectionTitle>
      <PeekRow itemWidth={112} gap={12}>
        {items.map(it => {
          const on = it.key === selected;
          return (
            <Pressable key={it.key} onPress={() => { haptic('tap'); (it.onPress ?? (() => onPick?.(it.key)))(); }} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={it.label}>
              {({ pressed }) => (
                <View style={{ transform: [{ scale: pressed ? 0.97 : 1 }] }}>
                  <View style={{ height: 112, borderRadius: 22, backgroundColor: pressed ? '#EFEFF0' : TILE, alignItems: 'center', justifyContent: 'center', borderWidth: on ? 2 : 0, borderColor: C.ink }}>
                    <Image source={icon3d(it.icon)} resizeMode="contain" style={{ width: 80, height: 80 }} />
                  </View>
                  <Text numberOfLines={1} style={{ fontFamily: on ? F.semibold : F.medium, fontSize: 15, color: C.ink, marginTop: 9, paddingLeft: 2 }}>{it.label}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </PeekRow>
    </View>
  );
}

const Heart = ({ on }: { on: boolean }) => (
  <Svg width={26} height={26} viewBox="0 0 24 24">
    <Path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.9 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.3 0 5.6 3.3 4.4 6.7-1.7 4.7-9.2 9.3-9.2 9.3z"
      fill={on ? '#E46C93' : 'rgba(0,0,0,0.35)'} stroke="#fff" strokeWidth={1.8} strokeLinejoin="round" />
  </Svg>
);

const SLOT_TINT: Record<Slot, string> = { breakfast: '#FFF3DE', lunch: '#EAF6E8', dinner: '#FCE9E4', snack: '#EEEAFB' };

/** Big recipe cards (like Airbnb's listing cards): a tinted square with the dish, a save heart, then the name and details. */
export function RecipeCards({ slot }: { slot: Slot }) {
  const { saved, toggleSaved } = useStore();
  const list = IRON_RECIPES.filter(r => r.slot === slot).sort((a, b) => b.mg - a.mg);
  return (
    <View>
      <SectionTitle note="Sorted by iron per serving">{`${SLOT_LABEL[slot]} recipes`}</SectionTitle>
      <PeekRow itemWidth={236} gap={14}>
        {list.map(r => {
          const key = `recipe:${r.id}`;
          const on = saved.includes(key);
          return (
            <Locked key={r.id} radius={24} label={r.name}>
              <Pressable onPress={() => router.push(`/recipe/${r.id}`)} accessibilityRole="button" accessibilityLabel={`${r.name}, ${r.mg} milligrams of iron, ${r.minutes} minutes`}>
                {({ pressed }) => (
                  <View style={{ transform: [{ scale: pressed ? 0.98 : 1 }] }}>
                    <View style={{ height: 236, borderRadius: 24, backgroundColor: SLOT_TINT[r.slot], alignItems: 'center', justifyContent: 'center' }}>
                      <Image source={icon3d(r.icon)} resizeMode="contain" style={{ width: 150, height: 150 }} />
                      <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.ink }}>{r.plant ? 'Plant-based' : 'Heme iron'}</Text>
                      </View>
                      <Pressable onPress={() => { haptic(on ? 'tap' : 'success'); toggleSaved(key); }} hitSlop={10} accessibilityRole="button" accessibilityLabel={on ? 'Remove from saved' : 'Save recipe'}
                        style={{ position: 'absolute', top: 12, right: 12 }}>
                        <Heart on={on} />
                      </Pressable>
                    </View>
                    <Text numberOfLines={1} style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink, marginTop: 10 }}>{r.name}</Text>
                    <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.gray2, marginTop: 2 }}>{r.mg} mg iron · {r.minutes} min</Text>
                  </View>
                )}
              </Pressable>
            </Locked>
          );
        })}
      </PeekRow>
    </View>
  );
}

export const SearchIcon = ({ size = 18, color = C.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx={10.5} cy={10.5} r={6.5} stroke={color} strokeWidth={2.4} fill="none" /><Path d="m15.5 15.5 5 5" stroke={color} strokeWidth={2.4} strokeLinecap="round" /></Svg>
);

/** Take a food photo right from the search bar (scan = camera, photo = library) and open the iron result. */
async function snapFood(fromLibrary: boolean) {
  haptic('tap');
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.9 };
  const res = fromLibrary ? await ImagePicker.launchImageLibraryAsync(opts) : await ImagePicker.launchCameraAsync(opts).catch(() => ImagePicker.launchImageLibraryAsync(opts));
  if (res.canceled || !res.assets?.[0]) return;
  handOffPhoto(res.assets[0].uri);
  router.push({ pathname: '/scan-label', params: { mode: 'food' } });
}

const ScanGlyph = () => (
  <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 9v6M11 9v6M14 9v6M17 9v6" stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" /></Svg>
);
const PhotoGlyph = () => (
  <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="M4 8.5a2 2 0 0 1 2-2h2l1.5-2h5L16 6.5h2a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" stroke={C.ink} strokeWidth={2} fill="none" strokeLinejoin="round" /></Svg>
);

/**
 * Airbnb-style search pill: tap the text to search Moi; the scan and photo buttons at its tail read a
 * food's iron from its label or barcode and show how close it gets you to today's goal.
 */
export function SearchBar() {
  return (
    <View style={{ height: 58, borderRadius: 999, flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 7, gap: 8,
      backgroundColor: '#fff', borderWidth: 1, borderColor: '#EEEEF0', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 4 }}>
      <Pressable onPress={() => { haptic('tap'); router.push('/search'); }} accessibilityRole="search" accessibilityLabel="Search Moi"
        style={({ pressed }) => ({ flex: 1, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 10, opacity: pressed ? 0.6 : 1 })}>
        <SearchIcon size={19} />
        <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>Search Moi</Text>
      </Pressable>
      <Pressable onPress={() => snapFood(true)} accessibilityRole="button" accessibilityLabel="Check a food's iron from a photo"
        style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? '#E9E9EC' : '#F3F3F5' })}>
        <PhotoGlyph />
      </Pressable>
      <Pressable onPress={() => snapFood(false)} accessibilityRole="button" accessibilityLabel="Scan a food for iron"
        style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? '#2E2E2E' : C.ink })}>
        <ScanGlyph />
      </Pressable>
    </View>
  );
}
