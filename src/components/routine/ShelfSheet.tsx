import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { celebrate } from './Celebrate';
import { haptic } from '../../lib/haptics';
import { shelfFromPhoto, takeProductPhoto } from '../../lib/routine/capture';
import { AREAS, CATEGORY_LABEL, placeItems, setRoutine, type Area, type Item } from '../../lib/routine/model';
import { C, F } from '../../theme';
import { Btn, ChipBtn, iconFor, st } from './Kit';

/** Snap your shelf: one photo, every product we can recognise, tick and add. */
export function ShelfSheet({ open, area, onClose }: { open: boolean; area: Area; onClose: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'reading' | 'done'>('idle');
  const [note, setNote] = useState('');
  const [pct, setPct] = useState(0);
  const [items, setItems] = useState<(Item & { unsure?: boolean })[]>([]);
  const [off, setOff] = useState<Set<string>>(new Set());
  const label = AREAS.find(a => a.key === area)?.label.toLowerCase() ?? 'routine';

  const snap = async (fromLibrary: boolean) => {
    const uri = await takeProductPhoto(fromLibrary);
    if (!uri) return;
    setPhase('reading'); setItems([]); setOff(new Set()); setPct(0);
    // One bar across the three stages: barcodes 0–15%, labels 15–60%, matching 60–100%.
    const found = await shelfFromPhoto(uri, area, (stage, p) => {
      setNote(stage === 'barcodes' ? 'Reading barcodes' : stage === 'labels' ? 'Reading labels' : 'Matching products');
      setPct(stage === 'barcodes' ? 0.05 + p * 0.1 : stage === 'labels' ? 0.15 + p * 0.45 : 0.6 + p * 0.4);
    }, list => { setItems(list); haptic('select'); }).catch(() => [] as (Item & { unsure?: boolean })[]);
    setPct(1);
    // Guesses start unticked, so only products we're sure of are added without a look.
    setOff(new Set(found.filter(i => i.unsure).map(i => i.id!)));
    setItems(found); setPhase('done'); haptic(found.length ? 'success' : 'select');
  };
  const add = () => {
    const pick = items.filter(i => !off.has(i.id!));
    setRoutine(r => placeItems(r, pick));
    close();
    if (pick.length) celebrate(`${pick.length} added from your shelf`, pick.length > 2);
  };
  const close = () => { setPhase('idle'); setItems([]); setNote(''); onClose(); };
  const chosen = items.filter(i => !off.has(i.id!)).length;

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
      <Pressable onPress={close} style={{ flex: 1, backgroundColor: 'rgba(20,24,36,0.35)', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 560, maxHeight: '88%', backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ flex: 1, fontFamily: F.semibold, fontSize: 20, color: C.ink }}>Snap your shelf</Text>
            <ChipBtn label="Close" icon="check" iconOnly tone="dark" onPress={close} />
          </View>
          {phase === 'idle' ? (
            <>
              <Text style={st.sub}>{`One photo of your ${label} products, labels facing out. We add what we recognise.`}</Text>
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                <Btn label="Take a photo" onPress={() => snap(false)} />
                <Btn kind="secondary" label="Upload a photo" onPress={() => snap(true)} />
              </View>
              <Text style={[st.meta, { fontSize: 12 }]}>Read on your device. The photo isn’t uploaded.</Text>
            </>
          ) : phase === 'reading' ? (
            <View style={{ gap: 12, paddingVertical: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[st.sub, { flex: 1 }]}>{note || 'Reading your shelf'}</Text>
                <Text style={[st.meta, { fontFamily: F.semibold }]}>{items.length ? `${items.length} found` : `${Math.round(pct * 100)}%`}</Text>
              </View>
              <Bar value={pct} />
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {['Barcodes', 'Labels', 'Matching'].map((l, k) => {
                  const on = pct >= [0, 0.15, 0.6][k];
                  return <Text key={l} style={[st.meta, { fontSize: 12, color: on ? '#5B67C9' : '#A9ADBD', fontFamily: on ? F.semibold : F.regular }]}>{`${k ? '· ' : ''}${l}`}</Text>;
                })}
              </View>
              <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ gap: 8 }}>
                {items.map(i => <FoundRow key={i.id} i={i} />)}
              </ScrollView>
            </View>
          ) : (
            <>
              <Text style={st.sub}>{items.length ? `Found ${items.length}. Best guesses are unticked: tick them if they’re yours.` : 'We couldn’t recognise products in that photo. Try closer, with labels or barcodes facing the camera.'}</Text>
              <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ gap: 8 }}>
                {items.map(i => {
                  const on = !off.has(i.id!);
                  return (
                    <Pressable key={i.id} onPress={() => setOff(s => { const n = new Set(s); on ? n.add(i.id!) : n.delete(i.id!); return n; })} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16, borderWidth: 1.5, borderColor: on ? '#6E7BD9' : '#E3E5EB', backgroundColor: on ? '#F5F6FD' : '#fff' }}>
                      <Image source={iconFor(i.category)} style={{ width: 40, height: 40 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={st.meta}>{`${CATEGORY_LABEL[i.category] ?? ''}${i.brand ? ` · ${i.brand}` : ''}${i.unsure ? ' · Best guess' : ''}`}</Text>
                        <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.ink }} numberOfLines={2}>{i.name}</Text>
                      </View>
                      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: on ? '#6E7BD9' : '#D5D8DE', backgroundColor: on ? '#6E7BD9' : '#fff', alignItems: 'center', justifyContent: 'center' }}>
                        {on ? <Text style={{ color: '#fff', fontSize: 12, fontFamily: F.semibold, lineHeight: 14 }}>{'✓'}</Text> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                {items.length ? <Btn label={`Add ${chosen} to my routine`} onPress={add} disabled={!chosen} glow={chosen > 0} /> : null}
                <Btn kind="secondary" label="Try another photo" onPress={() => setPhase('idle')} />
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Bar({ value }: { value: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: value, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }, [value]);
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: '#ECEEF4', overflow: 'hidden' }}>
      <Animated.View style={{ height: 6, borderRadius: 3, backgroundColor: '#6E7BD9', width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
    </View>
  );
}

/** A product the moment it's recognised: slides in with a check. */
function FoundRow({ i }: { i: Item }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(a, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }).start(); }, []);
  return (
    <Animated.View style={{ opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }], flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16, backgroundColor: '#F5F6FD' }}>
      <Image source={iconFor(i.category)} style={{ width: 36, height: 36 }} />
      <View style={{ flex: 1 }}>
        <Text style={st.meta}>{`${CATEGORY_LABEL[i.category] ?? ''}${i.brand ? ` · ${i.brand}` : ''}`}</Text>
        <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.ink }} numberOfLines={1}>{i.name}</Text>
      </View>
      <Text style={{ color: '#5B67C9', fontFamily: F.semibold }}>✓</Text>
    </Animated.View>
  );
}
