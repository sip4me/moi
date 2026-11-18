// Same glyph family as the Figma "Rec icon/*" components: 24-unit grid, colored by ring color.
const B = '#5B8DEF', GR = '#6BAF7B', RD = '#E5484D', GD = '#C9A24A', INK = '#0A0A0A';

const G: Record<string, (c: string) => string> = {
  drop: c => `<path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11Z" fill="${c}"/>`,
  pipette: c => `<path d="M14.5 3.5a2.6 2.6 0 0 1 3.7 0l2.3 2.3a2.6 2.6 0 0 1 0 3.7l-1.6 1.6-6-6 1.6-1.6Z" fill="${c}"/><path d="m12 7 5 5-7.5 7.5c-.6.6-1.4.9-2.2.8l-1.6-.2-1.8 1.9-1.4-1.4 1.9-1.8-.2-1.6c-.1-.8.2-1.6.8-2.2L12 7Z" fill="${c}" fill-opacity=".55"/>`,
  phone: c => `<rect x="7" y="2.5" width="10" height="19" rx="2.5" fill="none" stroke="${c}" stroke-width="1.8"/><path d="M10.5 18.5h3" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`,
  flame: c => `<path d="M12 2c.5 3.2 4.5 5.4 4.5 10a4.5 4.5 0 0 1-9 0c0-2 1-3.4 2-4.3.2 1.6 1 2.5 1.8 2.8C10.8 7.6 11 4.5 12 2Z" fill="${c}"/><path d="M12 13c1 1 1.8 2 1.8 3.2a1.8 1.8 0 0 1-3.6 0c0-1.2.8-2.2 1.8-3.2Z" fill="#fff" fill-opacity=".7"/>`,
  moon: c => `<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="${c}"/>`,
  hand: c => `<circle cx="12" cy="12" r="8" fill="none" stroke="${c}" stroke-width="2.4"/><circle cx="12" cy="12" r="3" fill="${c}"/>`,
  oil: c => `<path d="M12 4s5 5.5 5 9.2A5 5 0 0 1 7 13.2C7 9.5 12 4 12 4Z" fill="${c}"/><circle cx="17.5" cy="6" r="2" fill="${c}" fill-opacity=".55"/>`,
  scissors: c => `<circle cx="6.5" cy="17.5" r="2.8" fill="none" stroke="${c}" stroke-width="2"/><circle cx="17.5" cy="17.5" r="2.8" fill="none" stroke="${c}" stroke-width="2"/><path d="M8.5 15.5 18 4M15.5 15.5 6 4" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`,
  tie: c => `<ellipse cx="12" cy="12" rx="8" ry="5" fill="none" stroke="${c}" stroke-width="2.4"/>`,
  comb: c => `<rect x="3" y="6" width="18" height="4.5" rx="1.5" fill="${c}"/><path d="M5.5 10.5v7M9 10.5v7M12.5 10.5v7M16 10.5v7M19.5 10.5v5" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`,
  jar: c => `<rect x="5" y="9" width="14" height="11" rx="3" fill="${c}"/><rect x="4" y="5" width="16" height="4" rx="1.5" fill="${c}" fill-opacity=".55"/>`,
  timer: c => `<circle cx="12" cy="13" r="7.5" fill="none" stroke="${c}" stroke-width="2.2"/><path d="M12 13V9.5M9.5 2.8h5" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`,
  spray: c => `<rect x="7" y="9" width="10" height="12" rx="2.5" fill="${c}"/><rect x="9" y="5" width="5" height="4" rx="1" fill="${c}" fill-opacity=".6"/><path d="M16 5.5h3M17 3l2-1M17 8l2 1" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>`,
  pillow: c => `<path d="M4 8c0-2 1.5-3 3.5-3h9C18.5 5 20 6 20 8v8c0 2-1.5 3-3.5 3h-9C5.5 19 4 18 4 16V8Z" fill="${c}"/>`,
  scrub: c => `<circle cx="12" cy="12" r="8.5" fill="none" stroke="${c}" stroke-width="2"/><circle cx="9" cy="10" r="1.6" fill="${c}"/><circle cx="14.5" cy="9" r="1.3" fill="${c}"/><circle cx="12" cy="14.5" r="1.8" fill="${c}"/>`,
  flake: c => `<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="12" r="2.4" fill="${c}"/>`,
  wave: c => `<path d="M3 9c3-2 6 2 9 0s6-2 9 0M3 15c3-2 6 2 9 0s6-2 9 0" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`,
  link: c => `<path d="M10 14l4-4M8.5 16.5 7 18a3 3 0 0 1-4.2-4.2L6 10.6M15.5 7.5 17 6a3 3 0 0 1 4.2 4.2L18 13.4" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`,
  bubbles: c => `<circle cx="9" cy="14" r="5" fill="none" stroke="${c}" stroke-width="2"/><circle cx="16.5" cy="8" r="3.2" fill="none" stroke="${c}" stroke-width="2"/><circle cx="17.5" cy="16.5" r="1.8" fill="${c}"/>`,
  bottle: c => `<rect x="7" y="8" width="10" height="13" rx="2.5" fill="${c}"/><rect x="9" y="3.5" width="6" height="4.5" rx="1" fill="${c}" fill-opacity=".6"/>`,
  oilclock: c => `<path d="M10 3s4.5 5 4.5 8.4a4.5 4.5 0 0 1-9 0C5.5 8 10 3 10 3Z" fill="${c}"/><circle cx="17" cy="16.5" r="4.5" fill="#fff" stroke="${c}" stroke-width="1.8"/><path d="M17 14.5v2l1.4 1" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>`,
  shield: c => `<path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3Z" fill="${c}"/><path d="M12 8s2.6 2.9 2.6 4.8a2.6 2.6 0 0 1-5.2 0C9.4 10.9 12 8 12 8Z" fill="#fff"/>`,
  leaf: c => `<path d="M5 19C5 10 11 5 20 4c-1 9-6 15-15 15Z" fill="${c}"/><path d="M5 19 13 11" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
  sprig: c => `<path d="M12 21V4" stroke="${c}" stroke-width="2" stroke-linecap="round"/><ellipse cx="8.5" cy="8" rx="3" ry="1.4" transform="rotate(-30 8.5 8)" fill="${c}"/><ellipse cx="15.5" cy="10" rx="3" ry="1.4" transform="rotate(30 15.5 10)" fill="${c}"/><ellipse cx="8.5" cy="13" rx="3" ry="1.4" transform="rotate(-30 8.5 13)" fill="${c}"/><ellipse cx="15.5" cy="15" rx="3" ry="1.4" transform="rotate(30 15.5 15)" fill="${c}"/>`,
  seed: c => `<ellipse cx="12" cy="12" rx="5" ry="8" transform="rotate(35 12 12)" fill="${c}"/>`,
  seeds: c => `<ellipse cx="8" cy="9" rx="2.6" ry="4.5" transform="rotate(30 8 9)" fill="${c}"/><ellipse cx="15.5" cy="8" rx="2.6" ry="4.5" transform="rotate(-25 15.5 8)" fill="${c}"/><ellipse cx="12" cy="16.5" rx="2.6" ry="4.5" transform="rotate(80 12 16.5)" fill="${c}"/>`,
  shieldflame: c => `<path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3Z" fill="${c}"/><path d="M12 7.5c.3 1.8 2.6 3 2.6 5.6a2.6 2.6 0 0 1-5.2 0c0-1.1.6-1.9 1.2-2.4.1.9.6 1.4 1 1.6-.2-2 0-3.7.4-4.8Z" fill="#fff"/>`,
  ring: c => `<circle cx="12" cy="12" r="7.5" fill="none" stroke="${c}" stroke-width="2.6"/><circle cx="12" cy="12" r="3.5" fill="none" stroke="${c}" stroke-width="1.6"/>`,
  apple: c => `<path d="M12 7.5c-3-2-8-1-8 5 0 4.5 3 8.5 5 8.5 1 0 2-.6 3-.6s2 .6 3 .6c2 0 5-4 5-8.5 0-6-5-7-8-5Z" fill="${c}"/><path d="M12 7.5c0-2 1-3.5 3-4.2" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`,
  sun: c => `<circle cx="12" cy="12" r="4.5" fill="${c}"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`,
  wind: c => `<path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`,
  steth: c => `<path d="M6 3v5a5 5 0 0 0 10 0V3M11 13v2.5a4.5 4.5 0 0 0 9 0V13" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="11" r="2" fill="${c}"/>`,
  tube: c => `<path d="M8.5 3h7M10 3v14a2 2 0 0 0 4 0V3" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/><path d="M10 11.5h4V17a2 2 0 0 1-4 0v-5.5Z" fill="${c}"/>`,
  magnifier: c => `<circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="${c}" stroke-width="2.2"/><path d="m15.5 15.5 5 5" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`,
};

