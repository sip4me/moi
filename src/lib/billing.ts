// Subscriptions: Stripe Checkout (3-day free trial), the subscription row Supabase keeps in step with
// Stripe, and the Stripe customer portal. Until Stripe is configured on the server, every call reports
// { configured: false } and the app keeps its test-build behaviour.
import { Linking, Platform } from 'react-native';
import { ensureUser, supabase } from './supabase';

export type PlanKey = 'moi_monthly' | 'moi_yearly' | 'moi_yearly_offer';
export const TRIAL_DAYS = 3;
export const PLANS: Record<PlanKey, { label: string; price: string; per: string; note?: string }> = {
  moi_yearly: { label: 'Yearly', price: '$29.99', per: 'year', note: '$2.50 a month' },
  moi_monthly: { label: 'Monthly', price: '$9.99', per: 'month' },
  moi_yearly_offer: { label: 'Yearly', price: '$19.99', per: 'year', note: '$1.67 a month' },
};

/** The day billing starts if someone starts the trial today, e.g. "Saturday, Nov 21". */
export const trialEndLabel = () => {
  const d = new Date(); d.setDate(d.getDate() + TRIAL_DAYS);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

const open = (url: string) => (Platform.OS === 'web' ? window.location.assign(url) : Linking.openURL(url));

/** Sends the person to Stripe Checkout. Returns false when Stripe isn't set up yet (test build). */
export async function startCheckout(plan: PlanKey): Promise<boolean> {
  const sb = supabase();
  if (!sb) return false;
  await ensureUser();
  const { data, error } = await sb.functions.invoke<{ configured: boolean; url?: string; error?: string }>('create-checkout', { body: { plan } });
  if (error) throw error;
  if (!data?.configured) return false;
  if (!data.url) throw new Error(data.error ?? 'Checkout unavailable');
  open(data.url);
  return true;
}

export type Subscription = { status: string; plan: string | null; trial_end: string | null; current_period_end: string | null; cancel_at_period_end: boolean };
export const isActive = (s?: Subscription | null) => !!s && (s.status === 'trialing' || s.status === 'active');

/** The person's subscription as Stripe last reported it, or null if they've never checked out. */
export async function loadSubscription(): Promise<Subscription | null> {
  const sb = supabase();
  if (!sb) return null;
  const uid = await ensureUser();
  if (!uid) return null;
  const { data } = await sb.from('subscriptions').select('status, plan, trial_end, current_period_end, cancel_at_period_end').eq('user_id', uid).maybeSingle();
  return (data as Subscription | null) ?? null;
}

/** Opens the Stripe portal (change plan, card, cancel). 'none' = no subscription yet; 'test' = Stripe not set up. */
export async function openPortal(): Promise<'opened' | 'none' | 'test'> {
  const sb = supabase();
  if (!sb) return 'test';
  await ensureUser();
  const { data, error } = await sb.functions.invoke<{ configured: boolean; url?: string | null }>('billing-portal', { body: {} });
  if (error) throw error;
  if (!data?.configured) return 'test';
  if (!data.url) return 'none';
  open(data.url);
  return 'opened';
}
