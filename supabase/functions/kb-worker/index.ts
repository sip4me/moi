// Moi Routine knowledge-base worker. Called by pg_cron and by a trigger, never by browsers.
//   { mode: 'batch' }        imports the next pages of beauty products from Open Beauty Facts (each marked hair or not)
//   { mode: 'enrich', id }   looks up a product someone logged that we don't have, and adds it
//   { mode: 'facets' }       every brand Open Beauty Facts knows
//   { mode: 'stats' }        how much each feed holds
// Open Beauty Facts data is © its contributors, ODbL. We keep source + source_url on every row.
import { createClient } from 'npm:@supabase/supabase-js@2';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const UA = 'MoiRoutine/1.0 (hello@moi.app)';
const OBF = 'https://world.openbeautyfacts.org';
const FIELDS = 'code,product_name,product_name_en,product_name_fr,brands,ingredients_text,ingredients_text_en,image_front_small_url,categories_tags,countries_tags,quantity,unique_scans_n';
const COUNTRIES = ['france', 'italy', 'netherlands', 'germany', 'spain', 'belgium', 'united-kingdom', 'united-states', 'switzerland', 'portugal', 'poland', 'austria', 'sweden', 'denmark', 'norway', 'finland', 'ireland', 'czech-republic', 'romania', 'greece', 'hungary', 'canada', 'mexico', 'brazil', 'argentina', 'australia', 'new-zealand', 'japan', 'south-korea', 'india', 'morocco', 'south-africa', 'turkey', 'russia', 'ukraine', 'world'];
// Everything first (most hair products aren't tagged as hair care), then each country to catch more.
const FEEDS = ['all|world', ...COUNTRIES.filter(c => c !== 'world').map(c => `all|${c}`)];
const BEAUTY: [RegExp, string][] = [[/make-?up|lipstick|mascara|foundation|eyeshadow|nail/, 'makeup'], [/fragrance|perfume|eau-de/, 'fragrance'], [/sun|spf/, 'sun_care'], [/face|facial|skin|serum|moisturi|cleanser|toner|anti-aging|eye-cream/, 'skin_care'], [/body|shower|soap|bath|deodorant|hand/, 'body_care'], [/tooth|oral|mouth/, 'oral_care'], [/baby/, 'baby_care'], [/men|shav|beard/, 'shaving']];
const HAIR = /hair|shampoo|shampoing|shampooing|conditioner|apr[eè]s-shampo|cheveu|capill|capelli|balsamo|haar|cabello|champ[uú]|pelo|spülung|spulung|scalp|cuir chevelu|curl|boucle|frizz|keratin|dry shampoo|leave-in|coloration|hair dye|teinture/;
const isHair = (p: Obf, name: string) => /hair|shampoo|conditioner/.test((p.categories_tags ?? []).join(' ')) || HAIR.test(name.toLowerCase());

const CAT_TAGS: [RegExp, string][] = [
  [/dry-shampoo/, 'dry_shampoo'], [/anti-dandruff|dandruff/, 'anti_dandruff'], [/clarif|purif|detox/, 'clarifying'],
  [/heat-protect|thermo/, 'heat_protectant'], [/leave-in|no-rinse/, 'leave_in'], [/hair-mask|masque/, 'deep_conditioner'],
  [/conditioner|apres-shampoing|balm/, 'conditioner'], [/shampoo/, 'shampoo'], [/hair-oil|hair-serum/, 'oil'],
  [/hair-dye|colou?r|coloration/, 'color'], [/styling|gel|wax|hairspray|mousse|cream/, 'styler'], [/scalp|lotion|anti-hair-loss/, 'scalp_treatment'],
];
const NAME_RULES: [RegExp, string][] = [
  [/dry shampoo|shampooing sec|shampoo secco/, 'dry_shampoo'], [/dandruff|antipelliculaire|antiforfora|ketoconazol/, 'anti_dandruff'],
  [/clarif|detox|purif/, 'clarifying'], [/heat|thermo|thermique|calore/, 'heat_protectant'], [/leave[- ]?in|sans rinçage|senza risciacquo/, 'leave_in'],
  [/mask|masque|maschera|masker/, 'deep_conditioner'], [/conditioner|après-shampooing|apres-shampooing|balsamo|crèmespoeling|spülung/, 'conditioner'],
  [/shampoo|shampooing|champú|shampoing/, 'shampoo'], [/oil|huile|olio|serum|sérum/, 'oil'], [/gel|wax|cire|spray|laque|mousse|cream|crème/, 'styler'],
  [/scalp|cuir chevelu|lozione|lotion/, 'scalp_treatment'], [/bond|plex/, 'bond_builder'],
];

