import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { icon3d } from '../../data/icons3d';
import { haptic } from '../../lib/haptics';
import { Button, EvidenceChip, Glyph } from '../../components/ui';
import { leverColor } from '../../data/icons';
import { rules, useStore } from '../../state/store';
import { C, F } from '../../theme';

const Chip = ({ t, bg, fg }: { t: string; bg: string; fg: string }) => <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}><Text style={{ fontFamily: F.medium, fontSize: 13, color: fg }}>{t}</Text></View>;

export function generateStaticParams() {
  return rules.levers.map(l => ({ id: l.id }));
}

export default function Why() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plan, done, todayKey, toggleDone, onboarded, overrides, setOverride } = useStore();
  const card = plan?.cards.find(c => c.id === id) ?? plan?.extras.find(c => c.id === id);
  const learn = plan?.learn.find(l => l.id === id);
  const lever = rules.levers.find(l => l.id === id);
  const item: any = card ?? learn ?? lever;
  if (!item) return null;
  const isDaily = !!plan?.cards.find(c => c.id === id);
  const isDone = (done[todayKey] ?? []).includes(id!);
  const ings: string[] = (card as any)?.ingredients ?? (lever as any)?.ingredients ?? [];
  const value = card ? `${card.value}${card.unit ? ' ' + card.unit : ''}` : '';
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end', alignItems: 'center' }}>
      <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={close} />
      <View style={{ width: '100%', maxWidth: 430, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 34, gap: 14 }}>
        <View style={{ alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: '#D6D6D9' }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#F6EEEC', alignItems: 'center', justifyContent: 'center' }}><Image source={icon3d(id!)} resizeMode="contain" style={{ width: 44, height: 44 }} /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.bold, fontSize: 20, color: C.ink }}>{item.label}{value ? ` · ${value}` : ''}</Text>
            {(card as any)?.target !== undefined ? <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.gray }}>Working toward every {(card as any).target} {card!.unit}</Text> : null}
          </View>
        </View>
        <EvidenceChip level={item.evidence} />
        {card && typeof card.value === 'number' && lever?.min !== undefined && lever?.max !== undefined ? (
          <Stepper
            value={card.value} min={lever.min} max={lever.max} unit={card.unit} edited={id! in overrides}
            onChange={v => setOverride(id!, v)} onReset={() => setOverride(id!, null)}
          />
        ) : null}
        <Text style={{ fontFamily: F.regular, fontSize: 15, color: '#2A2A2A', lineHeight: 21 }}>{item.why}</Text>
        {ings.length ? <View style={{ gap: 8 }}><Text style={{ fontFamily: F.semibold, fontSize: 11, color: C.gray, letterSpacing: 1 }}>LOOK FOR ON THE LABEL</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{ings.map(g => <Chip key={g} t={g} bg="#F2F2F4" fg={C.ink} />)}</View></View> : null}
        {plan?.ingredients.avoid.length && card ? <View style={{ gap: 8 }}><Text style={{ fontFamily: F.semibold, fontSize: 11, color: C.gray, letterSpacing: 1 }}>AVOID</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{plan.ingredients.avoid.map(g => <Chip key={g} t={g} bg={C.amberSoft} fg={C.amberText} />)}</View></View> : null}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
          {isDaily && onboarded ? <>
            <Button label="Close" variant="secondary" onPress={close} style={{ flex: 1 }} />
            <Button label={isDone ? 'Undo' : 'Done today'} onPress={() => { if (!isDone) haptic('success'); toggleDone(id!); close(); }} style={{ flex: 1 }} />
          </> : <Button label="Got it" onPress={close} style={{ flex: 1 }} />}
        </View>
      </View>
    </View>
  );
}

/** Adjust a card's amount within the range the plan allows; the calendar re-plans from it. */
function Stepper({ value, min, max, unit, edited, onChange, onReset }: { value: number; min: number; max: number; unit: string; edited: boolean; onChange: (v: number) => void; onReset: () => void }) {
  const step = max - min > 40 ? 10 : 1;
  const btn = (label: string, next: number, disabled: boolean) => (
    <Pressable onPress={() => onChange(next)} disabled={disabled} accessibilityLabel={label === '−' ? 'Less' : 'More'}
      style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? C.pressed : '#fff', borderWidth: 1, borderColor: C.line, opacity: disabled ? 0.35 : 1 })}>
      <Text style={{ fontFamily: F.semibold, fontSize: 20, color: C.ink, marginTop: -2 }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 18, padding: 10, paddingLeft: 16 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.ink }}>Adjust for you</Text>
        <Pressable onPress={onReset} disabled={!edited} hitSlop={6}>
          <Text style={{ fontFamily: F.regular, fontSize: 12, color: edited ? C.gray2 : C.gray, textDecorationLine: edited ? 'underline' : 'none' }}>{edited ? 'Reset to plan' : 'Your calendar updates to match'}</Text>
        </Pressable>
      </View>
      {btn('−', Math.max(min, value - step), value <= min)}
      <Text style={{ minWidth: 64, textAlign: 'center', fontFamily: F.semibold, fontSize: 16, color: C.ink }}>{value} {unit}</Text>
      {btn('+', Math.min(max, value + step), value >= max)}
    </View>
  );
}
