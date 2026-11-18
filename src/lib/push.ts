import { Platform } from 'react-native';
import { ensureUser, supabase } from './supabase';

const KEY = process.env.EXPO_PUBLIC_VAPID_KEY;

export type PushResult = 'on' | 'denied' | 'needs-home-screen' | 'unsupported';

function keyBytes(b64url: string) {
  const b64 = (b64url + '='.repeat((4 - (b64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

const isIOS = () => typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
const isStandalone = () => typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true);

/**
 * Turns on reminders for this device: asks permission, subscribes to web push and saves the
 * subscription to the person's account so the hourly sender can reach it. iPhone only allows this
 * from the home-screen app, so in a Safari tab it says so instead of failing quietly.
 */
export async function enablePush(): Promise<PushResult> {
  if (Platform.OS !== 'web') return 'unsupported'; // native push arrives with the App Store build
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') {
    return isIOS() && !isStandalone() ? 'needs-home-screen' : 'unsupported';
  }
  if (!KEY) return 'unsupported';
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';

  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(KEY) }));
  const uid = await ensureUser();
  const sb = supabase();
  if (sb && uid) {
    const json = sub.toJSON();
    await sb.from('push_tokens').upsert({ user_id: uid, platform: 'web', token: json.endpoint!, subscription: json, last_seen_at: new Date().toISOString() }, { onConflict: 'token' });
  }
  return 'on';
}

/** Records that a reminder was opened, so the sender can tell reminders that help from noise. */
export async function markOpened(notificationId: string) {
  const sb = supabase();
  if (!sb || !/^[0-9a-f-]{36}$/.test(notificationId)) return;
  await ensureUser();
  await sb.from('notification_log').update({ opened_at: new Date().toISOString() }).eq('id', notificationId).is('opened_at', null);
}
