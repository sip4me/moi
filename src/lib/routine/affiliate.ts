/**
 * Store links for a product, tagged for affiliate credit when Moi has the program IDs.
 *
 * - Links use the product's barcode (UPC/EAN) when we have it, so the store search lands on that exact product
 *   instead of a fuzzy name match; otherwise brand + name.
 * - Affiliate IDs come from public build-time env (they are tracking IDs, not secrets):
 *     EXPO_PUBLIC_AMAZON_TAG      Amazon Associates tag, e.g. moi-20 (added as &tag=)
 *     EXPO_PUBLIC_AFF_ULTA        deep-link template from the network, with {url} where the store URL goes
 *     EXPO_PUBLIC_AFF_TARGET      e.g. https://goto.target.com/c/<pub>/<ad>/<campaign>?u={url}
 *     EXPO_PUBLIC_AFF_SEPHORA
 *   Unset → plain store links (no credit, nothing breaks).
 * - Prices: Amazon only allows showing its prices from its own API or Amazon-served links, so Moi never shows a
 *   price next to an Amazon link unless it came from there; unknown prices say "See price".
 */
import type { Item } from './model';

const env = (k: string) => (process.env as Record<string, string | undefined>)[k]?.trim() || '';
const AMAZON_TAG = env('EXPO_PUBLIC_AMAZON_TAG');
const TEMPLATES: Record<string, string> = {
  'Ulta Beauty': env('EXPO_PUBLIC_AFF_ULTA'),
  Target: env('EXPO_PUBLIC_AFF_TARGET'),
  Sephora: env('EXPO_PUBLIC_AFF_SEPHORA'),
};

/** True when at least one store link earns Moi a commission (drives the required disclosure). */
export const HAS_AFFILIATE = !!(AMAZON_TAG || Object.values(TEMPLATES).some(Boolean));

const wrap = (store: string, url: string) => {
  const t = TEMPLATES[store];
  return t ? t.replace('{url}', encodeURIComponent(url)) : url;
};

export type StoreLink = { name: string; url: string; exact: boolean; tagged: boolean };

/**
 * Amazon's Add to Cart form: puts every product (by ASIN) straight into the shopper's Amazon cart, credited
 * to Moi's tag. Amazon still shows its cart, where the shopper taps "Proceed to checkout" themselves.
 * Null when any product has no known ASIN.
 */
export function amazonCart(items: Item[]): string | null {
  if (!items.length || items.some(i => !i.asin)) return null;
  const parts = items.map((i, n) => `ASIN.${n + 1}=${encodeURIComponent(i.asin!)}&Quantity.${n + 1}=1`).join('&');
  return `https://www.amazon.com/gp/aws/cart/add.html?${AMAZON_TAG ? `AssociateTag=${encodeURIComponent(AMAZON_TAG)}&` : ''}${parts}`;
}

export function storeLinks(i: Item & { code?: string | null }): StoreLink[] {
  const code = (i.code ?? '').replace(/\D/g, '');
  const exact = code.length >= 8;
  const q = encodeURIComponent(exact ? code : `${i.brand} ${i.name}`.trim());
  // Known ASIN: straight into the Amazon cart. Otherwise an exact barcode search.
  const amazon = amazonCart([i]) ?? `https://www.amazon.com/s?k=${q}${AMAZON_TAG ? `&tag=${encodeURIComponent(AMAZON_TAG)}` : ''}`;
  const raw: [string, string][] = [
    ['Amazon', amazon],
    ['Ulta Beauty', `https://www.ulta.com/search?search=${encodeURIComponent(`${i.brand} ${i.name}`.trim())}`],
    ['Target', `https://www.target.com/s?searchTerm=${q}`],
    ['Sephora', `https://www.sephora.com/search?keyword=${encodeURIComponent(`${i.brand} ${i.name}`.trim())}`],
  ];
  return raw.map(([name, url]) => ({
    name,
    url: name === 'Amazon' ? url : wrap(name, url),
    exact: exact && (name === 'Amazon' || name === 'Target'),
    tagged: name === 'Amazon' ? !!AMAZON_TAG : !!TEMPLATES[name],
  }));
}
