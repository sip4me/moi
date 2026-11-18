// Food barcode lookup for the iron scanner: Open Food Facts' product endpoint, reduced to what Moi needs
// (name, brand, serving size and iron). Data © Open Food Facts contributors, ODbL 1.0 — the app credits it.
const USER_AGENT = 'Moi/1.0 (hello@moi.app)';
const FIELDS = 'code,product_name,brands,serving_size,nutriments,image_front_small_url';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

type Off = { product_name?: string; brands?: string; serving_size?: string; image_front_small_url?: string; nutriments?: Record<string, number | string> };
const num = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' && !isNaN(+v) ? +v : null);

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const code = new URL(req.url).searchParams.get('code')?.replace(/\D/g, '') ?? '';
    if (code.length < 8 || code.length > 14) return json({ food: null });
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${FIELDS}`, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return json({ food: null });
    const { product: p } = (await res.json()) as { product?: Off };
    if (!p?.product_name) return json({ food: null });
    const n = p.nutriments ?? {};
    // Open Food Facts stores iron in grams; Moi works in milligrams.
    const per100 = num(n['iron_100g']);
    const perServing = num(n['iron_serving']);
    return json({
      food: {
        code, name: p.product_name.trim(), brand: p.brands?.split(',')[0]?.trim() || null,
        serving: p.serving_size?.trim() || null, image_url: p.image_front_small_url ?? null,
        ironPer100gMg: per100 === null ? null : Math.round(per100 * 1000 * 10) / 10,
        ironPerServingMg: perServing === null ? null : Math.round(perServing * 1000 * 10) / 10,
      },
      attribution: 'Food data © Open Food Facts contributors, ODbL',
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
