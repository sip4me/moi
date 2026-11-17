import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { StepScreen } from '../../components/onboarding';
import { Sub, Title } from '../../components/ui';
import { useStep } from '../../state/useStep';
import { C, F } from '../../theme';

export default function CameraPermission() {
  const { next } = useStep('camera');
  const [denied, setDenied] = useState(false);
  async function allow() {
    // The web asks for the camera when the photo is taken, so there's nothing to request yet.
    if (Platform.OS !== 'web') {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) return setDenied(true);
    }
    next();
  }
  return (
    <StepScreen step="camera" cta="Allow camera" onNext={allow} secondary={{ label: 'Not now', onPress: next }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <View style={{ width: 108, height: 108, borderRadius: 54, backgroundColor: '#EFEFF1', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Svg width={46} height={46} viewBox="0 0 24 24"><Path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.2-1.8h5.4L15.9 6h1.6A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-8Z" stroke={C.ink} strokeWidth={1.6} fill="none" strokeLinejoin="round" /><Circle cx={12} cy={12.5} r={3.4} stroke={C.ink} strokeWidth={1.6} fill="none" /></Svg>
        </View>
        <Title style={{ textAlign: 'center' }}>Allow camera access to scan your hair.</Title>
        <Sub style={{ textAlign: 'center' }}>We only use the camera when you take a scan. Photos stay on your account — never your camera roll unless you save them.</Sub>
        {denied ? <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.red, textAlign: 'center' }}>Camera access is off. Turn it on in Settings, or tap Not now and upload photos instead.</Text> : null}
      </View>
    </StepScreen>
  );
}
