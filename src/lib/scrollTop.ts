// Tapping the tab you're already on scrolls that tab back to the top (like iOS).
type Fn = () => void;
const listeners = new Map<string, Set<Fn>>();

export function onScrollTop(tab: string, fn: Fn) {
  const set = listeners.get(tab) ?? new Set<Fn>();
  set.add(fn); listeners.set(tab, set);
  return () => { set.delete(fn); };
}

export function scrollTop(tab: string) { listeners.get(tab)?.forEach(fn => fn()); }
