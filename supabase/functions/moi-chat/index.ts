// Moi's chat: builds a routine in conversation with Claude.
// - Asks tap-to-answer questions from Moi's fixed list (questions.json), which the app saves into the routine.
// - Recommends real products from Moi's database (search_products), shade-matched.
// - When the database has nothing that fits, it may suggest a product found on the web (labelled "From the web",
//   plain brand link, no affiliate tag); every web link is checked to load before it is shown.
// Limits: FREE_TOTAL messages ever for free accounts (then the paywall), ROYAL_PER_DAY a day for paying members
// (public.usage_counts: kind 'chat_free' lifetime, kind 'chat' daily).
import { createClient } from 'npm:@supabase/supabase-js@2';
import QUESTIONS from './questions.json' with { type: 'json' };
import SHADES from './shades.json' with { type: 'json' };

const KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MODEL = 'claude-sonnet-5-5';
const FREE_TOTAL = 3;
const ROYAL_PER_DAY = 150;

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

type Q = { key: string; area: string; q: string; options: string[]; max?: number };
const BANK = QUESTIONS as Q[];

const CATS = [
  'primer', 'foundation', 'concealer', 'powder', 'blush', 'bronzer', 'highlighter', 'brows', 'mascara', 'eyeliner', 'eyeshadow', 'lips', 'lip_gloss', 'setting_spray', 'makeup_remover',
  'cleanser', 'toner', 'serum', 'moisturizer', 'spf', 'retinoid', 'exfoliant', 'eye_cream', 'face_mask', 'lip_balm', 'acne',
  'shampoo', 'clarifying', 'conditioner', 'deep_conditioner', 'leave_in', 'heat_protectant', 'styler', 'oil', 'scalp_treatment', 'bond_builder', 'dry_shampoo', 'anti_dandruff',
];

// ── Colour (CIELAB, CIEDE2000, hue families) ──────────────────
function hexToLab(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) return null;
  const n = parseInt(m[1], 16);
  const lin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = [lin((n >> 16) & 255), lin((n >> 8) & 255), lin(n & 255)];
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047), y = f(r * 0.2126 + g * 0.7152 + b * 0.0722), z = f((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
/** CIEDE2000: how different two colours look to the eye (about 1 = just noticeable). */
function dE(l1: number[], l2: number[]): number {
  const [L1, a1, b1] = l1, [L2, a2, b2] = l2, rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cm = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const ap1 = a1 * (1 + G), ap2 = a2 * (1 + G);
  const Cp1 = Math.hypot(ap1, b1), Cp2 = Math.hypot(ap2, b2);
  const hp = (b: number, a: number) => (b === 0 && a === 0 ? 0 : (Math.atan2(b, a) / rad + 360) % 360);
  const h1 = hp(b1, ap1), h2 = hp(b2, ap2);
  const dL = L2 - L1, dC = Cp2 - Cp1;
  let dh = Cp1 * Cp2 === 0 ? 0 : h2 - h1; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
  const dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin((dh / 2) * rad);
  const Lm = (L1 + L2) / 2, Cpm = (Cp1 + Cp2) / 2;
  let hm = h1 + h2; if (Cp1 * Cp2 !== 0) hm = Math.abs(h1 - h2) > 180 ? (h1 + h2 + (h1 + h2 < 360 ? 360 : -360)) / 2 : (h1 + h2) / 2;
  const T = 1 - 0.17 * Math.cos((hm - 30) * rad) + 0.24 * Math.cos(2 * hm * rad) + 0.32 * Math.cos((3 * hm + 6) * rad) - 0.2 * Math.cos((4 * hm - 63) * rad);
  const SL = 1 + (0.015 * (Lm - 50) ** 2) / Math.sqrt(20 + (Lm - 50) ** 2), SC = 1 + 0.045 * Cpm, SH = 1 + 0.015 * Cpm * T;
  const RT = -2 * Math.sqrt(Cpm ** 7 / (Cpm ** 7 + 25 ** 7)) * Math.sin(60 * Math.exp(-(((hm - 275) / 25) ** 2)) * rad);
  return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH));
}
const matchLabel = (d: number) => (d < 3 ? 'same shade' : d < 6 ? 'very close' : d < 10 ? 'close' : 'different');
const hueOf = (l: number[]) => (Math.atan2(l[2], l[1]) * 180 / Math.PI + 360) % 360;
const chromaOf = (l: number[]) => Math.hypot(l[1], l[2]);
/** Two colourful shades whose hues sit far apart (a pink is not a terracotta, whatever its depth). */
const otherHue = (a: number[], b: number[]) => {
  if (chromaOf(a) < 14 || chromaOf(b) < 14) return false;
  const d = Math.abs(hueOf(a) - hueOf(b)); return Math.min(d, 360 - d) > 30;
};

