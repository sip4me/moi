// Product search: our own catalog first, then Open Beauty Facts, then — only when both come up empty —
// the brand's own product page via Firecrawl, read once and saved so the next person gets it instantly.
// Open Beauty Facts data is ODbL 1.0 (the app credits it on those results). From brand pages we keep only
// facts: product name, brand and the INCI ingredient list — never photos or marketing copy.
import { createClient } from 'npm:@supabase/supabase-js@2';

const OBF = 'https://world.openbeautyfacts.org/cgi/search.pl';
const USER_AGENT = 'Moi/1.0 (hello@moi.app)';
const FIELDS = 'code,product_name,brands,ingredients_text,ingredients_text_en,image_front_small_url,categories_tags';
const HAIR = /hair|shampoo|conditioner|scalp|curl|leave-in|dry-shampoo/;
const REMOTE_PER_MINUTE = 8; // upstream allows 10 searches a minute; keep headroom
const RECHECK_DAYS = 14;
const FIRECRAWL_KEY = Deno.env.get('FIRECRAWL_API_KEY');
const WEB_PER_DAY = Number(Deno.env.get('WEB_LOOKUPS_PER_DAY') ?? 15); // protects the Firecrawl credit balance
const WEB_RECHECK_DAYS = 30; // a query that found nothing isn't retried for a month

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

const slug = (t: string) => t.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

/** True when a brand-site lookup is allowed: this query wasn't tried recently and today's budget isn't spent. */
async function mayFetchWeb(q: string) {
  if (!FIRECRAWL_KEY) return false;
  const key = `web:${q}`;
  const since = new Date(Date.now() - WEB_RECHECK_DAYS * 864e5).toISOString();
  const { data: seen } = await db.from('product_lookups').select('query').eq('query', key).gte('fetched_at', since).maybeSingle();
  if (seen) return false;
  const dayAgo = new Date(Date.now() - 864e5).toISOString();
  const { count } = await db.from('product_lookups').select('query', { count: 'exact', head: true }).like('query', 'web:%').gte('fetched_at', dayAgo);
  return (count ?? 0) < WEB_PER_DAY;
}

type WebProduct = { name?: string; brand?: string; ingredients?: string; is_hair_product?: boolean };

/** Finds the product on its brand's site and reads the full ingredient list (Firecrawl search + JSON extraction). */
async function fetchWeb(q: string) {
  await db.from('product_lookups').upsert({ query: `web:${q}`, fetched_at: new Date().toISOString() });
  const res = await fetch('https://api.firecrawl.dev/v2/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${FIRECRAWL_KEY}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(45000),
    body: JSON.stringify({
      query: `${q} hair product full ingredients list official site`,
      limit: 1,
      scrapeOptions: {
        onlyMainContent: true,
        formats: [{
          type: 'json',
          prompt: 'From this product page, return the product name, the brand, whether it is a hair or scalp care product, and the complete INCI ingredient list exactly as printed, comma-separated. Leave ingredients empty if the full list is not on the page.',
          schema: {
            type: 'object',
            properties: { name: { type: 'string' }, brand: { type: 'string' }, is_hair_product: { type: 'boolean' }, ingredients: { type: 'string' } },
            required: ['name', 'ingredients'],
          },
        }],
      },
    }),
  });
  if (!res.ok) return;
  const body = await res.json() as { data?: { web?: { url?: string; json?: WebProduct }[] } | { url?: string; json?: WebProduct }[] };
  const hits = Array.isArray(body.data) ? body.data : body.data?.web ?? [];
  const hit = hits.find(h => h.json?.ingredients);
  const p = hit?.json;
  const ingredients = (p?.ingredients ?? '').replace(/\s+/g, ' ').trim();
  // Only save what we can score: a name, a real comma-separated INCI list, and a hair or scalp product.
  if (!p?.name || p.is_hair_product === false || ingredients.length < 40 || ingredients.split(',').length < 5) return;
  const brand = p.brand?.trim() || null;
  const row = {
    code: `web:${slug(`${brand ?? ''} ${p.name}`)}`, name: p.name.trim(), brand, ingredients,
    image_url: null, hair: true, source: 'brand_site', source_url: hit?.url ?? null, updated_at: new Date().toISOString(),
  };
  await db.from('products').upsert(row, { onConflict: 'code' });
  return row;
}

/** Barcode lookup: our table first, then Open Beauty Facts' product endpoint (not the rate-limited search). */
async function byCode(code: string) {
  const { data } = await db.from('products').select('*').eq('code', code).maybeSingle();
  if (data) return data;
  const res = await fetch(`https://world.openbeautyfacts.org/api/v2/product/${code}.json?fields=${FIELDS}`, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const { product: p } = (await res.json()) as { product?: ObfProduct };
  const ingredients = (p?.ingredients_text_en || p?.ingredients_text || '').trim();
  const row = p && p.product_name ? {
    code, name: p.product_name.trim(), brand: p.brands?.split(',')[0]?.trim() || null, ingredients,
    image_url: p.image_front_small_url ?? null, hair: (p.categories_tags ?? []).some(t => HAIR.test(t)), updated_at: new Date().toISOString(),
  } : null;
  if (row && ingredients.length > 20) await db.from('products').upsert(row, { onConflict: 'code' });
  return row;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const code = new URL(req.url).searchParams.get('code')?.replace(/\D/g, '');
    if (code) {
      if (code.length < 8 || code.length > 14) return json({ products: [] });
      const p = await byCode(code);
      return json({ products: p ? [p] : [], attribution: 'Product data © Open Beauty Facts contributors, ODbL' });
    }
    const q = (new URL(req.url).searchParams.get('q') ?? '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 60);
    if (q.length < 2) return json({ products: [] });
    let products = await local(q);
    if (products.length < 8 && (await mayFetch(q))) {
      try { await fetchRemote(q); products = await local(q); } catch { /* upstream down: serve what we have */ }
    }
    // Nothing anywhere yet: read it from the brand's own site (rate-limited; misses are remembered).
    // Only on an explicit request (?web=1), so half-typed searches never spend credits.
    const web = new URL(req.url).searchParams.get('web') === '1';
    if (web && !products.length && q.length >= 4 && (await mayFetchWeb(q))) {
      try { const row = await fetchWeb(q); products = await local(q); if (row && !products.length) products = [row]; } catch { /* Firecrawl down: the app offers to paste the label */ }
    }
    // canLookUp tells the app whether to offer "Find it online" (only once a Firecrawl key is set).
    return json({ products, canLookUp: !!FIRECRAWL_KEY, attribution: 'Product data © Open Beauty Facts contributors, ODbL' });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
