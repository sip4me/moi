import { hexToLab, type Lab } from './color';
import { shadeWords } from './shade';
import SHADES_JSON from './shades.json';
import { pref, type Item, type RoutineState } from './model';

/**
 * Moi's own one-line description of a product, written for the look the person picked
 * (lip contour, smudged kohl, toasty...). Our words, never the brand's copy.
 */
export function lookNote(i: Item, s: RoutineState, fallback?: string): string | undefined {
  const lip = pref(s, 'mk_lip_look')[0], eye = pref(s, 'mk_eye_look')[0], face = pref(s, 'mk_face_look')[0];
  const liner = /liner|pencil|contour/i.test(i.name);
  switch (i.category) {
    case 'lips':
      if (lip === 'Lip contour') return liner ? 'Line just past your edges and blend in for a soft, full contour.' : 'Wear it inside a blended liner for a contoured lip.';
      if (lip === 'Blurred lip') return liner ? 'Smudge the edge with a finger for a soft, blurred line.' : 'Press it on and blot for a soft-focus, just-bitten lip.';
      if (lip === 'Bold lip') return liner ? 'Line first so your bold color stays sharp all day.' : 'Rich color for your bold lip. Pair it with a soft eye.';
      if (lip === 'Glossy') return 'A soft base under your gloss.';
      break;
    case 'lip_gloss':
      if (lip === 'Glossy') return 'The glassy shine your glossy lip is built on.';
      if (lip === 'Lip contour') return 'Dab in the center over your liner for a fuller pout.';
      return 'A touch of shine to finish your lips.';
    case 'eyeliner':
      if (eye === 'Smudged kohl') return 'Smudge along the lash line for a lived-in, kohl look.';
      if (eye === 'Micro wing') return 'A fine tip for a small, neat flick.';
      if (eye === 'Siren eyes') return 'Drag it out and up for the lifted siren shape.';
      break;
    case 'eyeshadow':
      if (eye === 'Soft metallic') return 'A sheer shimmer for your soft metallic lid.';
      if (eye === 'Siren eyes') return 'Shade the outer corner to stretch the eye.';
      break;
    case 'mascara':
      if (eye === 'Barely there') return 'Defines lashes without looking done.';
      return 'Lifts and darkens to finish your eyes.';
    case 'brows':
      return eye === 'Barely there' ? 'Brushes brows up so they look fuller, not drawn on.' : 'Frames your eye look.';
    case 'bronzer':
      if (face === 'Toasty') return 'Warm bronze for the cozy, sun-warmed face.';
      if (face === 'Soft sculpt') return 'Diffuse it under the cheekbones for soft shape, no harsh lines.';
      return 'Adds warmth and shape where the sun would hit.';
    case 'blush':
      if (face === 'Soft sculpt') return 'Blend it up toward the temples to lift the face.';
      if (face === 'Cloud skin') return 'A sheer flush that melts into soft-focus skin.';
      if (face === 'Skin first') return 'A flush that looks like your own color.';
      if (face === 'Toasty') return 'A warm flush to go with your bronze.';
      break;
    case 'powder':
      if (face === 'Cloud skin') return 'Blurs shine for the soft-focus cloud finish.';
      return 'Sets your base so it lasts.';
    case 'foundation':
      if (face === 'Skin first') return 'Light coverage so your skin still shows through.';
      if (face === 'Cloud skin') return 'A soft-matte base that blurs texture.';
      if (face === 'Full glam') return 'Full coverage that holds for hours.';
      break;
    case 'highlighter':
      return face === 'Toasty' ? 'A warm glow on the high points.' : 'A touch of glow on the high points.';
    case 'concealer':
      return face === 'Skin first' ? 'Just where you need it, so skin stays the star.' : 'Brightens and evens where you need it.';
  }
  return fallback;
}

const article = (w: string) => (/^[aeiou]/i.test(w) ? 'an' : 'a');
const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/**
 * The plan in one line, like Cal AI's "You should lose…": "Get a lip liner and a kohl liner to get your
 * lip contour look." Built from their top gaps and the goal those gaps serve.
 */
