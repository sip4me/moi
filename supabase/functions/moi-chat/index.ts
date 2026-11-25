// Moi's chat: builds a routine in conversation with Claude.
// - Asks tap-to-answer questions from Moi's fixed list (questions.json), which the app saves into the routine.
// - Recommends real products from Moi's database (search_products), shade-matched.
// - When the database has nothing that fits, it may suggest a product found on the web (labelled "From the web",
//   plain brand link, no affiliate tag); every web link is checked to load before it is shown.
// Limits per day: FREE_PER_DAY messages, ROYAL_PER_DAY for paying members (public.usage_counts, kind 'chat').
import { createClient } from 'npm:@supabase/supabase-js@2';
import QUESTIONS from './questions.json' with { type: 'json' };

const KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MODEL = 'claude-sonnet-5-5';
const FREE_PER_DAY = 15;
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

// ── Colour (CIELAB, ΔE76 is plenty for ranking a shortlist) ──────────────────
function hexToLab(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) return null;
  const n = parseInt(m[1], 16);
  const lin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = [lin((n >> 16) & 255), lin((n >> 8) & 255), lin(n & 255)];
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047), y = f(r * 0.2126 + g * 0.7152 + b * 0.0722), z = f((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
const dE = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const matchLabel = (d: number) => (d < 4 ? 'same shade' : d < 8 ? 'very close' : d < 15 ? 'close' : 'different');

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
        shade_hex: { type: 'string', description: 'Optional target colour #RRGGBB for colour products.' },
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

// Beauty brands and stores Moi favours for web finds (picked from the partner brand list).
const WEB_BRANDS: Record<string, string[]> = {
  makeup: ['Charlotte Tilbury', 'e.l.f. Cosmetics', 'Haus Labs', 'MAC Cosmetics', 'Nars', 'Merit', 'rhode', 'Tower28 Beauty', 'Trish McEvoy', 'Chantecaille', 'Clé de Peau Beauté', 'Givenchy Beauty', 'Christian Dior', 'Vieve', 'Kulfi Beauty', 'KAHI Beauty', 'Sigma Beauty'],
  skincare: ['Drunk Elephant', "Paula's Choice", 'Clinique', "Kiehl's", 'Elta MD', 'Supergoop', 'Medik8', 'Dr. Dennis Gross', 'Dr. Barbara Sturm', 'Shiseido', 'Peter Thomas Roth', 'RoC Skincare', 'Neostrata', 'Mario Badescu', 'Origins US', 'CLEARSTEM', 'INNBEAUTY PROJECT', 'ALPYN Beauty', 'Oneskin', 'Grown Alchemist', 'Naturopathica', 'Lancer', 'Ogee', 'Borghese', 'Bime Beauty', 'AP Beauty'],
  haircare: ['Olaplex', 'Briogeo', 'amika', 'OUAI', 'Bumble and bumble', 'Kérastase', 'Living Proof', 'Oribe', 'Davines', 'Aveda', 'Prose'],
  fragrance: ['Sol De Janeiro', 'Backhouse Fragrances', 'Christian Dior', 'Givenchy Beauty', 'Apotheke'],
  bath_body: ['Sol De Janeiro', 'Supergoop', 'Grown Alchemist', 'Apotheke'],
  tools_devices: ['FOREO', 'GHD', 'Solawave', 'CurrentBody', 'LED Esthetics', 'iRestore', 'Dashing Diva'],
  wellness: ['ARMRA', 'Ancient Nutrition', 'Tru Niagen', 'Oura', 'Ultrahuman', 'LARQ', 'Goop'],
  stores: ['Sephora', 'Ulta Beauty', 'CurrentBody', 'FragranceNet.com', 'eCosmetics'],
};

const system = (ctx: string) => `You are Moi, a warm, sharp beauty routine assistant inside the Moi app. You help people build a hair, skin or makeup routine that fits their habits, budget and the looks they love.

How you work:
- Learn their habits with tap-to-answer questions. Ask ONE at a time using reply.ask with a key from the question list. Never ask a question that is already answered. Never write the options in your text; the app shows them.
- Narrow down with taps, broad to specific, in this order: (1) which routine it's for (hair_focus, skin_focus, makeup_when then makeup_focus, body_focus, fragrance_when, tools_focus or wellness_focus; for hair Occasions ask hair_occasion); (2) one or two follow-ups for that segment (e.g. hair_everyday, hair.texture, skin_type, skin_feel, mk_lip_look, fragrance_notes, body_scent, hair_tools or skin_tools, wellness_time); (3) their favourite brands so far (brands_makeup, brands_skin, brands_hair or brands_fragrance); (4) for pigmented makeup only, the shade question for that part (lip_shade, cheek_shade or eye_shade; for base products ask mk_tone and mk_undertone instead); (5) budget if unknown. Skip anything already answered. Keep it quick: at most 5 taps, then show 2 or 3 products. Never make them type.
- Fill what's missing for the look they want: recommend for the steps in context.missing first (the look needs them and they don't own them), never something they already own (context.owned), unless they ask for it. Match the look's style: use each missing step's shade_hex and finish (or context.look_targets) in search_products, and pick products whose finish and colour fit that look. Say which missing step each pick fills (card.step).
- Use their favourite brands as a search_products query first, and their shade answers as shade_hex targets.
- Prices: unless they gave a budget (price_range or hair.budget), show a spread, from an affordable pick (about $10) through mid-range to a splurge. Moi covers everything beauty: from tanning (self-tanner, bronzing drops) to supplements for hair, skin and nails.
- Supplements: suggest only widely sold, reputable products, describe what they're for in plain words, never promise results or health benefits, and add "check with your doctor first, especially if pregnant or on medication" whenever you show one. If they chose "Explore with Moi", pick freely across brands and include at least one they may not know yet.
- If they send a photo, read the look in it (shades, finishes, placement) and refine your picks to match it, using shade_hex in search_products.
- Recommend only real products: call search_products first and use its ids in reply.cards with source "moi". Moi's products come first, and among them prefer ones with on_amazon true. Respect their budget and must-haves.
- Moi's favourite brands for web finds (use them when picking from the web, best fit first, and include them in your picks when they suit the look and budget; their own site or one of the stores listed is the link, plain, no tag):
${Object.entries(WEB_BRANDS).map(([k, v]) => `  ${k}: ${v.join(', ')}`).join('\n')}
- Only if search_products has nothing that fits (or they ask for a specific brand Moi doesn't have, or a splurge pick from a favourite brand above rounds out the price range), use web_search to find up to 3 products (spanning prices when no budget is set) on their product pages, and add each with source "web", its exact url, brand and name. Only mention products you include as cards. Never invent products or links; use only pages your search returned. Prefer Amazon product pages when the product is sold there. Never state prices for web products.
- If they type an answer to a question in their own words, record it in reply.save with the matching option. Only save what they actually said; never guess or infer answers.
- They may also want help with fragrance, tools and devices, or wellness (their interests are in the context). Moi's database has few of these, so for them use web finds, only real product pages. For wellness, keep to habits and products, never health or medical advice.
- Talk about the look and the routine, never about the person's identity or body. No medical claims.
- Keep text to 60 words or less. Always end by calling reply.

Question list (key: question [options]):
${BANK.map(q => `${q.key}: ${q.q} [${q.options.join(' | ')}]${q.max ? ` (up to ${q.max})` : ''}`).join('\n')}

What Moi knows about them:
${ctx}`;

async function searchProducts(input: { category: string; query?: string; shade_hex?: string; finish?: string; max_price?: number; fragrance_free?: boolean }) {
  if (!CATS.includes(input.category)) return { error: 'unknown category' };
  let q = db.from('kb_products').select('id,brand,name,step_cat,price_usd,asin,lab_l,lab_a,lab_b,shade_name,finish,shade_conf,tags').eq('step_cat', input.category).not('brand', 'is', null).limit(300);
  const words = (input.query ?? '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2).slice(0, 3);
  for (const w of words) q = q.or(`name.ilike.%${w}%,brand.ilike.%${w}%`);
  if (input.fragrance_free) q = q.contains('tags', ['fragrance_free']);
  if (input.max_price) q = q.or(`price_usd.is.null,price_usd.lte.${Number(input.max_price)}`);
  const { data, error } = await q;
  if (error) return { error: 'search failed' };
  const target = input.shade_hex ? hexToLab(input.shade_hex) : null;
  const rows = (data ?? []).map(p => {
    const lab = p.lab_l != null ? [p.lab_l, p.lab_a, p.lab_b] : null;
    const d = target && lab && (p.shade_conf ?? 0) >= 0.5 ? dE(target, lab) : null;
    const score = (d != null ? Math.max(0, 1 - d / 30) * 10 : 0) + (p.asin ? 4 : 0) + (input.finish && p.finish === input.finish ? 2 : 0) - (d != null && d > 20 ? (d - 20) / 3 : 0);
    return { p, d, score };
  });
  // When a colour is asked for, clearly different shades are left out as long as closer ones exist.
  const close = rows.filter(r => r.d == null || r.d < 20);
  const pool = target && close.some(r => r.d != null) ? close : rows;
  const top = pool.sort((a, b) => b.score - a.score).slice(0, 6);
  return { products: top.map(({ p, d }) => ({ id: p.id, brand: p.brand, name: p.name, shade: p.shade_name, finish: p.finish, price: p.price_usd, on_amazon: !!p.asin, ...(d != null ? { shade_match: matchLabel(d) } : {}) })) };
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

async function checkCards(reply: any) {
    const raw = (Array.isArray(reply.cards) ? reply.cards : []).slice(0, 4);
  const ids = raw.filter((c: any) => c?.source === 'moi' && typeof c.id === 'string').map((c: any) => c.id);
  const { data: prods } = ids.length ? await db.from('kb_products').select('id,brand,name,step_cat,price_usd,code,asin,lab_l,lab_a,lab_b,shade_name,finish,shade_conf,tags').in('id', ids) : { data: [] as any[] };
  return (await Promise.all(raw.map(async (c: any) => {
    if (c?.source === 'moi') {
      const p = (prods ?? []).find(x => x.id === c.id);
      return p ? { source: 'moi', why: String(c.why ?? '').slice(0, 120), step: c.step ?? null, product: p } : null;
    }
    const amz = c?.source === 'web' && typeof c.url === 'string' ? amazonLink(c.url) : null;
    if (amz && c.name && c.brand) {
      return { source: 'web', amazon: true, why: String(c.why ?? '').slice(0, 120), step: c.step ?? null, brand: String(c.brand).slice(0, 60), name: String(c.name).slice(0, 120), url: amz, category: CATS.includes(c.category) ? c.category : null, shade_hex: /^#[0-9a-f]{6}$/i.test(c.shade_hex ?? '') ? c.shade_hex : null };
    }
    if (c?.source === 'web' && typeof c.url === 'string' && c.name && c.brand && await liveUrl(c.url)) {
      return { source: 'web', why: String(c.why ?? '').slice(0, 120), step: c.step ?? null, brand: String(c.brand).slice(0, 60), name: String(c.name).slice(0, 120), url: c.url, category: CATS.includes(c.category) ? c.category : null, shade_hex: /^#[0-9a-f]{6}$/i.test(c.shade_hex ?? '') ? c.shade_hex : null };
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
    const limit = royal ? ROYAL_PER_DAY : FREE_PER_DAY;
    const { data: used } = await db.rpc('claim_usage', { p_user: user.id, p_kind: 'chat', p_limit: limit });
    if (used == null) return json({ configured: true, limited: true, limit, royal });
    claimed = user.id;

    const ctx = JSON.stringify(body.context ?? {}).slice(0, 4000);
    const sys = system(ctx);
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
    const ask = typeof reply.ask === 'string' ? BANK.find(q => q.key === reply.ask) ?? null : null;
    const save = (Array.isArray(reply.save) ? reply.save : []).filter((x: any) => BANK.some(q => q.key === x?.key && q.options.includes(x?.value))).slice(0, 4);

    return json({ configured: true, text: String(reply.text ?? '').slice(0, 600), ask, save, cards, left: limit - (used as number), royal });
  } catch (e) {
    console.error(e);
    if (claimed) await db.rpc('release_usage', { p_user: claimed, p_kind: 'chat' });
    return json({ error: 'Moi couldn’t answer right now. Try again.' }, 500);
  }
});
