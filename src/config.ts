/**
 * External links. Leave a value empty and Settings shows "Coming soon" instead of a dead link.
 * The Notion pages must be published (Share → Publish) so people without Notion can open them.
 */
export const LINKS = {
  terms: 'https://app.notion.com/p/Terms-of-Use-41c0edb7cf3a8045bf7efb30c37bdbd7',
  privacy: 'https://app.notion.com/p/Moi-Privacy-Policy-41c0edb7cf3a804faee2d427f12a96fe',
  contact: '', // e.g. 'mailto:hello@yourdomain.com'
};

/** Opens a link in a new tab on the web (so the app stays open) and in the browser on phones. */
export function openLink(url: string) {
  if (!url) return;
  if (typeof window !== 'undefined' && typeof window.open === 'function') window.open(url, '_blank', 'noopener');
  else import('react-native').then(({ Linking }) => Linking.openURL(url));
}