export function shouldLine(s: RoutineState, gaps: { title: string; fills: string[]; id: string }[], areaOfGap: (g: { id: string; fills: string[] }) => string): string | null {
  const top = gaps.slice(0, 2);
  if (!top.length) return null;
  const area = areaOfGap(top[0]);
  const lip = pref(s, 'mk_lip_look')[0], eye = pref(s, 'mk_eye_look')[0], face = pref(s, 'mk_face_look')[0];
  const goal = area === 'makeup' ? (lip ?? eye ?? face ? `get your ${(lip ?? eye ?? face)!.toLowerCase()} look` : 'finish your makeup routine')
    : area === 'skin' ? (pref(s, 'skin_concerns')[0] ? `help with ${pref(s, 'skin_concerns')[0].toLowerCase()}` : 'complete your skin routine')
    : area === 'body' ? (pref(s, 'body_concerns')[0] ? `help with ${pref(s, 'body_concerns')[0].toLowerCase()}` : 'complete your body routine')
    : s.goals[0] ? `${s.goals[0].toLowerCase()}` : 'reach your hair goal';
  const things = top.map(g => `${article(g.title)} ${g.title.toLowerCase()}`);
  return `Get ${list(things)} to ${goal}.`;
}

/** What a typed look ("glossy lip and smudged kohl", "defined curls") says about their routine and looks. */
export function lookFromText(text: string): { area?: 'hair' | 'skin' | 'makeup' | 'body'; prefs: Record<string, string[]>; goals: string[] } {
  const t = text.toLowerCase();
  const has = (re: RegExp) => re.test(t);
  const prefs: Record<string, string[]> = {};
  const lip = has(/lip contour|overline|over-line/) ? 'Lip contour' : has(/blur(red)? lip|soft lip|bitten/) ? 'Blurred lip' : has(/gloss|glossy|glass lip/) ? 'Glossy' : has(/bold lip|red lip|oxblood|cherry|berry lip|dark lip/) ? 'Bold lip' : null;
  const eye = has(/siren/) ? 'Siren eyes' : has(/kohl|smudg|smok|tired girl|indie/) ? 'Smudged kohl' : has(/wing|flick|cat.?eye/) ? 'Micro wing' : has(/metallic|shimmer|glitter/) ? 'Soft metallic' : has(/no.?makeup|natural|barely|clean girl/) ? 'Barely there' : null;
  const face = has(/full glam|glam/) ? 'Full glam' : has(/toast|bronz|sun.?kiss|latte|warm/) ? 'Toasty' : has(/cloud|soft.?matte|velvet|blur/) ? 'Cloud skin' : has(/sculpt|contour|cheekbone/) ? 'Soft sculpt' : has(/skin first|clean girl|no.?makeup|natural|tint/) ? 'Skin first' : null;
  if (lip) prefs.mk_lip_look = [lip];
  if (eye) prefs.mk_eye_look = [eye];
  if (face) prefs.mk_face_look = [face];
  const goals = [
    has(/curl|coil|ringlet/) && 'Define curls', has(/frizz|smooth|sleek/) && 'Less frizz', has(/grow|length|long hair/) && 'Grow length',
    has(/volume|bounce|blowout/) && 'More volume', has(/damage|repair|bleach|broken/) && 'Repair damage', has(/thick|fuller/) && 'Thicker look',
  ].filter((g): g is string => !!g);
  const makeup = !!(lip || eye || face) || has(/makeup|make-up|lip|eye|lash|brow|blush|glam/);
  const hair = goals.length > 0 || has(/hair|braid|wave|bun|ponytail/);
  const skin = has(/skin|glow|dewy|acne|spot|glass skin|pores/);
  const body = has(/body|lotion|shower/);
  return { area: makeup ? 'makeup' : hair ? 'hair' : skin ? 'skin' : body ? 'body' : undefined, prefs, goals };
}

