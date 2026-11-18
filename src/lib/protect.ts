import { useEffect } from 'react';
import { Platform } from 'react-native';

const editable = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.closest('input, textarea, [contenteditable="true"]') !== null);

/**
 * Web: no copying page content, no right-click/long-press menus, no dragging images out.
 * Typing and pasting into fields still work. (This deters casual copying; it can't stop someone determined.)
 */
export function useContentProtection() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const block = (e: Event) => { if (!editable(e.target)) e.preventDefault(); };
    const events = ['copy', 'cut', 'contextmenu', 'dragstart', 'selectstart'] as const;
    events.forEach(n => document.addEventListener(n, block, { capture: true }));
    return () => events.forEach(n => document.removeEventListener(n, block, { capture: true }));
  }, []);
}
