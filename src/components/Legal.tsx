import { Text } from 'react-native';
import { LINKS, openLink } from '../config';
import { C, F } from '../theme';

/** "By continuing, you agree to our Terms of Use and Privacy Policy" with both links tappable. */
export function LegalLine({ lead = 'By continuing, you agree to our', center = true, style }: { lead?: string; center?: boolean; style?: object }) {
  const link = (label: string, url: string) => (
    <Text accessibilityRole="link" onPress={() => openLink(url)} style={{ fontFamily: F.semibold, color: C.gray2, textDecorationLine: 'underline' }}>{label}</Text>
  );
  return (
    <Text style={[{ fontFamily: F.regular, fontSize: 12, lineHeight: 17, color: C.gray, textAlign: center ? 'center' : 'left' }, style]}>
      {lead} {link('Terms of Use', LINKS.terms)} and {link('Privacy Policy', LINKS.privacy)}.
    </Text>
  );
}