type Obf = { code?: string; product_name?: string; product_name_en?: string; product_name_fr?: string; brands?: string; ingredients_text?: string; ingredients_text_en?: string; image_front_small_url?: string; categories_tags?: string[]; countries_tags?: string[]; quantity?: string; unique_scans_n?: number };

const slug = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const title = (t: string) => t.replace(/^en:/, '').split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ');

function tagsFrom(ing: string, category: string): string[] {
  const i = ing.toLowerCase(); const t: string[] = [];
  if (/sodium (lauryl|laureth|coco) sulfate|ammonium (lauryl|laureth) sulfate/.test(i)) t.push('sulfate_strong'); else if (i && ['shampoo', 'clarifying', 'anti_dandruff'].includes(category)) t.push('sulfate_free');
  if (/dimethicone|amodimethicone|cyclopentasiloxane|siloxane/.test(i)) t.push('silicone');
  if (/dimaleate|maleate/.test(i)) t.push('bond_builder');
  if (/hydrolyzed (keratin|wheat|silk|rice|quinoa|soy)/.test(i)) t.push('protein');
  if (/glycerin|honey|aloe|panthenol|sodium pca/.test(i)) t.push('humectant');
  if (/butyrospermum|shea butter|ricinus|cocos nucifera oil/.test(i)) t.push('heavy_oil');
  if (category === 'heat_protectant') t.push('heat_protect');
  if (/ketoconazole|zinc pyrithione|piroctone|climbazole|salicylic/.test(i)) t.push('anti_dandruff');
  if (!/parfum|fragrance/.test(i) && i) t.push('fragrance_free');
  return t;
}
function categoryOf(p: Obf, name: string): string | null {
  const cats = (p.categories_tags ?? []).join(' ');
  const byTag = CAT_TAGS.find(([r]) => r.test(cats))?.[1];
  const byName = NAME_RULES.find(([r]) => r.test(name.toLowerCase()))?.[1];
  return byName ?? byTag ?? (/hair/.test(cats) ? 'styler' : null);
}
function toRow(p: Obf) {
  const name = (p.product_name_en || p.product_name || p.product_name_fr || '').trim();
  const brand = (p.brands ?? '').split(',')[0].trim();
  if (!name || !brand || name.length > 200) return null;
  const hair = isHair(p, name);
  const cats = (p.categories_tags ?? []).join(' ') + ' ' + name.toLowerCase();
  const beauty = hair ? 'hair_care' : (BEAUTY.find(([r]) => r.test(cats))?.[1] ?? 'other_beauty');
  const category = hair ? (categoryOf(p, name) ?? 'styler') : beauty;
  const ing = p.ingredients_text_en || p.ingredients_text || '';
  const ml = Number((p.quantity ?? '').match(/([\d.]+)\s*ml/i)?.[1]) || null;
  return {
    code: p.code || null, brand, name, category, size_ml: ml,
    ingredients_raw: ing || null,
    inci: ing ? ing.toLowerCase().replace(/\([^)]*\)/g, '').split(/[,;]/).map(s => s.trim()).filter(s => s && s.length < 80).slice(0, 80) : [],
    tags: tagsFrom(ing, category),
    countries: (p.countries_tags ?? []).map(title).slice(0, 30),
    image_url: p.image_front_small_url ?? null,
    source: 'obf', source_url: p.code ? `${OBF}/product/${p.code}` : null, license: 'ODbL',
    popularity: p.unique_scans_n ?? 0,
    hair, beauty_category: beauty,
    image_credit: p.image_front_small_url ? 'Open Beauty Facts contributors, CC BY-SA' : null,
  };
}

