import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureUser, supabase } from '../lib/supabase';

export type CloudStatus = 'off' | 'saving' | 'saved';
export type Account = { email: string | null; phone: string | null; anonymous: boolean };

/** The slice of app state that lives in the `profiles` row and `done_log` table. */
export type Snapshot = {
  planSummary?: Record<string, unknown>;
  name: string;
  answers: Record<string, unknown>;
  onboarded: boolean;
  lastWash: string | null;
  reminders: Record<string, boolean>;
  done: Record<string, string[]>;
};
type LifeChangeRow = { type: string; label: string; startsAt: string; endsAt: string | null };
type Result = { error: { message: string } | null };

const day = (iso: string) => iso.slice(0, 10);
const ok = (what: string) => ({ error }: Result) => {
  if (error) console.warn(`[moi] ${what} failed:`, error.message);
  return !error;
};

async function pull(uid: string): Promise<Snapshot | null> {
  const sb = supabase();
  if (!sb) return null;
  const since = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
  const [{ data: p }, { data: rows }] = await Promise.all([
    sb.from('profiles').select('name, answers, onboarded, last_wash, reminders').eq('id', uid).maybeSingle(),
    sb.from('done_log').select('day, lever_id').eq('user_id', uid).gte('day', since),
  ]);
  if (!p) return null;
  const done: Record<string, string[]> = {};
  for (const r of rows ?? []) (done[r.day] ??= []).push(r.lever_id);
  return { name: p.name, answers: p.answers ?? {}, onboarded: p.onboarded, lastWash: p.last_wash, reminders: p.reminders ?? {}, done };
}

/**
 * Mirrors the local store to Supabase. Local storage stays the source of truth while
 * offline. When a different account signs in on this device, its saved plan replaces
 * the local one before anything is uploaded, so signing in never overwrites cloud data.
 */
export function useCloud(ready: boolean, local: Omit<Snapshot, 'done'>, apply: (s: Snapshot) => void) {
  const [uid, setUid] = useState<string | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [status, setStatus] = useState<CloudStatus>('off');
  const [syncedUid, setSyncedUid] = useState<string | null>(null);

  // Sign in quietly, then follow every auth change (sign-in, sign-up, sign-out).
  useEffect(() => {
    if (!ready) return;
    const sb = supabase();
    if (!sb) return;
    ensureUser().catch(() => {});
    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUid(u?.id ?? null);
      setAccount(u ? { email: u.email ?? null, phone: u.phone || null, anonymous: !!u.is_anonymous } : null);
    });
    return () => data.subscription.unsubscribe();
  }, [ready]);

  // First time we see an account: adopt its saved plan if it has one, otherwise upload ours.
  const adopt = useCallback(async (id: string) => {
    const remote = await pull(id).catch(() => null);
    if (remote?.onboarded) apply(remote);
    setSyncedUid(id);
    setStatus('saved');
  }, [apply]);
  useEffect(() => { if (uid && uid !== syncedUid) adopt(uid); }, [uid, syncedUid, adopt]);

  // Debounce profile writes so tapping through onboarding is one request, not fourteen.
  const key = JSON.stringify(local);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const sb = supabase();
    if (!sb || !uid || uid !== syncedUid) return;
    setStatus('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const saved = ok('profile save')(await sb.from('profiles').upsert({
        id: uid,
        name: local.name,
        answers: local.answers,
        onboarded: local.onboarded,
        last_wash: local.lastWash,
        reminders: local.reminders,
        plan_summary: local.planSummary ?? {},
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }));
      setStatus(saved ? 'saved' : 'off');
    }, 600);
    return () => clearTimeout(timer.current);
  }, [key, uid, syncedUid]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = (what: string, fn: (sb: NonNullable<ReturnType<typeof supabase>>, id: string) => PromiseLike<Result>) => {
    const sb = supabase();
    if (sb && uid) fn(sb, uid).then(ok(what), () => {});
  };

  return {
    status,
    account,
    /** Resolves once the signed-in account's saved plan (if any) is applied locally. */
    syncNow: async () => { const sb = supabase(); const { data } = (await sb?.auth.getUser()) ?? { data: { user: null } }; if (data.user) await adopt(data.user.id); },
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
