import { Text, View } from 'react-native';
import { InfoCard, StepScreen } from '../../components/onboarding';
import { Logo, Title } from '../../components/ui';
import { C, F } from '../../theme';

function Column({ heading, bar, height, dark }: { heading: React.ReactNode; bar: string; height: number; dark?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 10, gap: 10, alignItems: 'center', justifyContent: 'flex-end' }}>
      {heading}
      <View style={{ alignSelf: 'stretch', height, borderRadius: 12, backgroundColor: dark ? C.ink : '#E3E3E6', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 12 }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 13, color: dark ? '#fff' : C.ink }}>{bar}</Text>
      </View>
    </View>
  );
}

export default function Comparison() {
  return (
    <StepScreen step="comparison" title={
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', columnGap: 8 }}>
        <Title>Know what works with</Title><Logo size={30} color={C.ink} /><Title>vs on your own</Title>
      </View>
    }>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <InfoCard style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end', height: 220 }}>
            <Column heading={<Text style={{ fontFamily: F.medium, fontSize: 13, color: C.ink }}>On your own</Text>} bar="Guessing" height={64} />
            <Column dark heading={<View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}><Text style={{ fontFamily: F.medium, fontSize: 13, color: C.ink }}>With</Text><Logo size={14} color={C.ink} /></View>} bar="Measured" height={170} />
          </View>
          <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.gray2, textAlign: 'center' }}>Moi makes it easy and holds you accountable.</Text>
        </InfoCard>
      </View>
    </StepScreen>
  );
}
