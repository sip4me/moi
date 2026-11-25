import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Modal, Platform, Pressable, Share, Switch, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { BrandText, Button, Screen } from '../components/ui';
import { LINKS, openLink } from '../config';
import { HEALTH_FULL, HEALTH_SHORT } from '../data/disclaimer';
import { deleteAccount, signOut } from '../lib/auth';
import { enablePush } from '../lib/push';
import { useStore } from '../state/store';
import { isActive, loadSubscription, openPortal } from '../lib/billing';
import { C, F, surface } from '../theme';

// Matches the Figma "Settings" frame (147:571): grouped cards, caps section labels, a danger zone at the end.

const Chevron = () => (
  <Svg width={8} height={13} viewBox="0 0 8 14"><Path d="M1.5 1.5 6.5 7l-5 5.5" stroke="#9A9A9A" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
);

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 32 }}>
      <Text style={{ fontFamily: F.bold, fontSize: 20, letterSpacing: -0.3, color: C.ink, marginBottom: 12 }}>{label.charAt(0) + label.slice(1).toLowerCase()}</Text>
      <View style={[surface, { paddingHorizontal: 18, paddingVertical: 4, overflow: 'hidden' }]}>{children}</View>
    </View>
  );
}

type RowProps = { title: string; sub?: string; value?: string; first?: boolean; onPress?: () => void; right?: React.ReactNode; muted?: boolean };
function Row({ title, sub, value, first, onPress, right, muted }: RowProps) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: sub ? 62 : 50, paddingVertical: 8, marginHorizontal: -18, paddingHorizontal: 18, borderTopWidth: first ? 0 : 1, borderTopColor: '#EFEFF1', backgroundColor: pressed ? '#F4F4F5' : 'transparent' })}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.regular, fontSize: 16, color: muted ? C.gray : C.ink }}>{title}</Text>
        {sub ? <View style={{ marginTop: 2 }}><BrandText text={sub} size={13} weight="regular" color={C.gray} /></View> : null}
      </View>
      {value ? <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.ink }}>{value}</Text> : null}
      {right ?? (onPress ? <Chevron /> : null)}
    </Pressable>
  );
}

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <Switch value={value} onValueChange={onChange} trackColor={{ true: C.ink, false: '#E3E3E6' }} thumbColor="#fff" {...({ activeThumbColor: '#fff' } as object)} />
);

/** Bottom sheet used for every confirmation on this screen. */
function Sheet({ open, title, body, confirm, danger, busy, error, onConfirm, onClose }: {
  open: boolean; title: string; body: string; confirm: string; danger?: boolean; busy?: boolean; error?: string | null; onConfirm?: () => void; onClose: () => void;
}) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 430, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 32, gap: 12 }}>
          <View style={{ alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: '#E3E3E6', marginBottom: 6 }} />
          <Text style={{ fontFamily: F.bold, fontSize: 22, color: C.ink }}>{title}</Text>
          <BrandText text={body} size={15} weight="regular" color={C.gray2} lineHeight={1.47} />
          {error ? <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.red }}>{error}</Text> : null}
          <View style={{ gap: 4, marginTop: 8 }}>
            {onConfirm ? <Button label={confirm} loading={busy} onPress={onConfirm} style={danger ? { backgroundColor: C.red } : undefined} /> : null}
            <Button label={onConfirm ? 'Cancel' : confirm} variant={onConfirm ? 'ghost' : 'primary'} onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type SheetKind = 'affiliate' | 'delete' | 'subscription' | 'signout' | 'soon' | 'health' | null;

