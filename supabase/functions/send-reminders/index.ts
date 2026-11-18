// Hourly reminder sender (called by pg_cron). For each person with notifications on, it works in
// their own time zone and sends at most one reminder per slot:
//   8 AM  — wash day ("Wash day: …steps") or, on their rescan Sunday, a scan check-in
//   8 PM  — tonight's habits (bonnet, massage, wind down…)
// House rules: at most 2 a day, nothing 10 PM–7 AM, and after 3 unopened reminders in a row it
// steps back to wash days only until they open one.
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

type Summary = { washEvery?: number; washSteps?: string[]; nightSteps?: string[] };
type Profile = { id: string; timezone: string | null; last_wash: string | null; reminders: Record<string, boolean>; plan_summary: Summary; answers: Record<string, unknown> };

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

function localParts(tz: string | null, now = new Date()) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false, weekday: 'short' });
  const p = Object.fromEntries(f.formatToParts(now).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24, weekday: p.weekday };
}
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const list = (xs: string[] = []) => xs.slice(0, 3).join(', ').toLowerCase();

function pick(p: Profile, now = new Date()) {
  const { date, hour, weekday } = localParts(p.timezone, now);
  const on = (k: string) => p.reminders?.[k] !== false;
  if (!on('all') || hour < 7 || hour >= 22) return null;
  const every = p.plan_summary?.washEvery ?? 3;
  const washDay = p.last_wash ? daysBetween(p.last_wash, date) >= every : false;
  if (hour === 8) {
    if (washDay && on('wash_interval')) return { kind: 'wash', title: 'Wash day', body: p.plan_summary?.washSteps?.length ? `Today: ${list(p.plan_summary.washSteps)}.` : 'Your routine is ready in Moi.' };
    if (weekday === 'Sun' && on('scan')) return { kind: 'scan', title: 'Check-in scan', body: 'Same light, same spot. Three photos, about a minute.' };
  }
  if (hour === 20 && p.plan_summary?.nightSteps?.length) return { kind: 'night', title: 'Tonight', body: `${list(p.plan_summary.nightSteps)}. Tap when done.` };
  return null;
}

Deno.serve(async req => {
  const { data: cfg } = await admin.rpc('get_push_config');
  if (!cfg || req.headers.get('x-cron-secret') !== cfg.moi_cron_secret) return new Response('Forbidden', { status: 403 });
  webpush.setVapidDetails('mailto:hello@moi.app', cfg.moi_vapid_public, cfg.moi_vapid_private);

  const { data: tokens } = await admin.from('push_tokens').select('id, user_id, platform, token, subscription').eq('platform', 'web');
  if (!tokens?.length) return Response.json({ sent: 0 });
  const users = [...new Set(tokens.map(t => t.user_id))];
  const { data: profiles } = await admin.from('profiles').select('id, timezone, last_wash, reminders, plan_summary, answers').in('id', users);

  let sent = 0;
  for (const p of (profiles ?? []) as Profile[]) {
    const msg = pick(p);
    if (!msg) continue;
    const { date } = localParts(p.timezone);
    const { data: recent } = await admin.from('notification_log').select('kind, sent_at, opened_at').eq('user_id', p.id).order('sent_at', { ascending: false }).limit(5);
    const today = (recent ?? []).filter(r => localParts(p.timezone, new Date(r.sent_at)).date === date);
    if (today.length >= 2 || today.some(r => r.kind === msg.kind)) continue;
    const ignored = (recent ?? []).slice(0, 3);
    if (ignored.length === 3 && ignored.every(r => !r.opened_at) && msg.kind !== 'wash') continue;

    const { data: log } = await admin.from('notification_log').insert({ user_id: p.id, kind: msg.kind }).select('id').single();
    for (const t of tokens.filter(t => t.user_id === p.id)) {
      try {
        await webpush.sendNotification(t.subscription, JSON.stringify({ ...msg, url: `/?n=${log?.id ?? ''}` }));
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await admin.from('push_tokens').delete().eq('id', t.id); // subscription expired
      }
    }
  }
  return Response.json({ sent });
});