/** A colour in plain colour-theory words: hue family, depth, how muted, warm or cool. */
function describe(l: number[]): string {
  const [L] = l, C = chromaOf(l), h = hueOf(l);
  const depth = L > 78 ? 'very light' : L > 64 ? 'light' : L > 48 ? 'medium' : L > 32 ? 'deep' : 'very deep';
  if (C < 6) return `${depth} neutral ${L > 85 ? 'white' : L < 25 ? 'black' : 'grey-taupe'}`;
  const fam = h < 8 || h >= 345 ? 'pink-red' : h < 22 ? 'rose-pink' : h < 35 ? 'coral (pink-orange)' : h < 44 ? 'red-orange' : h < 62 ? 'orange' : h < 80 ? 'golden' : h < 105 ? 'yellow' : h < 170 ? 'green' : h < 250 ? 'blue' : h < 300 ? 'violet' : 'magenta-berry';
  const brownish = L < 62 && C < 55 && h >= 20 && h < 80;
  const sat = C < 18 ? 'muted' : C < 35 ? 'soft' : C < 55 ? 'rich' : 'vivid';
  const temp = h >= 25 && h < 110 ? 'warm' : h >= 250 || h < 10 ? 'cool' : 'neutral';
  return `${depth} ${sat} ${fam}${brownish ? ' with brown' : ''}, ${temp}`;
}

// Moi's named shade palette (the same one the app uses): word → colour.
const PALETTE = (SHADES as [string, string, string][]).map(([w, hex, tone]) => ({ w, hex, tone, lab: hexToLab(hex)! }));
const PALETTE_BY_WORD = new Map(PALETTE.map(x => [x.w, x]));
/** A shade word ("soft terracotta", "Terracotta blush") as Moi's palette colour; longest matching name wins. */
function paletteHex(words?: string): string | null {
  const t = (words ?? '').toLowerCase().trim(); if (!t) return null;
  const exact = PALETTE_BY_WORD.get(t); if (exact) return exact.hex;
  const hit = [...PALETTE].sort((a, b) => b.w.length - a.w.length).find(x => new RegExp(`\\b${x.w.replace(/ /g, '\\s+')}\\b`).test(t));
  return hit?.hex ?? null;
}

