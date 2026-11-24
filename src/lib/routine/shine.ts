import { Platform } from 'react-native';

/**
 * Moi's jewellery finishes, drawn from the moodboard: brushed titanium, rose-sake glass,
 * cat-eye blue. On web, words become shiny letters (a metallic gradient clipped to the
 * glyphs, with a slow light sweep). Native falls back to the solid colour.
 */
export const PALETTE = {
  pearl: '#F6F7FA',
  frost: '#EEF1F7',
  titanium: '#988D86',
  ice: '#DCE6F7',
  icy: '#A9BCDD',
  cobalt: '#2B3FC8',
  rose: '#E8A9A0',
  roseDeep: '#C97B7B',
  peach: '#EFBEB4',
  butter: '#F3E5CD',
  pistachio: '#D9E58F',
  champagne: '#C9A86A',
  ink: '#0E0E10',
  quiet: '#8E9298', // light grey for things you read, not tap
  // Buttons: rose-garnet lacquer, the complement to cobalt progress and champagne finishes.
  garnet: '#A8576A',
  garnetDeep: '#7E3A4C',
};

const CSS = `
@keyframes moiSweep { 0% { background-position: 120% 0; } 55% { background-position: -20% 0; } 100% { background-position: -20% 0; } }
@keyframes moiFlow { 0% { background-position: 0% 0; } 100% { background-position: 200% 0; } }
[data-shine] { -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent !important; background-size: 260% 100%; animation: moiSweep 7s cubic-bezier(.45,.05,.25,1) infinite; }
[data-shine="chrome"] { background-image: linear-gradient(100deg, #0E0E10 0%, #2C2D33 30%, #6F7480 42%, #E9ECF2 49%, #FFFFFF 50%, #E9ECF2 51%, #6F7480 58%, #2C2D33 70%, #0E0E10 100%); }
[data-shine="rose"] { background-image: linear-gradient(100deg, #7E4646 0%, #A35F5E 28%, #C97B7B 40%, #F6D6CF 48%, #FFF4F1 50%, #F6D6CF 52%, #C97B7B 60%, #A35F5E 72%, #7E4646 100%); }
[data-shine="blush"] { background-image: linear-gradient(100deg, #B9837F 0%, #C99A96 30%, #DDB3AE 42%, #F7E3DF 49%, #FFFFFF 50%, #F7E3DF 51%, #DDB3AE 58%, #C99A96 70%, #B9837F 100%); }
[data-shine="titanium"] { background-image: linear-gradient(100deg, #6E6560 0%, #8C827C 30%, #B9B0A9 44%, #F1ECE8 50%, #B9B0A9 56%, #8C827C 70%, #6E6560 100%); }
[data-fill="cateye"] { background-image: linear-gradient(90deg, #A9BCDD 0%, #6F8BE0 45%, #2B3FC8 100%) !important; position: relative; overflow: hidden; }
[data-fill="cateye"]::after { content: ""; position: absolute; inset: 0; background: linear-gradient(100deg, transparent 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0) 65%, transparent 100%); background-size: 200% 100%; animation: moiFlow 2.6s linear infinite; }
[data-fill="champagne"] { background-image: linear-gradient(90deg, #E9D6A8 0%, #C9A86A 50%, #9E7F45 100%) !important; }
[data-fill="champagne-coin"] { background-image: radial-gradient(circle at 32% 28%, #FFF3D1 0%, #E4C98E 38%, #C9A86A 62%, #9E7F45 100%) !important; }
[data-fill="cobalt-dot"] { background-image: radial-gradient(circle at 34% 30%, #8FA4F0 0%, #4058D8 55%, #2B3FC8 100%) !important; }
/* Main buttons and selected chips: soft luxury pill (reference step 6). White-to-lavender face, inner lavender glow,
   a white halo ring with a faint lavender line, and a soft lavender shadow underneath. Dark ink text. */
[data-fill="garnet"], [data-fill="lilac"] { position: relative; background-color: #F4F5FC !important; background-image: linear-gradient(180deg, #FFFFFF 0%, #EDEFFB 100%) !important; border-color: rgba(255,255,255,0.95) !important;
  box-shadow: inset 0 0 0 1px rgba(180,190,240,0.45), inset 0 2px 1px #FFFFFF, inset 0 -8px 14px rgba(150,165,235,0.2), 0 0 0 4px rgba(255,255,255,0.85), 0 0 0 5px rgba(170,180,235,0.4), 0 16px 28px -10px rgba(110,120,220,0.5), 0 4px 8px rgba(60,70,120,0.07);
  transition: box-shadow .2s ease, transform .15s ease, background-image .2s ease; }
[data-fill="garnet"]:hover, [data-fill="lilac"]:hover { background-image: linear-gradient(180deg, #F7F8FE 0%, #E3E7FA 100%) !important;
  box-shadow: inset 0 0 0 1px rgba(160,172,240,0.6), inset 0 2px 1px #FFFFFF, inset 0 -8px 14px rgba(140,155,235,0.28), 0 0 0 4px rgba(255,255,255,0.9), 0 0 0 5px rgba(150,162,235,0.6), 0 12px 22px -10px rgba(110,120,220,0.6), 0 3px 6px rgba(60,70,120,0.08); }
[data-fill="garnet"]:active, [data-fill="lilac"]:active { transform: translateY(1px); }
[data-fill="garnet"] div, [data-fill="lilac"] div { color: #2A2F45 !important; text-shadow: none !important; }
[data-fill="garnet"] svg [stroke]:not([stroke="none"]), [data-fill="lilac"] svg [stroke]:not([stroke="none"]) { stroke: #2A2F45 !important; }
[data-fill="garnet"] svg [data-chev] { stroke: #8E92A8 !important; }
/* Secondary buttons, unselected chips, menu button: raised white pill (reference step 4). */
[data-fill="pearl"] { background-image: linear-gradient(180deg, #FFFFFF 0%, #EEF0F6 100%) !important; border-color: rgba(255,255,255,0.95) !important; box-shadow: inset 0 0 0 1.5px #FFFFFF, 0 14px 24px -12px rgba(40,50,90,0.32), 0 3px 6px rgba(40,50,90,0.06); transition: box-shadow .2s ease, background-image .2s ease; }
[data-fill="pearl"]:hover { background-image: linear-gradient(180deg, #F6F7FA 0%, #E6E9F1 100%) !important; box-shadow: inset 0 0 0 1.5px #FFFFFF, 0 10px 18px -10px rgba(40,50,90,0.36), 0 2px 4px rgba(40,50,90,0.08); }
/* Selected choice cards (Start, Plans): the same lavender halo. */
[data-fill="pearl-on"] { background-image: linear-gradient(180deg, #FFFFFF 0%, #EEF0FB 100%) !important; border-color: rgba(170,180,240,0.7) !important; box-shadow: 0 0 0 4px rgba(255,255,255,0.9), 0 0 0 5px rgba(170,180,235,0.45), 0 16px 28px -12px rgba(110,120,220,0.45); }
[data-fill="pearl-on"]:hover { border-color: rgba(140,152,235,0.9) !important; }
[data-fill="pearl-ask"] { background-image: linear-gradient(180deg, #FFFFFF 0%, #F1F3F8 100%) !important; border-color: rgba(168,87,106,0.55) !important; border-style: dashed !important; box-shadow: 0 12px 24px -12px rgba(40,50,90,0.3); }
/* Welcome screen: warm paper with a faint grain. */
[data-fill="paper"] { background-color: #F3EFE7 !important; }
[data-fill="paper"]::after { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .5; mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .55 0 0 0 0 .5 0 0 0 0 .42 0 0 0 .22 0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E"); }
/* Gold coin button with a light sweep. */
[data-fill="gold-coin"] { position: relative; overflow: hidden; background-image: radial-gradient(80% 80% at 35% 25%, #FFF3CF 0%, #E9C46A 38%, #C99A2E 75%, #9C7420 100%) !important; border-color: rgba(255,240,200,0.85) !important;
  box-shadow: inset 0 -6px 10px rgba(120,80,10,0.35), 0 16px 24px -12px rgba(120,80,10,0.5); transition: filter .2s ease, box-shadow .2s ease; }
[data-fill="gold-coin"]::after { content: ""; position: absolute; inset: -40%; pointer-events: none; background: linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.75) 50%, transparent 58%); animation: moi-coin 3.6s ease-in-out infinite; }
[data-fill="gold-coin"]:hover { filter: brightness(0.93) saturate(1.1); box-shadow: inset 0 -6px 10px rgba(120,80,10,0.4), 0 12px 20px -10px rgba(120,80,10,0.55); }
@keyframes moi-coin { 0%, 55% { transform: translateX(-60%); } 85%, 100% { transform: translateX(60%); } }
/* Welcome screen glassmorphism: grainy peach-to-teal ground, a frosted card with a fine white edge, and frosted bars. */
[data-fill="glass-bg"] { position: relative; overflow: hidden; background-image: linear-gradient(180deg, #F4C7B5 0%, #E6BFC2 26%, #C2B2C3 46%, #8FA0B4 66%, #4F8197 84%, #2C6478 100%) !important; }
[data-fill="glass-bg"]::after { content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 1; opacity: .38; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E"); }
[data-fill="soft-bg"] { position: relative; overflow: hidden; background-image: linear-gradient(180deg, #F8E9E4 0%, #F4E6E7 16%, #EFE9F0 32%, #F2F2F7 46%, #F6F7FA 58%, #F6F7FA 100%) !important; }
[data-fill="soft-bg"]::after { content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 1; opacity: .22; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E"); }
[data-fill="soft-orb"] { filter: blur(44px) saturate(70%); }
/* Frost: a white veil over the circles so the colour reads as a tint, not a picture. */
[data-fill="soft-frost"] { background-color: rgba(246,247,250,0.42) !important; -webkit-backdrop-filter: blur(24px); backdrop-filter: blur(24px); }
[data-fill="bubble"] { position: relative; background-color: #E9E3F0 !important;
  background-image: radial-gradient(circle at 50% 38%, #FBF9FD 0%, #EFE9F5 42%, #DCD2E6 78%, #C7BBD6 100%) !important;
  box-shadow: inset 0 -16px 26px rgba(48,36,78,0.26), inset 0 10px 18px rgba(255,255,255,0.7), inset 0 0 0 1px rgba(255,255,255,0.55), 0 26px 34px -16px rgba(48,36,78,0.5), 0 4px 10px rgba(48,36,78,0.12); }
/* A tinted interior per kind of product, deep enough that the glass highlight reads. */
[data-fill="bubble"][data-tone="sage"] { background-image: radial-gradient(circle at 50% 40%, #EEF3EA 0%, #CBD9C4 45%, #94AE8C 82%, #6F8C69 100%) !important; }
[data-fill="bubble"][data-tone="peach"] { background-image: radial-gradient(circle at 50% 40%, #FBEDE3 0%, #F1CDB6 45%, #D99A7C 82%, #B87459 100%) !important; }
[data-fill="bubble"][data-tone="lilac"] { background-image: radial-gradient(circle at 50% 40%, #F3EEF8 0%, #D9CCE8 45%, #A894C6 82%, #7F6AA6 100%) !important; }
[data-fill="bubble"][data-tone="rose"] { background-image: radial-gradient(circle at 50% 40%, #FBEDEF 0%, #EDC6CD 45%, #C98391 82%, #A35A6B 100%) !important; }
[data-fill="bubble"][data-tone="sky"] { background-image: radial-gradient(circle at 50% 40%, #EEF3F9 0%, #CAD8EA 45%, #8EA6C8 82%, #637FA6 100%) !important; }
/* Liquid glass: the edge of the sphere bends and blurs what is inside it, like a lens. */
[data-fill="bubble-lens"] { border-radius: 50%; -webkit-backdrop-filter: blur(3px) saturate(170%) brightness(1.06); backdrop-filter: blur(3px) saturate(170%) brightness(1.06);
  -webkit-mask-image: radial-gradient(circle, transparent 60%, #000 78%); mask-image: radial-gradient(circle, transparent 60%, #000 78%); }
/* The dome: a sharp specular cap, light gathered at the bottom (caustic), a darker refracting edge, a thin bright rim. */
[data-fill="bubble-gloss"] { border-radius: 50%;
  background-image:
    radial-gradient(ellipse 66% 36% at 50% 5%, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.78) 32%, rgba(255,255,255,0) 64%),
    radial-gradient(ellipse 58% 20% at 50% 95%, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0) 70%),
    radial-gradient(circle at 76% 70%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 6%),
    radial-gradient(circle, rgba(30,20,60,0) 60%, rgba(30,20,60,0.16) 84%, rgba(30,20,60,0.34) 100%) !important;
  box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.65), inset 0 2px 1px rgba(255,255,255,0.8), inset 0 -2px 3px rgba(255,255,255,0.5); }
[data-fill="bubble-chip"] { background-color: rgba(255,255,255,0.86) !important; -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); box-shadow: 0 4px 12px rgba(60,50,90,0.14); }
/* Frosted metal in Moi's palette: a chrome bezel tinted lilac and rose, a frosted pearl face, pressed-in when tapped. */
[data-fill="metal"] { border: 1.5px solid transparent !important;
  background: linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(240,236,244,0.92) 100%) padding-box, linear-gradient(150deg, #FFFFFF 0%, #C8BCD6 26%, #F8F1F4 48%, #B3A3C1 72%, #EEE5EE 100%) border-box !important;
  -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -2px 4px rgba(122,74,94,0.10), 0 4px 10px -4px rgba(74,52,96,0.30); }
[data-fill="metal"]:hover { background: linear-gradient(180deg, #FFFFFF 0%, #F4F0F7 100%) padding-box, linear-gradient(150deg, #FFFFFF 0%, #BDAFCE 26%, #FBF5F7 48%, #A693B6 72%, #F1E8F0 100%) border-box !important; }
[data-fill="metal"]:active { box-shadow: inset 0 2px 5px rgba(74,52,96,0.22); transform: translateY(1px); }
[data-fill="metal-well"] { background-color: rgba(236,230,240,0.85) !important; box-shadow: inset 0 1px 3px rgba(74,52,96,0.12), inset 0 -1px 0 rgba(255,255,255,0.9); }
[data-fill="metal-card"] { border: 1px solid transparent !important;
  background: linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(250,246,250,0.70) 100%) padding-box, linear-gradient(155deg, #FFFFFF 0%, #D4C8DE 28%, #FBF6F8 50%, #C2B2CC 76%, #F4EDF3 100%) border-box !important;
  -webkit-backdrop-filter: blur(20px) saturate(120%); backdrop-filter: blur(20px) saturate(120%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.9), 0 12px 26px -14px rgba(74,52,96,0.32); }
[data-fill="glass-card"] { background-color: rgba(255,255,255,0.14) !important; background-image: linear-gradient(160deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.16) 100%) !important;
  -webkit-backdrop-filter: blur(30px) saturate(135%); backdrop-filter: blur(30px) saturate(135%); border-color: rgba(255,255,255,0.6) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), inset 0 0 0 1px rgba(255,255,255,0.12), 0 40px 70px -30px rgba(25,40,70,0.45); }
[data-fill="glass-panel"] { background-color: rgba(255,255,255,0.66) !important; background-image: linear-gradient(160deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 100%) !important;
  -webkit-backdrop-filter: blur(30px) saturate(135%); backdrop-filter: blur(30px) saturate(135%); border-color: rgba(255,255,255,0.75) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 30px 60px -30px rgba(25,40,70,0.35); }
[data-fill="glass-bar"] { background-color: rgba(255,255,255,0.32) !important; -webkit-backdrop-filter: blur(16px) saturate(140%); backdrop-filter: blur(16px) saturate(140%);
  border-color: rgba(255,255,255,0.65) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.75), 0 10px 24px -14px rgba(25,40,70,0.35); }
/* Ready to go: the main button's lavender halo breathes. */
[data-glow="1"] { animation: moi-glow 1.8s ease-in-out infinite; }
@keyframes moi-glow {
  0%, 100% { box-shadow: inset 0 0 0 1px rgba(180,190,240,0.45), inset 0 2px 1px #FFFFFF, 0 0 0 4px rgba(255,255,255,0.85), 0 0 0 5px rgba(170,180,235,0.45), 0 16px 28px -10px rgba(110,120,220,0.5); }
  50% { box-shadow: inset 0 0 0 1px rgba(160,172,240,0.7), inset 0 2px 1px #FFFFFF, 0 0 0 5px rgba(255,255,255,0.95), 0 0 0 7px rgba(130,145,240,0.75), 0 0 34px 6px rgba(130,145,240,0.55), 0 16px 28px -10px rgba(110,120,220,0.6); }
}
@media (prefers-reduced-motion: reduce) {
  [data-glow="1"] { animation: none; } [data-shine], [data-fill="cateye"]::after { animation: none !important; } }
`;

if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('moi-shine')) {
  const el = document.createElement('style');
  el.id = 'moi-shine';
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Props that give a Text shiny letters (web) — spread onto <Text>. */
export const shine = (kind: 'chrome' | 'rose' | 'titanium' | 'blush') => (Platform.OS === 'web' ? ({ dataSet: { shine: kind } } as any) : {});
/** Props that give a View a jewellery fill (web). */
export const fill = (kind: 'cateye' | 'champagne' | 'champagne-coin' | 'cobalt-dot' | 'garnet' | 'lilac' | 'pearl' | 'pearl-on' | 'pearl-ask' | 'paper' | 'gold-coin' | 'glass-bg' | 'soft-bg' | 'soft-orb' | 'soft-frost' | 'metal' | 'metal-well' | 'metal-card' | 'bubble' | 'bubble-lens' | 'bubble-gloss' | 'bubble-chip' | 'glass-card' | 'glass-bar' | 'glass-panel') => (Platform.OS === 'web' ? ({ dataSet: { fill: kind } } as any) : {});
