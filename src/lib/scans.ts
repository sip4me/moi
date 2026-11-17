import { ensureUser, supabase } from './supabase';

export type Angle = 'hairline' | 'crown' | 'part';
export const ANGLES: { id: Angle; title: string; hint: string; guide: string }[] = [
  { id: 'hairline', title: 'Hairline', hint: 'Face forward, hair pulled back', guide: 'Line up your hairline with the top arc' },
  { id: 'crown', title: 'Crown', hint: 'Phone above your head, looking down', guide: 'Center the crown of your head in the circle' },
  { id: 'part', title: 'Part line', hint: 'Center part, close on the scalp', guide: 'Line your part up with the center line' },
];

const uuid = () =>
  globalThis.crypto?.randomUUID?.() ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

/**
 * Uploads one scan session (up to three photos) to the private `scans` bucket under the
 * person's own folder, and records each photo in the `scans` table. Returns how many saved.
 */
export async function saveScan(photos: Partial<Record<Angle, string>>): Promise<number> {
  const sb = supabase();
  const uid = await ensureUser();
  if (!sb || !uid) return 0;
  const session = uuid();
  let saved = 0;
  for (const [angle, uri] of Object.entries(photos) as [Angle, string][]) {
    try {
      const blob = await (await fetch(uri)).blob();
      const ext = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      const path = `${uid}/${session}/${angle}.${ext}`;
      const up = await sb.storage.from('scans').upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false });
      if (up.error) throw up.error;
      const row = await sb.from('scans').insert({ user_id: uid, session_id: session, angle, path });
      if (row.error) throw row.error;
      saved++;
    } catch (e) {
      console.warn('[moi] scan upload failed:', (e as Error).message);
    }
  }
  return saved;
}
