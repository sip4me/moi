import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { Btn, Bubble, Heading, Shell, SYS, useWide } from '../../components/routine/Kit';
import { Logo } from '../../components/ui';
import { haptic } from '../../lib/haptics';
import { checkoutRoutine, FOUNDING_CAP, refreshAccess, ROUTINE_PLANS, useAccess, useFounding, type RoutinePlan } from '../../lib/routine/access';
import { analyze, picksFor } from '../../lib/routine/gaps';
import { hasInfo, useCatalog, useRoutine } from '../../lib/routine/model';
import { fill } from '../../lib/routine/shine';
import { useStore } from '../../state/store';
import { C, F } from '../../theme';

const crown = require('../../../assets/crown-pink.png');

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
      <Shell glass active="plans" footer={<View style={{ gap: 8, width: wide ? undefined : '100%', flexDirection: wide ? 'row' : 'column' }}><Btn label={signedIn ? 'See my profile' : 'Create my royal profile'} onPress={toProfile} /><Btn kind="secondary" label={hasInfo(s) ? 'See my gap report' : 'Start with my goals'} onPress={() => router.replace(hasInfo(s) ? '/routine/gaps' : '/routine/about')} /></View>}>
        <Image source={crown} style={{ width: 72, height: 72, transform: [{ rotate: '-12deg' }] }} resizeMode="contain" />
        <Heading title={a.founder ? `Long live Founding Royal #${a.spot}` : 'You’ve been crowned'} sub={a.founder ? 'Lifetime database access is yours, even if you cancel.' : a.test ? 'Test mode: payments aren’t switched on yet, so this device is unlocked.' : 'Your plan is active.'} />
      </Shell>
    );
  }
  if (waiting) {
    return <Shell glass active="plans"><View style={{ gap: 12, alignItems: 'flex-start' }}><ActivityIndicator color={C.gray} /><Heading title="Finishing up" sub="Confirming your payment." /></View></Shell>;
  }

  // Figma "34 · Paywall": one headline, a phone showing their own plan, one button, one price line.
  const p = ROUTINE_PLANS[pick];
  const yearly = pick === 'routine_founder';
  const gaps = hasInfo(s) ? analyze(s, cat).gaps : [];
  const fit = hasInfo(s) ? analyze(s, cat).score : 0;
  const fixed = gaps.map(g => picksFor(g, s, cat, 1)[0]?.item).filter((i): i is NonNullable<typeof i> => !!i);
  const after = hasInfo(s) ? analyze(s, cat, fixed).score : 0;
  const H = { fontFamily: SYS ?? F.bold, fontWeight: '700' as const, fontSize: wide ? 34 : 28, lineHeight: wide ? 40 : 34, letterSpacing: -0.8, color: '#111114', textAlign: 'center' as const };
  const G = { dataSet: { grad: 'title' } } as any; // the steel-to-ink title gradient used on every page
  const small = { fontFamily: SYS ?? F.medium, fontSize: 14, color: '#6C6A80', textAlign: 'center' as const };
  return (
    <Shell active="plans"
      footer={<View style={{ width: wide ? 420 : '100%', gap: 10, alignItems: 'center' }}>
        <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 16, color: '#111114' }}>{`✓  ${yearly && founding ? 'Lifetime database access' : 'Cancel anytime'}`}</Text>
        <View style={{ width: '100%' }}><Btn label={busy ? 'Opening checkout…' : 'Continue'} onPress={busy ? undefined : buy} /></View>
      </View>}>
      <View style={{ alignItems: 'center', gap: 18, maxWidth: 520, alignSelf: 'center', width: '100%' }}>
        <Pressable onPress={() => router.push({ pathname: '/sign-in', params: { mode: 'signin', next: '/routine/plans' } })} accessibilityRole="button" style={{ alignSelf: 'flex-end' }} hitSlop={8}>
          <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 14, color: '#8E9298' }}>Restore</Text>
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}><Text {...G} style={H}>Unlock</Text><Logo size={wide ? 38 : 32} color="#111114" /><Text {...G} style={H}>to reach</Text></View>
          <Text {...G} style={H}>your beauty goals faster.</Text>
        </View>
        {/* Their own plan, shown on a phone. */}
        <View style={{ width: 236, borderRadius: 38, borderWidth: 9, borderColor: '#111114', backgroundColor: '#fff', paddingTop: 34, paddingBottom: 14, paddingHorizontal: 12, gap: 10, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } }}>
          <View style={{ position: 'absolute', top: 8, alignSelf: 'center', width: 70, height: 18, borderRadius: 9, backgroundColor: '#111114' }} />
          <View style={{ alignItems: 'center', gap: 6 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#111114', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text></View>
            <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '700', fontSize: 14, lineHeight: 18, color: '#111114', textAlign: 'center' }}>Your routine plan is ready!</Text>
            {fit ? <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#F1F1F4' }}><Text style={{ fontFamily: SYS ?? F.medium, fontSize: 11, color: '#111114' }}>{after > fit ? `Fit ${fit} → ${after}` : `Fit ${fit}`}</Text></View> : null}
          </View>
          <View style={{ backgroundColor: '#F4F4F7', borderRadius: 14, padding: 8, gap: 6 }}>
            <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 11, color: '#111114' }}>{gaps.length ? `${gaps.length} gap${gaps.length === 1 ? '' : 's'} to fix` : 'Your routine'}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {(gaps.length ? gaps.slice(0, 4) : []).map(g => (
                <View key={g.id} style={{ width: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 6, padding: 6, borderRadius: 10, backgroundColor: '#fff' }}>
                  <Bubble category={g.fills[0]} size={22} />
                  <Text numberOfLines={1} style={{ flex: 1, fontFamily: SYS ?? F.medium, fontSize: 10, color: '#111114' }}>{g.title}</Text>
                </View>
              ))}
            </View>
            {fit ? <View style={{ gap: 4, padding: 6, borderRadius: 10, backgroundColor: '#fff' }}>
              <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 10, color: '#111114' }}>{`Routine fit  ${after}/100`}</Text>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: '#ECEEF2' }}><View style={{ height: 4, borderRadius: 2, width: `${after}%`, backgroundColor: '#3FA45B' }} /></View>
            </View> : null}
          </View>
          <View style={{ height: 30, borderRadius: 15, backgroundColor: '#111114', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 11, color: '#fff' }}>Let’s get started!</Text></View>
        </View>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text style={small}>{yearly ? `Just ${p.price}/year (about $2/mo)` : `Just ${p.price}/month`}</Text>
          <Pressable onPress={() => { haptic('select'); setPick(yearly ? 'routine_monthly' : 'routine_founder'); }} accessibilityRole="button" hitSlop={8}>
            <Text style={[small, { fontSize: 13, textDecorationLine: 'underline' }]}>{yearly ? `Prefer monthly? ${ROUTINE_PLANS.routine_monthly.price}/month` : `Switch to yearly · ${ROUTINE_PLANS.routine_founder.price}/year`}</Text>
          </Pressable>
        </View>
        {f && founding && yearly ? <Text style={small}>{`${(f.left ?? FOUNDING_CAP).toLocaleString()} of ${FOUNDING_CAP.toLocaleString()} founding spots left`}</Text> : null}
        {err ? <Text style={{ fontFamily: F.semibold, fontSize: 14, color: '#A8576A' }}>{err}</Text> : null}
        {status === 'cancel' ? <Text style={small}>No charge made.</Text> : null}
      </View>
    </Shell>
  );
}
