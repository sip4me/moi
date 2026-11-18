import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BrandText, Screen, SectionCard, Sub } from '../../components/ui';
import { washInterval } from '../../data/schedule';
import { profileFromAnswers, useStore } from '../../state/store';
import { C, F } from '../../theme';

const Chev = () => <Svg width={8} height={13} viewBox="0 0 8 14"><Path d="M1.5 1.5 6.5 7l-5 5.5" stroke="#9A9A9A" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const ACTIVITY: Record<string, string> = { sports: 'Sports', demanding_job: 'Demanding job', student: 'Student', pregnant: 'Pregnant', caregiver: 'Caring for a child' };
const cap = (v?: string) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : '');
const GOAL: Record<string, string> = { repair: 'Less frizz & breakage', grow: 'Longer, fuller hair', keep: 'Stop thinning', balance: 'Calmer scalp' };

function Row({ k, v, onPress, first }: { k: string; v?: string; onPress?: () => void; first?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderTopWidth: first ? 0 : 1, borderTopColor: '#E6E6E8', backgroundColor: pressed && onPress ? '#EFEFF1' : 'transparent' })}>
      <Text style={{ fontFamily: F.regular, fontSize: 16, color: v ? C.gray : C.ink }}>{k}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1, marginLeft: 16 }}>{v ? <Text style={{ fontFamily: F.medium, fontSize: 16, color: C.ink, textAlign: 'right', flexShrink: 1 }}>{v}</Text> : null}{onPress ? <Chev /> : null}</View>
    </Pressable>
  );
}

export default function Profile() {
  const { answers, lifeChange, setLifeChange, reset, name, cloud, scans, saved, shelf, plan, done } = useStore();
  const streak = Object.values(done).filter(v => v.length).length;
  const profile = profileFromAnswers(answers);
  const age = answers.birthDate ? Math.floor((Date.now() - new Date(answers.birthDate).getTime()) / (365.25 * 86400000)) : null;
  const activities = profile.lifestyle.map(x => ACTIVITY[x]).filter(Boolean).concat(profile.swims ? ['Swimming'] : []).join(', ');
  const lc = lifeChange;
  const total = lc?.endsAt ? Math.max(1, Math.round((new Date(lc.endsAt).getTime() - new Date(lc.startsAt).getTime()) / 86400000)) : 0;
  const left = lc?.endsAt ? Math.max(0, Math.ceil((new Date(lc.endsAt).getTime() - Date.now()) / 86400000)) : 0;
  return (
    <Screen scroll tab="profile">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        {/* Figma 07 · Profile avatar: the scan silhouette wearing the pink crown. */}
        <Image source={require('../../../assets/avatar.png')} resizeMode="contain" style={{ width: 76, height: 78 }} accessibilityLabel="Your profile picture" />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.bold, fontSize: 26, color: C.ink }}>{name}</Text>
          <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.gray }}>{[cap(answers.texture), answers.thickness ?? answers.length, streak ? `${streak}-day streak` : scans.length ? `${scans.length} scan${scans.length > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ')}</Text>
        </View>
        <Pressable onPress={() => router.push('/settings')} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, backgroundColor: pressed ? '#E3E3E6' : '#F2F2F4', alignItems: 'center', justifyContent: 'center' })} accessibilityLabel="Settings">
          <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" stroke={C.ink} strokeWidth={1.9} fill="none" /><Path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A7.6 7.6 0 0 0 7 6.5l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a7.6 7.6 0 0 0 2.6-1.5l2.4 1 2-3.4-2-1.6Z" stroke={C.ink} strokeWidth={1.9} strokeLinejoin="round" fill="none" /></Svg>
        </Pressable>
      </View>
      <View style={{ marginTop: 14 }}><BrandText text="The more Moi knows, the better your plan" size={16} weight="regular" color={C.gray2} lineHeight={1.375} /></View>
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

      <SectionCard label="MY CROWN" style={{ marginTop: 22, paddingBottom: 4 }}>
        <View>
          <Row first k="Scan history" v={scans.length ? `${scans.length}` : undefined} onPress={() => router.push('/(tabs)/progress')} />
          <Row k="Saved styles" v={saved.length ? `${saved.length}` : undefined} onPress={() => router.push('/saved')} />
          <Row k="Product shelf" v={shelf.length ? `${shelf.length}` : undefined} onPress={() => router.push('/(tabs)/products')} />
        </View>
      </SectionCard>
      <SectionCard label="THE BASICS" style={{ marginTop: 14, paddingBottom: 4 }}>
        <View>
          <Row first k="Name" v={name} />
          <Row k="Age" v={age ? String(age) : '—'} />
          <Row k="Hair type" v={[cap(answers.texture), answers.length].filter(Boolean).join(' · ') || '—'} />
          <Row k="Porosity" v={cap(profile.porosity)} />
          <Row k={goalList(answers.goal).length > 1 ? 'Goals' : 'Goal'} v={goalList(answers.goal).map(g => GOAL[g]).filter(Boolean).join(', ') || '—'} />
        </View>
      </SectionCard>
      <SectionCard label="MY ROUTINE" style={{ marginTop: 14, paddingBottom: 4 }}>
        <View>
          <Row first k="Wash" v={plan ? `Every ${washInterval(plan)} days` : '—'} />
          <Row k="Activities" v={activities || 'None'} />
          <Row k="Reminders" onPress={() => router.push('/reminders')} />
          <Row k="Retake the questions" onPress={() => { reset(); router.replace('/onboarding'); }} />
        </View>
      </SectionCard>
    </Screen>
  );
}

const goalList = (g: unknown): string[] => (Array.isArray(g) ? g : g ? [String(g)] : []);
