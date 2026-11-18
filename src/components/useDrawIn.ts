import { useEffect, useState } from 'react';

/**
 * 0 → 1 over `ms` with an ease-out curve, started after `delay`. Drives line "draw-in"
 * animations through strokeDashoffset, which works the same on web and native.
 */
export function useDrawIn(ms = 1400, delay = 250) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now + delay;
      const t = Math.min(1, Math.max(0, (now - start) / ms));
      setP(1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ms, delay]);
  return p;
}
