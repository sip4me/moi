// Moi Routine paywall: plans, who has access, the founding-offer counter and the people counter.
// Access = an active subscription (Routine or tracker plan), a founding spot (lifetime database access),
// or, while Stripe isn't switched on, a test unlock kept on this device.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Linking, Platform } from 'react-native';
import { ensureUser, supabase } from '../supabase';
import { setRoutine, useRoutine } from './model';

export type RoutinePlan = 'routine_founder' | 'routine_monthly' | 'routine_standard';
export const FOUNDING_CAP = 1000;
export const ROUTINE_PLANS: Record<RoutinePlan, { label: string; price: string; per: string; perks: string[] }> = {
  routine_founder: { label: 'Founding yearly', price: '$24', per: 'year', perks: ['Lifetime access to the product database', '$2 a month'] },
  routine_monthly: { label: 'Monthly', price: '$4', per: 'month', perks: ['Cancel anytime'] },
  // The regular price, once someone's 3-day launch offer has ended.
  routine_standard: { label: 'Monthly', price: '$10', per: 'month', perks: ['Unlimited searches', 'Cancel anytime'] },
};

// ── Access ────────────────────────────────────────────────────────────────────
type Access = { loading: boolean; paid: boolean; founder: boolean; spot?: number };
let access: Access = { loading: true, paid: false, founder: false };
const subs = new Set<() => void>();
let loadP: Promise<void> | null = null;

export function refreshAccess(): Promise<void> {
  loadP = (async () => {
    const sb = supabase();
    if (!sb) { access = { loading: false, paid: false, founder: false }; return; }
    const { data } = await sb.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) { access = { loading: false, paid: false, founder: false }; return; }
    const [s, f] = await Promise.all([
      sb.from('subscriptions').select('status, plan').eq('user_id', uid).maybeSingle(),
      sb.from('founders').select('spot').eq('user_id', uid).maybeSingle(),
    ]);
    const st = (s.data as { status?: string } | null)?.status;
    access = { loading: false, paid: st === 'active' || st === 'trialing', founder: !!f.data, spot: (f.data as { spot?: number } | null)?.spot };
  })().catch(() => { access = { ...access, loading: false }; }).finally(() => subs.forEach(f => f()));
  return loadP;
}

/** ok: may see the gap report and shop. */
export function useAccess() {
  const a = useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f); }; }, () => access, () => access);
  const s = useRoutine();
  if (!loadP) refreshAccess();
  const test = !!s.testUnlock;
  useEffect(() => { if ((a.paid || a.founder) && !s.saved) setRoutine(r => ({ ...r, saved: true })); }, [a.paid, a.founder, s.saved]);
  return { ...a, test, ok: a.paid || a.founder || test, loading: a.loading && !test };
}

const open = (url: string) => (Platform.OS === 'web' ? window.location.assign(url) : Linking.openURL(url));

/** Opens Stripe Checkout. Returns 'test' when Stripe isn't switched on yet: access is then unlocked on this device. */
export async function checkoutRoutine(plan: RoutinePlan): Promise<'opened' | 'test'> {
  const sb = supabase();
  if (!sb) { setRoutine(r => ({ ...r, testUnlock: plan, saved: true })); return 'test'; }
  await ensureUser();
  const { data, error } = await sb.functions.invoke<{ configured: boolean; url?: string; error?: string }>('create-checkout', { body: { plan } });
  if (error) throw error;
  if (!data?.configured) { setRoutine(r => ({ ...r, testUnlock: plan, saved: true })); return 'test'; }
  if (!data.url) throw new Error(data.error ?? 'Checkout unavailable');
  open(data.url);
  return 'opened';
}

// ── Counters ──────────────────────────────────────────────────────────────────
/** Founding spots taken so far, refreshed every 30 seconds while shown. */
export function useFounding() {
  const [f, setF] = useState<{ taken: number; left: number; open: boolean } | null>(null);
  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    let alive = true;
    const get = () => sb.rpc('founding_status').then(({ data }) => { if (alive && data) setF(data as any); });
    get();
    const t = setInterval(get, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  return f;
}

const DEVICE_KEY = 'moi-device-id';
const uuid = () => globalThis.crypto?.randomUUID?.() ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
});

/** How many people use Moi (one per device). Counts this device once, then refreshes every 30 seconds. */
export function useMembers() {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    let alive = true;
    (async () => {
      let id = await AsyncStorage.getItem(DEVICE_KEY).catch(() => null);
      if (!id) { id = uuid(); await AsyncStorage.setItem(DEVICE_KEY, id).catch(() => {}); }
      const { data } = await sb.rpc('register_member', { p_device: id });
      if (alive && data != null) setN(Number(data));
    })().catch(() => {});
    const t = setInterval(() => sb.rpc('member_count').then(({ data }) => { if (alive && data != null) setN(Number(data)); }), 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  return n;
}

// ── Launch offer ──────────────────────────────────────────────────────────────
/** Each person's offer runs 3 days from the first time they see the paywall; then the price is $10 a month. */
export const OFFER_MS = 3 * 24 * 60 * 60 * 1000;
const OFFER_KEY = 'moi-offer-start';
export function useOffer() {
  const [start, setStart] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    AsyncStorage.getItem(OFFER_KEY).then(v => {
      const t = Number(v);
      if (t > 0) setStart(t); else { const n = Date.now(); AsyncStorage.setItem(OFFER_KEY, String(n)); setStart(n); }
    }).catch(() => setStart(Date.now()));
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const left = start == null ? OFFER_MS : Math.max(0, start + OFFER_MS - now);
  return { loading: start == null, open: left > 0, left };
}
export const countdown = (ms: number) => {
  const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return d ? `${d}d ${h}h ${m}m` : `${h}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`;
};
