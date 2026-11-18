import { Linking, Platform } from 'react-native';
import { ensureUser, supabase } from './supabase';

export type BuddyStreak = { pair_id: string; buddy_name: string; streak: number; best: number; me_today: boolean; buddy_today: boolean; since: string };

/**
 * Collectible tokens, earned by the best joint streak you've reached with anyone. Sixteen in all,
 * from pairing up to a full year together; names are playful, hair-care themed.
 */
export const TOKENS = [
  { id: 'pair', days: 0, name: 'First Twirl', color: ['#FDE7EE', '#E46C93'] },
  { id: 'baby', days: 2, name: 'Baby Hairs', color: ['#FFF4E0', '#E8A85A'] },
  { id: 'spark', days: 3, name: 'Sparkle Spritz', color: ['#FFF1D6', '#F2A33A'] },
  { id: 'ribbon', days: 5, name: 'Velvet Ribbon', color: ['#F7E1EA', '#B04C7A'] },
  { id: 'silk', days: 7, name: 'Silk Pillow Pact', color: ['#EDE9FF', '#7B66E3'] },
  { id: 'bonnet', days: 10, name: 'Bonnet Buddies', color: ['#FCE4EC', '#D45D8A'] },
  { id: 'pineapple', days: 14, name: 'Moonlit Pineapple', color: ['#FFF6CC', '#D9A400'] },
  { id: 'honey', days: 21, name: 'Honey Drizzle', color: ['#FFEFD0', '#D98A1E'] },
  { id: 'curls', days: 30, name: 'Curl Constellation', color: ['#E6ECFF', '#4F6BD8'] },
  { id: 'lather', days: 45, name: 'Lather Legend', color: ['#E3F4F7', '#3E9BB0'] },
  { id: 'pearl', days: 60, name: 'Shower Pearl', color: ['#EEF3FD', '#5B8DEF'] },
  { id: 'rose', days: 75, name: 'Rosewater Rendezvous', color: ['#FBE6DF', '#C9735A'] },
  { id: 'comb', days: 100, name: 'Golden Comb', color: ['#FFF3D6', '#C9A24A'] },
  { id: 'mermaid', days: 150, name: 'Mermaid Mane', color: ['#DDF5EE', '#2E9C7E'] },
  { id: 'scrunchie', days: 200, name: 'Starlight Scrunchie', color: ['#ECE6FA', '#6A4FC7'] },
  { id: 'crown', days: 365, name: 'The Royal Crown', color: ['#FDE3EC', '#D2638C'] },
] as const;
export type Token = (typeof TOKENS)[number];

export const tokensFor = (streaks: BuddyStreak[]) => {
  const best = Math.max(-1, ...streaks.map(s => s.best));
  return TOKENS.map(t => ({ ...t, earned: streaks.length > 0 && best >= t.days }));
};
export const nextToken = (best: number) => TOKENS.find(t => t.days > best);

export async function loadBuddyStreaks(): Promise<BuddyStreak[]> {
  const sb = supabase();
  if (!sb) return [];
  await ensureUser();
  const today = new Date().toLocaleDateString('en-CA'); // the person's local date, YYYY-MM-DD
  const { data, error } = await sb.rpc('my_buddy_streaks', { today });
  if (error) throw error;
  return (data ?? []) as BuddyStreak[];
}

const appOrigin = () => (Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : 'https://moi-ashy.vercel.app');

/**
 * Makes a one-time invite link and opens the person's own Messages app with it addressed to the number.
 * The number never leaves the device; only its last four digits are saved to label the pending invite.
 */
export async function inviteByPhone(phone: string, myName?: string) {
  const sb = supabase();
  if (!sb) throw new Error('offline');
  await ensureUser();
  const digits = phone.replace(/\D/g, '');
  const { data: code, error } = await sb.rpc('create_buddy_invite', { last4: digits.slice(-4) });
  if (error) throw error;
  const link = `${appOrigin()}/join/${code}`;
  const who = myName && myName !== 'Your name' ? `${myName.split(' ')[0]} wants` : 'I want';
  const body = `${who} to start a hair streak with you on Moi. Join here: ${link}`;
  const iOS = Platform.OS === 'ios' || (Platform.OS === 'web' && typeof navigator !== 'undefined' && /iPhone|iPad|Mac/.test(navigator.userAgent));
  const url = `sms:${encodeURIComponent(phone.trim())}${iOS ? '&' : '?'}body=${encodeURIComponent(body)}`;
  await Linking.openURL(url).catch(() => {});
  return { code: code as string, link, body };
}

export async function acceptInvite(code: string) {
  const sb = supabase();
  if (!sb) throw new Error('offline');
  await ensureUser();
  const { error } = await sb.rpc('accept_buddy_invite', { invite_code: code });
  if (error) throw new Error(error.message);
}

export async function endBuddy(pairId: string) {
  const sb = supabase();
  if (!sb) return;
  await sb.from('buddies').delete().eq('id', pairId);
}
