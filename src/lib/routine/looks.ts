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
