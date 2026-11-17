import { Pressable, Text, View } from 'react-native';
import { StepScreen } from '../../components/onboarding';
import { Sub, Title } from '../../components/ui';
import { useStore } from '../../state/store';
import { useStep } from '../../state/useStep';
import { C } from '../../theme';

export default function Rating() {
  const { answers, setAnswer } = useStore();
  const { next } = useStep('rating');
  const stars: number = answers.rating ?? 5;
  return (
    <StepScreen step="rating" cta="Rate Moi" onNext={() => { setAnswer('rating', stars); next(); }} secondary={{ label: 'Not now', onPress: next }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <Pressable key={n} onPress={() => setAnswer('rating', n)} hitSlop={6} accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}>
              <Text style={{ fontSize: 34, color: n <= stars ? C.ink : '#D9D9DE' }}>★</Text>
            </Pressable>
          ))}
        </View>
        <Title style={{ textAlign: 'center' }}>Was your first scan helpful?</Title>
        <Sub style={{ textAlign: 'center' }}>A quick rating helps other people find an honest way to track their hair. It takes 5 seconds.</Sub>
      </View>
    </StepScreen>
  );
}
