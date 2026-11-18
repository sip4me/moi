import { LegalLine } from '../../components/Legal';
import { goNext } from '../../data/flow';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Screen, Sub, Title, BrandLine } from '../../components/ui';
import { useStore } from '../../state/store';
import { C, F } from '../../theme';

export default function Paywall() {
  const { plan, answers } = useStore();
  return (
    <Screen footer={<>
      <Text style={{ textAlign: 'center', fontFamily: F.semibold, fontSize: 14, color: C.ink, marginBottom: 10 }}>✓  No payment due now</Text>
      <Button label="Continue" onPress={() => goNext('paywall', answers)} />
      <Text style={{ textAlign: 'center', fontFamily: F.regular, fontSize: 12, color: C.gray, marginTop: 8 }}>Test build — payments aren’t connected yet.</Text>
      <LegalLine lead="Subscriptions renew automatically until you cancel. See our" style={{ marginTop: 6 }} />
    </>}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <BrandLine parts={['Unlock', 'logo', 'to reach your hair goals faster.']} size={27} center />
        <View style={{ backgroundColor: '#F6F6F8', borderRadius: 24, padding: 20, alignSelf: 'stretch', gap: 8, marginTop: 10 }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>Your plan includes</Text>
          {['A daily routine that adapts to weather and life changes', 'Progress scans every two weeks', 'Product label checks against your hair', `Goal: ${plan?.target ?? ''}`].map(t => <Sub key={t} style={{ fontSize: 14 }}>•  {t}</Sub>)}
        </View>
      </View>
    </Screen>
  );
}
