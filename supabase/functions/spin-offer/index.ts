// The "Not now" discount wheel. The server spins, once per account, and keeps the result in public.offer_spins,
// so the app can't choose its own discount. create-checkout applies it as a one-time Stripe coupon on the first month.
import { createClient } from 'npm:@supabase/supabase-js@2';

// Every slice on the wheel is a real outcome; the odds favour the smaller discounts.
const ODDS: [number, number][] = [[20, 0.5], [30, 0.35], [50, 0.15]];
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) return json({ error: 'Sign in first' }, 401);
    const { data: had } = await db.from('offer_spins').select('percent, used_at').eq('user_id', user.id).maybeSingle();
    if (had) return json({ percent: had.percent, used: !!had.used_at, again: true });
    const r = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
    let acc = 0, percent = ODDS[0][0];
    for (const [p, w] of ODDS) { acc += w; if (r < acc) { percent = p; break; } }
    const { error } = await db.from('offer_spins').insert({ user_id: user.id, percent });
    if (error) { const { data: row } = await db.from('offer_spins').select('percent').eq('user_id', user.id).maybeSingle(); return json({ percent: row?.percent ?? percent, again: true }); }
    return json({ percent, used: false, again: false });
  } catch (e) {
    return json({ error: String(e instanceof Error ? e.message : e) }, 500);
  }
});
