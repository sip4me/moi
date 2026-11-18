import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { LegalLine } from '../../components/Legal';
import { BrandLine, Button, Screen } from '../../components/ui';
import { goNext } from '../../data/flow';
import { PLANS, type PlanKey, TRIAL_DAYS, startCheckout, trialEndLabel } from '../../lib/billing';
import { useStore } from '../../state/store';
import { C, F, surface } from '../../theme';

/** Plan option: a selectable card with a radio, the price, and an optional badge. */
function PlanCard({ plan, on, onPress, badge }: { plan: PlanKey; on: boolean; onPress: () => void; badge?: string }) {
  const p = PLANS[plan];
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${p.label}, ${p.price} a ${p.per}`}
      style={({ pressed }) => [surface, { borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: on ? 2 : 1, borderColor: on ? C.ink : C.line, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: on ? C.ink : '#CFCFD4', alignItems: 'center', justifyContent: 'center' }}>
        {on ? <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: C.ink }} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>{p.label}</Text>
        {p.note ? <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.gray2, marginTop: 2 }}>{p.note}</Text> : null}
      </View>
      <Text style={{ fontFamily: F.bold, fontSize: 17, color: C.ink }}>{p.price}<Text style={{ fontFamily: F.regular, fontSize: 13, color: C.gray }}> / {p.per}</Text></Text>
      {badge ? (
        <View style={{ position: 'absolute', top: -10, right: 14, backgroundColor: C.ink, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 11, color: '#fff', letterSpacing: 0.4 }}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/**
 * The paywall: 3 days free, then $29.99 a year (default) or $9.99 a month. Billing runs through Stripe
 * Checkout (Apple Pay first where available). "Not now" goes to the one-time $19.99 offer.
 */
export default function Paywall() {
  const { plan, answers, setSubscribed } = useStore();
  const fromHome = useLocalSearchParams<{ from?: string }>().from === 'home';
  const [pick, setPick] = useState<PlanKey>('moi_yearly');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const leave = () => (fromHome ? (router.canGoBack() ? router.back() : router.replace('/(tabs)')) : goNext('paywall', answers));
  const p = PLANS[pick];
  const ends = trialEndLabel();

  async function start() {
    setBusy(true); setErr('');
    try {
      const live = await startCheckout(pick);
      // Test build (Stripe not set up yet): unlock on the phone so the app can be tried end to end.
      if (!live) { setSubscribed(true); setBusy(false); leave(); }
    } catch {
      setBusy(false); setErr('Checkout couldn’t open. Check your connection and try again.');
    }
  }

  return (
    <Screen footer={<>
      <Text style={{ textAlign: 'center', fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: C.gray2, marginBottom: 10 }}>
        {TRIAL_DAYS} days free, then {p.price} a {p.per}. Cancel before {ends} and you won’t be charged.
      </Text>
      <Button label={busy ? 'Opening checkout…' : `Start my ${TRIAL_DAYS}-day free trial`} onPress={start} disabled={busy} />
      {busy ? <ActivityIndicator style={{ marginTop: 8 }} color={C.gray} /> : null}
      {err ? <Text style={{ textAlign: 'center', fontFamily: F.regular, fontSize: 13, color: '#B4372B', marginTop: 8 }}>{err}</Text> : null}
      <Pressable onPress={() => router.push({ pathname: '/onboarding/offer', params: fromHome ? { from: 'home' } : {} })} hitSlop={10} style={{ alignSelf: 'center', paddingVertical: 8 }}>
        {({ pressed }) => <Text style={{ fontFamily: F.medium, fontSize: 14, color: pressed ? C.gray : C.gray2 }}>Not now</Text>}
      </Pressable>
      <LegalLine lead="Renews automatically until you cancel. See our" style={{ marginTop: 2 }} />
    </>}>
      <View style={{ flex: 1, justifyContent: 'center', gap: 18 }}>
        <BrandLine parts={['Unlock', 'logo', 'to reach your hair goals faster.']} size={27} center />
        {/* What the trial looks like, so nobody is surprised by the charge. */}
        <View style={[surface, { borderRadius: 22, padding: 18, gap: 14 }]}>
          {[
            ['Today', 'Full access: AI photo scans, your adaptive routine and product checks.'],
            [ends, `Your ${p.label.toLowerCase()} plan starts at ${p.price}. Cancel anytime before then in Settings.`],
          ].map(([when, what], i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 10, alignItems: 'center', paddingTop: 5 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: i ? '#C9A24A' : C.ink }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>{when}</Text>
                <Text style={{ fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.gray2, marginTop: 2 }}>{what}</Text>
              </View>
            </View>
          ))}
          {plan?.target ? <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.gray }}>Your goal: {plan.target}</Text> : null}
        </View>
        <View style={{ gap: 14, marginTop: 4 }}>
          <PlanCard plan="moi_yearly" on={pick === 'moi_yearly'} onPress={() => setPick('moi_yearly')} badge="BEST VALUE" />
          <PlanCard plan="moi_monthly" on={pick === 'moi_monthly'} onPress={() => setPick('moi_monthly')} />
        </View>
      </View>
    </Screen>
  );
}
