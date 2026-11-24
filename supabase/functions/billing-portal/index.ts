// Settings → Manage subscription: opens Stripe's customer portal (change plan, update card, cancel, invoices).
import { createClient } from 'npm:@supabase/supabase-js@2';

const STRIPE = Deno.env.get('STRIPE_SECRET_KEY');
const SITE = Deno.env.get('SITE_URL') ?? 'https://usemoi.com';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!STRIPE) return json({ configured: false });
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  const { data: { user } } = await db.auth.getUser(token);
  if (!user) return json({ error: 'Sign in first' }, 401);
  const { data } = await db.from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
  if (!data?.stripe_customer_id) return json({ configured: true, url: null });
  const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST', headers: { Authorization: `Bearer ${STRIPE}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ customer: data.stripe_customer_id, return_url: `${SITE}/settings` }),
  });
  const body = await res.json();
  if (!res.ok) return json({ error: body?.error?.message ?? 'Stripe error' }, 500);
  return json({ configured: true, url: body.url });
});
