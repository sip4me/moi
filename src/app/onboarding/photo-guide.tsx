import { Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { StepScreen } from '../../components/onboarding';
import { ANGLES } from '../../lib/scans';
import { C, F } from '../../theme';

const ICON: Record<string, React.ReactNode> = {
  hairline: <Ellipse cx={12} cy={12} rx={6} ry={8} stroke={C.ink} strokeWidth={1.7} fill="none" />,
  crown: <><Circle cx={12} cy={12} r={8} stroke={C.ink} strokeWidth={1.7} fill="none" /><Path d="M12 12c2-3 5-3 5-3M12 12c-1 3-4 4-4 4M12 12c-3-1-4-4-4-4" stroke={C.ink} strokeWidth={1.5} fill="none" strokeLinecap="round" /></>,
  part: <><Path d="M5 4h14v16H5z" stroke={C.ink} strokeWidth={1.7} fill="none" strokeLinejoin="round" /><Path d="M12 4v16M12 9c-2 1-4 1-5 3M12 13c2 1 4 1 5 3" stroke={C.ink} strokeWidth={1.5} fill="none" strokeLinecap="round" /></>,
};

export default function PhotoGuide() {
  return (
    <StepScreen step="photo-guide" title="Three photos. Same way, every time." sub="Consistent shots are what make progress visible. Takes about a minute." cta="Start my first scan" scroll>
      <View style={{ gap: 10, marginTop: 22 }}>
        {ANGLES.map((a, i) => (
          <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, borderRadius: 18, padding: 12 }}>
            <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: '#EBEBEE', alignItems: 'center', justifyContent: 'center' }}><Svg width={24} height={24} viewBox="0 0 24 24">{ICON[a.id]}</Svg></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.ink }}>{i + 1} · {a.title}</Text>
              <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.gray2, marginTop: 2 }}>{a.hint}</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={{ fontFamily: F.semibold, fontSize: 11, letterSpacing: 1.3, color: C.gray2, marginTop: 22, marginBottom: 8 }}>FOR ACCURATE RESULTS</Text>
      {['Daylight from a window — no flash', 'Dry, unstyled hair, no product', 'Same spot and distance each time'].map(t => (
        <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: C.ink }} />
          <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.ink }}>{t}</Text>
        </View>
      ))}
    </StepScreen>
  );
}