// ── Tools ─────────────────────────────────────────────────────────────────────
const TOOLS = [
  {
    name: 'search_products',
    description: 'Search Moi’s product database (real products with store links). Always use this before recommending anything. Returns up to 6 products, closest shade first when shade_hex is given.',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: CATS },
        query: { type: 'string', description: 'Optional brand or product words, e.g. "fenty gloss" or "brown liner".' },
        shade: { type: 'string', description: 'Optional shade name from Moi\u2019s palette, e.g. "soft terracotta" or "deep berry". Preferred over guessing a hex.' },
        shade_hex: { type: 'string', description: 'Optional exact target colour #RRGGBB (from the look or the photo). Wins over shade.' },
        finish: { type: 'string', enum: ['matte', 'satin', 'cream', 'dewy', 'natural', 'gloss', 'shimmer', 'metallic'] },
        max_price: { type: 'number', description: 'Optional maximum price in USD.' },
        fragrance_free: { type: 'boolean' },
      },
      required: ['category'],
    },
  },
  { type: 'web_search_20250305', name: 'web_search', max_uses: 3 },
  {
    name: 'reply',
    description: 'Your answer to show in the app. Always finish every turn by calling this exactly once.',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'What you say, warm and short: at most 60 words, no lists, no markdown.' },
        ask: { type: 'string', description: 'Key of ONE question from the question list to ask next, shown as tap answers. Omit when not asking.' },
        cards: {
          type: 'array', maxItems: 4,
          items: {
            type: 'object',
            properties: {
              source: { type: 'string', enum: ['moi', 'web'] },
              id: { type: 'string', description: 'For source moi: the product id from search_products.' },
              brand: { type: 'string' }, name: { type: 'string' },
              url: { type: 'string', description: 'For source web: the product page from web search (Amazon product pages are welcome).' },
              category: { type: 'string', enum: CATS },
              shade_hex: { type: 'string' },
              step: { type: 'string', description: 'The routine step it fills, e.g. "Lip liner".' },
              shade_match: { type: 'string', enum: ['same', 'very close', 'close'], description: 'For colour products: how close it is to the shade they want, copied from search_products (shade_match). Omit when unknown or different.' },
              why: { type: 'string', description: 'One line in your own words, at most 14 words.' },
            },
            required: ['source', 'why'],
          },
        },
        save: {
          type: 'array', description: 'Answers the person gave in their own words that match a question option.',
          items: { type: 'object', properties: { key: { type: 'string' }, value: { type: 'string' } }, required: ['key', 'value'] },
        },
      },
      required: ['text'],
    },
  },
];

