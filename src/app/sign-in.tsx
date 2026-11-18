import { LegalLine } from '../components/Legal';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { BrandText, Button, Screen, Sub, Title, TopBar } from '../components/ui';
import { type Method, type Mode, normalisePhone, sendCode, validate, verifyCode } from '../lib/auth';
import { useStore } from '../state/store';
import { C, F } from '../theme';

const RESEND_AFTER = 30;

/**
 * One screen for both directions:
 *  - mode=signin  → "Welcome back": switch this device to an existing account.
 *  - mode=signup  → "Save your plan": attach an email/phone to the account the person already has.
 * Both use a 6-digit code, never a password.
 */
export default function SignIn() {
  const params = useLocalSearchParams<{ mode?: Mode; next?: string }>();
  const [mode, setMode] = useState<Mode>(params.mode === 'signup' ? 'signup' : 'signin');
  const next = params.next ?? '/';
  const { syncNow } = useStore();

  const [method, setMethod] = useState<Method>('email');
  const [value, setValue] = useState('');
  const [keep, setKeep] = useState(true);
  const [step, setStep] = useState<'enter' | 'code'>('enter');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(w => w - 1), 1000); return () => clearTimeout(t); }, [wait]);

  const invalid = validate(method, value);
  const shown = method === 'phone' ? normalisePhone(value) : value.trim();

  async function send() {
    setBusy(true); setError(null);
    const err = await sendCode(method, value, mode, keep);
    setBusy(false);
    if (err) return setError(err);
    setStep('code'); setCode(''); setWait(RESEND_AFTER);
  }

  async function verify() {
    setBusy(true); setError(null);
    const err = await verifyCode(method, value, code, mode);
    if (err) { setBusy(false); return setError(err); }
    if (mode === 'signin') await syncNow();
    setBusy(false);
    router.replace(next as any);
  }

  const title = step === 'code' ? 'Enter your code' : mode === 'signin' ? 'Welcome back' : 'Save your progress';
  const sub = step === 'code'
    ? `We sent a 6-digit code to ${shown}.`
    : mode === 'signin' ? 'We’ll send you a 6-digit code. No password needed.' : 'Create an account so your plan and progress follow you to any phone.';

  return (
    <Screen footer={step === 'enter' ? <>
      <Button label="Send code" disabled={!!invalid} loading={busy} onPress={send} />
      <LegalLine lead={mode === 'signup' ? 'By creating an account, you agree to our' : 'By signing in, you agree to our'} style={{ marginTop: 10 }} />
      {mode === 'signup'
        ? <Button label="Skip for now" variant="ghost" onPress={() => router.replace(next as any)} />
        : <Button label="New to Moi? Get started" variant="ghost" onPress={() => router.replace('/onboarding')} />}
    </> : <>
      <Button label="Continue" disabled={code.trim().length < 6} loading={busy} onPress={verify} />
      <Button label={wait > 0 ? `Resend code in ${wait}s` : 'Resend code'} variant="ghost" disabled={wait > 0 || busy} onPress={send} />
    </>}>
      <TopBar onBack={step === 'code' ? () => { setStep('enter'); setError(null); } : undefined} />
      <View style={{ marginTop: 20, gap: 8 }}>
        <Title>{title}</Title>
        <Sub>{sub}</Sub>
      </View>

      {step === 'enter' ? (
        <View style={{ marginTop: 28, gap: 14 }}>
          <Segmented value={method} onChange={m => { setMethod(m); setValue(''); setError(null); }} />
          <Field
            key={method}
            value={value}
            onChangeText={t => { setValue(t); setError(null); }}
            placeholder={method === 'email' ? 'you@example.com' : '(555) 123-4567'}
            keyboardType={method === 'email' ? 'email-address' : 'phone-pad'}
            autoComplete={method === 'email' ? 'email' : 'tel'}
            onSubmitEditing={() => !invalid && send()}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4, paddingTop: 4 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.ink }}>Keep me signed in</Text>
              <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.gray, marginTop: 2 }}>Stay signed in on this device after you close the app.</Text>
            </View>
            <Switch value={keep} onValueChange={setKeep} trackColor={{ true: C.ink, false: '#D9D9DE' }} thumbColor="#fff" {...({ activeThumbColor: '#fff' } as object)} />
          </View>
          {mode === 'signin' ? null : (
            <Pressable onPress={() => { setMode('signin'); setError(null); }} hitSlop={8} style={{ alignSelf: 'flex-start', paddingHorizontal: 4 }}>
              <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.gray2 }}>Already have an account? <Text style={{ fontFamily: F.semibold, color: C.ink }}>Sign in</Text></Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={{ marginTop: 28, gap: 12 }}>
          <Field
            value={code}
            onChangeText={t => { setCode(t.replace(/\D/g, '').slice(0, 6)); setError(null); }}
            placeholder="••••••"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            maxLength={6}
            style={{ fontFamily: F.semibold, fontSize: 28, letterSpacing: 12, textAlign: 'center' }}
            onSubmitEditing={() => code.length === 6 && verify()}
          />
          <Pressable onPress={() => { setStep('enter'); setError(null); }} hitSlop={8} style={{ alignSelf: 'center' }}>
            <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.gray2 }}>Use a different {method === 'email' ? 'email' : 'number'}</Text>
          </Pressable>
        </View>
      )}

      {error ? <Text accessibilityRole="alert" style={{ fontFamily: F.medium, fontSize: 14, color: C.red, marginTop: 14, paddingHorizontal: 4 }}>{error}</Text> : null}
    </Screen>
  );
}

function Segmented({ value, onChange }: { value: Method; onChange: (m: Method) => void }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: C.option, borderRadius: 999, padding: 4 }}>
      {(['email', 'phone'] as const).map(m => {
        const on = value === m;
        return (
          <Pressable key={m} onPress={() => onChange(m)} accessibilityRole="tab" accessibilityState={{ selected: on }}
            style={{ flex: 1, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? '#fff' : 'transparent', shadowColor: '#000', shadowOpacity: on ? 0.08 : 0, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}>
            <Text style={{ fontFamily: on ? F.semibold : F.medium, fontSize: 15, color: on ? C.ink : C.gray2 }}>{m === 'email' ? 'Email' : 'Phone'}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Field(props: React.ComponentProps<typeof TextInput>) {
  const [focus, setFocus] = useState(false);
  return (
    <TextInput
      autoFocus
      autoCapitalize="none"
      autoCorrect={false}
      placeholderTextColor="#ABABAB"
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      {...props}
      style={[{ height: 58, borderRadius: 18, backgroundColor: C.option, paddingHorizontal: 18, fontFamily: F.regular, fontSize: 17, color: C.ink, borderWidth: 1.5, borderColor: focus ? C.ink : 'transparent', outlineStyle: 'none' } as any, props.style]}
    />
  );
}