// ── Shade targets ─────────────────────────────────────────────────────────────
const HEX: Record<string, string> = Object.fromEntries((SHADES_JSON as { shades: { w: string; hex: string }[] }).shades.map(x => [x.w, x.hex]));
const lab = (w: string) => (HEX[w] ? hexToLab(HEX[w]) : undefined);

/** Words that say which product a colour word is about ("berry lip", "brown liner", "peach blush"). */
const NEAR: [RegExp, string][] = [[/lip ?liner|liner on (the )?lips/, 'lips'], [/gloss/, 'lip_gloss'], [/lip|mouth/, 'lips'], [/blush|cheek/, 'blush'], [/bronz|contour/, 'bronzer'], [/highlight|glow/, 'highlighter'],
  [/liner|kohl|kajal|wing/, 'eyeliner'], [/shadow|lid|eye/, 'eyeshadow'], [/brow/, 'brows'], [/lash|mascara/, 'mascara']];

/**
 * The shade (and finish) each product should have for the look they want: colours they typed come first
 * ("cherry cola lips"), then each trend look's own colours, then their own skin for base products.
 */
export function lookTargets(s: RoutineState): Record<string, { lab: Lab; finish?: string }> {
  const out: Record<string, { lab: Lab; finish?: string }> = {};
  const put = (cat: string, w: string, finish?: string) => { const l = lab(w); if (l && !out[cat]) out[cat] = { lab: l, finish }; };
  const warm = pref(s, 'mk_undertone')[0] === 'Warm' || pref(s, 'mk_undertone')[0] === 'Olive';
  // 1. Colours they typed, matched to the nearest product word after or before them.
  const text = (s.lookText ?? '').toLowerCase();
  for (const c of shadeWords(text)) {
    const around = text.slice(Math.max(0, c.at - 20), c.at + c.w.length + 24);
    const cat = NEAR.find(([re]) => re.test(around))?.[1] ?? 'lips';
    put(cat, c.w);
  }
  // 2. Each trend look's colours.
  const lip = pref(s, 'mk_lip_look')[0], eye = pref(s, 'mk_eye_look')[0], face = pref(s, 'mk_face_look')[0];
  if (lip === 'Lip contour') { put('lips', 'nude brown'); put('lip_gloss', 'clear', 'gloss'); }
  if (lip === 'Blurred lip') put('lips', 'rosewood', 'matte');
  if (lip === 'Glossy') put('lip_gloss', warm ? 'peach' : 'sheer pink', 'gloss');
  if (lip === 'Bold lip') put('lips', warm ? 'orange red' : 'true red');
  if (eye === 'Smudged kohl') put('eyeliner', 'dark brown');
  if (eye === 'Micro wing' || eye === 'Siren eyes') put('eyeliner', 'black');
  if (eye === 'Siren eyes') put('eyeshadow', 'soft brown');
  if (eye === 'Soft metallic') put('eyeshadow', warm ? 'champagne' : 'opal', 'metallic');
  if (eye === 'Barely there') put('mascara', 'dark brown');
  if (face === 'Toasty') { put('bronzer', 'bronze'); put('blush', 'terracotta'); }
  if (face === 'Soft sculpt') { put('bronzer', 'cool brown'); put('blush', 'dusty rose'); }
  if (face === 'Cloud skin') { put('blush', 'petal'); put('foundation', 'nude', 'matte'); }
  if (face === 'Skin first') put('blush', warm ? 'peach' : 'pink nude');
  // 3. Base products match their own skin, not the look.
  const tone = ({ Fair: 'fair', Light: 'light', Medium: 'medium', Tan: 'tan', Deep: 'deep', Rich: 'rich' } as Record<string, string>)[pref(s, 'mk_tone')[0] ?? ''];
  if (tone) for (const c of ['foundation', 'concealer', 'powder']) put(c, tone, out.foundation?.finish);
  return out;
}

/**
 * "You can achieve this look": the routine it takes, one product per step, inside their budget and
 * preferences (best fit first), as a readable list.
 */
export function achieveList(picks: { item: Item }[]): string[] {
  return picks.map(p => `${p.item.brand ? `${p.item.brand} ` : ''}${p.item.name}`);
}