// Beauty brands and stores Moi favours for web finds (picked from the partner brand list), with their official sites.
const WEB_BRANDS: Record<string, [string, string][]> = {
  makeup: [['Charlotte Tilbury', 'https://www.charlottetilbury.com'], ['e.l.f. Cosmetics', 'https://www.elfcosmetics.com'], ['Haus Labs', 'https://www.hauslabs.com'], ['ILIA', 'https://iliabeauty.com'], ['MAC Cosmetics', 'https://www.maccosmetics.com'], ['Nars', 'https://www.narscosmetics.com'], ['Merit', 'https://www.meritbeauty.com'], ['rhode', 'https://www.rhodeskin.com'], ['Tower28 Beauty', 'https://www.tower28beauty.com'], ['Trish McEvoy', 'https://www.trishmcevoy.com'], ['Chantecaille', 'https://www.chantecaille.com'], ['Clé de Peau Beauté', 'https://www.cledepeaubeaute.com'], ['Givenchy Beauty', 'https://www.givenchybeauty.com'], ['Christian Dior', 'https://www.dior.com'], ['Kulfi Beauty', 'https://kulfibeauty.com'], ['KAHI Beauty', 'https://kahicosmetics.com'], ['Sigma Beauty', 'https://www.sigmabeauty.com'], ['Prakti Beauty', 'https://praktibeauty.com']],
  skincare: [['Drunk Elephant', 'https://www.drunkelephant.com'], ['Paula\'s Choice', 'https://www.paulaschoice.com'], ['Clinique', 'https://www.clinique.com'], ['Kiehl\'s', 'https://www.kiehls.com'], ['Elta MD', 'https://eltamd.com'], ['Supergoop', 'https://supergoop.com'], ['Medik8', 'https://www.medik8.com'], ['Dr. Dennis Gross', 'https://www.drdennisgross.com'], ['Dr. Barbara Sturm', 'https://www.drsturm.com'], ['Shiseido', 'https://www.shiseido.com'], ['Peter Thomas Roth', 'https://www.peterthomasroth.com'], ['RoC Skincare', 'https://www.rocskincare.com'], ['Neostrata', 'https://www.neostrata.com'], ['Mario Badescu', 'https://www.mariobadescu.com'], ['Origins US', 'https://www.origins.com'], ['CLEARSTEM', 'https://clearstemskincare.com'], ['INNBEAUTY PROJECT', 'https://innbeautyproject.com'], ['ALPYN Beauty', 'https://alpynbeauty.com'], ['Oneskin', 'https://www.oneskin.co'], ['Grown Alchemist', 'https://grownalchemist.com'], ['Naturopathica', 'https://naturopathica.com'], ['Lancer', 'https://www.lancerskincare.com'], ['Ogee', 'https://ogee.com'], ['Borghese', 'https://borghese.com'], ['Bime Beauty', 'https://bimebeauty.com'], ['AP Beauty', 'https://global.amoremall.com/collections/ap-beauty']],
  haircare: [['Olaplex', 'https://olaplex.com'], ['Briogeo', 'https://briogeohair.com'], ['amika', 'https://loveamika.com'], ['OUAI', 'https://theouai.com'], ['Bumble and bumble', 'https://www.bumbleandbumble.com'], ['Kérastase', 'https://www.kerastase-usa.com'], ['Living Proof', 'https://www.livingproof.com'], ['Oribe', 'https://www.oribe.com'], ['Davines', 'https://us.davines.com'], ['Aveda', 'https://www.aveda.com'], ['Prose', 'https://prose.com']],
  fragrance: [['Sol De Janeiro', 'https://soldejaneiro.com'], ['Backhouse Fragrances', 'https://backhousefragrances.com'], ['Christian Dior', 'https://www.dior.com'], ['Givenchy Beauty', 'https://www.givenchybeauty.com'], ['Apotheke', 'https://apothekeco.com']],
  bath_body: [['Sol De Janeiro', 'https://soldejaneiro.com'], ['Supergoop', 'https://supergoop.com'], ['Grown Alchemist', 'https://grownalchemist.com'], ['Apotheke', 'https://apothekeco.com']],
  tools_devices: [['FOREO', 'https://www.foreo.com'], ['GHD', 'https://www.ghdhair.com'], ['Solawave', 'https://solawave.co'], ['CurrentBody', 'https://www.currentbody.com'], ['LED Esthetics', 'https://ledesthetics.com'], ['iRestore', 'https://www.irestorelaser.com'], ['Dashing Diva', 'https://dashingdiva.com'], ['RAD Roller', 'https://radroller.com']],
  wellness: [['ARMRA', 'https://tryarmra.com'], ['Ancient Nutrition', 'https://ancientnutrition.com'], ['Tru Niagen', 'https://www.truniagen.com'], ['Oura', 'https://ouraring.com'], ['Ultrahuman', 'https://www.ultrahuman.com'], ['LARQ', 'https://www.livelarq.com'], ['Goop', 'https://goop.com']],
  stores: [['Sephora', 'https://www.sephora.com'], ['Ulta Beauty', 'https://www.ulta.com'], ['CurrentBody', 'https://www.currentbody.com'], ['FragranceNet.com', 'https://www.fragrancenet.com'], ['eCosmetics', 'https://www.ecosmetics.com']],
};
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const squash = (x: string) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
const BRAND_SITES = new Map<string, string>();
for (const list of Object.values(WEB_BRANDS)) for (const [n, u] of list) BRAND_SITES.set(squash(n), u);
/** A brand's official site when it's one of Moi's favoured brands ("NARS" and "Nars Cosmetics" both match). */
function brandSite(brand?: string | null): string | null {
  const b = squash(brand ?? ''); if (b.length < 2) return null;
  if (BRAND_SITES.has(b)) return BRAND_SITES.get(b)!;
  for (const [k, u] of BRAND_SITES) if (k.length >= 4 && (b.startsWith(k) || k.startsWith(b) && b.length >= 4)) return u;
  return null;
}

const PALETTE_LIST = PALETTE.filter(x => chromaOf(x.lab) >= 6 || /nude|brown|taupe|black|grey|gray|clear/.test(x.w)).map(x => `${x.w} (${describe(x.lab)})`).join('; ');

