import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
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
  const { plan, done, todayKey, toggleDone, onboarded } = useStore();
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
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: leverColor(id!) + '22', alignItems: 'center', justifyContent: 'center' }}><Glyph id={id} size={26} /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.bold, fontSize: 20, color: C.ink }}>{item.label}{value ? ` · ${value}` : ''}</Text>
            {(card as any)?.target !== undefined ? <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.gray }}>Working toward every {(card as any).target} {card!.unit}</Text> : null}
          </View>
        </View>
        <EvidenceChip level={item.evidence} />
        <Text style={{ fontFamily: F.regular, fontSize: 15, color: '#2A2A2A', lineHeight: 21 }}>{item.why}</Text>
        {ings.length ? <View style={{ gap: 8 }}><Text style={{ fontFamily: F.semibold, fontSize: 11, color: C.gray, letterSpacing: 1 }}>LOOK FOR ON THE LABEL</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{ings.map(g => <Chip key={g} t={g} bg="#F2F2F4" fg={C.ink} />)}</View></View> : null}
        {plan?.ingredients.avoid.length && card ? <View style={{ gap: 8 }}><Text style={{ fontFamily: F.semibold, fontSize: 11, color: C.gray, letterSpacing: 1 }}>AVOID</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{plan.ingredients.avoid.map(g => <Chip key={g} t={g} bg={C.amberSoft} fg={C.amberText} />)}</View></View> : null}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
          {isDaily && onboarded ? <>
            <Button label="Close" variant="secondary" onPress={close} style={{ flex: 1 }} />
            <Button label={isDone ? 'Undo' : 'Done today'} onPress={() => { toggleDone(id!); close(); }} style={{ flex: 1 }} />
          </> : <Button label="Got it" onPress={close} style={{ flex: 1 }} />}
        </View>
      </View>
    </View>
  );
}
