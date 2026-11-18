/** Product category, guessed from the name and label, for the shelf row's caption, tint and how-often line. */
export type Kind = 'shampoo' | 'conditioner' | 'styling' | 'treatment' | 'other';

export const KIND: Record<Kind, { caption: string; tint: string; usage: (washEvery: number) => string }> = {
  shampoo: { caption: 'SHAMPOO', tint: '#7E9488', usage: n => (n <= 1 ? 'Every day' : `Every ${n} days`) },
  conditioner: { caption: 'CONDITIONER', tint: '#C4A574', usage: () => 'After every wash' },
  styling: { caption: 'STYLING', tint: '#5B8DEF', usage: () => 'On styling days' },
  treatment: { caption: 'TREATMENT', tint: '#E05A5A', usage: () => 'Once a week' },
  other: { caption: 'PRODUCT', tint: '#9A8FB8', usage: () => 'As needed' },
};

// Order matters: a "clarifying scalp scrub" is a treatment, a "hair oil shampoo" is a shampoo.
const RULES: [Kind, RegExp][] = [
  ['treatment', /mask|masque|treatment|scrub|serum|bond|plex|tonic|exfoli/i],
  ['shampoo', /shampoo|cleanser|co-?wash|clarif/i],
  ['conditioner', /conditioner|condition(?!ing mask)|detangl/i],
  ['styling', /mousse|gel|spray|cream|curl|leave-?in|pomade|wax|custard|styl|heat protect/i],
  ['treatment', /\boil\b/i],
];

export function kindOf(name: string, label = ''): Kind {
  for (const [k, re] of RULES) if (re.test(name)) return k;
  // Fall back to the label: cleansing surfactants near the top usually mean a shampoo.
  if (/sodium (laureth|lauryl) sulfate|cocamidopropyl betaine|decyl glucoside/i.test(label.split(',').slice(0, 4).join(','))) return 'shampoo';
  if (/behentrimonium|cetrimonium/i.test(label)) return 'conditioner';
  return 'other';
}
