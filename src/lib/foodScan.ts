// Iron scanner: find a food by barcode (Open Food Facts) or read "Iron" off its Nutrition Facts panel.
import { ensureUser, supabase } from './supabase';

export type ScannedFood = { name: string; brand?: string | null; serving?: string | null; image_url?: string | null; ironMg: number; basis: 'serving' | '100g' };

export const FOOD_DATA_CREDIT = 'Food data © Open Food Facts contributors, ODbL';
/** FDA Daily Value for iron, used to turn "% DV" on a US label into milligrams. */
const IRON_DV_MG = 18;

/** Looks a food barcode up; null when it isn't there or doesn't list iron. */
export async function foodByBarcode(code: string): Promise<ScannedFood | null> {
  const sb = supabase();
  if (!sb) return null;
  await ensureUser();
  const { data, error } = await sb.functions.invoke<{ food: null | { name: string; brand: string | null; serving: string | null; image_url: string | null; ironPer100gMg: number | null; ironPerServingMg: number | null } }>(`food-lookup?code=${code}`, { method: 'GET' });
  if (error) throw error;
  const f = data?.food;
  if (!f) return null;
  if (f.ironPerServingMg !== null) return { ...f, ironMg: f.ironPerServingMg, basis: 'serving' };
  if (f.ironPer100gMg !== null) return { ...f, ironMg: f.ironPer100gMg, basis: '100g' };
  return null;
}

/** Reads iron (and the serving size) from Nutrition Facts text: "Iron 3.6mg 20%" or just "Iron 20%". */
export function ironFromLabel(raw: string): { ironMg: number; serving?: string } | null {
  const flat = raw.replace(/\r/g, '').replace(/[|]/g, ' ');
  const serving = /serving size\s*[:\-]?\s*([^\n]{2,40})/i.exec(flat)?.[1]?.trim();
  // OCR often drops or swaps the capital I ("ron8.1mg", "lron 8 mg") and the space before the number.
  const IRON = String.raw`(?:^|[^a-z])[il1|!]?ron(?![a-z])[^\n\d]{0,12}`;
  const mg = new RegExp(IRON + String.raw`(\d+(?:[.,]\d+)?)\s*m\s*g`, 'im').exec(flat);
  if (mg) return { ironMg: parseFloat(mg[1].replace(',', '.')), serving };
  const pct = new RegExp(IRON + String.raw`(\d{1,3})\s*%`, 'im').exec(flat);
  if (pct) return { ironMg: Math.round((+pct[1] / 100) * IRON_DV_MG * 10) / 10, serving };
  return null;
}

/** FDA wording: 20%+ of the Daily Value is "high", 10–19% is a "good source". */
export function ironVerdict(mg: number) {
  const dv = (mg / IRON_DV_MG) * 100;
  if (dv >= 20) return { label: 'Iron-rich', tone: 'green' as const };
  if (dv >= 10) return { label: 'Good source of iron', tone: 'amber' as const };
  return { label: 'Low in iron', tone: 'gray' as const };
}
