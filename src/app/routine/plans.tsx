import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { Btn, Heading, Label, Shell, st, useWide } from '../../components/routine/Kit';
import { haptic } from '../../lib/haptics';
import { checkoutRoutine, FOUNDING_CAP, refreshAccess, ROUTINE_PLANS, useAccess, useFounding, type RoutinePlan } from '../../lib/routine/access';
import { analyze } from '../../lib/routine/gaps';
import { hasInfo, useCatalog, useRoutine } from '../../lib/routine/model';
import { fill } from '../../lib/routine/shine';
import { useStore } from '../../state/store';
import { C, F } from '../../theme';

const crown = require('../../../assets/crown-pink.png');
const GOLD = '#C99A2E';

const PERKS = ['Your full gap report, step by step', 'Product picks matched to your goals and hair', 'The bundle that closes your gaps', 'Every new product as the database grows'];

/** Moi Routine paywall: founding yearly ($25, lifetime database access, first 1,000 customers) or monthly ($6). */
export default function Plans() {
  const { status } = useLocalSearchParams<{ status?: string }>();
  const s = useRoutine();
  const cat = useCatalog();
  const wide = useWide();
  const a = useAccess();
  const f = useFounding();
  const founding = f?.open ?? true;
  const [pick, setPick] = useState<RoutinePlan>('routine_founder');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const { account } = useStore();
  const signedIn = !!account && !account.anonymous;
  // After payment: make the account profile (the tracker's sign-up screen attaches an email or phone to this account).
  const toProfile = () => (signedIn ? router.replace('/routine/profile') : router.replace({ pathname: '/sign-in', params: { mode: 'signup', next: '/routine/profile' } }));
  const gapCount = useMemo(() => (hasInfo(s) ? analyze(s, cat).gaps.length : 0), [s, cat]);

  // Back from Stripe: wait for the webhook to mark the subscription, then go to the report.
  const [waiting, setWaiting] = useState(status === 'success');
  useEffect(() => {
    if (status !== 'success') return;
    let alive = true, tries = 0;
    const poll = async () => { await refreshAccess(); if (!alive) return; if (++tries < 15) setTimeout(poll, 1500); else setWaiting(false); };
    poll();
    return () => { alive = false; };
  }, [status]);
  useEffect(() => { if (a.ok && waiting) { setWaiting(false); haptic('success'); } }, [a.ok, waiting]);

  const buy = async () => {
    setBusy(true); setErr('');
    try {
      const r = await checkoutRoutine(pick);
      if (r === 'test') { haptic('success'); toProfile(); }
    } catch { setErr('Checkout couldn’t open. Check your connection and try again.'); }
    setBusy(false);
  };

  if (a.ok) {
    return (
      <Shell active="plans" footer={<View style={{ gap: 8, width: wide ? undefined : '100%', flexDirection: wide ? 'row' : 'column' }}><Btn label={signedIn ? 'See my profile' : 'Create my royal profile'} onPress={toProfile} /><Btn kind="secondary" label={hasInfo(s) ? 'See my gap report' : 'Start with my goals'} onPress={() => router.replace(hasInfo(s) ? '/routine/gaps' : '/routine/goals')} /></View>}>
        <Image source={crown} style={{ width: 72, height: 72, transform: [{ rotate: '-12deg' }] }} resizeMode="contain" />
        <Heading title={a.founder ? `Long live Founding Royal #${a.spot}` : 'You’ve been crowned'} sub={a.founder ? 'Lifetime access to the product database is yours, even if you cancel the yearly plan.' : a.test ? 'Test mode: payments aren’t switched on yet, so this device is unlocked.' : 'Your plan is active. Manage it any time in Settings.'} />
      </Shell>
    );
  }
  if (waiting) {
    return <Shell active="plans"><View style={{ gap: 12, alignItems: 'flex-start' }}><ActivityIndicator color={C.gray} /><Heading title="Finishing up" sub="Confirming your payment with Stripe. This takes a few seconds." /></View></Shell>;
  }

  const plan = (k: RoutinePlan) => {
    const p = ROUTINE_PLANS[k];
    const on = pick === k;
    const founder = k === 'routine_founder';
    return (
      <Pressable key={k} {...fill(on ? 'pearl-on' : 'pearl')} onPress={() => { haptic('select'); setPick(k); }} accessibilityRole="radio" accessibilityState={{ checked: on }}
        style={({ hovered }: { hovered?: boolean }) => ({ flex: wide ? 1 : undefined, borderRadius: 24, padding: 20, gap: 10, borderWidth: 2, backgroundColor: on ? '#FBEDEB' : '#fff', borderColor: on ? '#A8576A' : hovered ? '#7E3A4C' : 'transparent' })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ flex: 1, fontFamily: F.semibold, fontSize: 16, color: C.ink }}>{founder ? (founding ? 'Founding Royal · yearly' : 'Royal · yearly') : 'Royal · monthly'}</Text>
          {founder && founding ? <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: GOLD }}><Text style={{ fontFamily: F.semibold, fontSize: 11, letterSpacing: 0.6, color: '#fff' }}>♛ BEST VALUE</Text></View> : null}
          <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: on ? '#A8576A' : '#D5D8DE', backgroundColor: on ? '#A8576A' : '#fff', alignItems: 'center', justifyContent: 'center' }}>
            {on ? <Text style={{ color: '#fff', fontSize: 13, fontFamily: F.semibold, lineHeight: 15 }}>{'✓'}</Text> : null}
          </View>
        </View>
        <Text style={{ fontFamily: F.display, fontSize: 40, lineHeight: 44, color: C.ink }}>{p.price}<Text style={{ fontFamily: F.medium, fontSize: 15, color: '#8E9298' }}>{` / ${p.per}`}</Text></Text>
        {(founder && !founding ? ['About $2 a month'] : p.perks).map(x => <Text key={x} style={[st.sub, { fontSize: 14 }]}>{`• ${x}`}</Text>)}
      </Pressable>
    );
  };

  const p = ROUTINE_PLANS[pick];
  return (
    <Shell active="plans"
      footer={<View style={{ width: wide ? undefined : '100%', gap: 8 }}>
        <Btn label={busy ? 'Opening checkout…' : `Continue with ${p.price} a ${p.per}`} onPress={busy ? undefined : buy} />
        <Text style={[st.meta, { textAlign: 'center', fontSize: 12 }]}>{pick === 'routine_founder' && founding ? 'Renews yearly. Your crown and database access stay for life, even if you cancel.' : 'Renews automatically. Cancel anytime.'}</Text>
      </View>}>
      <Image source={crown} style={{ width: 64, height: 64, transform: [{ rotate: '-12deg' }] }} resizeMode="contain" />
      <Heading title="Claim your crown" sub={gapCount ? `Unlock your ${gapCount} gap${gapCount === 1 ? '' : 's'} and the products that fill them.` : 'Unlock your gap report and the products that fill it.'} />
      {f ? (
        <View {...fill('pearl')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20, backgroundColor: '#fff', maxWidth: 600 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>{founding ? `Founding Royals: ${f.left.toLocaleString()} of ${FOUNDING_CAP.toLocaleString()} crowns left` : 'Every founding crown has been claimed'}</Text>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: '#ECEEF2', overflow: 'hidden' }}><View style={{ height: 6, width: `${Math.max(2, (f.taken / FOUNDING_CAP) * 100)}%`, backgroundColor: GOLD }} /></View>
            <Text style={st.meta}>{founding ? 'The first 1,000 yearly members are crowned for life: lifetime access to the product database.' : 'Yearly still includes everything, without the lifetime access.'}</Text>
          </View>
        </View>
      ) : null}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 12, maxWidth: 600 }}>{plan('routine_founder')}{plan('routine_monthly')}</View>
      <View style={{ gap: 10, maxWidth: 600 }}>
        <Label>Your royal privileges</Label>
        {PERKS.map(x => <Text key={x} style={[st.sub, { fontSize: 15 }]}>{`♛  ${x}`}</Text>)}
      </View>
      {err ? <Text style={{ fontFamily: F.semibold, fontSize: 14, color: '#A8576A' }}>{err}</Text> : null}
      {status === 'cancel' ? <Text style={st.meta}>No charge made. Pick a plan whenever you are ready.</Text> : null}
    </Shell>
  );
}
