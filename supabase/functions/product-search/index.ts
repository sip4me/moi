// Product search: our own catalog first, then Open Beauty Facts for anything we haven't looked up yet.
// Data © Open Beauty Facts contributors, ODbL 1.0 — the app shows that attribution under the results.
import { createClient } from 'npm:@supabase/supabase-js@2';

const OBF = 'https://world.openbeautyfacts.org/cgi/search.pl';
const USER_AGENT = 'Moi/1.0 (hello@moi.app)';
const FIELDS = 'code,product_name,brands,ingredients_text,ingredients_text_en,image_front_small_url,categories_tags';
const HAIR = /hair|shampoo|conditioner|scalp|curl|leave-in|dry-shampoo/;
const REMOTE_PER_MINUTE = 8; // upstream allows 10 searches a minute; keep headroom
const RECHECK_DAYS = 14;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

type ObfProduct = { code?: string; product_name?: string; brands?: string; ingredients_text?: string; ingredients_text_en?: string; image_front_small_url?: string; categories_tags?: string[] };

async function local(q: string) {
  const { data, error } = await db.rpc('search_products', { q, max_rows: 20 });
  if (error) throw error;
  return data ?? [];
}

/** True when we may call upstream for this query now: not fetched recently, and under the rate budget. */
async function mayFetch(q: string) {
  const since = new Date(Date.now() - RECHECK_DAYS * 864e5).toISOString();
  const { data: seen } = await db.from('product_lookups').select('query').eq('query', q).gte('fetched_at', since).maybeSingle();
  if (seen) return false;
  const minuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count } = await db.from('product_lookups').select('query', { count: 'exact', head: true }).gte('fetched_at', minuteAgo);
  return (count ?? 0) < REMOTE_PER_MINUTE;
}

async function fetchRemote(q: string) {
  const url = `${OBF}?${new URLSearchParams({ search_terms: q, search_simple: '1', action: 'process', json: '1', page_size: '40', fields: FIELDS })}`;
  await db.from('product_lookups').upsert({ query: q, fetched_at: new Date().toISOString() });
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) return;
  const { products = [] } = (await res.json()) as { products?: ObfProduct[] };
  const rows = products
    .map(p => ({
      code: p.code?.trim(),
      name: p.product_name?.trim(),
      brand: p.brands?.split(',')[0]?.trim() || null,
      ingredients: (p.ingredients_text_en || p.ingredients_text || '').trim(),
      image_url: p.image_front_small_url ?? null,
      hair: (p.categories_tags ?? []).some(t => HAIR.test(t)),
      updated_at: new Date().toISOString(),
    }))
    // Only products we can actually score: a name and a real ingredient list.
    .filter(r => r.code && r.name && r.ingredients.length > 20);
  if (rows.length) await db.from('products').upsert(rows, { onConflict: 'code' });
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const q = (new URL(req.url).searchParams.get('q') ?? '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 60);
    if (q.length < 2) return json({ products: [] });
    let products = await local(q);
    if (products.length < 8 && (await mayFetch(q))) {
      try { await fetchRemote(q); products = await local(q); } catch { /* upstream down: serve what we have */ }
    }
    return json({ products, attribution: 'Product data © Open Beauty Facts contributors, ODbL' });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
