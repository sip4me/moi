import { Image, Text, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { InfoCard, StepScreen } from '../../components/onboarding';
import { useDrawIn } from '../../components/useDrawIn';
import { C, F } from '../../theme';

const crown = require('../../../assets/crown-pink.png');

export default function GreatPotential() {
  const p = useDrawIn();
  return (
    <StepScreen step="potential" title="Your hair can grow 2.8 mm a week">
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <InfoCard>
          <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.ink }}>Your hair growth</Text>
          <View style={{ marginTop: 12 }}>
            <Svg width="100%" height={150} viewBox="0 0 300 150">
              <Defs><LinearGradient id="g" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={C.gold} stopOpacity={0.55} /><Stop offset="1" stopColor={C.gold} stopOpacity={0.05} /></LinearGradient></Defs>
              <Line x1={70} y1={10} x2={70} y2={140} stroke="#E6E6E8" strokeWidth={1} />
              <Line x1={140} y1={10} x2={140} y2={140} stroke="#E6E6E8" strokeWidth={1} />
              <Path d="M10 132 C 50 130, 70 130, 90 122 S 160 80, 200 62 S 260 34, 285 26 L 285 140 L 10 140 Z" fill="url(#g)" opacity={p} />
              <Path d="M10 132 C 50 130, 70 130, 90 122 S 160 80, 200 62 S 260 34, 285 26" stroke="#8C6A35" strokeWidth={2} fill="none" strokeDasharray="400 400" strokeDashoffset={400 * (1 - p)} />
              <Line x1={10} y1={140} x2={290} y2={140} stroke={C.ink} strokeWidth={1.5} />
            </Svg>
            <Image source={crown} style={{ opacity: p > 0.95 ? 1 : 0, position: 'absolute', right: -2, top: 0, width: 30, height: 30 }} resizeMode="contain" />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 }}>
            {['Week 1', 'Week 4', 'Week 12'].map(t => <Text key={t} style={{ fontFamily: F.medium, fontSize: 12, color: C.ink }}>{t}</Text>)}
          </View>
          <Text style={{ fontFamily: F.regular, fontSize: 13, lineHeight: 19, color: C.gray2, textAlign: 'center', marginTop: 12 }}>
            Growth feels slow at first, but stick with your routine and your scans will show the difference by week 12.
          </Text>
        </InfoCard>
      </View>
    </StepScreen>
  );
}
