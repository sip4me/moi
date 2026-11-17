import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button, OptionRow, Screen, Sub, Title, TopBar } from '../../../components/ui';
import { QUESTIONS } from '../../../data/questions';
import { useStore } from '../../../state/store';
import { C, F } from '../../../theme';

const TEXTURE_PATH: Record<string, string> = {
  straight: 'M14 8v24M20 8v24M26 8v24',
  wavy: 'M14 8c3 3-3 6 0 9s-3 6 0 9-2 4 0 6M20 8c3 3-3 6 0 9s-3 6 0 9-2 4 0 6M26 8c3 3-3 6 0 9s-3 6 0 9-2 4 0 6',
  curly: 'M13 9c-3 1-3 5 0 5s3 4 0 5-3 5 0 5 3 4 0 5M20 9c-3 1-3 5 0 5s3 4 0 5-3 5 0 5 3 4 0 5M27 9c-3 1-3 5 0 5s3 4 0 5-3 5 0 5 3 4 0 5',
  coily: 'M11 9h5l-5 4h5l-5 4h5l-5 4h5l-5 4h5M18 9h5l-5 4h5l-5 4h5l-5 4h5l-5 4h5M25 9h5l-5 4h5l-5 4h5l-5 4h5l-5 4h5',
};
import Svg, { Path } from 'react-native-svg';

export function generateStaticParams() {
  return QUESTIONS.map((_, i) => ({ step: String(i) }));
}

export default function QuestionScreen() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const i = Number(step ?? 0);
  const q = QUESTIONS[i];
  const { answers, setAnswer } = useStore();
  if (!q) return null;
  const val = answers[q.id];
  const answered = q.kind === 'multi' ? Array.isArray(val) && val.length > 0 : val !== undefined;
  const next = () => (i + 1 < QUESTIONS.length ? router.push(`/onboarding/q/${i + 1}`) : router.push('/onboarding/analyzing'));
  const pick = (v: any) => {
    if (q.kind !== 'multi') return setAnswer(q.id, v);
    const cur: any[] = Array.isArray(val) ? val : [];
    if (v === 'none') return setAnswer(q.id, cur.includes('none') ? [] : ['none']);
    const base = cur.filter(x => x !== 'none');
    setAnswer(q.id, base.includes(v) ? base.filter(x => x !== v) : [...base, v]);
  };
  const isSel = (v: any) => (q.kind === 'multi' ? Array.isArray(val) && val.includes(v) : val === v);
  return (
    <Screen footer={<Button label="Continue" disabled={!answered} onPress={next} />}>
      <TopBar progress={(i + 1) / (QUESTIONS.length + 2)} />
      <View style={{ marginTop: 20 }}>
        <Title>{q.title}</Title>
        {q.subtitle ? <Sub style={{ marginTop: 8 }}>{q.subtitle}</Sub> : null}
      </View>
      <View style={{ flex: 1, justifyContent: 'center', gap: 10, paddingVertical: 16 }}>
        {q.kind === 'tiles' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {q.options.map(o => {
              const sel = isSel(o.value);
              return (
                <Pressable key={String(o.value)} onPress={() => pick(o.value)} style={({ pressed }) => ({ width: '47%', aspectRatio: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: sel ? C.ink : pressed ? C.pressed : C.option })}>
                  <Svg width={40} height={40} viewBox="0 0 40 40"><Path d={TEXTURE_PATH[String(o.value)]} stroke={sel ? '#fff' : C.ink} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
                  <Text style={{ fontFamily: F.medium, fontSize: 15, color: sel ? '#fff' : C.ink }}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : q.options.map(o => <OptionRow key={String(o.value)} label={o.label} sub={o.sub} selected={isSel(o.value)} multi={q.kind === 'multi'} onPress={() => pick(o.value)} />)}
      </View>
    </Screen>
  );
}
