import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Screen, SectionCard, Sub } from '../../components/ui';
import { useStore } from '../../state/store';
import { C, F } from '../../theme';

const Chev = () => <Svg width={8} height={13} viewBox="0 0 8 14"><Path d="M1.5 1.5 6.5 7l-5 5.5" stroke="#9A9A9A" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const GOAL: Record<string, string> = { repair: 'Less frizz & breakage', grow: 'Longer, fuller hair', keep: 'Stop thinning', balance: 'Calmer scalp' };

function Row({ k, v, onPress, first }: { k: string; v?: string; onPress?: () => void; first?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderTopWidth: first ? 0 : 1, borderTopColor: '#E6E6E8', backgroundColor: pressed && onPress ? '#EFEFF1' : 'transparent' })}>
      <Text style={{ fontFamily: F.regular, fontSize: 16, color: v ? C.gray : C.ink }}>{k}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{v ? <Text style={{ fontFamily: F.medium, fontSize: 16, color: C.ink }}>{v}</Text> : null}{onPress ? <Chev /> : null}</View>
    </Pressable>
  );
}

export default function Profile() {
  const { answers, lifeChange, setLifeChange, reset, name, cloud } = useStore();
  const lc = lifeChange;
  const total = lc?.endsAt ? Math.max(1, Math.round((new Date(lc.endsAt).getTime() - new Date(lc.startsAt).getTime()) / 86400000)) : 0;
  const left = lc?.endsAt ? Math.max(0, Math.ceil((new Date(lc.endsAt).getTime() - Date.now()) / 86400000)) : 0;
  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: '#000', alignItems: 'center', justifyContent: 'flex-end', overflow: 'visible' }}>
          <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#9AA', marginBottom: 4 }} />
          <View style={{ width: 40, height: 18, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 2, borderBottomWidth: 0, borderColor: '#9AA', marginBottom: 6 }} />
          <Image source={require('../../../assets/crown.png')} style={{ position: 'absolute', top: -14, width: 34, height: 36, transform: [{ rotate: '-20deg' }] }} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.bold, fontSize: 26, color: C.ink }}>{name}</Text>
          <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.gray }}>{[answers.texture, answers.thickness].filter(Boolean).join(' · ')}</Text>
        </View>
        <Pressable onPress={() => router.push('/reminders')} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, backgroundColor: pressed ? '#E3E3E6' : '#F2F2F4', alignItems: 'center', justifyContent: 'center' })} accessibilityLabel="Reminders">
          <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16ZM10 20.5a2 2 0 0 0 4 0" stroke={C.ink} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
        </Pressable>
      </View>
      <Sub style={{ marginTop: 14 }}>The more Moi knows, the better your plan</Sub>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cloud === 'saved' ? '#34A853' : cloud === 'saving' ? '#C9A227' : '#BDBDBD' }} />
        <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.gray }}>{cloud === 'saved' ? 'Backed up' : cloud === 'saving' ? 'Saving…' : 'Saved on this phone only'}</Text>
      </View>

      <Text style={{ fontFamily: F.semibold, fontSize: 13, color: C.gray, letterSpacing: 1.5, marginTop: 22, marginBottom: 10 }}>SOMETHING CHANGED?</Text>
      {lc ? (
        <View style={{ backgroundColor: C.goldSoft, borderRadius: 24, padding: 18, gap: 10, borderWidth: 1, borderColor: '#F1DDAA' }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 17, color: C.ink }}>{lc.label}</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 13, color: '#7A6A4A' }}>{lc.endsAt ? `${left} of ${total} days left · until ${new Date(lc.endsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Until you end it'}</Text>
          {lc.endsAt ? <View style={{ height: 6, borderRadius: 3, backgroundColor: '#F1DDAA' }}><View style={{ height: 6, borderRadius: 3, backgroundColor: C.gold, width: `${Math.round(((total - left) / total) * 100)}%` }} /></View> : null}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[['Edit', () => router.push('/change')], ['End early', () => setLifeChange(null)]].map(([t, f]: any) => (
              <Pressable key={t} onPress={f} style={({ pressed }) => ({ backgroundColor: pressed ? '#F6EBD0' : '#fff', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: '#E6D3A3' })}><Text style={{ fontFamily: F.semibold, fontSize: 13, color: C.ink }}>{t}</Text></Pressable>
            ))}
          </View>
        </View>
      ) : (
        <Pressable onPress={() => router.push('/change')} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: pressed ? C.pressed : C.card, borderRadius: 20, padding: 16 })}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontFamily: F.semibold, fontSize: 17, marginTop: -2 }}>+</Text></View>
          <View style={{ flex: 1 }}><Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>Add a change</Text><Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray }}>Travel, a new style, being sick… we’ll adjust for as long as it lasts</Text></View>
        </Pressable>
      )}

      <SectionCard label="THE BASICS" style={{ marginTop: 22, paddingBottom: 4 }}>
        <View>
          <Row first k="Goal" v={GOAL[answers.goal] ?? '—'} />
          <Row k="Texture" v={answers.texture ?? '—'} />
          <Row k="Scalp" v={answers.scalp ?? '—'} />
          <Row k="Porosity" v={answers.porosity ?? '—'} />
          <Row k="Time a day" v={answers.timeBudget ? `${answers.timeBudget} min` : '—'} />
        </View>
      </SectionCard>
      <SectionCard label="MY ROUTINE" style={{ marginTop: 14, paddingBottom: 4 }}>
        <View>
          <Row first k="Reminders" onPress={() => router.push('/reminders')} />
          <Row k="Retake the questions" onPress={() => { reset(); router.replace('/onboarding'); }} />
        </View>
      </SectionCard>
    </Screen>
  );
}
