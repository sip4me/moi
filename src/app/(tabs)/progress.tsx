import { Text, View } from 'react-native';
import { Screen, SectionCard, Sub, Title } from '../../components/ui';
import { useStore } from '../../state/store';
import { C, F } from '../../theme';

export default function Progress() {
  const { plan, done } = useStore();
  const days = Object.entries(done).filter(([, v]) => v.length).sort(([a], [b]) => a.localeCompare(b));
  return (
    <Screen scroll>
      <Title>Progress</Title>
      <SectionCard style={{ marginTop: 16 }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>Your goal</Text>
        <Text style={{ fontFamily: F.bold, fontSize: 22, color: C.ink }}>{plan?.target ?? '—'}</Text>
        <Sub style={{ fontSize: 13 }}>Photo scans and the trend chart arrive with the camera in the app build. For now this tracks your routine.</Sub>
      </SectionCard>
      <SectionCard label="ROUTINE DAYS" style={{ marginTop: 14 }}>
        {days.length ? days.slice(-10).reverse().map(([d, ids]) => (
          <View key={d} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.ink }}>{new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
            <Text style={{ fontFamily: F.regular, fontSize: 15, color: C.gray2 }}>{ids.length} done</Text>
          </View>
        )) : <Sub style={{ fontSize: 14 }}>Mark a routine card done on Home and it shows up here.</Sub>}
      </SectionCard>
    </Screen>
  );
}