async function saveBrands(products: Obf[], hairBrands: Set<string>) {
  const m = new Map<string, any>();
  for (const p of products) for (const raw of (p.brands ?? '').split(',').slice(0, 2)) {
    const name = raw.trim(); const sl = slug(name); if (!sl || name.length > 80) continue;
    const b = m.get(sl) ?? { name, slug: sl, countries: new Set<string>(), hair: false };
    (p.countries_tags ?? []).forEach(c => b.countries.add(title(c))); if (hairBrands.has(sl)) b.hair = true; m.set(sl, b);
  }
  if (!m.size) return;
  await db.rpc('kb_merge_brands', { rows: [...m.values()].map(b => ({ name: b.name, slug: b.slug, countries: [...b.countries], hair: b.hair })) });
}

async function save(rows: NonNullable<ReturnType<typeof toRow>>[]) {
  if (!rows.length) return 0;
  const seen = new Set<string>();
  const uniq = rows.filter(r => r.code && !seen.has(r.code) && seen.add(r.code));
  // Brands first, so products can point at them.
  const brands = new Map<string, { name: string; slug: string; countries: Set<string> }>();
  for (const r of uniq) { const s = slug(r.brand); if (!s) continue; const b = brands.get(s) ?? { name: r.brand, slug: s, countries: new Set<string>() }; r.countries.forEach(c => b.countries.add(c)); brands.set(s, b); }
  await db.rpc('kb_merge_brands', { rows: [...brands.values()].map(b => ({ name: b.name, slug: b.slug, countries: [...b.countries], hair: uniq.some(r => r.hair && slug(r.brand) === b.slug) })) });
  const { data: bs } = await db.from('kb_brands').select('id,slug').in('slug', [...brands.keys()]);
  const bid = new Map((bs ?? []).map((b: any) => [b.slug, b.id]));
  const { error, count } = await db.from('kb_products').upsert(uniq.map(r => ({ ...r, brand_id: bid.get(slug(r.brand)) ?? null, updated_at: new Date().toISOString() })), { onConflict: 'code', count: 'exact' });
  if (error) console.error('save', error.message);
  return error ? 0 : (count ?? uniq.length);
}

