// Animated illustrations rebuilt from the Figma references page (same geometry, same two frames).
// Poses are in the 280 × 210 artboard; rotations are CSS degrees (clockwise), i.e. Figma's sign flipped.
import type { ArtLayer, ArtSpec } from '../components/TwoFrameArt';
import { FOLLICLE } from '../components/WashDayArt';

const INK = '#2F3B3B', AMBER = '#F4C96B', PINK = '#F4B6C8';
const svg = (vb: string, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="none" overflow="visible">${body}</svg>`;
const STAR = svg('0 0 24 24', `<path d="M12 0Q13.5 10.5 24 12Q13.5 13.5 12 24Q10.5 13.5 0 12Q10.5 10.5 12 0Z" fill="${INK}"/>`);
const star = (a: [number, number, number, number], b: [number, number, number, number]): ArtLayer =>
  ({ svg: STAR, w: 24, h: 24, a: { cx: a[0], cy: a[1], sx: a[2], sy: a[2], op: a[3] }, b: { cx: b[0], cy: b[1], sx: b[2], sy: b[2], op: b[3] } });

// ── Pre-wash oil (Figma "Illustration / Pre-wash oil (animated drop)") ─────────────
const DROP = svg('-3 -3 30 37', `<path d="M12 1C12 1 3 13.5 3 20.5C3 26 7 30 12 30C17 30 21 26 21 20.5C21 13.5 12 1 12 1Z" fill="${AMBER}" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/><circle cx="9.5" cy="19.5" r="2.5" fill="#fff"/>`);
const drop = (a: [number, number, number, number], b: [number, number, number, number]): ArtLayer =>
  ({ svg: DROP, w: 30, h: 37, a: { cx: a[0], cy: a[1], sx: a[2], sy: a[2], op: a[3] }, b: { cx: b[0], cy: b[1], sx: b[2], sy: b[2], op: b[3] } });
const BEAD = svg('0 0 24 17', `<ellipse cx="12" cy="8.5" rx="10" ry="6.5" fill="${AMBER}" stroke="${INK}" stroke-width="4"/>`);
const bead = (a: [number, number, number], b: [number, number, number]): ArtLayer =>
  ({ svg: BEAD, w: 24, h: 17, a: { cx: a[0], cy: a[1], sx: a[2], sy: a[2] }, b: { cx: b[0], cy: b[1], sx: b[2], sy: b[2] } });

export const OIL_ART: ArtSpec = {
  W: 280, H: 210, label: 'Pre-wash oil: a dropper adds oil drops to a hair strand',
  layers: [
    { svg: svg('0 0 280 210', FOLLICLE), w: 280, h: 210, a: { cx: 140, cy: 105 } },
    // Dropper tube and collar stay put; the bulb squeezes.
    { svg: svg('0 0 40 70', `<path d="M14 36H26L23 64.7C22.6 67.8 17.4 67.8 17 64.7L14 36Z" fill="#fff" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><rect x="4" y="27" width="32" height="9" rx="4" fill="#fff" stroke="${INK}" stroke-width="5"/>`), w: 40, h: 70, a: { cx: 128, cy: 43 } },
    { svg: svg('0 0 30 34', `<rect x="3" y="3" width="24" height="28" rx="12" fill="#fff" stroke="${INK}" stroke-width="5"/>`), w: 30, h: 34, a: { cx: 128, cy: 22 }, b: { cx: 128, cy: 25, sx: 1.25, sy: 0.79 } },
    drop([127.8, 82.1, 0.65, 1], [127.9, 90.7, 0.95, 1]),   // the drop gathering at the tip
    drop([145.4, 102.9, 0.7, 1], [139.4, 122.9, 0.7, 0.85]), // a landed drop gliding down the strand
    { svg: svg('-2 -2 16 30', '<path d="M0 26C3 16 7 8 12 0" stroke="#fff" stroke-width="4" stroke-linecap="round"/>'), w: 16, h: 30, a: { cx: 171, cy: 77 }, b: { cx: 156, cy: 125 } },
    bead([98.3, 141.8, 0.84], [96.1, 140.3, 1.075]),
    bead([201.7, 142.2, 1.025], [203.9, 140.7, 0.79]),
    star([206.8, 62.8, 0.9, 1], [202.7, 58.7, 0.55, 0.35]),
    star([216.1, 98.1, 0.5, 0.4], [220.2, 102.2, 0.85, 1]),
    star([79, 101, 0.75, 1], [75.5, 97.5, 0.45, 0.4]),
    star([92.9, 50.9, 0.4, 0.35], [96.5, 54.5, 0.7, 1]),
  ],
};

// ── Night pineapple (Figma "Illustration / Night pineapple (animated)") ───────────
const HAND = 'M8 46C3 40 2 32 3 25L3 13C3 9 9 9 9 13L9 22L10 7C10 3 16 3 16 7L16 21L17 5C17 1 23 1 23 5L23 21L24 9C24 5 30 5 30 9L30 28C33 24 38 25 37 30C35 36 32 42 26 46Z';
const hand = (mirror: boolean) => svg('-3 -3 46 54', `<path d="${HAND}" fill="#fff" stroke="${INK}" stroke-width="5" stroke-linejoin="round"${mirror ? ' transform="translate(40 0) scale(-1 1)"' : ''}/>`);

export const PINEAPPLE_ART: ArtSpec = {
  W: 280, H: 210, label: 'Night: hands tie the hair up into a loose pineapple with a scrunchie',
  layers: [
    { svg: svg('-4 -4 56 56', `<path d="M20 0C8 2 0 12 0 24C0 38 12 48 26 48C36 48 44 42 48 34C44 36 40 37 36 37C22 37 12 26 12 14C12 8 15 3 20 0Z" fill="${AMBER}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>`), w: 35, h: 35, a: { cx: 33, cy: 31 } },
    star([69, 23, 0.75, 1], [65.4, 19.4, 0.45, 0.4]),
    star([241.4, 23.4, 0.45, 0.35], [245.6, 27.6, 0.8, 1]),
    star([257.2, 77.2, 0.6, 1], [254.8, 74.8, 0.4, 0.45]),
    // Hair worn down rises up and away into the pineapple.
    { svg: svg('-3 -3 114 126', `<path d="M0 120C6 90 -2 60 6 36C14 10 40 0 54 0C68 0 94 10 102 36C110 60 102 90 108 120C96 112 86 112 78 118L30 118C22 112 12 112 0 120Z" fill="#fff" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`), w: 114, h: 126, a: { cx: 140, cy: 116 }, b: { cx: 140, cy: 64, sx: 0.65, sy: 0.5, op: 0 } },
    { svg: svg('-3 -3 186 46', `<path d="M0 40C10 12 50 2 90 2C130 2 170 12 180 40" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`), w: 186, h: 46, a: { cx: 140, cy: 194 } },
    { svg: svg('-3 -3 36 32', `<path d="M0 0L0 26M30 0L30 26" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`), w: 36, h: 32, a: { cx: 140, cy: 163 } },
    { svg: svg('-3 -3 82 96', `<ellipse cx="38" cy="45" rx="38" ry="45" fill="#fff" stroke="${INK}" stroke-width="6"/>`), w: 82, h: 96, a: { cx: 140, cy: 111 } },
    { svg: svg('-3 -3 82 54', `<path d="M0 48C-4 18 14 0 38 0C62 0 80 18 76 48C70 28 56 20 38 20C20 20 6 28 0 48Z" fill="#fff" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`), w: 82, h: 54, a: { cx: 140, cy: 88 }, b: { cx: 140, cy: 84, sy: 0.83 } },
    { svg: svg('-6 -3 92 50', `<path d="M0 40C-4 28 6 18 16 22C16 8 34 4 40 16C46 4 64 8 64 22C74 18 84 28 80 40C70 46 12 46 0 40Z" fill="#fff" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`), w: 92, h: 50, a: { cx: 140, cy: 71, sx: 0.53, sy: 0.5, op: 0 }, b: { cx: 140, cy: 34, sx: 1.2, sy: 1.18, op: 1 } },
    { svg: svg('-2 -2 16 13', `<path d="M0 8C4 0 12 2 10 8" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`), w: 16, h: 13, a: { cx: 142, cy: 68.5, op: 0 }, b: { cx: 140, cy: 30.5, op: 1 } },
    { svg: hand(false), w: 46, h: 54, a: { cx: 84, cy: 104, rot: 16 }, b: { cx: 100, cy: 66, rot: 58 } },
    { svg: hand(true), w: 46, h: 54, a: { cx: 196, cy: 104, rot: -16 }, b: { cx: 180, cy: 66, rot: -58 } },
    // The scrunchie moves from the wrist to the base of the pineapple.
    { svg: svg('-3 -3 44 20', `<ellipse cx="19" cy="7" rx="19" ry="7" fill="${PINK}" stroke="${INK}" stroke-width="5"/>`), w: 44, h: 20, a: { cx: 80, cy: 130, sx: 0.79, sy: 0.93, rot: 16 }, b: { cx: 140, cy: 60 } },
  ],
};

export const OIL_TIMING = { toB: 900, toA: 900 };
export const PINEAPPLE_TIMING = { toB: 1200, holdB: 1200, toA: 1200, holdA: 400 };