export default function Settings() {
  const { answers, name, reminders, setReminder, account, reset } = useStore();
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const close = () => { setSheet(null); setError(null); };
  const { setSubscribed } = useStore();
  const [subMsg, setSubMsg] = useState({ title: '', body: '' });
  const tell = (title: string, body: string) => { setSubMsg({ title, body }); setSheet('subscription'); };
  // Stripe's portal handles plan changes, card updates and cancelling.
  const manage = async () => {
    const r = await openPortal().catch(() => 'error' as const);
    if (r === 'none') tell('No subscription yet', 'Start your 3-day free trial from any locked card, and you can manage it here afterwards.');
    if (r === 'test') tell('No active subscription', 'This is a test build, so payments aren’t switched on and nothing is being charged.');
    if (r === 'error') tell('Couldn’t open', 'Check your connection and try again.');
  };
  // Re-reads the subscription Stripe has on file for this account.
  const restore = async () => {
    const sub = await loadSubscription().catch(() => null);
    if (isActive(sub)) { setSubscribed(true); tell('Subscription restored', 'Everything in Moi is unlocked on this device.'); }
    else tell('Nothing to restore', 'We couldn’t find an active subscription on this account. Sign in with the email you subscribed with, then try again.');
  };
  const [pushNote, setPushNote] = useState('Max 2 a day, never 10 PM–7 AM');
  const togglePush = async (v: boolean) => {
    if (!v) { setReminder('all', false); return; }
    const r = await enablePush().catch(() => 'unsupported' as const);
    setReminder('all', r === 'on');
    setPushNote(r === 'on' ? 'On · max 2 a day, never 10 PM–7 AM' : r === 'needs-home-screen' ? 'Add Moi to your home screen first, then turn this on there' : r === 'denied' ? 'Blocked in your browser settings' : 'Not supported in this browser');
  };
  const on = (id: string) => reminders[id] ?? true;

  const signedIn = account && !account.anonymous;
  const who = account?.email ?? account?.phone ?? '';
  const version = Constants.expoConfig?.version ?? '4.42.0';
  const hairProfile = [answers.texture, answers.length, answers.porosity && `${answers.porosity} porosity`].filter(Boolean).join(' · ');

  const open = (url: string) => (url ? openLink(url) : setSheet('soon'));

  async function confirmDelete() {
    setBusy(true); setError(null);
    const err = await deleteAccount();
    setBusy(false);
    if (err) return setError(err);
    reset();
    close();
    router.replace('/onboarding');
  }

  async function confirmSignOut() {
    setBusy(true);
    await signOut();
    reset();
    setBusy(false);
    close();
    router.replace('/onboarding');
  }

  const shareDiagnostics = () => Share.share({
    message: [`Moi ${version}`, `Platform: ${Platform.OS} ${Platform.Version ?? ''}`, `Account: ${signedIn ? 'signed in' : 'guest'}`, `Plan rules: ${answers ? 'set' : 'none'}`].join('\n'),
  }).catch(() => {});

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 44 }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} hitSlop={10} accessibilityLabel="Back" style={{ width: 44, height: 44, justifyContent: 'center' }}>
          <Svg width={11} height={18} viewBox="0 0 10 16"><Path d="M8 2 2 8l6 6" stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', fontFamily: F.semibold, fontSize: 18, color: C.ink, marginRight: 44 }}>Settings</Text>
      </View>

      <Group label="PERSONALIZATION">
        <Row first title="Edit my details" sub={name} onPress={() => router.push('/details')} />
        <Row title="Hair profile" sub={hairProfile || 'Not set yet'} onPress={() => router.push('/onboarding/q/texture')} />
      </Group>

      <Group label="REMINDERS">
        <Row first title="Notifications on this device" sub={pushNote} right={<Toggle value={reminders.all ?? false} onChange={togglePush} />} />
        <Row title="Wash day reminder" sub="8:00 AM on wash days" right={<Toggle value={on('wash_interval')} onChange={v => setReminder('wash_interval', v)} />} />
        <Row title="Scan check-ins" sub="Every other Sunday" right={<Toggle value={on('scan')} onChange={v => setReminder('scan', v)} />} />
        <Row title="Product tips" sub="Ingredient alerts for your shelf" right={<Toggle value={reminders.tips ?? false} onChange={v => setReminder('tips', v)} />} />
        <Row title="All routine reminders" onPress={() => router.push('/reminders')} />
      </Group>

      <Group label="ACCOUNT">
        {signedIn ? (
          <>
            <Row first title={who} sub="Signed in" />
            <Row title="Sign out" onPress={() => setSheet('signout')} />
          </>
        ) : (
          <View style={{ paddingVertical: 10, gap: 6 }}>
            <Button label="Create an account" onPress={() => router.push({ pathname: '/sign-in', params: { mode: 'signup', next: '/settings' } })} />
            <Button label="I already have an account" variant="ghost" onPress={() => router.push({ pathname: '/sign-in', params: { mode: 'signin', next: '/' } })} />
          </View>
        )}
      </Group>

      <Group label="SUBSCRIPTION">
        <Row first title="Manage subscription" sub="Change plan, update card or cancel" onPress={manage} />
        <Row title="Restore purchases" sub="Already subscribed on another device?" onPress={restore} />
      </Group>

      <Group label="APP">
        <Row first title="Language" sub="Automatic · English" />
        <Row title="Units" sub="US · inches" />
        <Row title="Version" value={version} muted />
      </Group>

      <Group label="LEGAL">
        <Row first title="Terms of Use" onPress={() => open(LINKS.terms)} />
        <Row title="Privacy Policy" onPress={() => open(LINKS.privacy)} />
        <Row title="Health disclaimer" sub={HEALTH_SHORT} onPress={() => setSheet('health')} />
        <Row title="Affiliate disclosure" sub="Moi earns from qualifying Amazon purchases" onPress={() => setSheet('affiliate')} />
        <Row title="Contact us" onPress={() => open(LINKS.contact)} right={<CopyIcon />} />
      </Group>

      <Text style={{ fontFamily: F.bold, fontSize: 20, letterSpacing: -0.3, color: C.ink, marginTop: 32, marginBottom: 12 }}>Support</Text>
      <Pressable onPress={shareDiagnostics} style={({ pressed }) => ({ ...surface, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: pressed ? '#F4F4F5' : '#fff', borderRadius: 20, paddingHorizontal: 18, height: 56 })}>
        <MailIcon /><Text style={{ flex: 1, fontFamily: F.regular, fontSize: 16, color: C.ink }}>Share troubleshooting info</Text><Chevron />
      </Pressable>
      <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.gray, marginTop: 8 }}>Sends app and device details to help us fix problems. No photos or hair data.</Text>

      <Text style={{ fontFamily: F.semibold, fontSize: 12, letterSpacing: 1.4, color: C.gray, marginTop: 24, marginBottom: 8 }}>DANGER ZONE</Text>
      <Pressable onPress={() => setSheet('delete')} accessibilityRole="button"
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, borderRadius: 18, backgroundColor: pressed ? '#FBDADA' : '#FDECEC', borderWidth: 1, borderColor: '#F7CFCF' })}>
        <TrashIcon /><Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.red }}>Delete account</Text>
      </Pressable>
      <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.gray, textAlign: 'center', marginTop: 10, marginBottom: 16 }}>This permanently deletes your scans, routines, and progress.</Text>

      <Sheet open={sheet === 'delete'} danger busy={busy} error={error} onClose={close} onConfirm={confirmDelete}
        title="Delete your account?" confirm="Delete everything"
        body="Your account, plan, check-ins, life changes and reminder settings will be erased from our servers and this device. This can’t be undone." />
      <Sheet open={sheet === 'signout'} busy={busy} onClose={close} onConfirm={confirmSignOut}
        title="Sign out?" confirm="Sign out"
        body="Your plan stays saved to your account. Sign back in any time with your email." />
      <Sheet open={sheet === 'subscription'} onClose={close} confirm="Got it" title={subMsg.title} body={subMsg.body} />
      <Sheet open={sheet === 'affiliate'} onClose={close} confirm="Got it" title="Affiliate disclosure" body={'As an Amazon Associate, Moi earns from qualifying purchases. If you buy after tapping a store link, we may earn a commission at no extra cost to you. Picks are based on your routine and goals, not commissions. Prices are estimates; the store shows the current price. Product photos come from Open Beauty Facts, not Amazon.'} />
      <Sheet open={sheet === 'health'} onClose={close} confirm="Got it" title="Health disclaimer" body={HEALTH_FULL.join('\n\n')} />
      <Sheet open={sheet === 'soon'} onClose={close} confirm="Got it"
        title="Coming soon" body="This page isn’t published yet. It will be ready before Moi launches." />
    </Screen>
  );
}

const CopyIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24"><Rect x={8} y={8} width={12} height={12} rx={2.5} stroke="#9A9A9A" strokeWidth={1.8} fill="none" /><Path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" stroke="#9A9A9A" strokeWidth={1.8} fill="none" /></Svg>
);
const MailIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24"><Rect x={3} y={5} width={18} height={14} rx={2.5} stroke={C.ink} strokeWidth={1.8} fill="none" /><Path d="m4 7 8 6 8-6" stroke={C.ink} strokeWidth={1.8} fill="none" strokeLinejoin="round" /></Svg>
);
const TrashIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12M10 11v6M14 11v6" stroke={C.red} strokeWidth={1.9} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
);
