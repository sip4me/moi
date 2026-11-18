// Trending hairstyles (winter 2026, from stylist round-ups in Bustle, Who What Wear, Refinery29, Marie Claire,
// Byrdie and MadameNoire) and the kinds of products each one needs. Product types only — never brands —
// so "Find one" searches the catalog and the person's own fit score decides.

import type { Profile } from '../engine/planEngine';

export interface Trend {
  id: string; name: string; icon: string;
  blurb: string;
  /** Hair textures it works best on; empty = any. */
  bestFor: Profile['texture'][];
  products: { type: string; why: string; search: string }[];
  steps: string[];
  /** A heads-up when the style works against someone's goal. */
  care?: { when: (p: Profile) => boolean; note: string };
}

export const TRENDS: Trend[] = [
  { id: 'blowout', name: '’90s bouncy blowout', icon: 'style_blowout', bestFor: ['straight', 'wavy'],
    blurb: 'Big root volume and ends curled under — the “expensive hair” look stylists say is back.',
    products: [
      { type: 'Heat protectant', why: 'Non-negotiable with a round brush and high heat.', search: 'heat protectant' },
      { type: 'Volumizing mousse', why: 'Gives roots lift that lasts all day.', search: 'volume mousse' },
      { type: 'Large round brush or velcro rollers', why: 'Sets the bend in the ends.', search: 'round brush' },
      { type: 'Light flexible hairspray', why: 'Holds the shape without crunch.', search: 'hairspray' },
    ],
    steps: ['Mousse at the roots on damp hair, then protectant through the lengths.', 'Rough-dry to 80%, then dry in sections over a round brush, rolling the ends under.', 'Pin each section in a roller while it cools, 10 minutes. Brush out and mist.'],
    care: { when: p => (p.goals ?? [p.goal]).includes('repair'), note: 'You’re working on frizz and breakage: keep the dryer on medium and save this for once a week.' } },
  { id: 'bob', name: 'Soft layered bob', icon: 'style_bob', bestFor: [],
    blurb: 'The bob is still everywhere, now lighter and more fluid with blended layers.',
    products: [
      { type: 'Texture spray', why: 'Separates layers for that undone movement.', search: 'texture spray' },
      { type: 'Light smoothing cream', why: 'Tames the ends without weighing the cut down.', search: 'smoothing cream' },
      { type: 'Heat protectant', why: 'For a quick flat-iron bend.', search: 'heat protectant' },
    ],
    steps: ['Ask for a chin-to-collarbone bob with soft, blended internal layers.', 'Air-dry or blow-dry with your fingers; bend the ends with a flat iron.', 'Mist texture spray and scrunch.'] },
  { id: 'curtain', name: 'Curtain bangs', icon: 'style_curtain', bestFor: ['straight', 'wavy'],
    blurb: 'Face-framing fringe split down the middle is back again for 2026.',
    products: [
      { type: 'Small round brush', why: 'Shapes each side away from the face.', search: 'round brush' },
      { type: 'Dry shampoo', why: 'Bangs get oily first — this buys an extra day.', search: 'dry shampoo' },
    ],
    steps: ['Dry the bangs first, while damp, brushing each side up and away.', 'Finish with a cool shot to set.', 'Refresh day two with dry shampoo at the root.'],
    care: { when: p => p.scalp === 'oily', note: 'With an oily scalp, wash just your bangs in the sink between wash days.' } },
  { id: 'curls', name: 'Halo curls', icon: 'style_curls', bestFor: ['curly', 'coily', 'wavy'],
    blurb: 'Defined, elongated curls with full, round volume — embracing natural texture.',
    products: [
      { type: 'Leave-in conditioner', why: 'Moisture base so curls clump.', search: 'leave-in conditioner' },
      { type: 'Curl cream', why: 'Definition and softness.', search: 'curl cream' },
      { type: 'Strong-hold gel', why: 'Locks the clumps in place as they dry.', search: 'curl gel' },
      { type: 'Diffuser', why: 'Dries for volume without blowing curls apart.', search: 'diffuser' },
      { type: 'Satin bonnet or pillowcase', why: 'Keeps the shape overnight.', search: 'satin bonnet' },
    ],
    steps: ['On soaking-wet hair: leave-in, then curl cream, then gel, in sections.', 'Diffuse on low, cupping curls up toward the scalp.', 'Once dry, scrunch out the crunch and fluff the roots.'] },
  { id: 'braids', name: 'Knotless braids', icon: 'style_braids', bestFor: ['coily', 'curly'],
    blurb: 'Still the front-runner in protective styling — lighter and gentler at the root.',
    products: [
      { type: 'Pre-stretched braiding hair', why: 'Ready to use, lighter than standard.', search: 'braiding hair' },
      { type: 'Light leave-in or braid spray', why: 'Keeps your own hair moisturised underneath.', search: 'braid spray' },
      { type: 'Setting mousse', why: 'Smooths flyaways after install.', search: 'setting mousse' },
      { type: 'Satin scarf', why: 'Protects the braids and edges at night.', search: 'satin scarf' },
    ],
    steps: ['Start with clean, conditioned, stretched hair.', 'Ask for medium sizes and no pain at the root — tightness isn’t a sign of a good install.', 'Take them out by 6–8 weeks and deep-condition.'],
    care: { when: p => (p.goals ?? [p.goal]).includes('keep') || p.tightStyles, note: 'You want to hold on to density: go medium-to-large, never tight, and give your edges a break between installs.' } },
  { id: 'bixie', name: 'The bixie', icon: 'style_bixie', bestFor: ['straight', 'wavy', 'curly'],
    blurb: 'Half bob, half pixie — 2026’s breakout short cut.',
    products: [
      { type: 'Matte paste or pomade', why: 'Pieces out the short layers.', search: 'hair paste' },
      { type: 'Heat protectant', why: 'For a quick blow-dry.', search: 'heat protectant' },
    ],
    steps: ['Ask for a short, shaggy bob with pixie-length layers at the crown.', 'Blow-dry forward with your fingers.', 'Warm a pea of paste in your hands and twist a few pieces.'] },
  { id: 'bun', name: 'Relaxed princess bun', icon: 'style_bun', bestFor: [],
    blurb: 'A polished-but-tousled updo with face-framing pieces.',
    products: [
      { type: 'Texture spray', why: 'Gives grip so the bun holds without pins.', search: 'texture spray' },
      { type: 'Soft scrunchie or spiral tie', why: 'Holds without snapping strands.', search: 'scrunchie' },
    ],
    steps: ['Spray texture through dry hair.', 'Twist into a loose bun high on the head; secure with a soft scrunchie.', 'Pull out a few front pieces and loosen the top slightly.'] },
  { id: 'glass', name: 'Glass hair', icon: 'style_glass', bestFor: ['straight', 'wavy'],
    blurb: 'Ultra-smooth, mirror-shine strands with a clean part.',
    products: [
      { type: 'Heat protectant', why: 'Essential before a flat iron.', search: 'heat protectant' },
      { type: 'Smoothing serum', why: 'Seals the cuticle for shine.', search: 'smoothing serum' },
      { type: 'Gloss treatment', why: 'An at-home gloss adds the glassy finish.', search: 'hair gloss' },
      { type: 'Flat iron with temperature control', why: 'Keep it under 300 °F (150 °C).', search: 'flat iron' },
    ],
    steps: ['Gloss in the shower, then protectant on damp hair.', 'Blow-dry smooth, then pass a flat iron once per thin section.', 'One or two drops of serum on the lengths.'],
    care: { when: p => p.porosity === 'high' || p.chemical !== 'none', note: 'Your hair is more fragile: one pass of the iron, never two, and skip it on non-event days.' } },
];

export const trendsFor = (p: Profile) =>
  [...TRENDS].sort((a, b) => Number(b.bestFor.length === 0 || b.bestFor.includes(p.texture)) - Number(a.bestFor.length === 0 || a.bestFor.includes(p.texture)));
