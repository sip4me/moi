// Coins earned by checking off daily recs. Checking one queues a coin; the token bag on Home plays
// the drop (one coin per check) the next time it's on screen — right away if you checked on Home.
let pending = 0;
const listeners = new Set<() => void>();

export function queueCoin() {
  pending += 1;
  listeners.forEach(l => l());
}

/** Takes every waiting coin (the bag animates them) and returns how many there were. */
export function takeCoins() {
  const n = pending;
  pending = 0;
  return n;
}

export function onCoin(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

// Coins still in the air: the bag's number lags by these so it ticks up as each one lands.
let falling = 0;
const fallingListeners = new Set<(n: number) => void>();
export function setFalling(n: number) { falling = Math.max(0, n); fallingListeners.forEach(l => l(falling)); }
export const getFalling = () => falling;
export function onFalling(fn: (n: number) => void) { fallingListeners.add(fn); return () => { fallingListeners.delete(fn); }; }