async function obfSearch(params: Record<string, string>) {
  const url = `${OBF}/api/v2/search?${new URLSearchParams({ fields: FIELDS, page_size: '100', sort_by: 'unique_scans_n', ...params })}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new Error(`OBF ${res.status}`);
  return await res.json() as { count?: number; page_count?: number; products?: Obf[] };
}

async function batch(pages = 2) {
  const out: any[] = [];
  for (let i = 0; i < pages; i++) {
    const { data: states } = await db.from('kb_import_state').select('*');
    const map = new Map((states ?? []).map((s: any) => [s.feed, s]));
    const feed = FEEDS.find(f => !map.get(f)?.done);
    if (!feed) { out.push({ done: true }); break; }
    const st = map.get(feed) ?? { feed, next_page: 1, imported: 0 };
    const [cat, country] = feed.split('|');
    const params: Record<string, string> = { page: String(st.next_page) };
    if (cat !== 'all') params.categories_tags = cat;
    if (country !== 'world') params.countries_tags = `en:${country}`;
    const r = await obfSearch(params);
    const rows = (r.products ?? []).map(toRow).filter(Boolean) as any[];
    const n = await save(rows);
    await saveBrands(r.products ?? [], new Set(rows.filter(x => x.hair).map(x => slug(x.brand))));
    const last = !r.products?.length || st.next_page * 100 >= (r.count ?? 0);
    await db.from('kb_import_state').upsert({ feed, next_page: st.next_page + 1, total: r.count ?? null, done: last, imported: (st.imported ?? 0) + n, updated_at: new Date().toISOString() });
    out.push({ feed, page: st.next_page, got: r.products?.length ?? 0, saved: n, total: r.count });
  }
  return out;
}

async function enrich(id: string) {
  const { data: s } = await db.from('kb_submissions').select('*').eq('id', id).maybeSingle();
  if (!s || s.product_id) return { skipped: true };
  let found: Obf | null = null;
  if (s.code) {
    const res = await fetch(`${OBF}/api/v2/product/${s.code}.json?fields=${FIELDS}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) }).catch(() => null);
    found = res?.ok ? ((await res.json()) as { product?: Obf }).product ?? null : null;
  }
  const typed = s.name && !/^(Barcode \d+|Photo without a barcode)$/.test(s.name) ? String(s.name) : null;
  if (!found && typed) {
    const r = await obfSearch({ search_terms: `${s.brand ?? ''} ${typed}`.trim(), page_size: '10' }).catch(() => null);
    found = (r?.products ?? []).find(p => (p.categories_tags ?? []).some(c => /hair|shampoo|conditioner/.test(c))) ?? null;
  }
  let row = found ? toRow(found) : null;
  if (!row && typed) {
    // Not in any open database yet: add it from what the person told us, unverified.
    const category = s.category || NAME_RULES.find(([r]) => r.test(typed.toLowerCase()))?.[1] || 'styler';
    const brand = s.brand || typed.split(/\s+/)[0];
    row = { code: s.code ?? null, brand, name: typed, category, size_ml: null, ingredients_raw: s.ingredients_raw ?? null, inci: [], tags: tagsFrom(s.ingredients_raw ?? '', category), countries: [], image_url: null, source: 'user', source_url: null, license: null, popularity: 0 } as any;
  }
  if (!row) { await db.from('kb_submissions').update({ auto_note: 'No barcode or name to look up' }).eq('id', id); return { found: false }; }
  let productId: string | null = null;
  if (row.code) { await save([row as any]); const { data } = await db.from('kb_products').select('id').eq('code', row.code).maybeSingle(); productId = (data as any)?.id ?? null; }
  else {
    const { data: ex } = await db.from('kb_products').select('id').ilike('brand', row.brand).ilike('name', row.name).limit(1).maybeSingle();
    productId = (ex as any)?.id ?? null;
    if (!productId) { const { data } = await db.from('kb_products').insert({ ...row, verified: false }).select('id').single(); productId = (data as any)?.id ?? null; }
  }
  await db.from('kb_submissions').update({ product_id: productId, status: found ? 'approved' : 'pending', auto_note: found ? 'Matched in Open Beauty Facts' : 'Added from the person’s entry; needs review' }).eq('id', id);
  return { found: !!found, productId };
}

// Every brand Open Beauty Facts knows, with its product count, in one request.
async function facets() {
  const res = await fetch(`${OBF}/facets/brands.json`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`OBF facets ${res.status}`);
  const { tags = [] } = await res.json() as { tags?: { name: string; products: number }[] };
  let n = 0;
  for (let i = 0; i < tags.length; i += 1000) {
    const rows = tags.slice(i, i + 1000).map(t => ({ name: t.name, slug: slug(t.name), countries: [], hair: false, products: t.products })).filter(r => r.slug && r.name.length <= 80);
    await db.rpc('kb_merge_brands', { rows }); n += rows.length;
  }
  return { brands: n };
}

async function stats() {
  const probe = async (q: Record<string, string>) => (await obfSearch({ ...q, page_size: '1' }).catch(() => ({ count: -1 }))).count;
  const out: Record<string, number | undefined> = {};
  for (const c of ['en:hair-care', 'en:shampoos', 'en:hair-conditioners', 'en:hair-masks', 'en:hair-styling-products', 'en:hair-dyes']) out[c] = await probe({ categories_tags: c });
  for (const k of ['france', 'italy', 'netherlands', 'germany', 'united-states']) out[`hair-care|${k}`] = await probe({ categories_tags: 'en:hair-care', countries_tags: `en:${k}` });
  out.all_products = await probe({});
  return out;
}

Deno.serve(async req => {
  const { data: cfg } = await db.rpc('get_push_config');
  if (!cfg || req.headers.get('x-cron-secret') !== cfg.moi_cron_secret) return new Response('Forbidden', { status: 403 });
  const body = await req.json().catch(() => ({}));
  try {
    if (body.mode === 'enrich') return Response.json(await enrich(body.id));
    if (body.mode === 'stats') return Response.json(await stats());
    if (body.mode === 'facets') return Response.json(await facets());
    return Response.json(await batch(Math.min(Number(body.pages) || 3, 5)));
  } catch (e) { return Response.json({ error: String(e) }, { status: 500 }); }
});
