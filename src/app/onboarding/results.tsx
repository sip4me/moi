import { Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { InfoCard, StepScreen } from '../../components/onboarding';
import { useDrawIn } from '../../components/useDrawIn';
import { Logo, Title } from '../../components/ui';
import { C, F } from '../../theme';

// Both lines are under 400 units long, so a 400 dash fully hides them before they draw in.
const LEN = 400;

export default function LongTermResults() {
  const p = useDrawIn();
  return (
    <StepScreen step="results" title={
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', columnGap: 8 }}>
        <Logo size={30} color={C.ink} /><Title>creates long-term</Title><Title>results</Title>
      </View>
    }>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <InfoCard>
          <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.ink }}>Your hair health</Text>
          <Svg width="100%" height={150} viewBox="0 0 300 150" style={{ marginTop: 12 }}>
            <Defs>
              <LinearGradient id="moi" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#0A0A0A" stopOpacity={0.14} /><Stop offset="1" stopColor="#0A0A0A" stopOpacity={0} /></LinearGradient>
              <LinearGradient id="trad" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={C.red} stopOpacity={0.18} /><Stop offset="1" stopColor={C.red} stopOpacity={0} /></LinearGradient>
            </Defs>
            <Path d="M10 120 C 60 115, 90 40, 140 60 S 220 115, 290 118 L 290 135 L 10 135 Z" fill="url(#trad)" opacity={p} />
            <Path d="M10 120 C 60 115, 90 40, 140 60 S 220 115, 290 118" stroke={C.red} strokeWidth={2} fill="none" strokeDasharray={`${LEN} ${LEN}`} strokeDashoffset={LEN * (1 - p)} />
            <Path d="M10 120 C 90 120, 150 90, 200 55 S 260 22, 290 18 L 290 135 L 10 135 Z" fill="url(#moi)" opacity={p} />
            <Path d="M10 120 C 90 120, 150 90, 200 55 S 260 22, 290 18" stroke={C.ink} strokeWidth={2.5} fill="none" strokeDasharray={`${LEN} ${LEN}`} strokeDashoffset={LEN * (1 - p)} />
            <Circle cx={10} cy={120} r={5} fill="#fff" stroke={C.ink} strokeWidth={2} />
            <Circle cx={290} cy={18} r={5} fill="#fff" stroke={C.ink} strokeWidth={2} opacity={p > 0.97 ? 1 : 0} />
          </Svg>
          <View style={{ position: 'absolute', left: 120, top: 70, opacity: p }}><Text style={{ fontFamily: F.medium, fontSize: 11, color: C.gray2 }}>Traditional routine</Text></View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.ink }}>Month 1</Text>
            <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.ink }}>Month 6</Text>
          </View>
          <Text style={{ fontFamily: F.regular, fontSize: 13, lineHeight: 19, color: C.gray2, textAlign: 'center', marginTop: 12 }}>Routines you track keep working — routines you guess at fade after a few weeks.</Text>
        </InfoCard>
      </View>
    </StepScreen>
  );
}
