import { router } from 'expo-router';
import { Image, Platform, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { BrandLine, BrandText, Button, Screen, Sub, Title, TopBar } from '../../components/ui';
import { useStore } from '../../state/store';
import { C, F } from '../../theme';

const STEPS: [string, string, string, string][] = [
  ['1', 'Tap ', 'Share', ' in Safari’s toolbar'],
  ['2', 'Choose ', 'Add to Home Screen', ''],
  ['3', 'Tap ', 'Add', ' in the top corner'],
];

export default function AddToHomeScreen() {
  const { finishOnboarding } = useStore();
  const done = () => { finishOnboarding(); router.replace('/(tabs)'); };
  const short = useWindowDimensions().height < 760;
  const standalone = Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches;
  return (
    <Screen scroll={short} footer={<>
      <Button label={standalone ? 'Continue' : 'I added it'} onPress={done} />
      <Button label="Maybe later" variant="ghost" onPress={done} />
    </>}>
      <TopBar progress={1} />
      <View style={{ flex: short ? undefined : 1, justifyContent: 'center', gap: short ? 14 : 18, paddingTop: short ? 12 : 0 }}>
        <View style={{ alignSelf: 'center', transform: [{ scale: short ? 0.8 : 1 }], marginVertical: short ? -18 : 0, width: 210, height: 176, borderRadius: 34, borderWidth: 6, borderColor: '#E3E3E6', backgroundColor: '#DCCFBE', paddingHorizontal: 12, paddingTop: 18, flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, rowGap: 22 }}>
          {[0, 1, 2, 3, 4, 5].map(i => i === 4
            ? <View key={i} style={{ alignItems: 'center', width: 44, height: 44 }}><Image source={require('../../../assets/icon.png')} style={{ width: 44, height: 44, borderRadius: 11 }} /><Text style={{ fontFamily: F.medium, fontSize: 10, color: '#2A221B', marginTop: 3 }}>Moi</Text></View>
            : <View key={i} style={{ width: 44, height: 44, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.45)' }} />)}
        </View>
        {standalone ? <Title style={{ textAlign: 'center' }}>You’re all set.</Title> : <BrandLine parts={['Add', 'logo', 'to your home screen.']} center />}
        <BrandText text="Open Moi in one tap and get your wash-day and routine reminders. Takes 10 seconds." size={16} weight="regular" color={C.gray2} lineHeight={1.375} center />
        {!standalone ? (
          <View style={{ backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.line }}>
            {STEPS.map(([n, a, b, c], i) => (
              <View key={n} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: '#E6E6E8' }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontFamily: F.semibold, fontSize: 12 }}>{n}</Text></View>
                <Text style={{ flex: 1, fontFamily: F.regular, fontSize: 15, color: C.ink }}>{a}<Text style={{ fontFamily: F.semibold }}>{b}</Text>{c}</Text>
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  {i === 0 ? <Path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M8 10.5H6.5A1.5 1.5 0 0 0 5 12v7.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V12a1.5 1.5 0 0 0-1.5-1.5H16" stroke={C.ink} strokeWidth={2} fill="none" strokeLinecap="round" />
                    : i === 1 ? <><Rect x={4} y={4} width={16} height={16} rx={4} stroke={C.ink} strokeWidth={2} fill="none" /><Path d="M12 8.5v7M8.5 12h7" stroke={C.ink} strokeWidth={2} strokeLinecap="round" /></>
                      : <Path d="m5 12.5 4.5 4.5L19 7.5" stroke={C.ink} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
                </Svg>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
