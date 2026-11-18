import { LegalLine } from '../../components/Legal';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button, Logo, Screen } from '../../components/ui';
import { firstStep } from '../../data/flow';
import { C, F } from '../../theme';

export default function Welcome() {
  return (
    <Screen footer={<>
      <Button label="Get started" onPress={() => router.push(firstStep())} />
      <LegalLine style={{ marginTop: 10 }} />
      <Pressable onPress={() => router.push('/sign-in')} hitSlop={12} style={{ alignSelf: 'center', marginTop: 12, paddingVertical: 6 }}>
        {({ pressed }) => (
          <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.gray2, opacity: pressed ? 0.6 : 1 }}>
            Already have an account? <Text style={{ fontFamily: F.semibold, color: C.ink }}>Sign in</Text>
          </Text>
        )}
      </Pressable>
    </>}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Logo size={88} color={C.ink} />
        <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.gray2, marginTop: 6, letterSpacing: 0.2 }}>protect your crown</Text>
      </View>
    </Screen>
  );
}