const system = (ctx: string) => `You are Moi, a warm, sharp beauty routine assistant inside the Moi app. You help people build a hair, skin or makeup routine that fits their habits, budget and the looks they love.

How you work:
- Learn their habits with tap-to-answer questions. Ask ONE at a time using reply.ask with a key from the question list. Never ask a question that is already answered. Never write the options in your text; the app shows them.
- Narrow down with taps, broad to specific, in this order: (1) which routine it's for (hair_focus, skin_focus, makeup_when then makeup_focus, body_focus, fragrance_when, tools_focus or wellness_focus; for hair Occasions ask hair_occasion); (2) one or two follow-ups for that segment (e.g. hair_everyday, hair.texture, skin_type, skin_feel, mk_lip_look, fragrance_notes, body_scent, hair_tools or skin_tools, wellness_time); (3) their favourite brands so far (brands_makeup, brands_skin, brands_hair or brands_fragrance); (4) for pigmented makeup only, the shade question for that part (lip_shade, cheek_shade or eye_shade; for base products ask mk_tone and mk_undertone instead); (5) budget if unknown. Skip anything already answered. Keep it quick: at most 5 taps, then show 2 or 3 products. Never make them type.
- Fill what's missing for the look they want: recommend for the steps in context.missing first (the look needs them and they don't own them), never something they already own (context.owned), unless they ask for it. Match the look's style: use each missing step's shade_hex and finish (or context.look_targets) in search_products, and pick products whose finish and colour fit that look. Say which missing step each pick fills (card.step), and copy each colour product's shade_match from the search into card.shade_match.
- Use their favourite brands as a search_products query first. For their shade answers, pass search_products a shade from Moi's palette (below) rather than guessing a hex; use shade_hex only for a colour given in the context or read from a photo.
- Colour theory, so you can describe and match shades accurately: every shade has a hue (red, orange, pink, berry...), a depth (light to deep) and a saturation (muted to vivid), plus a temperature (warm leans orange/yellow, cool leans blue/pink). Brown is a deep, muted orange; terracotta is a muted, medium-deep orange with brown in it (baked clay), so it is warm, never pink; coral is a bright orange-pink; rose is a muted pink; berry is a deep blue-red; nude is a light, muted orange-pink close to skin. On deeper skin the same family needs more depth and saturation to show (e.g. deep terracotta, burnt orange), on fair skin a softer, lighter one (soft or light terracotta). Search results give each product's colour in these words; only call it a match when its hue family matches the target, and say "close" or "a lighter/deeper take" honestly when it isn't the same shade.
- Moi's shade palette (name: colour description): ${PALETTE_LIST}
- Prices: unless they gave a budget (price_range or hair.budget), show a spread, from an affordable pick (about $10) through mid-range to a splurge. Moi covers everything beauty: from tanning (self-tanner, bronzing drops) to supplements for hair, skin and nails.
- Supplements: suggest only widely sold, reputable products, describe what they're for in plain words, never promise results or health benefits, and add "check with your doctor first, especially if pregnant or on medication" whenever you show one. If they chose "Explore with Moi", pick freely across brands and include at least one they may not know yet.
- If they send a photo, read the look in it (shades, finishes, placement) and refine your picks to match it, using shade_hex in search_products.
- Recommend only real products: call search_products first and use its ids in reply.cards with source "moi". Moi's products come first, and among them prefer ones with on_amazon true. Respect their budget and must-haves.
- Moi's favourite brands for web finds (use them when picking from the web, best fit first, and include them in your picks when they suit the look and budget; their own site or one of the stores listed is the link, plain, no tag):
${Object.entries(WEB_BRANDS).map(([k, v]) => `  ${k}: ${v.map(([n, u]) => `${n} (${host(u)})`).join(', ')}`).join('\n')}
- Only if search_products has nothing that fits (or they ask for a specific brand Moi doesn't have, or a splurge pick from a favourite brand above rounds out the price range), use web_search to find up to 3 products (spanning prices when no budget is set) on their product pages, and add each with source "web", its exact url, brand and name. Only mention products you include as cards. Never invent products or links; use only pages your search returned. Prefer Amazon product pages when the product is sold there. Never state prices for web products.
- If they type an answer to a question in their own words, record it in reply.save with the matching option. Only save what they actually said; never guess or infer answers.
- They may also want help with fragrance, tools and devices, or wellness (their interests are in the context). Moi's database has few of these, so for them use web finds, only real product pages. For wellness, keep to habits and products, never health or medical advice.
- Talk about the look and the routine, never about the person's identity or body. No medical claims.
- Keep text to 60 words or less. Always end by calling reply.

Question list (key: question [options]):
${BANK.map(q => `${q.key}: ${q.q} [${q.options.join(' | ')}]${q.max ? ` (up to ${q.max})` : ''}`).join('\n')}

What Moi knows about them:
${ctx}`;

