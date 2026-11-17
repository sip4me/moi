// Deletes the calling user's account. Scan photos are removed from storage first; then
// deleting the auth user cascades to every Moi table (profile, check-ins, life changes,
// scans, push tokens, notification log).
//
// Auth is checked here (not by the gateway) so it works with Supabase's new
// publishable keys: the caller must send their own session token.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Not signed in' }, 401);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return json({ error: 'Not signed in' }, 401);

  const uid = data.user.id;
  // Photos live at scans/<uid>/<session>/<angle>.jpg; storage has no cascade, so remove them here.
  const bucket = admin.storage.from('scans');
  const { data: sessions } = await bucket.list(uid, { limit: 1000 });
  for (const s of sessions ?? []) {
    const { data: files } = await bucket.list(`${uid}/${s.name}`, { limit: 100 });
    const paths = (files ?? []).map(f => `${uid}/${s.name}/${f.name}`);
    if (paths.length) await bucket.remove(paths);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(uid);
  if (deleteError) return json({ error: 'Could not delete account' }, 500);

  return json({ deleted: true });
});
