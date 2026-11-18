import { ensureUser, supabase } from './supabase';

export type CatalogProduct = { code: string; name: string; brand: string | null; ingredients: string; image_url: string | null; hair: boolean; source?: string };

/** True for results that came from Open Beauty Facts (the only ones that need its credit). */
export const fromOpenBeautyFacts = (p: CatalogProduct) => !p.source || p.source === 'openbeautyfacts';

/** Attribution required by the Open Database License wherever catalog results are shown. */
export const PRODUCT_DATA_CREDIT = 'Product data © Open Beauty Facts contributors, ODbL';
export const PRODUCT_DATA_URL = 'https://world.openbeautyfacts.org';

/** Searches the shared catalog; the function fills gaps from Open Beauty Facts, then the brand's own site. */
/** `web` asks the server to look the product up on its brand's site when nothing else has it (slower, rate-limited). */
export async function searchProducts(q: string, signal?: AbortSignal, web = false): Promise<CatalogProduct[]> {
  return (await searchCatalog(q, signal, web)).products;
}

/** Same search, plus whether the server can look products up online right now. */
export async function searchCatalog(q: string, signal?: AbortSignal, web = false): Promise<{ products: CatalogProduct[]; canLookUp: boolean }> {
  const sb = supabase();
  if (!sb || q.trim().length < 2) return { products: [], canLookUp: false };
  await ensureUser();
  const { data, error } = await sb.functions.invoke<{ products: CatalogProduct[]; canLookUp?: boolean }>(`product-search?q=${encodeURIComponent(q.trim())}${web ? '&web=1' : ''}`, { method: 'GET', signal } as any);
  if (error) throw error;
  return { products: data?.products ?? [], canLookUp: !!data?.canLookUp };
}
