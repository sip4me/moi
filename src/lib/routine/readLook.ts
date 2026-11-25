/**
 * Sends an inspiration photo (shrunk on the device first) and/or a description to Moi's read-look
 * function, where Claude breaks the look into products. Returns the look, or why it couldn't.
 */
import { ensureUser, supabase } from '../supabase';
import type { LookRead } from './model';

export type ReadResult =
  | { ok: true; look: LookRead & { found?: boolean; face_look?: string | null; eye_look?: string | null; lip_look?: string | null; hair_goals?: string[] }; left: number }
  | { ok: false; why: 'limit' | 'off' | 'none' | 'error'; limit?: number };

/** Photo → JPEG data URL, longest side at most 1024 px (enough detail for colours, small to send). */
export async function shrink(uri: string): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((ok, bad) => { img.onload = () => ok(); img.onerror = () => bad(); img.src = uri; }).catch(() => null);
  if (!img.naturalWidth) return null;
  const k = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.85);
}

export async function readLook(photo?: string, text?: string): Promise<ReadResult> {
  const sb = supabase();
  if (!sb) return { ok: false, why: 'off' };
  await ensureUser();
  const image = photo ? await shrink(photo) : null;
  if (!image && !text?.trim()) return { ok: false, why: 'none' };
  const { data, error } = await sb.functions.invoke<{ configured?: boolean; limited?: boolean; limit?: number; look?: any; left?: number; error?: string }>('read-look', { body: { ...(image ? { image } : {}), ...(text?.trim() ? { text: text.trim() } : {}) } });
  if (error || !data) return { ok: false, why: 'error' };
  if (data.configured === false) return { ok: false, why: 'off' };
  if (data.limited) return { ok: false, why: 'limit', limit: data.limit };
  if (!data.look || data.look.found === false) return { ok: false, why: 'none' };
  return { ok: true, look: data.look, left: data.left ?? 0 };
}
