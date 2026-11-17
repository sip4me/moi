import { Platform, Text, View } from 'react-native';
import { StepScreen } from '../../components/onboarding';
import { Logo, Title } from '../../components/ui';
import { useStore } from '../../state/store';
import { useStep } from '../../state/useStep';
import { C, F } from '../../theme';

/** Asks the browser for notification permission where it can; the choice is saved either way. */
async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'web' && typeof Notification !== 'undefined') {
    try { return (await Notification.requestPermission()) === 'granted'; } catch { return false; }
  }
  return true; // native push permission is requested when push is wired up
}

export default function Notifications() {
  const { setReminder } = useStore();
  const { next } = useStep('notifications');
  const decide = async (allow: boolean) => {
    setReminder('all', allow && (await requestPermission()));
    next();
  };
  return (
    <StepScreen step="notifications" cta="Allow" onNext={() => decide(true)} secondary={{ label: 'Don’t allow', onPress: () => decide(false) }}>
      <View style={{ flex: 1, justifyContent: 'center', gap: 28 }}>
        <Title style={{ textAlign: 'center' }}>Reach your goals with{'\n'}notifications</Title>
        <View style={{ backgroundColor: '#E5E5E7', borderRadius: 16, overflow: 'hidden' }}>
          <View style={{ padding: 18, alignItems: 'center', gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}><Logo size={16} color={C.ink} /><Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>would like to send you</Text></View>
            <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>Notifications</Text>
          </View>
          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#CFCFD4' }}>
            <View style={{ flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: F.regular, fontSize: 15, color: C.gray2 }}>Don’t Allow</Text></View>
            <View style={{ flex: 1, height: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: C.ink }}><Text style={{ fontFamily: F.medium, fontSize: 15, color: '#fff' }}>Allow</Text></View>
          </View>
        </View>
        <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.gray, textAlign: 'center' }}>At most 2 a day, and never between 10 PM and 7 AM.</Text>
      </View>
    </StepScreen>
  );
}
