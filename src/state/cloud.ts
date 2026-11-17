import { useEffect, useRef, useState } from 'react';
import { ensureUser, supabase } from '../lib/supabase';

export type CloudStatus = 'off' | 'saving' | 'saved';
type Profile = { name: string; answers: Record<string, unknown>; onboarded: boolean; lastWash: string | null; reminders: Record<string, boolean> };
type LifeChangeRow = { type: string; label: string; startsAt: string; endsAt: string | null };

const day = (iso: string) => iso.slice(0, 10);
const warn = (what: string) => ({ error }: { error: { message: string } | null }) => {
  if (error) console.warn(`[moi] ${what} failed:`, error.message);
  return !error;
};

/**
 * Mirrors the local store to Supabase. Local storage stays the source of truth,
 * so the app works offline and in hosts that block network calls.
 */
export function useCloud(ready: boolean, profile: Profile) {
  const [uid, setUid] = useState<string | null>(null);
  const [status, setStatus] = useState<CloudStatus>('off');

  useEffect(() => {
    if (!ready) return;
    ensureUser().then(id => { setUid(id); if (id) setStatus('saved'); }).catch(() => {});
  }, [ready]);

  // Debounce profile writes so tapping through onboarding is one request, not fourteen.
  const key = JSON.stringify(profile);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const sb = supabase();
    if (!sb || !uid) return;
    setStatus('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const ok = warn('profile save')(await sb.from('profiles').upsert({
        id: uid,
        name: profile.name,
        answers: profile.answers,
        onboarded: profile.onboarded,
        last_wash: profile.lastWash,
        reminders: profile.reminders,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }));
      setStatus(ok ? 'saved' : 'off');
    }, 600);
    return () => clearTimeout(timer.current);
  }, [key, uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = (what: string, fn: (sb: NonNullable<ReturnType<typeof supabase>>, id: string) => PromiseLike<{ error: { message: string } | null }>) => {
    const sb = supabase();
    if (sb && uid) fn(sb, uid).then(warn(what), () => {});
  };

  return {
    status,
    setDone: (leverId: string, today: string, done: boolean) =>
      run('done log', (sb, id) => done
        ? sb.from('done_log').upsert({ user_id: id, day: today, lever_id: leverId })
        : sb.from('done_log').delete().match({ user_id: id, day: today, lever_id: leverId })),
    startChange: (c: LifeChangeRow) =>
      run('life change', (sb, id) => sb.from('life_changes').insert({ user_id: id, type: c.type, label: c.label, starts_at: day(c.startsAt), ends_at: c.endsAt ? day(c.endsAt) : null })),
    endChanges: (today: string) =>
      run('end change', (sb, id) => sb.from('life_changes').update({ ends_at: today }).eq('user_id', id).or(`ends_at.is.null,ends_at.gt.${today}`)),
  };
}
