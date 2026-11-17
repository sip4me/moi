import { useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Button, OptionRow, Screen, Sub, Title, TopBar } from '../../../components/ui';
import type { StepKey } from '../../../data/flow';
import { type Option, QUESTIONS, questionById } from '../../../data/questions';
import { useStore } from '../../../state/store';
import { useStep } from '../../../state/useStep';
import { C, F } from '../../../theme';

const TEXTURE_PATH: Record<string, string> = {
  straight: 'M14 8v24M20 8v24M26 8v24',
  wavy: 'M14 8c3 3-3 6 0 9s-3 6 0 9-2 4 0 6M20 8c3 3-3 6 0 9s-3 6 0 9-2 4 0 6M26 8c3 3-3 6 0 9s-3 6 0 9-2 4 0 6',
  curly: 'M13 9c-3 1-3 5 0 5s3 4 0 5-3 5 0 5 3 4 0 5M20 9c-3 1-3 5 0 5s3 4 0 5-3 5 0 5 3 4 0 5M27 9c-3 1-3 5 0 5s3 4 0 5-3 5 0 5 3 4 0 5',
  coily: 'M11 9h5l-5 4h5l-5 4h5l-5 4h5l-5 4h5M18 9h5l-5 4h5l-5 4h5l-5 4h5l-5 4h5M25 9h5l-5 4h5l-5 4h5l-5 4h5l-5 4h5',
};

export function generateStaticParams() {
  return QUESTIONS.map(q => ({ id: q.id }));
}

export default function QuestionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = questionById(id ?? '');
  const { answers, setAnswer } = useStore();
  const step = useStep(`q:${id}` as StepKey);
  if (!q) return null;

  const multi = q.kind === 'multi' || q.kind === 'chips';
  const val = answers[q.id];
  const list: any[] = Array.isArray(val) ? val : [];
  const writeInKey = `${q.id}Other`;
  const answered = multi ? list.length > 0 || !!answers[writeInKey]?.trim() : val !== undefined;
  const isSel = (v: Option['value']) => (multi ? list.includes(v) : val === v);
  const pick = (v: Option['value']) => {
    if (!multi) return setAnswer(q.id, v);
    if (v === 'none') return setAnswer(q.id, list.includes('none') ? [] : ['none']);
    const base = list.filter(x => x !== 'none');
    setAnswer(q.id, base.includes(v) ? base.filter(x => x !== v) : [...base, v]);
  };

  return (
    <Screen footer={<Button label="Continue" disabled={!answered} onPress={step.next} />}>
      <TopBar progress={step.progress} />
      <View style={{ marginTop: 20 }}>
        <Title>{q.title}</Title>
        {q.subtitle ? <Sub style={{ marginTop: 8 }}>{q.subtitle}</Sub> : null}
      </View>
      {/* Long lists scroll; short ones sit centred like the Figma frames. */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', gap: 10, paddingVertical: 16 }} showsVerticalScrollIndicator={false}>
        {q.kind === 'tiles' ? <Tiles options={q.options} isSel={isSel} pick={pick} />
          : q.kind === 'chips' ? <Chips options={q.options} isSel={isSel} pick={pick} />
          : q.options.map(o => <OptionRow key={String(o.value)} label={o.label} sub={o.sub} selected={isSel(o.value)} multi={multi} onPress={() => pick(o.value)} />)}
        {q.writeIn ? (
          <TextInput value={answers[writeInKey] ?? ''} onChangeText={t => setAnswer(writeInKey, t)} placeholder={q.writeIn} placeholderTextColor="#ABABAB"
            style={{ marginTop: 6, height: 52, borderRadius: 16, borderWidth: 1, borderColor: C.line, paddingHorizontal: 16, fontFamily: F.regular, fontSize: 15, color: C.ink, outlineStyle: 'none' } as any} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

type PickProps = { options: Option[]; isSel: (v: Option['value']) => boolean; pick: (v: Option['value']) => void };

function Tiles({ options, isSel, pick }: PickProps) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
      {options.map(o => {
        const sel = isSel(o.value);
        return (
          <Pressable key={String(o.value)} onPress={() => pick(o.value)} style={({ pressed }) => ({ width: '47%', aspectRatio: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: sel ? C.ink : pressed ? C.pressed : C.option })}>
            <Svg width={40} height={40} viewBox="0 0 40 40"><Path d={TEXTURE_PATH[String(o.value)]} stroke={sel ? '#fff' : C.ink} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
            <Text style={{ fontFamily: F.medium, fontSize: 15, color: sel ? '#fff' : C.ink }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Chips({ options, isSel, pick }: PickProps) {
  const groups = [...new Set(options.map(o => o.group ?? ''))];
  return (
    <View style={{ gap: 18 }}>
      {groups.map(g => (
        <View key={g} style={{ gap: 10 }}>
          {g ? <Text style={{ fontFamily: F.semibold, fontSize: 11, letterSpacing: 1.3, color: C.gray2 }}>{g}</Text> : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {options.filter(o => (o.group ?? '') === g).map(o => <Chip key={String(o.value)} label={o.label} on={isSel(o.value)} onPress={() => pick(o.value)} />)}
          </View>
        </View>
      ))}
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
      style={({ pressed }) => ({ paddingHorizontal: 16, height: 40, borderRadius: 20, justifyContent: 'center', backgroundColor: on ? (pressed ? '#2E2E2E' : C.ink) : pressed ? C.pressed : '#fff', borderWidth: 1, borderColor: on ? C.ink : '#E3E3E6' })}>
      <Text style={{ fontFamily: F.medium, fontSize: 14, color: on ? '#fff' : C.ink }}>{label}</Text>
    </Pressable>
  );
}
