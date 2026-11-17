import { Image, Text, View } from 'react-native';
import { StepScreen } from '../../components/onboarding';
import { Sub, Title } from '../../components/ui';
import { C, F } from '../../theme';

export default function ThankYou() {
  return (
    <StepScreen step="thanks">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <Image source={require('../../../assets/thanks.png')} style={{ width: 232, height: 232 }} />
        <Title style={{ textAlign: 'center', marginTop: 12 }}>Thank you for{'\n'}trusting us</Title>
        <Sub style={{ textAlign: 'center' }}>Now let’s personalize Moi for you…</Sub>
      </View>
      <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 18, paddingTop: 22, alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <View style={{ position: 'absolute', top: -14, width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF4D6', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 13 }}>🔒</Text></View>
        <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink, textAlign: 'center' }}>Your privacy and security matter to us.</Text>
        <Text style={{ fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: C.gray2, textAlign: 'center' }}>We promise to always keep your personal information and photos private and secure.</Text>
      </View>
    </StepScreen>
  );
}
