// Stripe → Moi: keeps public.subscriptions in step with Stripe (trial started, renewed, cancelled, failed).
// Verifies Stripe's signature with STRIPE_WEBHOOK_SECRET before trusting anything. Deployed without JWT checks.
import { createClient } from 'npm:@supabase/supabase-js@2';

const SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const enc = new TextEncoder();

async function verify(payload: string, header: string | null) {
  if (!SECRET || !header) return false;
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=') as [string, string]));
  const t = parts['t'];
  const sigs = header.split(',').filter(p => p.startsWith('v1=')).map(p => p.slice(3));
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const key = await crypto.subtle.importKey('raw', enc.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${payload}`)));
  const hex = [...mac].map(b => b.toString(16).padStart(2, '0')).join('');
  return sigs.some(s => s.length === hex.length && [...s].every((c, i) => c === hex[i]));
}

const iso = (s?: number | null) => (s ? new Date(s * 1000).toISOString() : null);

type Sub = { id: string; customer: string; status: string; trial_end?: number | null; current_period_end?: number; cancel_at_period_end?: boolean; metadata?: Record<string, string>; items?: { data?: { current_period_end?: number; price?: { lookup_key?: string } }[] } };

async function save(sub: Sub) {
  let userId = sub.metadata?.user_id;
  if (!userId) {
    const { data } = await db.from('subscriptions').select('user_id').eq('stripe_customer_id', sub.customer).maybeSingle();
    userId = data?.user_id;
  }
  if (!userId) return;
  const item = sub.items?.data?.[0];
  await db.from('subscriptions').upsert({
    user_id: userId, stripe_customer_id: sub.customer, stripe_subscription_id: sub.id, status: sub.status,
    plan: sub.metadata?.plan ?? item?.price?.lookup_key ?? null,
    trial_end: iso(sub.trial_end), current_period_end: iso(sub.current_period_end ?? item?.current_period_end),
    cancel_at_period_end: !!sub.cancel_at_period_end, updated_at: new Date().toISOString(),
  });
}

Deno.serve(async req => {
  const payload = await req.text();
  if (!(await verify(payload, req.headers.get('stripe-signature')))) return new Response('bad signature', { status: 400 });
  const event = JSON.parse(payload) as { type: string; data: { object: Record<string, unknown> } };
  try {
    if (event.type.startsWith('customer.subscription.')) await save(event.data.object as unknown as Sub);
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object as { subscription?: string; customer?: string; client_reference_id?: string };
      if (s.client_reference_id && s.customer) await db.from('subscriptions').upsert({ user_id: s.client_reference_id, stripe_customer_id: s.customer, stripe_subscription_id: s.subscription ?? null, updated_at: new Date().toISOString() });
    }
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
  return new Response('ok');
});
