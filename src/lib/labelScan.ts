// Reads a product photo on the device: first a barcode (exact product match), then the printed
// ingredient list (text recognition). The photo itself is never uploaded.
// Web only for now — the native app falls back to pasting the label.
import { Platform } from 'react-native';
import { type CatalogProduct } from './products';
import { ensureUser, supabase } from './supabase';

export const canScanLabels = Platform.OS === 'web';

/** Draws the photo to a canvas (max 1600 px) so both readers get the same pixels. */
async function toImageData(uri: string): Promise<ImageData> {
  const img = new (globalThis as any).Image() as HTMLImageElement;
  img.crossOrigin = 'anonymous';
  img.src = uri;
  await img.decode();
  const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * k);
  canvas.height = Math.round(img.naturalHeight * k);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

let zxingReady: Promise<typeof import('zxing-wasm/reader')> | null = null;
function zxing() {
  zxingReady ??= import('zxing-wasm/reader').then(m => {
    // The decoder is served from our own site, not a CDN.
    m.prepareZXingModule({ overrides: { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? '/zxing_reader.wasm' : prefix + path) } });
    return m;
  });
  return zxingReady;
}

/** The product barcode in the photo (EAN/UPC), or null. */
export async function readBarcode(uri: string): Promise<string | null> {
  const [{ readBarcodes }, data] = await Promise.all([zxing(), toImageData(uri)]);
  const found = await readBarcodes(data, { formats: ['EAN13', 'EAN8', 'UPCA', 'UPCE'], tryHarder: true, maxNumberOfSymbols: 1 });
  const code = found.find(r => r.isValid)?.text ?? null;
  if (__DEV__ || code) console.info('[moi] barcode', code ?? 'none');
  return code;
}

/** Every product barcode in the photo (a shelf can show many). */
export async function readBarcodes(uri: string): Promise<string[]> {
  const [{ readBarcodes: read }, data] = await Promise.all([zxing(), toImageData(uri)]);
  const found = await read(data, { formats: ['EAN13', 'EAN8', 'UPCA', 'UPCE'], tryHarder: true, maxNumberOfSymbols: 24 });
  return [...new Set(found.filter(r => r.isValid).map(r => r.text))];
}

/** Looks a barcode up in the catalog (and Open Beauty Facts behind it). */
export async function productByBarcode(code: string): Promise<CatalogProduct | null> {
  const sb = supabase();
  if (!sb) return null;
  await ensureUser();
  const { data, error } = await sb.functions.invoke<{ products: CatalogProduct[] }>(`product-search?code=${code}`, { method: 'GET' });
  if (error) throw error;
  return data?.products?.[0] ?? null;
}

/** Reads the printed text; `onProgress` gets 0–1 while it works. */
export async function readText(uri: string, onProgress?: (p: number) => void): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  // OEM 1 = LSTM only, matching the cores we ship. Everything is served from our own site.
  const worker = await createWorker('eng', 1, {
    workerPath: '/ocr/worker.min.js', corePath: '/ocr', langPath: '/ocr', gzip: true,
    logger: (m: { status: string; progress: number }) => { if (m.status === 'recognizing text') onProgress?.(m.progress); },
  });
  try {
    const { data } = await worker.recognize(uri);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

const START = /\b(ingredients?|ingr[ée]dients?|inci|composition|contains)\b\s*[:.\-]?/i;
const STOP = /\b(directions?|how to use|warnings?|caution|precautions?|for external use|made in|distributed by|manufactured|keep out of reach|net (wt|vol)|best before)\b/i;

/**
 * Pulls the ingredient list out of everything the camera read: the text after "Ingredients",
 * up to the next section, cleaned of line breaks and OCR noise.
 */
export function extractIngredients(raw: string): { text: string; confident: boolean } {
  const flat = raw.replace(/\r/g, '').replace(/-\n(?=[a-z])/g, '').replace(/\n+/g, ' ');
  const m = START.exec(flat);
  let body = m ? flat.slice(m.index + m[0].length) : flat;
  const stop = STOP.exec(body);
  if (stop && stop.index > 20) body = body.slice(0, stop.index);
  const text = body
    .replace(/[|•·*_~`"“”]/g, ' ')
    .replace(/\s*[,;]\s*/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,.:]+|[\s,.:]+$/g, '')
    .trim();
  // Confident when we found the heading and it looks like a list.
  return { text, confident: !!m && (text.match(/,/g)?.length ?? 0) >= 3 };
}
