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
/* Main buttons: frosted soft glass. Milky white, blush and peach glow along the top, lilac on round buttons, soft shadow. */
[data-fill="garnet"], [data-fill="lilac"] { position: relative; isolation: isolate; overflow: hidden; background-color: #F7F2F5 !important; background-image: linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(246,240,246,0.62) 100%) !important; border-color: rgba(255,255,255,0.95) !important;
  -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.9), inset 0 1px 0 #FFFFFF, 0 18px 26px -14px rgba(40,45,60,0.28), 0 4px 8px -4px rgba(40,45,60,0.12); transition: box-shadow .25s ease, transform .2s ease; }
[data-fill="garnet"]::before, [data-fill="lilac"]::before { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; pointer-events: none;
  background: radial-gradient(60% 70% at 18% 0%, rgba(255,170,190,0.55), rgba(255,170,190,0) 70%), radial-gradient(55% 70% at 85% 0%, rgba(255,215,170,0.5), rgba(255,215,170,0) 70%), radial-gradient(70% 60% at 50% 100%, rgba(250,222,232,0.6), rgba(250,222,232,0) 75%);
  transition: filter .25s ease, opacity .25s ease; }
/* Round buttons (the + and the welcome arrow) lean lilac, like the circle in the reference. */
[data-fill="garnet"]:hover, [data-fill="lilac"]:hover { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.95), inset 0 1px 0 #FFFFFF, 0 14px 22px -12px rgba(40,45,60,0.34), 0 3px 6px -3px rgba(40,45,60,0.16); }
[data-fill="garnet"]:hover::before, [data-fill="lilac"]:hover::before { filter: saturate(1.6) brightness(0.96); }
[data-fill="garnet"]:active, [data-fill="lilac"]:active { transform: translateY(1px); }
[data-fill="garnet"] div, [data-fill="lilac"] div { color: #1F2430 !important; text-shadow: none !important; }
[data-fill="garnet"] svg [stroke]:not([stroke="none"]), [data-fill="lilac"] svg [stroke]:not([stroke="none"]) { stroke: #1F2430 !important; }
[data-fill="garnet"] svg [fill="#fff"], [data-fill="garnet"] svg [fill="#FFFFFF"], [data-fill="garnet"] svg [fill="white"], [data-fill="lilac"] svg [fill="#fff"], [data-fill="lilac"] svg [fill="#FFFFFF"], [data-fill="lilac"] svg [fill="white"] { fill: #1F2430 !important; }
[data-fill="lilac"]::before { background: radial-gradient(70% 70% at 30% 10%, rgba(175,190,255,0.6), rgba(175,190,255,0) 70%), radial-gradient(70% 70% at 80% 90%, rgba(235,215,250,0.55), rgba(235,215,250,0) 75%); }
/* Secondary buttons and chips: raised pearl pills. */
[data-fill="pearl"] { background-image: linear-gradient(180deg, #FFFFFF 0%, #F1F3F8 100%) !important; border-color: rgba(255,255,255,0.95) !important; box-shadow: 0 12px 24px -12px rgba(40,50,90,0.3), 0 2px 5px rgba(40,50,90,0.06), inset 0 1px 0 #FFFFFF; transition: box-shadow .2s ease; }
[data-fill="pearl"]:hover { background-image: linear-gradient(180deg, #F2F4F9 0%, #E3E7F0 100%) !important; box-shadow: 0 8px 18px -10px rgba(40,50,90,0.35), 0 1px 3px rgba(40,50,90,0.08), inset 0 1px 0 #FFFFFF; }
/* Selected choice card: blush pearl with a garnet rim and soft glow. */
[data-fill="pearl-on"] { background-image: linear-gradient(180deg, #FFF8F7 0%, #F8E6E4 100%) !important; border-color: #A8576A !important; box-shadow: 0 0 0 4px rgba(168,87,106,0.14), 0 14px 26px -12px rgba(126,58,76,0.35), inset 0 1px 0 #FFFFFF; transform: translateY(-1px); transition: box-shadow .2s ease, transform .2s ease; }
[data-fill="pearl-on"]:hover { border-color: #7E3A4C !important; }
/* Choice cards when Continue was tapped with nothing picked. */
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
@media (prefers-reduced-motion: reduce) { [data-shine], [data-fill="cateye"]::after { animation: none !important; } }
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
export const fill = (kind: 'cateye' | 'champagne' | 'champagne-coin' | 'cobalt-dot' | 'garnet' | 'lilac' | 'pearl' | 'pearl-on' | 'pearl-ask' | 'paper' | 'gold-coin') => (Platform.OS === 'web' ? ({ dataSet: { fill: kind } } as any) : {});
