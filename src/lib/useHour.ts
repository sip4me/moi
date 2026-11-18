import { useEffect, useState } from 'react';

/** The local hour, refreshed every few minutes so time-of-day content changes while the app is open. */
export function useHour() {
  const [hour, setHour] = useState(() => new Date().getHours());
  useEffect(() => {
    const id = setInterval(() => setHour(new Date().getHours()), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return hour;
}
