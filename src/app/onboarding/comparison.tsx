import { Text, View } from 'react-native';
import { InfoCard, StepScreen } from '../../components/onboarding';
import { BrandLine } from '../../components/ui';
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
    <StepScreen step="comparison" title={<BrandLine parts={['Know what works with', 'logo', 'vs on your own']} />}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <InfoCard style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end', height: 220 }}>
            <Column heading={<Text style={{ fontFamily: F.medium, fontSize: 13, color: C.ink }}>On your own</Text>} bar="Guessing" height={64} />
            <Column dark heading={<BrandLine parts={['With', 'logo']} size={13} weight="medium" />} bar="Measured" height={170} />
          </View>
          <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.gray2, textAlign: 'center' }}>Moi makes it easy and holds you accountable.</Text>
        </InfoCard>
      </View>
    </StepScreen>
  );
}
