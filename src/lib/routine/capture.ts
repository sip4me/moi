import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { productByBarcode, readBarcode } from '../labelScan';
import { ensureUser, supabase } from '../supabase';
import { areaOf, classify, searchRemote, type Area, type Catalog, type Item } from './model';

/** Takes (or picks) a photo of a product. */
export async function takeProductPhoto(fromLibrary = false): Promise<string | null> {
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, allowsEditing: false };
  if (!fromLibrary && Platform.OS !== 'web') { const p = await ImagePicker.requestCameraPermissionsAsync(); if (!p.granted) fromLibrary = true; }
  const res = fromLibrary ? await ImagePicker.launchImageLibraryAsync(opts) : await ImagePicker.launchCameraAsync(opts).catch(() => ImagePicker.launchImageLibraryAsync(opts));
  return res.canceled ? null : res.assets[0]?.uri ?? null;
}

/** Saves the photo to the person's private folder; returns its storage path. */
async function uploadPhoto(uri: string): Promise<string | null> {
  const sb = supabase();
  const uid = sb ? await ensureUser() : null;
  if (!sb || !uid) return null;
  const blob = await (await fetch(uri)).blob();
  const path = `${uid}/${Date.now()}.jpg`;
  const { error } = await sb.storage.from('product-photos').upload(path, blob, { contentType: blob.type || 'image/jpeg' });
  return error ? null : path;
}

export type CaptureResult = { item: Item | null; code: string | null; message: string };

/**
 * Reads the barcode in a product photo and finds the product: our catalog first, then Moi's
 * product catalog and Open Beauty Facts. Anything new goes to the review queue with its photo,
 * which is how the database grows.
 */
export async function itemFromPhoto(uri: string, cat: Catalog): Promise<CaptureResult> {
  const code = await readBarcode(uri).catch(() => null);
  const sb = supabase();
  const photo = uploadPhoto(uri).catch(() => null);
  if (!code) {
    await queue({ name: 'Photo without a barcode', photo: await photo, code: null, found: false });
    return { item: null, code: null, message: 'No barcode found. Try again closer, with the barcode flat and well lit, or type the name.' };
  }
  if (sb) {
    const { data } = await sb.from('kb_products').select('id').eq('code', code).maybeSingle();
    const known = data && cat.products.find(p => p.id === (data as any).id);
    if (known) return { item: known, code, message: `Found ${known.brand} ${known.name}.` };
  }
  const p = await productByBarcode(code).catch(() => null);
  if (p) {
    const { category, tags } = classify(p.name, p.ingredients);
    const item: Item = { kind: 'product', brand: p.brand ?? '', name: p.name, category, tags };
    await queue({ name: p.name, brand: p.brand, code, ingredients: p.ingredients, category, photo: await photo, found: true });
    return { item, code, message: `Found ${p.brand ? `${p.brand} ` : ''}${p.name}.` };
  }
  await queue({ name: `Barcode ${code}`, code, photo: await photo, found: false });
  return { item: null, code, message: `We read barcode ${code} but don't have this product yet. Type its name and we'll add it to the database.` };
}

async function queue(r: { name: string; brand?: string | null; code: string | null; ingredients?: string; category?: string; photo: string | null; found: boolean }) {
  const sb = supabase();
  if (!sb || !(await ensureUser())) return;
  await sb.from('kb_submissions').insert({ name: r.name, brand: r.brand ?? null, code: r.code, ingredients_raw: r.ingredients ?? null, category: r.category ?? null, image_path: r.photo, barcode_found: r.found });
}

/** Typed products we don't know go to the review queue too. */
export const submitTyped = (name: string, category: string) => queue({ name, code: null, category, photo: null, found: false }).catch(() => {});

/**
 * For products we don't have: read the ingredient list from a photo of the label, on the device,
 * so the gap report can check sulfates, silicones, proteins and oils right away.
 * The ingredients also go to the review queue, so the product joins the database for everyone.
 */
export async function ingredientsFromPhoto(uri: string, item: Item, onProgress?: (p: number) => void): Promise<{ item: Item; found: number; confident: boolean }> {
  const { readText, extractIngredients } = await import('../labelScan');
  const { text, confident } = extractIngredients(await readText(uri, onProgress));
  const { category, tags } = classify(`${item.name} ${item.category}`, text);
  const merged: Item = { ...item, category: item.category || category, tags: Array.from(new Set([...item.tags, ...tags])) };
  queue({ name: item.name, brand: item.brand || null, code: null, ingredients: text, category: merged.category, photo: await uploadPhoto(uri).catch(() => null), found: false }).catch(() => {});
  return { item: merged, found: text.split(',').filter(s => s.trim()).length, confident };
}

/**
 * Snap your shelf: one photo of several products. Reads every barcode first (exact matches), then the
 * printed brand and product names for anything whose barcode isn't showing, and matches both against the
 * product database. Everything happens on the device; the photo isn't uploaded.
 */
export async function shelfFromPhoto(uri: string, area: Area, onProgress?: (stage: 'barcodes' | 'labels' | 'matching', p: number) => void): Promise<Item[]> {
  const { readBarcodes, readText } = await import('../labelScan');
  const sb = supabase();
  const found = new Map<string, Item>();
  const keep = (i: Item) => { if (i.id && !found.has(i.id) && (areaOf(i.category) === area)) found.set(i.id, i); };

  onProgress?.('barcodes', 0);
  const codes = await readBarcodes(uri).catch(() => [] as string[]);
  if (sb && codes.length) {
    const { data } = await sb.from('kb_products').select('id,brand,name,category,step_cat,hair,tags,price_usd,ing_groups,goals').in('code', codes);
    for (const r of (data ?? []) as any[]) keep({ kind: 'product', id: r.id, brand: r.brand ?? '', name: r.name, category: r.hair ? r.category : r.step_cat ?? r.category, tags: r.tags ?? [], price: r.price_usd, ingGroups: r.ing_groups ?? [], goals: r.goals ?? [] });
  }

  onProgress?.('labels', 0);
  const text = await readText(uri, p => onProgress?.('labels', p)).catch(() => '');
  // Lines that look like a brand or product name: mostly letters, 2 to 6 words.
  const lines = [...new Set(text.split(/\n+/).map(l => l.replace(/[^\p{L}\p{N}&' -]/gu, ' ').replace(/\s+/g, ' ').trim())
    .filter(l => l.length >= 4 && l.length <= 48 && /\p{L}{3}/u.test(l) && l.split(' ').length <= 6 && !/\b(ml|oz|fl|ingredients?|aqua|water|directions?)\b/i.test(l)))].slice(0, 14);
  onProgress?.('matching', 0);
  for (let k = 0; k < lines.length; k++) {
    const line = lines[k];
    const hits = await searchRemote(line, undefined, area).catch(() => [] as Item[]);
    const words = line.toLowerCase().split(' ').filter(w => w.length >= 4);
    const best = hits.find(h => words.some(w => `${h.brand} ${h.name}`.toLowerCase().includes(w)));
    if (best) keep(best);
    onProgress?.('matching', (k + 1) / lines.length);
  }
  return [...found.values()].slice(0, 20);
}