export const LEVER_ICON: Record<string, [string, string]> = {
  wash_interval: ['drop', B], leave_in: ['pipette', GR], heat_cap: ['flame', RD], satin: ['moon', GD],
  scalp_massage: ['hand', RD], ends_oil: ['oil', GD], trim: ['scissors', B], loose_styles: ['tie', GD],
  detangle: ['comb', GR], deep_condition: ['jar', GR], rinse: ['timer', GR], dry_shampoo: ['spray', GD],
  pillowcase: ['pillow', RD], scalp_scrub: ['scrub', B], anti_dandruff: ['flake', B], swim_prep: ['wave', B],
  bond_repair: ['link', RD], gentle_wash: ['bubbles', B], conditioner: ['bottle', GR], pre_wash_oil: ['oilclock', GD],
  keto_wash: ['shield', B], tea_tree: ['leaf', GR], rosemary: ['sprig', GR], flax_gel: ['seed', GD],
  flax_diet: ['seeds', GD], heat_protect: ['shieldflame', RD], soft_ties: ['ring', GD], hair_food: ['apple', RD],
  sun_cover: ['sun', GD], wind_down: ['wind', B],
  learn_minoxidil: ['steth', INK], learn_ferritin: ['tube', INK], learn_scalp_derm: ['magnifier', INK], learn_pregnancy: ['steth', INK],
};

export function leverColor(id: string) { return (LEVER_ICON[id] ?? ['drop', B])[1]; }
export function leverSvg(id: string, colorOverride?: string) {
  const [g, c] = LEVER_ICON[id] ?? ['drop', B];
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${G[g](colorOverride ?? c)}</svg>`;
}
export function glyphSvg(name: string, color: string) {
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${G[name](color)}</svg>`;
}
