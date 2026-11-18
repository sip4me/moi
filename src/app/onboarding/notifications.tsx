import { useState } from 'react';
import { Text, View } from 'react-native';
import { enablePush } from '../../lib/push';
import { StepScreen } from '../../components/onboarding';
import { BrandLine, Title } from '../../components/ui';
import { useStore } from '../../state/store';
import { useStep } from '../../state/useStep';
import { C, F } from '../../theme';

export default function Notifications() {
  const { setReminder } = useStore();
  const { next } = useStep('notifications');
  const [note, setNote] = useState<string | null>(null);
  const decide = async (allow: boolean) => {
    if (!allow) { setReminder('all', false); return next(); }
    const result = await enablePush().catch(() => 'unsupported' as const);
    setReminder('all', result === 'on');
    // On iPhone, reminders only work once Moi is on the home screen; the next steps show how.
    if (result === 'needs-home-screen') setReminder('all', true);
    next();
    if (result === 'denied') setNote('Notifications are off for this browser. You can turn them on later in Settings.');
  };
  return (
    <StepScreen step="notifications" cta="Allow" onNext={() => decide(true)} secondary={{ label: 'Don’t allow', onPress: () => decide(false) }}>
      <View style={{ flex: 1, justifyContent: 'center', gap: 28 }}>
        <Title style={{ textAlign: 'center' }}>Reach your goals with{'\n'}notifications</Title>
        <View style={{ backgroundColor: '#E5E5E7', borderRadius: 16, overflow: 'hidden' }}>
          <View style={{ padding: 18, alignItems: 'center', gap: 2 }}>
            <BrandLine parts={['logo', 'would like to send you']} size={15} weight="semibold" center />
            <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>Notifications</Text>
          </View>
          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#CFCFD4' }}>
            <View style={{ flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: F.regular, fontSize: 15, color: C.gray2 }}>Don’t Allow</Text></View>
            <View style={{ flex: 1, height: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: C.ink }}><Text style={{ fontFamily: F.medium, fontSize: 15, color: '#fff' }}>Allow</Text></View>
          </View>
        </View>
        <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.gray, textAlign: 'center' }}>At most 2 a day, and never between 10 PM and 7 AM.</Text>
        {note ? <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.red, textAlign: 'center' }}>{note}</Text> : null}
      </View>
    </StepScreen>
  );
}