async function searchProducts(input: { category: string; query?: string; shade?: string; shade_hex?: string; finish?: string; max_price?: number; fragrance_free?: boolean }) {
  if (!CATS.includes(input.category)) return { error: 'unknown category' };
  let q = db.from('kb_products').select('id,brand,name,step_cat,price_usd,asin,lab_l,lab_a,lab_b,shade_name,finish,shade_conf,tags').eq('step_cat', input.category).not('brand', 'is', null).limit(300);
  const words = (input.query ?? '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2).slice(0, 3);
  for (const w of words) q = q.or(`name.ilike.%${w}%,brand.ilike.%${w}%`);
  if (input.fragrance_free) q = q.contains('tags', ['fragrance_free']);
  if (input.max_price) q = q.or(`price_usd.is.null,price_usd.lte.${Number(input.max_price)}`);
  const { data, error } = await q;
  if (error) return { error: 'search failed' };
  const want = /^#?[0-9a-f]{6}$/i.test(input.shade_hex ?? '') ? input.shade_hex! : paletteHex(input.shade);
  const target = want ? hexToLab(want) : null;
  const rows = (data ?? []).map(p => {
    const lab = p.lab_l != null ? [p.lab_l, p.lab_a, p.lab_b] : null;
    const d = target && lab && (p.shade_conf ?? 0) >= 0.5 ? dE(target, lab) : null;
    const far = d != null && (d > 14 || otherHue(target!, lab!));
    const score = (d != null ? Math.max(0, 1 - d / 20) * 10 : 0) + (p.asin ? 4 : 0) + (input.finish && p.finish === input.finish ? 2 : 0) - (d != null && d > 14 ? (d - 14) / 2 : 0) - (far ? 4 : 0);
    return { p, d, far, lab, score };
  });
  // When a colour is asked for, clearly different shades are left out as long as closer ones exist.
  const close = rows.filter(r => r.d == null || !r.far);
  const pool = target && close.some(r => r.d != null) ? close : rows;
  const top = pool.sort((a, b) => b.score - a.score).slice(0, 6);
  return {
    ...(target ? { target: { hex: want, colour: describe(target) } } : {}),
    products: top.map(({ p, d, far, lab }) => ({ id: p.id, brand: p.brand, name: p.name, shade: p.shade_name, finish: p.finish, price: p.price_usd, on_amazon: !!p.asin, ...(lab && (p.shade_conf ?? 0) >= 0.5 ? { colour: describe(lab) } : {}), ...(d != null ? { shade_match: far ? 'different' : matchLabel(d) } : {}) })),
  };
}

const AMAZON_TAG = Deno.env.get('AMAZON_TAG') ?? 'moibeauty07-20';
/** An Amazon product page as Moi's affiliate link (its ASIN with Moi's store ID), or null. */
function amazonLink(url: string): string | null {
  try {
    const u = new URL(url);
    if (!/(^|\.)amazon\.com$/i.test(u.hostname)) return null;
    const m = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i.exec(u.pathname + '/');
    return m ? `https://www.amazon.com/dp/${m[1].toUpperCase()}?tag=${AMAZON_TAG}` : null;
  } catch { return null; }
}

/** A web link is shown only if it loads as a web page. */
async function liveUrl(url: string): Promise<boolean> {
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol) || /(^|\.)amazon\./i.test(u.hostname)) return false;
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 5000);
    const r = await fetch(u, { redirect: 'follow', signal: ctl.signal, headers: { 'user-agent': 'Mozilla/5.0 (compatible; MoiLinkCheck/1.0)' } });
    clearTimeout(t);
    // Many shops block automated checks (401/403/429); only clear "not found" answers drop a link.
    return (r.status < 400 && /html/i.test(r.headers.get('content-type') ?? 'text/html')) || [401, 403, 429, 503].includes(r.status);
  } catch { return false; }
}

