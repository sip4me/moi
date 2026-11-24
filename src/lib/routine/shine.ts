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
/* Main and round buttons: the checkout's chrome key, set in a thin silver track ring. */
[data-fill="garnet"], [data-fill="lilac"] { position: relative; background-color: #DADADA !important; background-image: linear-gradient(180deg, #E6E6E6 0%, #D2D2D2 100%) !important; border: 1.5px solid #161616 !important;
  box-shadow: inset 0 0 0 2px #FAFAFA, inset 0 0 0 3.5px #9C9C9C, inset 0 0 0 5px #ECECEC, inset 5px 5px 8px rgba(255,255,255,0.85), inset -4px -5px 8px rgba(0,0,0,0.15), 0 0 0 5px #EDEDED, 0 0 0 6px #DEDEDE, 0 16px 26px -12px rgba(0,0,0,0.42), 0 2px 3px rgba(0,0,0,0.12);
  transition: box-shadow .15s ease, transform .15s ease, background-image .15s ease; }
[data-fill="garnet"]:hover, [data-fill="lilac"]:hover { background-image: linear-gradient(180deg, #ECECEC 0%, #D8D8D8 100%) !important; }
[data-fill="garnet"]:active, [data-fill="lilac"]:active { transform: translateY(1px); background-image: linear-gradient(180deg, #D4D4D4 0%, #E2E2E2 100%) !important; box-shadow: inset 0 0 0 2px #F2F2F2, inset 0 0 0 3.5px #8E8E8E, inset 0 0 0 5px #E4E4E4, inset 0 4px 8px rgba(0,0,0,0.18), 0 0 0 5px #EDEDED, 0 0 0 6px #DEDEDE, 0 4px 8px -4px rgba(0,0,0,0.3); }
[data-fill="garnet"] div, [data-fill="lilac"] div { color: #111114 !important; text-shadow: none !important; }
[data-fill="garnet"] svg [stroke]:not([stroke="none"]), [data-fill="lilac"] svg [stroke]:not([stroke="none"]) { stroke: #111114 !important; }
[data-fill="garnet"] svg [data-chev] { stroke: #111114 !important; }
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
[data-fill="soft-frost"] { background-color: rgba(244,244,248,0.5) !important; -webkit-backdrop-filter: blur(40px) saturate(80%); backdrop-filter: blur(40px) saturate(80%); }
[data-fill="bubble"] { position: relative; background-color: #E9E3F0 !important;
  background-image: radial-gradient(circle at 50% 38%, #FBF9FD 0%, #EFE9F5 42%, #DCD2E6 78%, #C7BBD6 100%) !important;
  box-shadow: inset 0 -16px 26px rgba(48,36,78,0.26), inset 0 10px 18px rgba(255,255,255,0.7), inset 0 0 0 0.5px rgba(255,255,255,0.6), 0 26px 34px -16px rgba(48,36,78,0.5), 0 4px 10px rgba(48,36,78,0.12); }
/* A tinted interior per kind of product, deep enough that the glass highlight reads. */
[data-fill="bubble"][data-tone="lilac"] { background-image: radial-gradient(circle at 50% 40%, #F4F2F9 0%, #D9D3EA 45%, #A79DC9 82%, #8277AC 100%) !important; }
[data-fill="bubble"][data-tone="silver"] { background-image: radial-gradient(circle at 50% 40%, #F6F6F8 0%, #DCDCE3 45%, #A9A9B7 82%, #85859A 100%) !important; }
[data-fill="bubble"][data-tone="steel"] { background-image: radial-gradient(circle at 50% 40%, #F1F3F7 0%, #D3D8E3 45%, #9AA2B8 82%, #737D97 100%) !important; }
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
  box-shadow: inset 0 0 0 0.5px rgba(255,255,255,0.9), inset 0 1px 0.5px rgba(255,255,255,0.75), inset 0 -2px 3px rgba(255,255,255,0.4); }
[data-fill="bubble-chip"] { background-color: rgba(255,255,255,0.82) !important; -webkit-backdrop-filter: blur(14px) saturate(140%); backdrop-filter: blur(14px) saturate(140%); box-shadow: 0 6px 16px rgba(40,36,70,0.16), inset 0 0.5px 0 rgba(255,255,255,0.9); }
/* Frosted metal, grey and lilac: a chrome bezel, a frosted silver face, pressed-in when tapped. */
[data-fill="metal"] { border: 1.5px solid transparent !important;
  background: linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(236,236,242,0.94) 100%) padding-box, linear-gradient(150deg, #FFFFFF 0%, #BDBBCB 26%, #F5F5F8 48%, #9D9AAF 72%, #ECEBF1 100%) border-box !important;
  -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -2px 4px rgba(80,76,110,0.10), 0 4px 10px -4px rgba(50,48,70,0.30); }
[data-fill="metal"]:hover { background: linear-gradient(180deg, #FFFFFF 0%, #F2F2F6 100%) padding-box, linear-gradient(150deg, #FFFFFF 0%, #B1AEC2 26%, #F8F8FA 48%, #8F8CA3 72%, #EFEEF3 100%) border-box !important; }
[data-fill="metal"]:active { box-shadow: inset 0 2px 5px rgba(50,48,70,0.22); transform: translateY(1px); }
[data-fill="metal-well"] { background-color: rgba(228,228,234,0.9) !important; box-shadow: inset 0 1px 3px rgba(50,48,70,0.12), inset 0 -1px 0 rgba(255,255,255,0.9); }
[data-fill="metal-card"] { border: 1px solid transparent !important;
  background: linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(248,248,250,0.86) 100%) padding-box, linear-gradient(155deg, #FFFFFF 0%, #CFCDD9 28%, #F7F7F9 50%, #B6B3C5 76%, #F1F1F4 100%) border-box !important;
  -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.9), 0 12px 26px -14px rgba(50,48,70,0.30); }
/* Frosted separation: each section is a soft frosted plate on the flat grey ground. */
[data-fill="frost-panel"] { background-color: rgba(250,250,252,0.72) !important; -webkit-backdrop-filter: blur(24px); backdrop-filter: blur(24px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.95), 0 1px 2px rgba(50,48,70,0.05), 0 14px 32px -18px rgba(50,48,70,0.22); border-color: rgba(255,255,255,0.95) !important; }
/* Checkout silver (chrome stepper reference): light grey cards, chrome-bezel keys in a recessed track. */
[data-fill="silver-card"] { background-color: #F2F2F2 !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 26px 44px -30px rgba(0,0,0,0.38), 0 2px 6px rgba(0,0,0,0.04); }
[data-fill="chrome-track"] { background-color: #EDEDED !important; border-color: #E3E3E3 !important; box-shadow: inset 0 1px 2px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.85); }
[data-fill="chrome-cell"] { background-color: #EAEAEA !important; border-color: #E0E0E0 !important; box-shadow: inset 0 1px 2px rgba(0,0,0,0.04); }
[data-fill="chrome-key"], [data-fill="chrome-key-on"] { border: 1.5px solid #161616 !important; background-image: linear-gradient(180deg, #E5E5E5 0%, #D3D3D3 100%) !important; transition: box-shadow .12s ease, transform .12s ease;
  box-shadow: inset 0 0 0 2px #FAFAFA, inset 0 0 0 3.5px #9C9C9C, inset 0 0 0 5px #ECECEC, inset 5px 5px 8px rgba(255,255,255,0.85), inset -4px -5px 8px rgba(0,0,0,0.15), 0 14px 22px -10px rgba(0,0,0,0.42), 0 2px 3px rgba(0,0,0,0.14); }
[data-fill="chrome-key"]:hover { background-image: linear-gradient(180deg, #EAEAEA 0%, #D8D8D8 100%) !important; }
[data-fill="chrome-key"]:active, [data-fill="chrome-key-on"] { background-image: linear-gradient(180deg, #D6D6D6 0%, #E2E2E2 100%) !important;
  box-shadow: inset 0 0 0 2px #F2F2F2, inset 0 0 0 3.5px #8E8E8E, inset 0 0 0 5px #E4E4E4, inset 0 4px 8px rgba(0,0,0,0.18), 0 4px 8px -4px rgba(0,0,0,0.3); }
/* Glass ball (Juicy "Taste mix" recipe). */
[data-fill="ball"] { background-image: radial-gradient(circle at 50% 42%, #FFFFFF 0%, #F1EEF6 55%, #DAD4E6 100%) !important; }
[data-fill="ball"][data-tone="lilac"] { background-image: radial-gradient(circle at 50% 42%, #FBFAFE 0%, #E7E2F3 55%, #C9C0E0 100%) !important; }
[data-fill="ball"][data-tone="silver"] { background-image: radial-gradient(circle at 50% 42%, #FCFCFD 0%, #EBEBF0 55%, #CFCFD9 100%) !important; }
[data-fill="ball"][data-tone="steel"] { background-image: radial-gradient(circle at 50% 42%, #FAFCFE 0%, #E4EAF3 55%, #C3CEE0 100%) !important; }
[data-fill="ball"] { box-shadow: 0 0 0 0.5px rgba(255,255,255,0.9), 0 0 22px 4px rgba(255,255,255,0.75), 0 14px 26px -14px rgba(20,24,40,0.45); }
[data-fill="ball-scene"] { filter: blur(7px) saturate(135%); opacity: 0.85; }
[data-fill="ball-tint"] { background-image: radial-gradient(closest-side, rgba(255,255,255,0) 0%, rgba(184,212,240,0.06) 60%, rgba(156,192,230,0.45) 100%); }
[data-fill="ball-edge"] { background-image: radial-gradient(closest-side, rgba(10,20,40,0) 0%, rgba(10,20,40,0) 52%, rgba(10,20,40,0.55) 100%); filter: blur(1.5px); }
[data-fill="ball-bounce"] { background-image: radial-gradient(closest-side, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 100%); filter: blur(2px); }
[data-fill="ball-soft"] { background-image: radial-gradient(ellipse 50% 50% at 50% 30%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.45) 45%, rgba(255,255,255,0) 100%); filter: blur(1px); }
[data-fill="ball-glint"] { background-color: rgba(255,255,255,0.95); filter: blur(0.7px); transform: rotate(-24deg); }
[data-fill="ball-arc"] { background-image: radial-gradient(closest-side, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 76%, rgba(255,255,255,0.95) 87%, rgba(255,255,255,0.8) 93%, rgba(255,255,255,0) 100%);
  -webkit-mask-image: linear-gradient(135deg, #000 0%, #000 30%, rgba(0,0,0,0.4) 44%, transparent 56%); mask-image: linear-gradient(135deg, #000 0%, #000 30%, rgba(0,0,0,0.4) 44%, transparent 56%); filter: blur(0.6px); }
[data-fill="ball-shadow"] { background-image: radial-gradient(closest-side, rgba(20,20,40,0.32) 0%, rgba(20,20,40,0) 100%); filter: blur(3px); }
/* Headline text with a gradient that answers the page: steel blue into ink, like the reference titles. */
[data-grad="title"] { background-image: linear-gradient(180deg, #4B6A8F 0%, #2A3550 55%, #14161E 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; }
[data-grad="name"] { background-image: linear-gradient(180deg, #3E6FA8 0%, #263652 60%, #16181F 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; }
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
  0%, 100% { box-shadow: inset 0 0 0 2px #FAFAFA, inset 0 0 0 3.5px #9C9C9C, inset 0 0 0 5px #ECECEC, inset 5px 5px 8px rgba(255,255,255,0.85), inset -4px -5px 8px rgba(0,0,0,0.15), 0 0 0 5px #EDEDED, 0 0 0 6px #DEDEDE, 0 16px 26px -12px rgba(0,0,0,0.42); }
  50% { box-shadow: inset 0 0 0 2px #FFFFFF, inset 0 0 0 3.5px #A8A8A8, inset 0 0 0 5px #F2F2F2, inset 5px 5px 8px rgba(255,255,255,0.95), inset -4px -5px 8px rgba(0,0,0,0.12), 0 0 0 5px #F4F4F4, 0 0 0 7px #CFCFCF, 0 0 30px 6px rgba(255,255,255,0.85), 0 16px 26px -12px rgba(0,0,0,0.42); }
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
export const fill = (kind: 'cateye' | 'champagne' | 'champagne-coin' | 'cobalt-dot' | 'garnet' | 'lilac' | 'pearl' | 'pearl-on' | 'pearl-ask' | 'paper' | 'gold-coin' | 'glass-bg' | 'soft-bg' | 'soft-orb' | 'soft-frost' | 'silver-card' | 'chrome-track' | 'chrome-cell' | 'chrome-key' | 'chrome-key-on' | 'metal' | 'metal-well' | 'metal-card' | 'frost-panel' | 'ball' | 'ball-tint' | 'ball-edge' | 'ball-soft' | 'ball-glint' | 'ball-scene' | 'ball-bounce' | 'ball-arc' | 'ball-shadow' | 'bubble' | 'bubble-lens' | 'bubble-gloss' | 'bubble-chip' | 'glass-card' | 'glass-bar' | 'glass-panel') => (Platform.OS === 'web' ? ({ dataSet: { fill: kind } } as any) : {});
