// Starts a Stripe Checkout for Moi's subscription: 3-day free trial, then the chosen plan.
// Prices are looked up by lookup key, so no IDs live in code: moi_monthly, moi_yearly, moi_yearly_offer (tracker);
// routine_monthly ($4/month), routine_founder ($24/year, founding offer with lifetime database access) and
// routine_yearly ($24/year, once the 1,000 founding spots are gone) for Moi Routine. Routine plans have no trial.
// Without STRIPE_SECRET_KEY it answers { configured: false } and the app keeps its test-build behaviour.
import { createClient } from 'npm:@supabase/supabase-js@2';

const STRIPE = Deno.env.get('STRIPE_SECRET_KEY');
const SITE = Deno.env.get('SITE_URL') ?? 'https://usemoi.com';
const PLANS = new Set(['moi_monthly', 'moi_yearly', 'moi_yearly_offer', 'routine_monthly', 'routine_founder', 'routine_yearly']);
const TRIAL_DAYS = 3;

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

async function stripe(path: string, params?: Record<string, string>, method = params ? 'POST' : 'GET') {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method, headers: { Authorization: `Bearer ${STRIPE}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params ? new URLSearchParams(params) : undefined,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message ?? `Stripe ${res.status}`);
  return body;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!STRIPE) return json({ configured: false });
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) return json({ error: 'Sign in first' }, 401);
    const body = await req.json().catch(() => ({})) as { plan?: string };
    let plan = body.plan;
    if (!plan || !PLANS.has(plan)) return json({ error: 'Unknown plan' }, 400);
    const routine = plan.startsWith('routine_');
    // Founding offer closed? Sell the plain yearly plan instead and tell the app.
    let note: string | undefined;
    if (plan === 'routine_founder') {
      const { data: f } = await db.rpc('founding_status');
      if (f && !(f as { open: boolean }).open) { plan = 'routine_yearly'; note = 'The founding offer is full, so this is the regular yearly plan.'; }
    }

    const prices = await stripe(`prices?lookup_keys[]=${plan}&active=true&limit=1`);
    const price = prices.data?.[0];
    if (!price) return json({ error: `No Stripe price with lookup key ${plan}` }, 500);

    // One Stripe customer per Moi account; reuse it so trials and portal history stay together.
    const { data: row } = await db.from('subscriptions').select('stripe_customer_id, status').eq('user_id', user.id).maybeSingle();
    let customer = row?.stripe_customer_id as string | undefined;
    if (!customer) {
      const c = await stripe('customers', { ...(user.email ? { email: user.email } : {}), 'metadata[user_id]': user.id });
      customer = c.id as string;
      await db.from('subscriptions').upsert({ user_id: user.id, stripe_customer_id: customer, updated_at: new Date().toISOString() });
    }
    // Only one free trial per person.
    const hadTrial = row && row.status !== 'none';

    const session = await stripe('checkout/sessions', {
      mode: 'subscription',
      customer,
      client_reference_id: user.id,
      'line_items[0][price]': price.id,
      'line_items[0][quantity]': '1',
      ...(hadTrial || routine ? {} : { 'subscription_data[trial_period_days]': String(TRIAL_DAYS) }),
      'subscription_data[metadata][user_id]': user.id,
      'subscription_data[metadata][plan]': plan,
      payment_method_collection: 'always',
      success_url: routine ? `${SITE}/routine/plans?status=success` : `${SITE}/checkout?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: routine ? `${SITE}/routine/plans?status=cancel` : `${SITE}/checkout?status=cancel`,
    });
    return json({ configured: true, url: session.url, plan, note });
  } catch (e) {
    return json({ error: String(e instanceof Error ? e.message : e) }, 500);
  }
});
