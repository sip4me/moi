import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { Button, Screen, Sub, Title } from '../../components/ui';
import { acceptInvite } from '../../lib/buddies';
import { useStore } from '../../state/store';

const CROWN = require('../../../assets/crown-pink.png');

/** Landing page for an invite link: pairs the two people, then sends a newcomer through onboarding. */
export default function Join() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { onboarded, hydrated } = useStore();
  const [state, setState] = useState<'joining' | 'joined' | 'error'>('joining');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!hydrated || !code) return;
    acceptInvite(code).then(() => setState('joined')).catch(e => { setError(String(e.message ?? e)); setState('error'); });
  }, [hydrated, code]);

  const friendly = /expired/.test(error) ? 'This invite has expired. Ask your friend to send a new one.'
    : /already used/.test(error) ? 'This invite was already used by someone else.'
    : /own invite/.test(error) ? 'This is your own invite — send it to a friend instead.'
    : 'We couldn’t open this invite. Check your connection and try again.';

  return (
    <Screen footer={state === 'joining' ? <Button label="Joining…" loading disabled /> : state === 'joined'
      ? <Button label={onboarded ? 'See your streak' : 'Set up my plan'} onPress={() => router.replace(onboarded ? '/(tabs)/progress' : '/onboarding')} />
      : <Button label={onboarded ? 'Go home' : 'Start Moi'} variant="secondary" onPress={() => router.replace(onboarded ? '/(tabs)' : '/onboarding')} />}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Image source={CROWN} style={{ width: 120, height: 120 }} resizeMode="contain" />
        <Title style={{ textAlign: 'center' }}>{state === 'error' ? 'Invite didn’t work' : 'You’re in a streak together'}</Title>
        <Sub style={{ textAlign: 'center' }}>{state === 'error' ? friendly : 'Every day you both do at least one routine step, your joint streak grows — and you both collect tokens along the way.'}</Sub>
      </View>
    </Screen>
  );
}
