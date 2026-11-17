import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Screen, TopBar } from '../components/ui';
import { type Metrics, profileFromAnswers, useStore } from '../state/store';
import { C, F } from '../theme';

type Field = { key: keyof Metrics; label: string; options: (string | number)[]; fmt?: (v: any) => string };
const FIELDS: Field[] = [
  { key: 'density', label: 'Density', options: [40, 50, 60, 70, 80, 90], fmt: v => `${v}%` },
  { key: 'thickness', label: 'Thickness', options: ['Fine', 'Medium', 'Coarse'] },
  { key: 'porosity', label: 'Porosity', options: ['Low', 'Normal', 'High'] },
  { key: 'frizz', label: 'Frizz', options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], fmt: v => `${v}/10` },
  { key: 'oiliness', label: 'Oiliness', options: ['Low', 'Medium', 'High'] },
  { key: 'buildup', label: 'Buildup', options: ['None', 'Mild', 'Heavy'] },
];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Six metrics after a scan. Photo analysis isn't live yet, so the numbers start from the
 * person's answers and are labelled as estimates; "Fix results" lets them correct any of them.
 */
export default function ScanResult() {
  const { taken } = useLocalSearchParams<{ taken?: string }>();
  const { answers, scans, addScan } = useStore();
  const estimate = useMemo<Metrics>(() => {
    const p = profileFromAnswers(answers);
    const b = p.baseline;
    return {
      density: b.density ?? 65, thickness: cap(p.thickness), porosity: cap(p.porosity), frizz: b.frizz ?? 6,
      oiliness: (b.oiliness ?? 5) >= 7 ? 'High' : (b.oiliness ?? 5) <= 3 ? 'Low' : 'Medium',
      buildup: (b.buildup ?? 4) >= 6 ? 'Mild' : 'None',
    };
  }, [answers]);
  const [m, setM] = useState<Metrics>(scans[0]?.metrics ?? estimate);
  const [editing, setEditing] = useState(false);
  const cycle = (f: Field) => setM(cur => {
    const i = f.options.indexOf(cur[f.key] as never);
    return { ...cur, [f.key]: f.options[(i + 1) % f.options.length] };
  });
  const done = () => {
    addScan({ at: new Date().toISOString(), angles: Number(taken ?? 0), metrics: m, edited: editing || m !== estimate });
    router.replace('/(tabs)/progress');
  };
  const when = new Date().toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' });

  return (
    <Screen scroll footer={
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button label={editing ? 'Stop editing' : '+ Fix results'} variant="secondary" onPress={() => setEditing(e => !e)} style={{ flex: 1 }} />
        <Button label="Done" onPress={done} style={{ flex: 1 }} />
      </View>
    }>
      <TopBar />
      <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray, marginTop: 16 }}>{when}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ fontFamily: F.bold, fontSize: 24, color: C.ink }}>Your scan</Text>
        <View style={{ backgroundColor: C.amberSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 11, color: C.amberText }}>Estimated</Text>
        </View>
      </View>
      <Text style={{ fontFamily: F.regular, fontSize: 13, lineHeight: 19, color: C.gray2, marginTop: 6 }}>
        {Number(taken) ? `${taken} photo${Number(taken) > 1 ? 's' : ''} saved for your progress. ` : ''}Automatic photo analysis is coming soon, so these start from your answers. Tap Fix results to correct anything.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
        {FIELDS.map(f => (
          <Pressable key={f.key} disabled={!editing} onPress={() => cycle(f)}
            style={({ pressed }) => ({ width: '48%', flexGrow: 1, borderRadius: 16, padding: 14, backgroundColor: pressed ? C.pressed : C.card, borderWidth: 1, borderColor: editing ? C.ink : C.line })}>
            <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray }}>{f.label}</Text>
            <Text style={{ fontFamily: F.semibold, fontSize: 17, color: C.ink, marginTop: 2 }}>{f.fmt ? f.fmt(m[f.key]) : String(m[f.key])}</Text>
            {editing ? <Text style={{ fontFamily: F.medium, fontSize: 11, color: C.gray2, marginTop: 4 }}>Tap to change</Text> : null}
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
