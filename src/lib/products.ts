import { ensureUser, supabase } from './supabase';

export type CatalogProduct = { code: string; name: string; brand: string | null; ingredients: string; image_url: string | null; hair: boolean };

/** Attribution required by the Open Database License wherever catalog results are shown. */
export const PRODUCT_DATA_CREDIT = 'Product data © Open Beauty Facts contributors, ODbL';
export const PRODUCT_DATA_URL = 'https://world.openbeautyfacts.org';

/** Searches the shared catalog; the function fills gaps from Open Beauty Facts on first lookup. */
export async function searchProducts(q: string, signal?: AbortSignal): Promise<CatalogProduct[]> {
  const sb = supabase();
  if (!sb || q.trim().length < 2) return [];
  await ensureUser();
  const { data, error } = await sb.functions.invoke<{ products: CatalogProduct[] }>(`product-search?q=${encodeURIComponent(q.trim())}`, { method: 'GET', signal } as any);
  if (error) throw error;
  return data?.products ?? [];
}
