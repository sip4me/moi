import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { type BuddyStreak, inviteByPhone, loadBuddyStreaks, nextToken, tokensFor } from '../lib/buddies';
import { haptic } from '../lib/haptics';
import { useStore } from '../state/store';
import { C, F } from '../theme';
import { Button, Glyph } from './ui';

const initial = (name: string) => (name.trim()[0] ?? '?').toUpperCase();

function Avatar({ label, tone = C.ink, dashed }: { label: string; tone?: string; dashed?: boolean }) {
  return (
    <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: dashed ? '#fff' : tone, borderWidth: 2, borderColor: dashed ? '#D5D5D8' : '#fff', borderStyle: dashed ? 'dashed' : 'solid' }}>
      <Text style={{ fontFamily: F.semibold, fontSize: 14, color: dashed ? C.gray : '#fff' }}>{label}</Text>
    </View>
  );
}

/** A collectible token: a glossy medallion when earned, a flat grey coin with its day count when not. */
function TokenCoin({ name, days, color, earned }: { name: string; days: number; color: readonly [string, string]; earned: boolean }) {
  const id = `tok-${name.replace(/\W/g, '')}`;
  return (
    <View style={{ alignItems: 'center', width: 62, gap: 4 }} accessibilityLabel={`${name} token, ${earned ? 'earned' : `unlocks at a ${days}-day joint streak`}`}>
      <Svg width={52} height={52} viewBox="0 0 52 52">
        <Defs><RadialGradient id={id} cx="35%" cy="30%" r="75%"><Stop offset="0" stopColor="#fff" /><Stop offset="0.45" stopColor={color[0]} /><Stop offset="1" stopColor={color[1]} /></RadialGradient></Defs>
        <Circle cx={26} cy={26} r={24} fill={earned ? `url(#${id})` : '#EDEDEF'} stroke={earned ? color[1] : '#DDDDE0'} strokeWidth={1.5} />
        <Circle cx={26} cy={26} r={17} fill="none" stroke={earned ? '#ffffffAA' : '#D5D5D8'} strokeWidth={1.2} strokeDasharray={earned ? undefined : '2 3'} />
        {earned
          ? <Path d="M16 31 l2-11 5 5 3-7 3 7 5-5 2 11z" fill="#fff" stroke={color[1]} strokeWidth={1.2} strokeLinejoin="round" />
          : <Path d="M21 25v-3a5 5 0 0 1 10 0v3M19 25h14v9H19z" fill="none" stroke="#B5B5BA" strokeWidth={1.8} strokeLinejoin="round" />}
      </Svg>
      <Text numberOfLines={1} style={{ fontFamily: F.semibold, fontSize: 11, color: earned ? C.ink : C.gray }}>{name}</Text>
      <Text style={{ fontFamily: F.regular, fontSize: 10, color: C.gray, marginTop: -3 }}>{days ? `${days} days` : 'Pair up'}</Text>
    </View>
  );
}

type Send = { phase: 'idle' | 'sending' | 'sent' | 'error'; link?: string; error?: string };

function InviteSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { name } = useStore();
  const [phone, setPhone] = useState('');
  const [send, setSend] = useState<Send>({ phase: 'idle' });
  const [copied, setCopied] = useState(false);
  const digits = phone.replace(/\D/g, '');
  const valid = digits.length >= 7 && digits.length <= 15;
  const close = () => { onClose(); setTimeout(() => { setPhone(''); setSend({ phase: 'idle' }); setCopied(false); }, 250); };
  const submit = async () => {
    setSend({ phase: 'sending' });
    try { const r = await inviteByPhone(phone, name); haptic('success'); setSend({ phase: 'sent', link: r.link }); }
    catch (e: any) { setSend({ phase: 'error', error: /too many/.test(String(e?.message)) ? 'You have 10 invites waiting. Wait for one to be accepted first.' : 'Couldn’t create the invite. Check your connection and try again.' }); }
  };
  const copy = async () => {
    if (!send.link) return;
    try { await (globalThis as any).navigator?.clipboard?.writeText(send.link); setCopied(true); haptic('select'); } catch { /* the link is shown, so it can be copied by hand */ }
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
      <Pressable onPress={close} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} accessibilityLabel="Close" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 34, gap: 14, width: '100%', maxWidth: 520, alignSelf: 'center' }}>
          <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#E3E3E6', marginTop: -10 }} />
          <Text style={{ fontFamily: F.bold, fontSize: 24, letterSpacing: -0.4, color: C.ink }}>{send.phase === 'sent' ? 'Invite ready' : 'Start a joint streak'}</Text>
          {send.phase === 'sent' ? (
            <>
              <Text style={{ fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: C.gray2 }}>Messages opened with your invite. If it didn’t, copy the link and send it yourself. It works once and lasts 14 days.</Text>
              <Text selectable style={{ fontFamily: F.medium, fontSize: 13, color: C.ink, backgroundColor: C.option, borderRadius: 14, padding: 12 }}>{send.link}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button label={copied ? 'Copied ✓' : 'Copy link'} variant="secondary" onPress={copy} style={{ flex: 1 }} />
                <Button label="Done" onPress={close} style={{ flex: 1 }} />
              </View>
            </>
          ) : (
            <>
              <Text style={{ fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: C.gray2 }}>We’ll open Messages with a link for your friend. A day counts when you both do at least one routine step. Their number stays on your phone.</Text>
              <View style={{ height: 54, borderRadius: 16, backgroundColor: C.option, borderWidth: 1.5, borderColor: send.phase === 'error' ? '#E5484D' : 'transparent', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 }}>
                <Glyph name="phone" size={18} color={C.gray} />
                <TextInput value={phone} onChangeText={t => { setPhone(t); if (send.phase === 'error') setSend({ phase: 'idle' }); }} placeholder="Friend’s phone number" placeholderTextColor="#ABABAB"
                  keyboardType="phone-pad" textContentType="telephoneNumber" autoComplete="tel" autoFocus returnKeyType="send" onSubmitEditing={() => valid && submit()}
                  style={{ flex: 1, height: 54, fontFamily: F.medium, fontSize: 17, color: C.ink, outlineStyle: 'none' } as any} />
              </View>
              {send.phase === 'error' ? <Text style={{ fontFamily: F.medium, fontSize: 13, color: '#B42318', marginTop: -6 }}>{send.error}</Text> : null}
              <Button label={send.phase === 'sending' ? 'Creating invite…' : 'Send invite'} loading={send.phase === 'sending'} disabled={!valid} onPress={submit} />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Progress → Joint streaks: buddies, today's status for both, and the token collection. */
export function JointStreaks() {
  const { name, done, todayKey } = useStore();
  const [streaks, setStreaks] = useState<BuddyStreak[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [inviting, setInviting] = useState(false);
  const refresh = useCallback(() => { loadBuddyStreaks().then(s => { setStreaks(s); setFailed(false); }).catch(() => { setStreaks([]); setFailed(true); }); }, []);
  // Re-check when today's steps change: finishing one can complete the day for the pair.
  const todayCount = (done[todayKey] ?? []).length;
  useEffect(refresh, [refresh, todayCount]);

  const tokens = tokensFor(streaks ?? []);
  const best = Math.max(0, ...(streaks ?? []).map(s => s.best));
  const next = streaks?.length ? nextToken(best) : undefined;
  const me = name && name !== 'Your name' ? name : 'You';

  return (
    <View style={{ marginTop: 24 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 18, color: C.ink }}>Joint streaks</Text>
        {streaks?.length ? (
          <Pressable onPress={() => setInviting(true)} hitSlop={10}>
            {({ pressed }) => <Text style={{ fontFamily: F.semibold, fontSize: 15, color: pressed ? C.gray : C.ink, textDecorationLine: 'underline' }}>Invite</Text>}
          </Pressable>
        ) : null}
      </View>

      <View style={{ backgroundColor: C.option, borderRadius: 22, padding: 16, gap: 14 }}>
        {streaks === null ? <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.gray2 }}>Loading your streaks…</Text>
          : !streaks.length ? (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row' }}><Avatar label={initial(me)} /><View style={{ marginLeft: -10 }}><Avatar label="+" dashed /></View></View>
              <View>
                <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>Keep a streak with a friend</Text>
                <Text style={{ fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.gray2, marginTop: 2 }}>{failed ? 'Streaks need a connection. You can still invite someone.' : 'Each day you both do one routine step counts. Hit milestones together to collect tokens.'}</Text>
              </View>
              <Button label="Invite by phone number" onPress={() => setInviting(true)} />
            </View>
          ) : streaks.map(s => (
            <View key={s.pair_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flexDirection: 'row' }}><Avatar label={initial(me)} /><View style={{ marginLeft: -10 }}><Avatar label={initial(s.buddy_name)} tone={C.gold} /></View></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>You & {s.buddy_name}</Text>
                <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray2, marginTop: 1 }}>
                  {s.me_today && s.buddy_today ? 'Both done today ✓' : s.me_today ? `Waiting on ${s.buddy_name}` : s.buddy_today ? `${s.buddy_name} is done — your turn` : 'Neither done yet today'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Glyph name="flame" size={15} color={s.streak ? '#F08A24' : '#C9C9CE'} />
                <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.ink }}>{s.streak}</Text>
              </View>
            </View>
          ))}

        <View style={{ height: 1, backgroundColor: '#E6E6E9' }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.ink }}>Tokens {tokens.filter(t => t.earned).length}/{tokens.length}</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gray2 }}>{next ? `${next.days - best} more day${next.days - best === 1 ? '' : 's'} to ${next.name}` : streaks?.length ? 'All collected 👑' : 'Pair up to start'}</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, justifyContent: 'space-between' }}>
          {tokens.map(t => <TokenCoin key={t.id} name={t.name} days={t.days} color={t.color} earned={t.earned} />)}
        </View>
      </View>
      <InviteSheet open={inviting} onClose={() => { setInviting(false); refresh(); }} />
    </View>
  );
}
