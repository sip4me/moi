// The picture on each token coin: line drawings in a deep shade of the coin's own colour (52 × 52 coin, art
// kept inside the inner ring). Shared by the app and the Figma sheet so they never drift apart.

export type Glyph = { paths?: string[]; fills?: string[]; solid?: string[]; circles?: [number, number, number][]; dots?: [number, number, number][] };

export const TOKEN_ART: Record<string, Glyph> = {
  // First Twirl — a single curl
  pair: { paths: ['M27 35c-6 0-10-4-10-9s4-9 9-9c4 0 7 3 7 7 0 3-2 5-5 5-2 0-4-2-4-4'] },
  // Baby Hairs — three little wisps
  baby: { paths: ['M19 34c0-5 2-9 6-12', 'M25 35c0-7 2-12 6-16', 'M31 34c0-4 1-7 4-9'] },
  // Sparkle Spritz — spray bottle and a sparkle
  spark: { paths: ['M20 25h9v10a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2z', 'M22 25v-4h5v4', 'M27 21h3'], fills: ['M36 15l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z'] },
  // Velvet Ribbon — a bow
  ribbon: { paths: ['M26 25c-3-4-8-6-9.5-3.5S19 27.5 26 25c7 2.5 11 0 9.5-2.5S29 21 26 25z', 'M26 25l-4 10', 'M26 25l4 10'] },
  // Silk Pillow Pact — a soft pillow
  silk: { paths: ['M16 20q10-3 20 0-2 6 0 12-10 3-20 0 2-6 0-12z', 'M21 24q5 2 10 0'] },
  // Bonnet Buddies — a satin bonnet
  bonnet: { paths: ['M15 32c0-9 5-14 11-14s11 5 11 14z', 'M15 32h22', 'M20 27q6-3 12 0'] },
  // Moonlit Pineapple — a little pineapple under a crescent moon
  pineapple: { paths: ['M27 22.5c4 0 6.5 3.5 6.5 7.5s-2.5 7.5-6.5 7.5-6.5-3.5-6.5-7.5 2.5-7.5 6.5-7.5z', 'M22.5 26.5l9 7.5', 'M31.5 26.5l-9 7.5', 'M27 22.5l-3.5-5.5', 'M27 22.5v-7', 'M27 22.5l3.5-5.5'], solid: ['M16 13.5a4.4 4.4 0 1 0 3.6 7.6 3.5 3.5 0 1 1-3.6-7.6z'] },
  // Honey Drizzle — a honey drop
  honey: { paths: ['M26 15c-4 6-7 10-7 14a7 7 0 0 0 14 0c0-4-3-8-7-14z', 'M23 30a3 3 0 0 0 3 3'] },
  // Curl Constellation — linked stars
  curls: { paths: ['M18 31l7-11 8 7 3 7'], dots: [[18, 31, 2], [25, 20, 2], [33, 27, 2], [36, 34, 2]] },
  // Lather Legend — bubbles
  lather: { circles: [[22, 29, 5.5], [31.5, 22, 3.8], [32, 32, 2.6]] },
  // Shower Pearl — a pearl with its shine
  pearl: { circles: [[26, 26, 8.5]], paths: ['M21.5 23.5a5 5 0 0 1 4-3.5'] },
  // Rosewater Rendezvous — a rose
  rose: { paths: ['M26 19c4 0 7 3 7 7 0 4-3 7-7 7s-7-3-7-7c0-3 2-5 5-5 2 0 4 2 4 4 0 1.5-1 3-3 3'] },
  // Golden Comb — a comb
  comb: { paths: ['M16 21h20v5H16z', 'M18.5 26v8', 'M21.5 26v8', 'M24.5 26v8', 'M27.5 26v8', 'M30.5 26v8', 'M33.5 26v8'] },
  // Mermaid Mane — a mermaid tail
  mermaid: { paths: ['M24 14c4 4 5 9 2 15'], solid: ['M26 29c-2.5 3.5-6 5.5-9.5 5.5 1.5-3.5 5.5-6 9.5-5.5 4-.5 8 2 9.5 5.5-3.5 0-7-2-9.5-5.5z'] },
  // Starlight Scrunchie — a scrunchie with a star
  scrunchie: { paths: ['M26 17.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 1 1 0-17z'], fills: ['M26 22.5l1 2.3 2.4.3-1.8 1.6.5 2.4-2.1-1.2-2.1 1.2.5-2.4-1.8-1.6 2.4-.3z'] },
  // The Royal Crown — the Moi crown
  crown: { fills: ['M16 31l2-11 5 5 3-7 3 7 5-5 2 11z'] },
};

/** The coin as an SVG string (used for the Figma sheet). */
/** A deeper shade of a hex colour, for line art that reads on the light middle of the coin. */
export function deepen(hex: string, k = 0.35): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(v * (1 - k)).toString(16).padStart(2, '0');
  return `#${ch(n >> 16)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

export function coinSvg(id: string, color: readonly [string, string], earned = true, x = 0, y = 0): string {
  const g = TOKEN_ART[id] ?? TOKEN_ART.crown;
  const ink = deepen(color[1]);
  const grad = `g-${id}`;
  const art = [
    ...(g.paths ?? []).map(d => `<path d="${d}" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`),
    ...(g.fills ?? []).map(d => `<path d="${d}" fill="#fff" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/>`),
    ...(g.solid ?? []).map(d => `<path d="${d}" fill="${ink}" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>`),
    ...(g.circles ?? []).map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${ink}" stroke-width="2.4"/>`),
    ...(g.dots ?? []).map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${ink}"/>`),
  ].join('');
  return `<g transform="translate(${x} ${y})"><defs><radialGradient id="${grad}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset="0.45" stop-color="${color[0]}"/><stop offset="1" stop-color="${color[1]}"/></radialGradient></defs>`
    + `<circle cx="26" cy="26" r="24" fill="${earned ? `url(#${grad})` : '#EDEDEF'}" stroke="${earned ? color[1] : '#DDDDE0'}" stroke-width="1.5"/>`
    + `<circle cx="26" cy="26" r="19" fill="none" stroke="${earned ? '#ffffff99' : '#D5D5D8'}" stroke-width="1"/>`
    + (earned ? art : '') + '</g>';
}
