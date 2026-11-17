import { ensureUser, setRemember, supabase } from './supabase';

export type Method = 'email' | 'phone';
/** `signup` upgrades the quiet anonymous account (keeps the plan); `signin` switches to an existing one. */
export type Mode = 'signup' | 'signin';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Normalise to E.164. US numbers can be typed without +1. */
export function normalisePhone(raw: string) {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

export function validate(method: Method, value: string): string | null {
  if (method === 'email') return EMAIL.test(value.trim()) ? null : 'Enter a valid email address.';
  return /^\+\d{8,15}$/.test(normalisePhone(value)) ? null : 'Enter a valid phone number.';
}

const target = (method: Method, value: string) =>
  method === 'email' ? { email: value.trim().toLowerCase() } : { phone: normalisePhone(value) };

/** Turns Supabase errors into a sentence a person can act on. */
function friendly(message: string, method: Method, mode: Mode): string {
  const m = message.toLowerCase();
  if (m.includes('already') && (m.includes('registered') || m.includes('exists') || m.includes('been registered')))
    return `That ${method === 'email' ? 'email' : 'number'} already has an account. Sign in instead.`;
  if (m.includes('signups not allowed') || m.includes('user not found'))
    return mode === 'signin' ? `No account uses that ${method === 'email' ? 'email' : 'number'} yet.` : message;
  if (m.includes('phone') && (m.includes('provider') || m.includes('unsupported')))
    return 'Text codes aren’t switched on yet. Use email for now.';
  if (m.includes('rate') || m.includes('seconds')) return 'Too many codes sent. Wait a minute and try again.';
  if (m.includes('expired') || m.includes('invalid')) return 'That code didn’t work. Check it or send a new one.';
  return message;
}

export async function sendCode(method: Method, value: string, mode: Mode, keepSignedIn: boolean): Promise<string | null> {
  const sb = supabase();
  if (!sb) return 'Can’t reach Moi’s servers right now.';
  await setRemember(keepSignedIn);
  if (mode === 'signup') {
    await ensureUser();
    const { error } = await sb.auth.updateUser(target(method, value));
    return error ? friendly(error.message, method, mode) : null;
  }
  const { error } = await sb.auth.signInWithOtp({ ...target(method, value), options: { shouldCreateUser: false } } as any);
  return error ? friendly(error.message, method, mode) : null;
}

export async function verifyCode(method: Method, value: string, code: string, mode: Mode): Promise<string | null> {
  const sb = supabase();
  if (!sb) return 'Can’t reach Moi’s servers right now.';
  const type = mode === 'signup' ? (method === 'email' ? 'email_change' : 'phone_change') : (method === 'email' ? 'email' : 'sms');
  const { error } = await sb.auth.verifyOtp({ ...target(method, value), token: code.trim(), type } as any);
  return error ? friendly(error.message, method, mode) : null;
}

/** Signs out and starts a fresh anonymous session, so the app keeps working signed out. */
export async function signOut() {
  const sb = supabase();
  if (!sb) return;
  await sb.auth.signOut();
  await setRemember(true);
  await ensureUser();
}

/** Deletes the account and every row tied to it (via the `delete-account` Edge Function). */
export async function deleteAccount(): Promise<string | null> {
  const sb = supabase();
  if (!sb) return 'Can’t reach Moi’s servers right now.';
  const { error } = await sb.functions.invoke('delete-account', { method: 'POST' });
  if (error) return 'Couldn’t delete your account. Try again in a minute.';
  await sb.auth.signOut();
  await setRemember(true);
  return null;
}
