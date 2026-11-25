// Reads an inspiration photo (and/or a description) with Claude and returns the look as structured steps:
// for each product, the category, the shade in plain words plus a hex colour, the finish and how to apply it.
// Moi's own colour matching then turns those shades into real products from its database.
// Limits: FREE_PER_DAY reads a day, ROYAL_PER_DAY for paying members, counted in public.look_reads.
// Secret: ANTHROPIC_API_KEY (Supabase Edge Function secrets). Without it: { configured: false }.
import { createClient } from 'npm:@supabase/supabase-js@2';

const KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MODEL = 'claude-sonnet-5-5';
const FREE_PER_DAY = 3;
const ROYAL_PER_DAY = 20;
const MAX_IMAGE_BYTES = 3_500_000;

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const CATS = ['primer', 'foundation', 'concealer', 'powder', 'blush', 'bronzer', 'highlighter', 'brows', 'mascara', 'eyeliner', 'eyeshadow', 'lips', 'lip_gloss', 'setting_spray'];
const FINISHES = ['matte', 'satin', 'cream', 'dewy', 'natural', 'gloss', 'shimmer', 'metallic'];
const HAIR_GOALS = ['Define curls', 'Less frizz', 'Grow length', 'More volume', 'Repair damage', 'Thicker look'];

const TOOL = {
  name: 'look',
  description: 'The beauty look in the photo or description, broken into the products and steps that recreate it.',
  input_schema: {
    type: 'object',
    properties: {
      found: { type: 'boolean', description: 'False when there is no beauty look to read (no face, hair or makeup visible, or an unrelated picture).' },
      name: { type: 'string', description: 'A short name for the look, 2 to 4 words, e.g. "Soft brick glam".' },
      area: { type: 'string', enum: ['makeup', 'hair', 'skin'], description: 'The main thing the look is about.' },
      summary: { type: 'string', description: 'One friendly sentence describing the look, no more than 20 words.' },
      face_look: { type: ['string', 'null'], enum: ['Skin first', 'Soft sculpt', 'Cloud skin', 'Toasty', 'Full glam', null] },
      eye_look: { type: ['string', 'null'], enum: ['Barely there', 'Micro wing', 'Smudged kohl', 'Siren eyes', 'Soft metallic', null] },
      lip_look: { type: ['string', 'null'], enum: ['Lip contour', 'Blurred lip', 'Glossy', 'Bold lip', null] },
      steps: {
        type: 'array', maxItems: 8,
        description: 'Makeup products the look needs, in application order. Only what is visible or clearly implied.',
        items: {
          type: 'object',
          properties: {
            category: { type: 'string', enum: CATS },
            shade: { type: 'string', description: 'The colour in plain words, e.g. "warm brick red", "soft terracotta", "dark brown".' },
            hex: { type: 'string', description: 'The product colour (not the photo pixel), as #RRGGBB.' },
            finish: { type: 'string', enum: FINISHES },
            how: { type: 'string', description: 'One short application tip for this look, no more than 14 words.' },
          },
          required: ['category', 'shade', 'hex', 'finish', 'how'],
        },
      },
      hair_goals: { type: 'array', items: { type: 'string', enum: HAIR_GOALS } },
      hair_notes: { type: 'string', description: 'For hair looks: the style, colour and texture in one sentence. Empty otherwise.' },
    },
    required: ['found', 'name', 'area', 'summary', 'steps'],
  },
};

const SYSTEM = `You are Moi's beauty analyst. You read an inspiration photo or description and break the look into products a person can buy.
- Describe the look, never the person: do not guess identity, age, ethnicity or anything personal.
- Give each product's own colour as hex (what the lipstick or blush looks like in the pan or tube), correcting for photo lighting and filters.
- Use finishes the photo actually shows (gloss shine, matte, shimmer). Leave out steps you cannot see.
- Skin base (foundation, concealer, powder): include the finish only; Moi matches the shade to the person's own skin, so set hex to the look's skin colour as a rough guide.
- If there is no beauty look in the image, set found to false and steps to [].
- Always answer by calling the look tool, with no other text.`;

const HEX = /^#[0-9a-f]{6}$/i;

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!KEY) return json({ configured: false });
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) return json({ error: 'Sign in first' }, 401);

    const body = await req.json().catch(() => ({})) as { image?: string; text?: string };
    const text = (body.text ?? '').slice(0, 600).trim();
    let image: { media_type: string; data: string } | null = null;
    if (body.image) {
      const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(body.image);
      if (!m) return json({ error: 'Unsupported image' }, 400);
      if (m[2].length * 0.75 > MAX_IMAGE_BYTES) return json({ error: 'Image too large' }, 413);
      image = { media_type: m[1], data: m[2] };
    }
    if (!image && !text) return json({ error: 'Nothing to read' }, 400);

    // Daily limit: more for paying members.
    const { data: sub } = await db.from('subscriptions').select('status').eq('user_id', user.id).maybeSingle();
    const { data: founder } = await db.from('founders').select('spot').eq('user_id', user.id).maybeSingle();
    const royal = !!founder || sub?.status === 'active' || sub?.status === 'trialing';
    const limit = royal ? ROYAL_PER_DAY : FREE_PER_DAY;
    const { data: used } = await db.rpc('claim_look_read', { p_user: user.id, p_limit: limit });
    if (used == null) return json({ configured: true, limited: true, limit, royal });

    const content: unknown[] = [];
    if (image) content.push({ type: 'image', source: { type: 'base64', ...image } });
    content.push({ type: 'text', text: text ? `Their description: "${text}"\nRead the look.` : 'Read the look in this photo.' });

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 1200, system: SYSTEM, tools: [TOOL], tool_choice: { type: 'auto' }, messages: [{ role: 'user', content }] }),
    });
    const out = await res.json();
    if (!res.ok) {
      // Give the read back so a failed call doesn't use up the day's limit.
      await db.from('look_reads').update({ n: Math.max(0, (used as number) - 1) }).eq('user_id', user.id).eq('day', new Date().toISOString().slice(0, 10));
      console.error('anthropic', res.status, JSON.stringify(out).slice(0, 500));
      return json({ error: 'Moi couldn’t read that photo right now.' }, 502);
    }
    const look = out.content?.find((c: { type: string }) => c.type === 'tool_use')?.input ?? null;
    if (look?.steps) look.steps = look.steps.filter((s: { category: string; hex: string }) => CATS.includes(s.category) && HEX.test(s.hex));
    return json({ configured: true, look, left: limit - (used as number), royal });
  } catch (e) {
    console.error(e);
    return json({ error: 'Moi couldn’t read that photo right now.' }, 500);
  }
});
