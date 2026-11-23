// Bulk import of Open Beauty Facts from its published data file (the way OBF asks bulk users to get data).
// Triggered by pg_cron in Supabase with the shared secret; resumes from a saved row cursor.
// Data: Open Beauty Facts contributors, ODbL. Photos: CC BY-SA (credited per row).
export const config = { maxDuration: 300 };

const DUMPS = [
  'https://static.openbeautyfacts.org/data/en.openbeautyfacts.org.products.csv.gz',
  'https://static.openbeautyfacts.org/data/en.openbeautyfacts.org.products.csv',
];
const INGEST = 'https://nqbfsieploomjefpakfm.supabase.co/functions/v1/kb-ingest';
const FEED = 'obf_dump';
const BATCH = 500;
const BUDGET_MS = 270_000;

const HAIR = /hair|shampoo|shampoing|shampooing|conditioner|apr[eè]s-shampo|cheveu|capill|capelli|balsamo|haar|cabello|champ[uú]|pelo|spülung|spulung|scalp|cuir chevelu|curl|boucle|frizz|keratin|dry shampoo|leave-in|coloration|hair dye|teinture/;
const CAT_TAGS = [[/dry-shampoo/, 'dry_shampoo'], [/anti-dandruff|dandruff/, 'anti_dandruff'], [/clarif|purif|detox/, 'clarifying'], [/heat-protect|thermo/, 'heat_protectant'], [/leave-in|no-rinse/, 'leave_in'], [/hair-mask|masque/, 'deep_conditioner'], [/conditioner|apres-shampoing|balm/, 'conditioner'], [/shampoo/, 'shampoo'], [/hair-oil|hair-serum/, 'oil'], [/hair-dye|colou?r|coloration/, 'color'], [/styling|gel|wax|hairspray|mousse|cream/, 'styler'], [/scalp|lotion|anti-hair-loss/, 'scalp_treatment']];
const NAME_RULES = [[/dry shampoo|shampooing sec|shampoo secco/, 'dry_shampoo'], [/dandruff|antipelliculaire|antiforfora|ketoconazol/, 'anti_dandruff'], [/clarif|detox|purif/, 'clarifying'], [/heat|thermo|thermique|calore/, 'heat_protectant'], [/leave[- ]?in|sans rinçage|senza risciacquo/, 'leave_in'], [/mask|masque|maschera|masker/, 'deep_conditioner'], [/conditioner|après-shampooing|apres-shampooing|balsamo|spülung/, 'conditioner'], [/shampoo|shampooing|champú|shampoing/, 'shampoo'], [/oil|huile|olio|serum|sérum/, 'oil'], [/gel|wax|cire|spray|laque|mousse|cream|crème/, 'styler'], [/scalp|cuir chevelu|lozione|lotion/, 'scalp_treatment'], [/bond|plex/, 'bond_builder']];
const BEAUTY = [[/make-?up|lipstick|mascara|foundation|eyeshadow|nail/, 'makeup'], [/fragrance|perfume|eau-de/, 'fragrance'], [/sun|spf/, 'sun_care'], [/face|facial|skin|serum|moisturi|cleanser|toner|anti-aging|eye-cream/, 'skin_care'], [/body|shower|soap|bath|deodorant|hand/, 'body_care'], [/tooth|oral|mouth/, 'oral_care'], [/baby/, 'baby_care'], [/men|shav|beard/, 'shaving']];
const title = t => t.replace(/^en:/, '').split('-').map(w => (w[0] ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
const first = (rules, s) => rules.find(([r]) => r.test(s))?.[1];

function tagsFrom(ing, category) {
  const i = ing.toLowerCase(); const t = [];
  if (/sodium (lauryl|laureth|coco) sulfate|ammonium (lauryl|laureth) sulfate/.test(i)) t.push('sulfate_strong'); else if (i && ['shampoo', 'clarifying', 'anti_dandruff'].includes(category)) t.push('sulfate_free');
  if (/dimethicone|amodimethicone|cyclopentasiloxane|siloxane/.test(i)) t.push('silicone');
  if (/dimaleate|maleate/.test(i)) t.push('bond_builder');
  if (/hydrolyzed (keratin|wheat|silk|rice|quinoa|soy)/.test(i)) t.push('protein');
  if (/glycerin|honey|aloe|panthenol|sodium pca/.test(i)) t.push('humectant');
  if (/butyrospermum|shea butter|ricinus|cocos nucifera oil/.test(i)) t.push('heavy_oil');
  if (category === 'heat_protectant') t.push('heat_protect');
  if (/ketoconazole|zinc pyrithione|piroctone|climbazole|salicylic/.test(i)) t.push('anti_dandruff');
  if (i && !/parfum|fragrance/.test(i)) t.push('fragrance_free');
  return t;
}

function toRow(get) {
  const code = get('code'); const name = (get('product_name') || '').trim(); const brand = (get('brands_en') || get('brands') || (get('brands_tags') || '').split(',')[0].replace(/^xx:/, '').replace(/-/g, ' ') || '').split(',')[0].trim();
  if (!code || !name || !brand || name.length > 200 || brand.length > 80) return null;
  const cats = (get('categories_tags') || '').replace(/,/g, ' ');
  const lname = name.toLowerCase();
  const hair = /hair|shampoo|conditioner/.test(cats) || HAIR.test(lname);
  const beauty = hair ? 'hair_care' : (first(BEAUTY, `${cats} ${lname}`) ?? 'other_beauty');
  const category = hair ? (first(NAME_RULES, lname) ?? first(CAT_TAGS, cats) ?? 'styler') : beauty;
  const ing = get('ingredients_text') || '';
  const img = get('image_small_url') || get('image_url') || null;
  const ml = Number((get('quantity') || '').match(/([\d.]+)\s*ml/i)?.[1]) || null;
  return {
    code, brand, name, category, size_ml: ml, ingredients_raw: ing || null,
    inci: ing ? ing.toLowerCase().replace(/\([^)]*\)/g, '').split(/[,;]/).map(s => s.trim()).filter(s => s && s.length < 80).slice(0, 80) : [],
    tags: tagsFrom(ing, category),
    countries: (get('countries_tags') || '').split(',').filter(Boolean).map(title).slice(0, 30),
    image_url: img, image_credit: img ? 'Open Beauty Facts contributors, CC BY-SA' : null,
    source: 'obf', source_url: `https://world.openbeautyfacts.org/product/${code}`, license: 'ODbL',
    popularity: Number(get('unique_scans_n')) || 0, hair, beauty_category: beauty,
  };
}

async function call(secret, body) {
  const r = await fetch(INGEST, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-cron-secret': secret }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`ingest ${r.status} ${JSON.stringify(j).slice(0, 200)}`);
  return j;
}

async function* lines(stream) {
  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let i;
    while ((i = buf.indexOf('\n')) >= 0) { yield buf.slice(0, i); buf = buf.slice(i + 1); }
  }
  if (buf) yield buf;
}

export default async function handler(req, res) {
  const secret = process.env.KB_SECRET;
  if (!secret || req.headers['x-cron-secret'] !== secret) return res.status(403).send('Forbidden');
  const t0 = Date.now();
  const cur = await call(secret, { mode: 'cursor', feed: FEED });
  if (cur.done && !req.body?.debug) return res.json({ done: true });
  let resp = null;
  for (const u of DUMPS) { const r = await fetch(u, { headers: { 'User-Agent': 'MoiRoutine/1.0 (hello@moi.app)' } }); if (r.ok && r.body) { resp = { r, gz: u.endsWith('.gz') }; break; } }
  if (!resp) return res.status(502).json({ error: 'dump not reachable' });
  const body = resp.gz ? resp.r.body.pipeThrough(new DecompressionStream('gzip')) : resp.r.body;
  let header = null; let row = 0; let batch = []; let saved = 0; let finished = true;
  for await (const line of lines(body)) {
    if (!header) {
      header = line.replace(/^\uFEFF/, '').split('\t').map(h => h.trim());
      if (req.body?.debug) { const sample = []; return res.json({ header, url: resp.r.url }); }
      continue;
    }
    row++;
    if (row <= cur.next_page) continue;
    const cols = line.split('\t');
    const idx = Object.create(null);
    const get = k => { const i = idx[k] ?? (idx[k] = header.indexOf(k)); return i >= 0 ? cols[i] : undefined; };
    const r = toRow(get);
    if (r) batch.push(r);
    if (batch.length >= BATCH) {
      saved += (await call(secret, { mode: 'rows', rows: batch })).saved ?? 0; batch = [];
      await call(secret, { mode: 'progress', feed: FEED, next_page: row, done: false, imported: (cur.imported ?? 0) + saved });
      if (Date.now() - t0 > BUDGET_MS) { finished = false; break; }
    }
  }
  if (batch.length) saved += (await call(secret, { mode: 'rows', rows: batch })).saved ?? 0;
  await call(secret, { mode: 'progress', feed: FEED, next_page: finished ? 0 : row, done: finished, imported: (cur.imported ?? 0) + saved, total: finished ? row : null });
  return res.json({ from: cur.next_page, to: row, saved, finished, ms: Date.now() - t0 });
}
