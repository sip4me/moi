import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, Linking, Pressable, Text, View } from 'react-native';
import { Confetti } from '../../components/routine/Confetti';
import { celebrate } from '../../components/routine/Celebrate';
import { openPortal } from '../../lib/billing';
import { Btn, Bubble, Heading, Shell, SYS, useWide } from '../../components/routine/Kit';
import { Logo } from '../../components/ui';
import { haptic } from '../../lib/haptics';
import { checkoutRoutine, countdown, FOUNDING_CAP, refreshAccess, ROUTINE_PLANS, useAccess, useFounding, useOffer, type RoutinePlan } from '../../lib/routine/access';
import { analyze, gapArea, picksFor } from '../../lib/routine/gaps';
import { shouldLine } from '../../lib/routine/looks';
import { hasInfo, useCatalog, useRoutine } from '../../lib/routine/model';
import { fill } from '../../lib/routine/shine';
import { useStore } from '../../state/store';
import { LINKS } from '../../config';
import { C, F } from '../../theme';

const crown = require('../../../assets/crown-pink.png');

/** Moi Routine paywall: the full product database and picks. Yearly $24 (first 1,000 keep database access for life) or monthly $4. */
export default function Plans() {
  const { status, plan: lastPlan } = useLocalSearchParams<{ status?: string; plan?: string }>();
  const s = useRoutine();
  const cat = useCatalog();
  const wide = useWide();
  const a = useAccess();
  const f = useFounding();
  const founding = f?.open ?? true;
  const [pick, setPick] = useState<RoutinePlan>('routine_founder');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [justPaid, setJustPaid] = useState(false);
  const offer = useOffer();
  // The crown pops in on the celebration.
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => { if (a.ok) Animated.spring(pop, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }).start(); }, [a.ok, pop]);
  useEffect(() => { if (a.ok && (status === 'success' || justPaid)) celebrate('Welcome to Royal', true); }, [a.ok, status, justPaid]);
  const { account } = useStore();
  const signedIn = !!account && !account.anonymous;
  // After payment: make the account profile (the tracker's sign-up screen attaches an email or phone to this account).
  const toProfile = () => (signedIn ? router.replace('/routine/profile') : router.replace({ pathname: '/sign-in', params: { mode: 'signup', next: '/routine/profile' } }));

  // Back from Stripe: wait for the webhook to mark the subscription, then go to the report.
  const [waiting, setWaiting] = useState(status === 'success');
  const [round, setRound] = useState(0); // "Check again" starts another round of polling
  useEffect(() => {
    if (status !== 'success') return;
    let alive = true, tries = 0;
    setWaiting(true);
    const poll = async () => { await refreshAccess(); if (!alive) return; if (++tries < 15) setTimeout(poll, 1500); else setWaiting(false); };
    poll();
    return () => { alive = false; };
  }, [status, round]);
  useEffect(() => { if (a.ok && waiting) { setWaiting(false); haptic('success'); } }, [a.ok, waiting]);

  // Payment didn't go through: back from Stripe without paying, or checkout couldn't open.
  const [failed, setFailed] = useState<'' | 'cancel' | 'error'>(status === 'cancel' ? 'cancel' : '');
  const buy = async (plan?: RoutinePlan) => {
    setBusy(true); setErr(''); setFailed('');
    try {
      const r = await checkoutRoutine(plan ?? (offer.open ? pick : 'routine_standard'));
      if (r === 'test') { haptic('success'); setJustPaid(true); }
    } catch { setFailed('error'); haptic('tap'); }
    setBusy(false);
  };
  const help = () => Linking.openURL(LINKS.contact);
  const [skipDecline, setSkipDecline] = useState(false);

  const H = { fontFamily: SYS ?? F.bold, fontWeight: '700' as const, fontSize: wide ? 28 : 23, lineHeight: wide ? 33 : 28, letterSpacing: -0.6, color: '#111114', textAlign: 'center' as const };
  const G = { dataSet: { grad: 'title' } } as any; // the steel-to-ink title gradient used on every page
  const small = { fontFamily: SYS ?? F.medium, fontSize: 13, color: '#6C6A80', textAlign: 'center' as const };
  if (a.ok) {
    // Just paid (back from Stripe, or a test unlock): the celebration. Later visits: a calm "your plan" page.
    const fresh = status === 'success' || justPaid;
    const unlocked = ['Every gap and its fix', 'Picks matched to you', 'Your routines on any device'];
    return (
      <Shell active="plans"
        footer={<View style={{ width: wide ? 420 : '100%', gap: 12, alignItems: 'center' }}>
          <View style={{ width: '100%' }}><Btn label={hasInfo(s) ? 'See my picks' : 'Start with my goals'} onPress={() => router.replace(hasInfo(s) ? '/routine/gaps' : '/routine/about')} /></View>
          <Pressable onPress={toProfile} accessibilityRole="button" hitSlop={8}>
            <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 15, color: '#111114' }}>{signedIn ? 'My profile' : 'Save my account'}</Text>
          </Pressable>
        </View>}>
        {fresh ? <Confetti /> : null}
        <View style={{ alignItems: 'center', gap: 16, maxWidth: 460, alignSelf: 'center', width: '100%', paddingTop: 12 }}>
          <Animated.Image source={crown} resizeMode="contain" style={{ width: 96, height: 96, transform: [{ rotate: '-14deg' }, { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }], opacity: pop }} />
          <Text {...G} style={[H, { fontSize: 26, lineHeight: 31 }]}>{a.founder ? `Founding Royal #${a.spot}` : fresh ? 'You’re Royal!' : 'Your plan is active'}</Text>
          <Text style={[small, { fontSize: 14, lineHeight: 20, color: '#4A4858' }]}>{a.test ? 'Test mode: payments aren’t on yet, so this device is unlocked.' : a.founder ? 'Payment done. Database access is yours for life, even if you cancel.' : 'Payment done. Everything is unlocked.'}</Text>
          <View style={{ alignSelf: 'stretch', gap: 10, padding: 18, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 0.5, borderColor: 'rgba(20,20,40,0.10)' }}>
            {unlocked.map(x => (
              <View key={x} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#111114', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text></View>
                <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 14, color: '#111114' }}>{x}</Text>
              </View>
            ))}
          </View>
          {!fresh && !a.test ? (
            <Pressable onPress={async () => { const r = await openPortal(); if (r !== 'opened') setErr('Billing isn’t available yet.'); }} accessibilityRole="button" hitSlop={8}>
              <Text style={[small, { textDecorationLine: 'underline' }]}>Manage billing</Text>
            </Pressable>
          ) : null}
          {err ? <Text style={small}>{err}</Text> : null}
        </View>
      </Shell>
    );
  }
  // Result screens: confirming, still processing, didn't go through. Same layout as the celebration.
  const result = (o: { dim?: boolean; spin?: boolean; title: string; sub: string; main?: { label: string; on: () => void }; alt?: { label: string; on: () => void } }) => (
    <Shell active="plans" glass
      footer={o.main ? <View style={{ width: wide ? 420 : '100%', gap: 12, alignItems: 'center' }}>
        <View style={{ width: '100%' }}><Btn label={busy ? 'Opening checkout…' : o.main.label} onPress={busy ? undefined : o.main.on} /></View>
        {o.alt ? <Pressable onPress={o.alt.on} accessibilityRole="button" hitSlop={8}><Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 15, color: '#111114' }}>{o.alt.label}</Text></Pressable> : null}
      </View> : undefined}>
      <View style={{ alignItems: 'center', gap: 14, maxWidth: 420, alignSelf: 'center', width: '100%', marginTop: 28, paddingVertical: 28, paddingHorizontal: 22, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.38)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)', ...({ backdropFilter: 'blur(22px) saturate(140%)', WebkitBackdropFilter: 'blur(22px) saturate(140%)' } as any) }}>
        <Image source={crown} resizeMode="contain" style={{ width: 84, height: 84, transform: [{ rotate: '-14deg' }], opacity: o.dim ? 0.35 : 1 }} />
        {o.spin ? <ActivityIndicator color={C.gray} /> : null}
        <Text {...G} style={[H, { fontSize: 23, lineHeight: 28 }]}>{o.title}</Text>
        <Text style={[small, { fontSize: 14, lineHeight: 20, color: '#4A4858' }]}>{o.sub}</Text>
        {o.main && o.alt?.on !== help ? <Pressable onPress={help} accessibilityRole="link" hitSlop={8}><Text style={[small, { textDecorationLine: 'underline' }]}>Need help? hello@usemoi.com</Text></Pressable> : null}
      </View>
    </Shell>
  );
  if (waiting) return result({ spin: true, title: 'Confirming your payment', sub: 'This takes a few seconds. Keep this page open.' });
  if (status === 'success') {
    // Back from Stripe as paid, but the confirmation hasn't arrived yet.
    return result({ title: 'Your payment is processing', sub: 'Stripe is still confirming it. You won’t be charged twice.', main: { label: 'Check again', on: () => setRound(n => n + 1) }, alt: { label: 'Email us', on: help } });
  }
  if ((a.declined || status === 'declined') && !failed && !skipDecline) {
    // A charge was declined: usually not enough balance, or an expired card.
    return result({
      dim: true,
      title: 'Your card was declined',
      sub: 'Your bank turned down the payment. This usually means there wasn’t enough balance or the card expired. Update your card or use another one to keep Royal.',
      main: { label: 'Update my card', on: async () => { try { const r = await openPortal(); if (r !== 'opened') buy(); } catch { setFailed('error'); } } },
      alt: { label: 'See other plans', on: () => { setSkipDecline(true); router.setParams({ status: undefined as any }); } },
    });
  }
  if (failed) {
    const again = ROUTINE_PLANS[lastPlan as RoutinePlan] ? (lastPlan as RoutinePlan) : undefined;
    return result({
      dim: true,
      title: 'Payment didn’t go through',
      sub: failed === 'error' ? 'Checkout couldn’t open. Check your connection and try again. No charge was made.' : 'No charge was made. If your card was declined, try another card. Your routine and picks are saved.',
      main: { label: 'Try again', on: () => buy(again) },
      alt: { label: 'Back to plans', on: () => { setFailed(''); router.setParams({ status: undefined as any }); } },
    });
  }

  // Figma "34 · Paywall": one headline, a phone showing their own plan, one button, one price line.
  // Launch offer: 3 days from their first look at this page. After it ends, the plan is $10 a month.
  const offerOn = offer.open;
  const plan: RoutinePlan = offerOn ? pick : 'routine_standard';
  const p = ROUTINE_PLANS[plan];
  const yearly = plan === 'routine_founder';
  const off = yearly ? 80 : 60; // $24/yr vs $120/yr, $4/mo vs $10/mo
  // Same gaps the report shows: only ones with something to buy (clashes carry advice).
  const gaps = hasInfo(s) ? analyze(s, cat).gaps.filter(g => g.kind === 'clash' || picksFor(g, s, cat, 1).length > 0) : [];
  const fit = hasInfo(s) ? analyze(s, cat).score : 0;
  const fixed = gaps.map(g => picksFor(g, s, cat, 1)[0]?.item).filter((i): i is NonNullable<typeof i> => !!i);
  const after = hasInfo(s) ? analyze(s, cat, fixed).score : 0;
  const should = shouldLine(s, [...gaps].sort((x, y) => y.weight - x.weight), gapArea);
  return (
    <Shell active="plans"
      footer={<View style={{ width: wide ? 420 : '100%', gap: 10, alignItems: 'center' }}>
        <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 16, color: '#111114' }}>{`✓  ${!offerOn ? 'Unlimited searches · Cancel anytime' : yearly && founding ? 'Lifetime database access' : 'Cancel anytime'}`}</Text>
        <View style={{ width: '100%' }}><Btn label={busy ? 'Opening checkout…' : 'Continue'} onPress={busy ? undefined : () => buy()} /></View>
      </View>}>
      <View style={{ alignItems: 'center', gap: 18, maxWidth: 520, alignSelf: 'center', width: '100%' }}>
        <Pressable onPress={() => router.push({ pathname: '/sign-in', params: { mode: 'signin', next: '/routine/plans' } })} accessibilityRole="button" style={{ alignSelf: 'flex-end' }} hitSlop={8}>
          <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 14, color: '#8E9298' }}>Restore</Text>
        </Pressable>
        {offerOn && !offer.loading ? (
          <View style={{ alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 18, backgroundColor: '#111114' }}>
            <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F0A6BE' }}><Text style={{ fontFamily: SYS ?? F.bold, fontWeight: '800', fontSize: 14, color: '#111114' }}>{`${off}% OFF`}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '700', fontSize: 14, color: '#fff' }}>{`Ends in ${countdown(offer.left)}`}</Text>
              <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Then $10/month with unlimited searches.</Text>
            </View>
          </View>
        ) : null}
        {/* Their goal first, like Cal AI's "You should lose…". */}
        {should ? (
          <View style={{ alignSelf: 'stretch', alignItems: 'center', gap: 6, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 0.5, borderColor: 'rgba(20,20,40,0.10)' }}>
            <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 13, letterSpacing: 0.6, color: '#6C6A80', textTransform: 'uppercase' }}>You should:</Text>
            <Text style={{ fontFamily: SYS ?? F.bold, fontWeight: '700', fontSize: 16, lineHeight: 21, color: '#111114', textAlign: 'center' }}>{should}</Text>
          </View>
        ) : null}
        <View style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}><Text {...G} style={H}>Unlock</Text><Logo size={wide ? 38 : 32} color="#111114" /><Text {...G} style={H}>to get</Text></View>
          <Text {...G} style={H}>there faster.</Text>
        </View>
        {/* Their own plan, shown on a phone. */}
        <View style={{ width: 236, borderRadius: 38, borderWidth: 9, borderColor: '#111114', backgroundColor: '#fff', paddingTop: 34, paddingBottom: 14, paddingHorizontal: 12, gap: 10, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } }}>
          <View style={{ position: 'absolute', top: 8, alignSelf: 'center', width: 70, height: 18, borderRadius: 9, backgroundColor: '#111114' }} />
          <View style={{ alignItems: 'center', gap: 6 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#111114', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text></View>
            <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '700', fontSize: 14, lineHeight: 18, color: '#111114', textAlign: 'center' }}>Your routine plan is ready!</Text>
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
          {offerOn ? (
            <>
              <Text style={[small, { color: '#111114' }]}>
                <Text style={{ textDecorationLine: 'line-through', color: '#8E9298' }}>{yearly ? '$120/year' : '$10/month'}</Text>
                {yearly ? `  Just ${p.price}/year ($2/mo)` : `  Just ${p.price}/month`}
              </Text>
              <Pressable onPress={() => { haptic('select'); setPick(yearly ? 'routine_monthly' : 'routine_founder'); }} accessibilityRole="button" hitSlop={8}>
                <Text style={[small, { fontSize: 13, textDecorationLine: 'underline' }]}>{yearly ? `Prefer monthly? ${ROUTINE_PLANS.routine_monthly.price}/month` : `Switch to yearly · ${ROUTINE_PLANS.routine_founder.price}/year`}</Text>
              </Pressable>
            </>
          ) : <Text style={small}>{`${p.price}/month · Unlimited searches`}</Text>}
        </View>
        {f && founding && yearly && offerOn ? <Text style={small}>{`${(f.left ?? FOUNDING_CAP).toLocaleString()} of ${FOUNDING_CAP.toLocaleString()} founding spots left`}</Text> : null}
        {err ? <Text style={{ fontFamily: F.semibold, fontSize: 14, color: '#A8576A' }}>{err}</Text> : null}
      </View>
    </Shell>
  );
}
