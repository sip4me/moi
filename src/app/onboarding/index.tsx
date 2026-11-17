import { router } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { Button, Logo, Screen, Sub, Title } from '../../components/ui';
import { C, F } from '../../theme';

export default function Welcome() {
  return (
    <Screen footer={<>
      <Button label="Get started" onPress={() => router.push('/onboarding/q/0')} />
      <Text style={{ textAlign: 'center', fontFamily: F.regular, fontSize: 14, color: C.gray2, marginTop: 12 }}>Already have an account? <Text style={{ fontFamily: F.semibold, color: C.ink }}>Sign in</Text></Text>
    </>}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 }}>
        <View style={{ width: 230, height: 300, borderRadius: 40, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center', borderWidth: 6, borderColor: '#2C2C2E' }}>
          <Image source={require('../../../assets/icon.png')} style={{ width: 120, height: 120, borderRadius: 28 }} />
          <View style={{ position: 'absolute', bottom: 22, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 }}>
            <Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.ink }}>Scan hair</Text>
          </View>
        </View>
        <Logo size={56} />
      </View>
      <Title style={{ textAlign: 'center' }}>Hair care made easy.</Title>
      <Sub style={{ textAlign: 'center', marginTop: 8, marginBottom: 12 }}>Density, porosity, frizz and scalp health tracked over time.</Sub>
    </Screen>
  );
}
