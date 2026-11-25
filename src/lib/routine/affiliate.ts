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
import { Linking } from 'react-native';
import { supabase } from '../supabase';
import type { Item } from './model';

const env = (k: string) => (process.env as Record<string, string | undefined>)[k]?.trim() || '';
// Moi's Amazon Associates store ID (a public tracking tag, not a secret). The env value wins if set.
const AMAZON_TAG = env('EXPO_PUBLIC_AMAZON_TAG') || 'moibeauty07-20';
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
    // Known ASIN (checked in stock): the product's own Amazon page. Otherwise an Amazon search. Both carry Moi's tag.
  const tag = AMAZON_TAG ? `tag=${encodeURIComponent(AMAZON_TAG)}` : '';
  const amazon = i.asin ? `https://www.amazon.com/dp/${encodeURIComponent(i.asin)}${tag ? `?${tag}` : ''}` : `https://www.amazon.com/s?k=${q}${tag ? `&${tag}` : ''}`;
  const raw: [string, string][] = [
    ['Amazon', amazon],
    ['Ulta Beauty', `https://www.ulta.com/search?search=${encodeURIComponent(`${i.brand} ${i.name}`.trim())}`],
    ['Target', `https://www.target.com/s?searchTerm=${q}`],
    ['Sephora', `https://www.sephora.com/search?keyword=${encodeURIComponent(`${i.brand} ${i.name}`.trim())}`],
  ];
  return raw.map(([name, url]) => ({
    name,
    url: name === 'Amazon' ? url : TEMPLATES[name] ? wrap(name, url) : withUtm(url),
    exact: (name === 'Amazon' && !!i.asin) || (exact && (name === 'Amazon' || name === 'Target')),
    tagged: name === 'Amazon' ? !!AMAZON_TAG : !!TEMPLATES[name],
  }));
}

/** Plain (untagged) links say where the visitor came from, so brands see "usemoi" in their own analytics. */
export function withUtm(url: string, medium = 'referral'): string {
  try {
    const u = new URL(url);
    if (!u.searchParams.has('utm_source')) { u.searchParams.set('utm_source', 'usemoi'); u.searchParams.set('utm_medium', medium); }
    return u.toString();
  } catch { return url; }
}

export type ClickSource = 'chat' | 'picks' | 'shop' | 'page' | 'handoff' | 'gaps' | 'look';
/** Counts a store-link tap: brand, product, store, where in Moi. Anonymous (no user id). Never blocks the tap. */
export function logClick(c: { brand?: string; product?: string; productId?: string; store: string; source: ClickSource; web?: boolean; tagged?: boolean }) {
  const sb = supabase(); if (!sb) return;
  const id = c.productId && /^[0-9a-f-]{36}$/i.test(c.productId) ? c.productId : null;
  sb.from('link_clicks').insert({ brand: c.brand?.slice(0, 80) ?? null, product: c.product?.slice(0, 160) ?? null, product_id: id, store: c.store.slice(0, 40), source: c.source, web: !!c.web, tagged: !!c.tagged })
    .then(() => undefined, () => undefined);
}

/** Opens a store link for a product and counts the tap. */
export function openStore(i: Pick<Item, 'brand' | 'name' | 'id'>, link: { name: string; url: string; tagged?: boolean }, source: ClickSource) {
  logClick({ brand: i.brand, product: i.name, productId: i.id, store: link.name, source, tagged: link.tagged });
  Linking.openURL(link.url);
}
