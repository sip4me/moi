import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Btn, Shell, useWide } from '../../components/routine/Kit';
import { SectionCard } from '../../components/ui';
import { AREA_Q, AREAS, DAYS, allSteps, hasInfo, pref, useCatalog, useRoutine } from '../../lib/routine/model';
import { useAccess } from '../../lib/routine/access';
import { analyze } from '../../lib/routine/gaps';
import { useStore } from '../../state/store';
import { C, F } from '../../theme';

// The Moi Routine account profile. Same layout as the Routine tracker's Profile tab (avatar header,
// grouped cards with label/value rows) so both halves of Moi feel like one app.

const Chev = () => <Svg width={8} height={13} viewBox="0 0 8 14"><Path d="M1.5 1.5 6.5 7l-5 5.5" stroke="#9A9A9A" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const crown = require('../../../assets/crown-pink.png');

function Row({ k, v, onPress, first }: { k: string; v?: string; onPress?: () => void; first?: boolean }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderTopWidth: first ? 0 : 1, borderTopColor: '#EFEFF1', backgroundColor: pressed && onPress ? '#F7F7F8' : 'transparent' })}>
      <Text style={{ fontFamily: F.regular, fontSize: 16, color: v ? C.gray : C.ink }}>{k}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1, marginLeft: 16 }}>
        {v ? <Text style={{ fontFamily: F.medium, fontSize: 16, color: C.ink, textAlign: 'right', flexShrink: 1 }}>{v}</Text> : null}
        {onPress ? <Chev /> : null}
      </View>
    </Pressable>
  );
}

export default function RoutineProfile() {
  const s = useRoutine();
  const cat = useCatalog();
  const wide = useWide();
  const a = useAccess();
  const { name, account } = useStore();
  const signedIn = !!account && !account.anonymous;
  const who = account?.email ?? account?.phone ?? '';
  const fit = useMemo(() => (hasInfo(s) ? analyze(s, cat) : null), [s, cat]);
  const logged = allSteps(s).filter(x => x.step.item?.addedAt).length;
  const plan = a.founder ? `Founding Royal #${a.spot}` : a.paid ? 'Royal plan' : a.test ? 'Test unlock' : 'No plan yet';
  const hair = [s.hair.texture, s.hair.strands, s.hair.scalp && `${s.hair.scalp} scalp`].filter(Boolean).join(' · ');
  const area = (s.areas ?? ['hair'])[0] ?? 'hair';
  const card = { marginTop: 32, paddingVertical: 2, paddingHorizontal: 18, maxWidth: 640 };

  return (
    <Shell active="profile">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, maxWidth: 640 }}>
        <View>
          <Image source={require('../../../assets/avatar.png')} resizeMode="contain" style={{ width: 76, height: 79 }} accessibilityLabel="Your profile picture" />
          {a.ok ? <Image source={crown} resizeMode="contain" style={{ position: 'absolute', top: -14, right: -6, width: 34, height: 34, transform: [{ rotate: '14deg' }] }} /> : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.bold, fontSize: 26, color: C.ink }}>{name && name !== 'Your name' ? name : 'Your royal profile'}</Text>
          <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.gray }}>{[plan, hair].filter(Boolean).join(' · ')}</Text>
        </View>
        <Pressable onPress={() => router.push('/settings')} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, backgroundColor: pressed ? '#E3E3E6' : '#F2F2F4', alignItems: 'center', justifyContent: 'center' })} accessibilityLabel="Settings">
          <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" stroke={C.ink} strokeWidth={1.9} fill="none" /><Path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A7.6 7.6 0 0 0 7 6.5l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a7.6 7.6 0 0 0 2.6-1.5l2.4 1 2-3.4-2-1.6Z" stroke={C.ink} strokeWidth={1.9} strokeLinejoin="round" fill="none" /></Svg>
        </Pressable>
      </View>

      {!signedIn ? (
        <View style={{ marginTop: 24, padding: 18, borderRadius: 24, backgroundColor: C.goldSoft, borderWidth: 1, borderColor: '#F1DDAA', gap: 12, maxWidth: 640 }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 17, color: C.ink }}>Save your crown</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: '#7A6A4A' }}>Add your email or phone so your plan, routine and founding spot follow you to any device.</Text>
          <Btn label="Create my account" onPress={() => router.push({ pathname: '/sign-in', params: { mode: 'signup', next: '/routine/profile' } })} style={{ alignSelf: wide ? 'flex-start' : 'stretch' }} />
        </View>
      ) : null}

      <SectionCard label="MY CROWN" style={card}>
        <View>
          <Row first k="Plan" v={plan} onPress={a.ok ? undefined : () => router.push('/routine/plans')} />
          {a.founder ? <Row k="Database access" v="Lifetime" /> : null}
          <Row k="Manage subscription" onPress={() => router.push('/settings')} />
        </View>
      </SectionCard>

      {area === 'hair' ? (
        <SectionCard label="MY HAIR" style={card}>
          <View>
            <Row first k={s.goals.length > 1 ? 'Goals' : 'Goal'} v={s.goals.join(', ') || undefined} onPress={() => router.push('/routine/about')} />
            <Row k="Hair" v={hair || undefined} onPress={() => router.push('/routine/about')} />
            <Row k="Color or chemical" v={s.hair.treated || undefined} />
            <Row k="Budget" v={s.hair.budget || undefined} />
          </View>
        </SectionCard>
      ) : (
        <SectionCard label={`MY ${(AREAS.find(x => x.key === area)?.label ?? '').toUpperCase()}`} style={card}>
          <View>
            {AREA_Q.filter(q => q.area === area).map((q, i) => <Row key={q.key} first={i === 0} k={q.label.replace(/ · .*/, '')} v={pref(s, q.key).join(', ') || undefined} onPress={() => router.push('/routine/about')} />)}
            <Row k="Budget" v={s.hair.budget || undefined} />
          </View>
        </SectionCard>
      )}

      <SectionCard label="MY ROUTINE" style={card}>
        <View>
          {area === 'hair' ? <Row first k="Wash days" v={s.washDays.map(d => DAYS[d]).join(', ') || undefined} onPress={() => router.push('/routine/build')} /> : <Row first k="Routine" v={AREAS.find(x => x.key === area)?.label} onPress={() => router.push('/routine/build')} />}
          <Row k="Products logged" v={String(logged)} onPress={() => router.push('/routine/build')} />
          <Row k="Routine fit" v={fit ? String(fit.score) : undefined} onPress={() => router.push('/routine/gaps')} />
          <Row k="Gaps to fill" v={fit ? String(fit.gaps.length) : undefined} onPress={() => router.push('/routine/gaps')} />
        </View>
      </SectionCard>

      <SectionCard label="ACCOUNT" style={card}>
        <View>
          {signedIn ? <Row first k="Signed in as" v={who} /> : <Row first k="Create an account" onPress={() => router.push({ pathname: '/sign-in', params: { mode: 'signup', next: '/routine/profile' } })} />}
          <Row k="Edit my name" onPress={() => router.push('/details')} />
        </View>
      </SectionCard>
    </Shell>
  );
}
