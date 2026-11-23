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
/* Main buttons: frosted glass with blurred colour inside and an iridescent rim (the reference "+" pill). */
[data-fill="garnet"] { position: relative; isolation: isolate; overflow: hidden; background-color: #DCE2F1 !important; background-image: linear-gradient(180deg, rgba(255,255,255,0.5), rgba(228,233,245,0.3)) !important; border-color: rgba(255,255,255,0.92) !important;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.65), inset 0 0 14px rgba(255,255,255,0.55), -8px 0 22px -8px rgba(110,160,255,0.65), 8px 0 22px -8px rgba(245,140,190,0.65), 0 12px 24px -10px rgba(60,70,140,0.38); transition: box-shadow .25s ease; }
[data-fill="garnet"]::before { content: ""; position: absolute; inset: -25%; z-index: -1; pointer-events: none;
  background: radial-gradient(22% 50% at 24% 52%, #2E6B7E 0%, rgba(46,107,126,0) 72%), radial-gradient(22% 55% at 78% 50%, #16263D 0%, rgba(22,38,61,0) 74%), radial-gradient(40% 75% at 51% 50%, rgba(168,87,106,0.9) 0%, rgba(168,87,106,0) 72%), radial-gradient(70% 100% at 50% 60%, rgba(91,110,220,0.5), rgba(91,110,220,0) 78%);
  filter: blur(9px); transition: filter .25s ease, transform .4s ease; }
[data-fill="garnet"]:hover { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.75), inset 0 0 16px rgba(255,255,255,0.45), -10px 0 26px -8px rgba(110,160,255,0.8), 10px 0 26px -8px rgba(245,140,190,0.8), 0 10px 20px -10px rgba(60,70,140,0.45); }
[data-fill="garnet"]:hover::before { filter: blur(9px) brightness(0.78) saturate(1.25); transform: scale(1.06); }
[data-fill="garnet"] div, [data-fill="garnet"] svg { text-shadow: 0 1px 2px rgba(10,14,30,0.45); }
/* Secondary buttons and chips: raised pearl pills. */
[data-fill="pearl"] { background-image: linear-gradient(180deg, #FFFFFF 0%, #F1F3F8 100%) !important; border-color: rgba(255,255,255,0.95) !important; box-shadow: 0 12px 24px -12px rgba(40,50,90,0.3), 0 2px 5px rgba(40,50,90,0.06), inset 0 1px 0 #FFFFFF; transition: box-shadow .2s ease; }
[data-fill="pearl"]:hover { background-image: linear-gradient(180deg, #F2F4F9 0%, #E3E7F0 100%) !important; box-shadow: 0 8px 18px -10px rgba(40,50,90,0.35), 0 1px 3px rgba(40,50,90,0.08), inset 0 1px 0 #FFFFFF; }
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
export const fill = (kind: 'cateye' | 'champagne' | 'champagne-coin' | 'cobalt-dot' | 'garnet' | 'pearl') => (Platform.OS === 'web' ? ({ dataSet: { fill: kind } } as any) : {});