const MATCHES = ['same', 'very close', 'close'];
async function checkCards(reply: any) {
    const raw = (Array.isArray(reply.cards) ? reply.cards : []).slice(0, 4);
  const ids = raw.filter((c: any) => c?.source === 'moi' && typeof c.id === 'string').map((c: any) => c.id);
  const { data: prods } = ids.length ? await db.from('kb_products').select('id,brand,name,step_cat,price_usd,code,asin,lab_l,lab_a,lab_b,shade_name,finish,shade_conf,tags').in('id', ids) : { data: [] as any[] };
  return (await Promise.all(raw.map(async (c: any) => {
    if (c?.source === 'moi') {
      const p = (prods ?? []).find(x => x.id === c.id);
      return p ? { source: 'moi', why: String(c.why ?? '').slice(0, 120), step: c.step ?? null, shade_match: MATCHES.includes(c.shade_match) ? c.shade_match : null, product: p, brand_site: brandSite(p.brand) } : null;
    }
    const amz = c?.source === 'web' && typeof c.url === 'string' ? amazonLink(c.url) : null;
    if (amz && c.name && c.brand) {
      return { source: 'web', amazon: true, why: String(c.why ?? '').slice(0, 120), step: c.step ?? null, shade_match: MATCHES.includes(c.shade_match) ? c.shade_match : null, brand: String(c.brand).slice(0, 60), name: String(c.name).slice(0, 120), url: amz, brand_site: brandSite(c.brand), category: CATS.includes(c.category) ? c.category : null, shade_hex: /^#[0-9a-f]{6}$/i.test(c.shade_hex ?? '') ? c.shade_hex : null };
    }
    if (c?.source === 'web' && c.name && c.brand) {
      const site = brandSite(c.brand);
      // A product page that won't load falls back to the brand's own site, for favoured brands.
      const url = typeof c.url === 'string' && await liveUrl(c.url) ? c.url : site;
      if (url) return { source: 'web', why: String(c.why ?? '').slice(0, 120), step: c.step ?? null, shade_match: MATCHES.includes(c.shade_match) ? c.shade_match : null, brand: String(c.brand).slice(0, 60), name: String(c.name).slice(0, 120), url, official: !!site && host(site) === host(url), category: CATS.includes(c.category) ? c.category : null, shade_hex: /^#[0-9a-f]{6}$/i.test(c.shade_hex ?? '') ? c.shade_hex : null };
    }
    return null;
  }))).filter(Boolean);
}

async function claude(messages: unknown[], sys: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': KEY!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 1400, system: sys, tools: TOOLS, tool_choice: { type: 'auto' }, messages }),
  });
  const out = await res.json();
  if (!res.ok) throw new Error(`anthropic ${res.status} ${JSON.stringify(out).slice(0, 300)}`);
  return out as { content: { type: string; id?: string; name?: string; input?: any; text?: string }[]; stop_reason: string };
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!KEY) return json({ configured: false });
  let claimed: string | null = null;
  let royalUser = false;
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) return json({ error: 'Sign in first' }, 401);

    const body = await req.json().catch(() => ({})) as { history?: { role: 'user' | 'assistant'; text: string }[]; context?: Record<string, unknown>; image?: string };
    const history = (body.history ?? []).filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string' && m.text.trim()).slice(-14)
      .map(m => ({ role: m.role, content: m.text.slice(0, 1200) }));
    if (!history.length || history[history.length - 1].role !== 'user') return json({ error: 'Nothing to answer' }, 400);
    while (history.length && history[0].role !== 'user') history.shift();
    // An inspiration photo rides on the latest message.
    let photo: { media_type: string; data: string } | null = null;
    if (body.image) {
      const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(body.image);
      if (!m || m[2].length * 0.75 > 3_500_000) return json({ error: 'That photo couldn’t be read. Try a JPG or PNG.' }, 400);
      photo = { media_type: m[1], data: m[2] };
    }

    const { data: sub } = await db.from('subscriptions').select('status').eq('user_id', user.id).maybeSingle();
    const { data: founder } = await db.from('founders').select('spot').eq('user_id', user.id).maybeSingle();
    const royal = !!founder || sub?.status === 'active' || sub?.status === 'trialing';
    royalUser = royal;
    const limit = royal ? ROYAL_PER_DAY : FREE_TOTAL;
    const { data: used } = royal
      ? await db.rpc('claim_usage', { p_user: user.id, p_kind: 'chat', p_limit: limit })
      : await db.rpc('claim_lifetime', { p_user: user.id, p_kind: 'chat_free', p_limit: limit });
    if (used == null) return json({ configured: true, limited: true, limit, royal, paywall: !royal });
    claimed = user.id;
    // A free account's last message: show value now, not another question.
    const last = !royal && (used as number) >= limit;

    const ctx = JSON.stringify(body.context ?? {}).slice(0, 4000);
    const sys = system(ctx) + (last ? `\n\nThis is their last free message before Moi Royal. Don't ask another question: from what you know so far, show your 2 best picks now (search_products first), each filling a step of the look they want, and end your text by saying Royal unlocks more picks and the full chat.` : '');
    const messages: any[] = history.map((m, i) => (photo && i === history.length - 1 ? { role: 'user', content: [{ type: 'image', source: { type: 'base64', ...photo } }, { type: 'text', text: m.content }] } : m));
    let reply: any = null;
    for (let turn = 0; turn < 6 && !reply; turn++) {
      const out = await claude(messages, sys);
      messages.push({ role: 'assistant', content: out.content });
      reply = out.content.find(c => c.type === 'tool_use' && c.name === 'reply')?.input ?? null;
      if (reply) break;
      const calls = out.content.filter(c => c.type === 'tool_use' && c.name === 'search_products');
      if (calls.length) {
        const results = await Promise.all(calls.map(async c => ({ type: 'tool_result', tool_use_id: c.id, content: JSON.stringify(await searchProducts(c.input ?? {})) })));
        messages.push({ role: 'user', content: results });
        continue;
      }
      if (out.stop_reason === 'pause_turn') continue;
      // Answered in plain text: use it as the reply.
      const text = out.content.filter(c => c.type === 'text').map(c => c.text).join(' ').trim();
      reply = { text: text || 'Tell me a bit more about what you want.' };
    }
    if (!reply) reply = { text: 'Tell me a bit more about what you want.' };

    // Check everything before it reaches the app. If every product was dropped, ask Claude once for others.
    let checked = await checkCards(reply);
    if (Array.isArray(reply.cards) && reply.cards.length && !checked.length) {
      messages.push({ role: 'user', content: 'None of those product links could be confirmed, so they were not shown. Find different real products (search again) and reply again.' });
      for (let turn = 0; turn < 4; turn++) {
        const out = await claude(messages, sys);
        messages.push({ role: 'assistant', content: out.content });
        const r2 = out.content.find(c => c.type === 'tool_use' && c.name === 'reply')?.input ?? null;
        if (r2) { reply = r2; break; }
        const calls = out.content.filter(c => c.type === 'tool_use' && c.name === 'search_products');
        if (calls.length) { messages.push({ role: 'user', content: await Promise.all(calls.map(async c => ({ type: 'tool_result', tool_use_id: c.id, content: JSON.stringify(await searchProducts(c.input ?? {})) }))) }); continue; }
        if (out.stop_reason !== 'pause_turn') break;
      }
      checked = await checkCards(reply);
    }
    const cards = checked;
    const ask = !last && typeof reply.ask === 'string' ? BANK.find(q => q.key === reply.ask) ?? null : null;
    const save = (Array.isArray(reply.save) ? reply.save : []).filter((x: any) => BANK.some(q => q.key === x?.key && q.options.includes(x?.value))).slice(0, 4);

    return json({ configured: true, text: String(reply.text ?? '').slice(0, 600), ask, save, cards, left: limit - (used as number), royal });
  } catch (e) {
    console.error(e);
    if (claimed) await db.rpc(royalUser ? 'release_usage' : 'release_lifetime', { p_user: claimed, p_kind: royalUser ? 'chat' : 'chat_free' });
    return json({ error: 'Moi couldn’t answer right now. Try again.' }, 500);
  }
});
