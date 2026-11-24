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
/** Words that say what kind of product something is, by category (to check a match is the right kind). */
const KIND_WORDS: Record<string, RegExp> = {
  shampoo: /shampoo/i, conditioner: /conditioner/i, leave_in: /leave[- ]?in/i, oil: /\boil\b/i, styler: /gel|cream|curl|mousse/i, heat_protectant: /heat|thermal|protect/i,
  deep_conditioner: /mask|masque|deep/i, cleanser: /cleanser|wash|foam/i, moisturizer: /moistur|cream|lotion|gel/i, serum: /serum/i, spf: /spf|sunscreen|sun/i, toner: /toner|essence/i,
  foundation: /foundation|tint/i, concealer: /conceal/i, powder: /powder/i, primer: /primer/i, blush: /blush/i, bronzer: /bronz|contour/i, highlighter: /highlight|glow/i,
  mascara: /mascara|lash/i, eyeliner: /liner|kohl|kajal/i, eyeshadow: /shadow|palette/i, brows: /brow/i, lips: /lip|stick|liner/i, lip_gloss: /gloss/i,
  body_wash: /body wash|shower/i, body_lotion: /lotion|body cream|butter/i, deodorant: /deodorant/i,
};
const STOPWORDS = new Set(['with', 'and', 'for', 'the', 'new', 'ml', 'oz', 'fl', 'net', 'wt', 'all', 'hair', 'skin', 'types']);
const words = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(w => w.length >= 3 && !STOPWORDS.has(w));

/**
 * Snap your shelf: tells the products in one photo apart.
 * 1. Barcodes: each one is a different product, matched exactly.
 * 2. Printed text: lines are grouped by where they sit (side-by-side bottles become separate groups), so one
 *    bottle's brand and name are read together and never mixed with its neighbour's.
 * 3. Each group is matched on brand + name words, and the match must be the right kind of product
 *    (a group that says "conditioner" can't become a shampoo). Weak matches come back marked unsure.
 */
export async function shelfFromPhoto(uri: string, area: Area, onProgress?: (stage: 'barcodes' | 'labels' | 'matching', p: number) => void, onFound?: (items: (Item & { unsure?: boolean })[]) => void): Promise<(Item & { unsure?: boolean })[]> {
  const { readBarcodes, readLines } = await import('../labelScan');
  const sb = supabase();
  const found = new Map<string, Item & { unsure?: boolean }>();
  const keep = (i: Item, unsure = false) => {
    if (!i.id || areaOf(i.category) !== area) return;
    const had = found.get(i.id);
    if (!had || (had.unsure && !unsure)) { found.set(i.id, { ...i, unsure }); onFound?.([...found.values()]); }
  };

  onProgress?.('barcodes', 0);
  const codes = await readBarcodes(uri).catch(() => [] as string[]);
  if (sb && codes.length) {
    const { data } = await sb.from('kb_products').select('id,brand,name,category,step_cat,hair,tags,price_usd,ing_groups,goals,code').in('code', codes);
    for (const r of (data ?? []) as any[]) keep({ kind: 'product', id: r.id, brand: r.brand ?? '', name: r.name, category: r.hair ? r.category : r.step_cat ?? r.category, tags: r.tags ?? [], price: r.price_usd ?? null, code: r.code ?? null });
  }

  onProgress?.('labels', 0);
  const lines = (await readLines(uri, p => onProgress?.('labels', p)).catch(() => []))
    .filter(l => l.conf >= 55 && l.text.length >= 3 && /\p{L}{3}/u.test(l.text) && !/\b(ingredients?|aqua|directions?|warning|caution)\b/i.test(l.text));
  // Group lines into products: lines overlap horizontally when they're on the same bottle.
  const groups: { x0: number; x1: number; text: string[] }[] = [];
  for (const l of [...lines].sort((a, b) => a.x0 - b.x0)) {
    const g = groups.find(g => Math.min(g.x1, l.x1) - Math.max(g.x0, l.x0) > 0.4 * Math.min(g.x1 - g.x0, l.x1 - l.x0));
    if (g) { g.x0 = Math.min(g.x0, l.x0); g.x1 = Math.max(g.x1, l.x1); g.text.push(l.text); } else groups.push({ x0: l.x0, x1: l.x1, text: [l.text] });
  }

  onProgress?.('matching', 0);
  const todo = groups.filter(g => words(g.text.join(' ')).length).slice(0, 12);
  for (let k = 0; k < todo.length; k++) {
    const text = todo[k].text.join(' ');
    const ws = new Set(words(text));
    // Search with the group's most name-like lines (short, mostly letters), then score every hit against all its words.
    const query = todo[k].text.filter(t => t.split(' ').length <= 6).slice(0, 3).join(' ');
    const hits = await searchRemote(query || text.slice(0, 60), undefined, area).catch(() => [] as Item[]);
    const scored = hits.map(h => {
      const brand = words(h.brand), name = words(h.name);
      const brandHit = brand.length > 0 && brand.every(w => ws.has(w));
      const nameHits = name.filter(w => ws.has(w)).length;
      const kind = KIND_WORDS[h.category];
      const kindClash = Object.entries(KIND_WORDS).some(([c, re]) => c !== h.category && re.test(text) && !(kind && kind.test(text)));
      return { h, score: (brandHit ? 3 : 0) + nameHits * 2 + (kind?.test(text) ? 2 : 0) - (kindClash ? 4 : 0), nameHits, brandHit };
    }).sort((a, b) => b.score - a.score);
    const best = scored[0];
    // Sure: brand and at least one name word, or three name words. Otherwise offer it, unticked, as a guess.
    if (best && best.score >= 4) keep(best.h, !((best.brandHit && best.nameHits >= 1) || best.nameHits >= 3));
    onProgress?.('matching', (k + 1) / todo.length);
  }
  return [...found.values()].slice(0, 20);
}
