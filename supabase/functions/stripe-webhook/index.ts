// Stripe → Moi: keeps public.subscriptions in step with Stripe (trial started, renewed, cancelled, failed).
// Verifies Stripe's signature with STRIPE_WEBHOOK_SECRET before trusting anything. Deployed without JWT checks.
import { createClient } from 'npm:@supabase/supabase-js@2';

const SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const enc = new TextEncoder();
const RESEND = Deno.env.get('RESEND_API_KEY');
const STRIPE = Deno.env.get('STRIPE_SECRET_KEY');
const SITE = Deno.env.get('SITE_URL') ?? 'https://usemoi.com';
const PLAN_NAMES: Record<string, { name: string; every: string }> = {
  routine_monthly: { name: 'Moi Royal · Monthly', every: 'month' },
  routine_founder: { name: 'Moi Royal · Founding yearly', every: 'year' },
  routine_yearly: { name: 'Moi Royal · Yearly', every: 'year' },
  routine_standard: { name: 'Moi Royal · Unlimited monthly', every: 'month' },
};
const esc = (x: string) => x.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const money = (cents: number, cur: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: cur.toUpperCase() }).format(cents / 100);

type Session = { id: string; mode?: string; payment_status?: string; amount_total?: number; amount_subtotal?: number; currency?: string; created?: number; invoice?: string | null; metadata?: Record<string, string>; customer_details?: { email?: string | null; name?: string | null }; total_details?: { amount_tax?: number } };

/** Receipt email through Resend after a paid checkout. Idempotent per session, so Stripe retries don't send twice. */
async function sendReceipt(s: Session) {
  const to = s.customer_details?.email;
  if (!RESEND || !to || s.payment_status !== 'paid' || s.amount_total == null) return;
  const plan = PLAN_NAMES[s.metadata?.plan ?? ''] ?? { name: 'Moi Royal', every: '' };
  const cur = s.currency ?? 'usd';
  const total = money(s.amount_total, cur);
  const tax = s.total_details?.amount_tax ?? 0;
  const date = new Date((s.created ?? Date.now() / 1000) * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  // The Stripe invoice gives a receipt number and a PDF link.
  let number = '', link = '';
  if (STRIPE && s.invoice) {
    const r = await fetch(`https://api.stripe.com/v1/invoices/${s.invoice}`, { headers: { Authorization: `Bearer ${STRIPE}` } });
    if (r.ok) { const inv = await r.json(); number = inv.number ?? ''; link = inv.hosted_invoice_url ?? ''; }
  }
  const row = (k: string, v: string, bold = false) => `<tr><td style="padding:8px 0;color:#6C6A80;font-size:14px">${k}</td><td style="padding:8px 0;text-align:right;font-size:14px;color:#111114;${bold ? 'font-weight:700' : ''}">${esc(v)}</td></tr>`;
  const html = `<!doctype html><html><body style="margin:0;background:#F4F4F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<div style="max-width:480px;margin:0 auto;padding:32px 20px">
<div style="background:#fff;border-radius:24px;padding:28px;border:1px solid rgba(20,20,40,0.08)">
<div style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#111114">Moi</div>
<h1 style="font-size:22px;line-height:28px;margin:18px 0 6px;color:#111114">You’re Royal! Here’s your receipt.</h1>
<p style="margin:0 0 18px;font-size:14px;line-height:20px;color:#4A4858">Thanks for joining. Your picks and the full product database are unlocked.</p>
<table style="width:100%;border-collapse:collapse;border-top:1px solid #ECEEF2">
${row('Plan', plan.name)}
${row('Date', date)}
${number ? row('Receipt', number) : ''}
${tax ? row('Tax', money(tax, cur)) : ''}
${row('Total paid', total + (plan.every ? ` / ${plan.every}` : ''), true)}
</table>
${plan.every ? `<p style="margin:16px 0 0;font-size:13px;line-height:19px;color:#6C6A80">Renews every ${plan.every} until you cancel. Cancel anytime from Manage billing in Moi.</p>` : ''}
<div style="margin-top:22px"><a href="${SITE}/routine/gaps" style="display:inline-block;background:#111114;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:999px">See my picks</a></div>
${link ? `<p style="margin:16px 0 0;font-size:13px"><a href="${esc(link)}" style="color:#6C6A80">View or download the full receipt</a></p>` : ''}
</div>
<p style="text-align:center;font-size:12px;line-height:18px;color:#8E9298;margin:18px 0 0">Questions? Reply to this email or write to hello@usemoi.com.<br>Payments are processed securely by Stripe.</p>
</div></body></html>`;
  const text = `You're Royal! Here's your receipt.\n\nPlan: ${plan.name}\nDate: ${date}\n${number ? `Receipt: ${number}\n` : ''}${tax ? `Tax: ${money(tax, cur)}\n` : ''}Total paid: ${total}${plan.every ? ` / ${plan.every}` : ''}\n\n${plan.every ? `Renews every ${plan.every} until you cancel.\n` : ''}${link ? `Full receipt: ${link}\n` : ''}\nQuestions? hello@usemoi.com`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json', 'Idempotency-Key': `receipt-${s.id}` },
    body: JSON.stringify({ from: 'Moi <hello@usemoi.com>', to: [to], reply_to: 'hello@usemoi.com', subject: `Your Moi receipt · ${total}`, html, text }),
  });
  if (!r.ok) console.error('receipt email failed', r.status, await r.text());
}

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
  // Founding offer: the first paid yearly founder subscription claims one of the 1,000 lifetime spots.
  if ((sub.metadata?.plan ?? item?.price?.lookup_key) === 'routine_founder' && sub.status === 'active') await db.rpc('claim_founder', { p_user: userId });
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
      // The receipt never blocks unlocking: a failed email is logged, not retried by Stripe.
      await sendReceipt(event.data.object as unknown as Session).catch(e => console.error('receipt', e));
    }
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
  return new Response('ok');
});
