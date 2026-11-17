import { Switch, Text, View } from 'react-native';
import { Glyph, Screen, SectionCard, Sub, Title, TopBar } from '../components/ui';
import { useStore } from '../state/store';
import { C, F } from '../theme';

const TIME: Record<string, string> = { wash_interval: '8:00 AM on wash days', heat_protect: 'Weekdays · 7:30 AM', heat_cap: 'Weekdays · 7:30 AM', satin: 'Every night · 9:30 PM', scalp_massage: 'Every night · 9:00 PM', deep_condition: 'Tuesdays · 7:00 PM', leave_in: 'After each wash', conditioner: 'After each wash' };

export default function Reminders() {
  const { plan, reminders, setReminder } = useStore();
  const items = [...(plan?.cards ?? []).map(c => ({ id: c.id, t: c.label, s: TIME[c.id] ?? 'Daily · 8:00 PM' })), { id: 'scan', t: 'Scan check-in', s: 'Every other Sunday · 10:00 AM' }, { id: 'weather', t: 'Weather tips', s: 'Humid, cold or sunny days' }];
  return (
    <Screen scroll>
      <TopBar />
      <Title size={26} style={{ marginTop: 16 }}>Reminders</Title>
      <Sub style={{ marginTop: 6 }}>Built from your plan. Max 2 a day, never between 10 PM and 7 AM.</Sub>
      <SectionCard style={{ marginTop: 16 }}>
        {items.map((it, i) => (
          <View key={it.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: '#E6E6E8' }}>
            {it.id !== 'scan' && it.id !== 'weather' ? <Glyph id={it.id} /> : <Glyph name={it.id === 'scan' ? 'magnifier' : 'sun'} color={C.ink} />}
            <View style={{ flex: 1 }}><Text style={{ fontFamily: F.regular, fontSize: 16, color: C.ink }}>{it.t}</Text><Text style={{ fontFamily: F.regular, fontSize: 13, color: C.gray }}>{it.s}</Text></View>
            <Switch value={reminders[it.id] ?? true} onValueChange={v => setReminder(it.id, v)} trackColor={{ true: C.ink, false: '#E3E3E6' }} thumbColor="#fff" />
          </View>
        ))}
      </SectionCard>
      <Sub style={{ fontSize: 12, marginTop: 12 }}>Test build: these settings are saved, but notifications are sent once the app is on your home screen or installed.</Sub>
    </Screen>
  );
}
