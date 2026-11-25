import type { Item } from './model';
import { labToHex } from './color';
import SHADES_JSON from './shades.json';

/**
 * The colour a product shows in its glass ball: its shade when the name says one ("Ruby", "Nude 03",
 * "Berry gloss"), otherwise a soft colour for what it is. Later keys win over earlier ones, so
 * "brown-red" reads as red and "rose gold" as gold.
 */
const SHADES: [RegExp, string][] = [
  [/\b(clear|transparent|crystal)\b/i, '#EDEFF5'],
  [/\b(white|ivory|porcelain|snow)\b/i, '#F4EFE8'],
  [/\b(fair|light|vanilla|cream|beige|sand|nude|bare|natural|buff)\b/i, '#E4C3A6'],
  [/\b(medium|honey|caramel|tan|golden beige|warm)\b/i, '#C99468'],
  [/\b(deep|rich|espresso|cocoa|mocha|chocolate|brown|bronze|toffee|cinnamon|latte|chestnut)\b/i, '#8A5A3C'],
  [/\b(black|onyx|carbon|jet|noir|ink)\b/i, '#2A2A30'],
  [/\b(gr[ae]y|slate|charcoal|smoke|taupe|ash)\b/i, '#8C8790'],
  [/\b(peach|apricot|coral|salmon)\b/i, '#F2A285'],
  [/\b(orange|tangerine|terracotta|rust|copper)\b/i, '#D9733F'],
  [/\b(gold|champagne|glow|highlight|shimmer|glitter)\b/i, '#E5C46B'],
  [/\b(pink|rose|blush|petal|ballet|flamingo|bubblegum)\b/i, '#F0A6BE'],
  [/\b(mauve|dusty|lilac|lavender|orchid)\b/i, '#B98BB4'],
  [/\b(purple|violet|grape|amethyst|plum|aubergine)\b/i, '#7B4A87'],
  [/\b(berry|raspberry|fuchsia|magenta)\b/i, '#B83A72'],
  [/\b(red|ruby|cherry|scarlet|crimson|poppy|cola)\b/i, '#C8323C'],
  [/\b(wine|burgundy|oxblood|merlot|bordeaux)\b/i, '#6E1F2E'],
  [/\b(blue|navy|cobalt|sapphire|denim)\b/i, '#4C6FB4'],
  [/\b(green|emerald|olive|sage|khaki)\b/i, '#5E8A5C'],
];

/** What a product of this kind usually looks like, when its name names no shade. */
const BY_CATEGORY: Record<string, string> = {
  foundation: '#D9B08C', concealer: '#E2BF9C', powder: '#E8CDB3', primer: '#EFE6E0', bronzer: '#A86B45', blush: '#EE9AA8', highlighter: '#E8D08A',
  lips: '#C8566A', lip_gloss: '#F1B3C4', mascara: '#2E2C34', eyeliner: '#34323A', brows: '#7A5640', eyeshadow: '#B68AA6', setting_spray: '#DDE6F2',
};

const DICT = [...(SHADES_JSON as { shades: { w: string; hex: string }[] }).shades].sort((a, b) => b.w.length - a.w.length)
  .map(x => ({ ...x, re: new RegExp(`\\b${x.w.replace(/ /g, '\\s+')}\\b`, 'i') }));

/** The product's shade as a colour: its stored Lab shade, else the shade dictionary, else a few broad words, else its kind. */
export function shadeOf(i?: Pick<Item, 'name' | 'category'> & { lab?: [number, number, number] } | null): string | undefined {
  if (!i) return undefined;
  if (i.lab) return labToHex(i.lab);
  const d = DICT.find(x => x.re.test(i.name));
  if (d) return d.hex;
  let hit: string | undefined;
  for (const [re, hex] of SHADES) if (re.test(i.name)) hit = hex;
  return hit ?? BY_CATEGORY[i.category];
}

/** Every shade word found in some text, longest first ("cherry cola" before "cherry"). */
export function shadeWords(text: string): { w: string; hex: string; at: number }[] {
  const out: { w: string; hex: string; at: number }[] = [];
  let t = text.toLowerCase();
  for (const d of DICT) { const m = d.re.exec(t); if (m) { out.push({ w: d.w, hex: d.hex, at: m.index }); t = t.slice(0, m.index) + ' '.repeat(m[0].length) + t.slice(m.index + m[0].length); } }
  return out.sort((a, b) => a.at - b.at);
}
