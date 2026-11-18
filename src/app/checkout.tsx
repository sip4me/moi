import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button, Screen } from '../components/ui';
import { isActive, loadSubscription } from '../lib/billing';
import { haptic } from '../lib/haptics';
import { useStore } from '../state/store';
import { C, F } from '../theme';

/**
 * Where Stripe Checkout sends people back. On success it waits for Stripe's webhook to mark the
 * subscription (usually a second or two), then unlocks Moi. On cancel it returns to the paywall.
 */
export default function CheckoutReturn() {
  const { status } = useLocalSearchParams<{ status?: string }>();
  const { setSubscribed, onboarded } = useStore();
  const [state, setState] = useState<'waiting' | 'done' | 'slow'>('waiting');

  useEffect(() => {
    if (status !== 'success') return;
    let alive = true, tries = 0;
    const poll = async () => {
      const s = await loadSubscription().catch(() => null);
      if (!alive) return;
      if (isActive(s)) { setSubscribed(true); haptic('success'); setState('done'); return; }
      if (++tries >= 15) return setState('slow');
      setTimeout(poll, 1500);
    };
    poll();
    return () => { alive = false; };
  }, [status, setSubscribed]);

  const home = () => router.replace(onboarded ? '/(tabs)' : '/onboarding/home-screen');

  if (status !== 'success') {
    return (
      <Screen footer={<Button label="Back to plans" onPress={() => router.replace('/onboarding/paywall')} />}>
        <View style={{ flex: 1, justifyContent: 'center', gap: 10 }}>
          <Text style={{ fontFamily: F.bold, fontSize: 26, color: C.ink, textAlign: 'center' }}>No charge made</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: C.gray2, textAlign: 'center' }}>You left checkout before starting your trial. You can come back to it anytime.</Text>
        </View>
      </Screen>
    );
  }
  return (
    <Screen footer={state === 'waiting' ? null : <Button label="Let’s go" onPress={home} />}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        {state === 'waiting' ? <ActivityIndicator color={C.gray} /> : null}
        <Text style={{ fontFamily: F.bold, fontSize: 26, color: C.ink, textAlign: 'center' }}>{state === 'done' ? 'Your trial has started' : state === 'slow' ? 'Almost there' : 'Finishing up…'}</Text>
        <Text style={{ fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: C.gray2, textAlign: 'center' }}>
          {state === 'done' ? 'Everything in Moi is unlocked. You can cancel anytime in Settings → Manage subscription.' : state === 'slow' ? 'Stripe is still confirming your trial. It unlocks on its own in a moment, even if you leave this screen.' : 'Confirming your trial with Stripe.'}
        </Text>
      </View>
    </Screen>
  );
}
