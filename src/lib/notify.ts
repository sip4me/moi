// In-app notifications: anything can post one; <MoiNotifications/> at the root shows it as a banner.
export type MoiNote = { id: number; title: string; body: string; href?: string; kind?: string };
let seq = 0;
const listeners = new Set<(n: MoiNote) => void>();
export function notify(n: Omit<MoiNote, 'id'>) { const note = { ...n, id: ++seq }; listeners.forEach(l => l(note)); }
export function onNotify(fn: (n: MoiNote) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

// "The person just tapped a button": the root decides whether a goal nudge fits (and throttles it).
const taps = new Set<() => void>();
export function tapped() { taps.forEach(l => l()); }
export function onTapped(fn: () => void) { taps.add(fn); return () => { taps.delete(fn); }; }
