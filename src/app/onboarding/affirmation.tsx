import { Image, View } from 'react-native';
import { StepScreen } from '../../components/onboarding';
import { Sub, Title } from '../../components/ui';
import { GOAL_COPY, primaryGoal } from '../../data/goals';
import { useStore } from '../../state/store';

export default function Affirmation() {
  const { answers } = useStore();
  const copy = GOAL_COPY[primaryGoal(answers)];
  return (
    <StepScreen step="affirmation">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Image source={require('../../../assets/affirmation.png')} style={{ width: 150, height: 150 }} />
        <Title style={{ textAlign: 'center', marginTop: 16 }}>{copy.affirmation}</Title>
        <Sub style={{ textAlign: 'center' }}>Small changes show up clearly in your photos.</Sub>
      </View>
    </StepScreen>
  );
}
