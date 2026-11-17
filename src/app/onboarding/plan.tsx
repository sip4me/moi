import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { goNext } from '../../data/flow';
import { Button, CardGrid, DoctorNote, MoreRow, RecCard, Screen, SectionCard, Sub, Title, TopBar } from '../../components/ui';
import { useStore } from '../../state/store';
import { C, F, evidenceStyle } from '../../theme';

export default function PlanScreen() {
  const { plan, answers } = useStore();
  if (!plan) return null;
  const texture = answers.texture ?? 'your';
  return (
    <Screen scroll footer={<Button label="Let’s get started!" onPress={() => goNext('plan', answers)} />}>
      <TopBar progress={0.96} />
      <View style={{ alignItems: 'center', marginTop: 12, gap: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="m5 12.5 4.5 4.5L19 7.5" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
        </View>
        <Title size={28} style={{ textAlign: 'center' }}>Congratulations{'\n'}your hair plan is ready!</Title>
        <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink, marginTop: 6 }}>Your goal:</Text>
        <View style={{ backgroundColor: C.card, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 }}><Text style={{ fontFamily: F.medium, fontSize: 14, color: C.ink }}>{plan.target}</Text></View>
      </View>
      <SectionCard style={{ marginTop: 18 }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 17, color: C.ink }}>Daily recommendation</Text>
        <Sub style={{ fontSize: 13, marginTop: -6 }}>Built for {texture} hair · tap a card to see why</Sub>
        <CardGrid>{plan.cards.map(c => <RecCard key={c.id} id={c.id} label={c.label} value={c.value} unit={c.unit} onPress={() => router.push(`/why/${c.id}`)} />)}</CardGrid>
      </SectionCard>
      {plan.learn.length ? <View style={{ gap: 8, marginTop: 14 }}>{plan.learn.map(l => <DoctorNote key={l.id} id={l.id} label={l.label} why={l.why} onPress={() => router.push(`/why/${l.id}`)} />)}</View> : null}
      {plan.extras.length ? (
        <View style={{ gap: 8, marginTop: 16 }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>More you can try</Text>
          {plan.extras.map(c => <MoreRow key={c.id} id={c.id} label={c.label} meta={`${c.value}${c.unit ? ' ' + c.unit : ''} · ${evidenceStyle[c.evidence ?? 'early'].label.toLowerCase()}`} onPress={() => router.push(`/why/${c.id}`)} />)}
        </View>
      ) : null}
      <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray, textAlign: 'center', marginTop: 16 }}>General hair-care guidance, not medical advice.</Text>
    </Screen>
  );
}
