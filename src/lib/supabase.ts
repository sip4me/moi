import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

// ── "Keep me signed in" ────────────────────────────────────────────────────────
// When on, the session lives in device storage and survives closing the app.
// When off, it lives in memory only, so the next launch starts signed out.
const REMEMBER_KEY = 'moi-remember';
const memory = new Map<string, string>();
let remember = true;
const loaded = AsyncStorage.getItem(REMEMBER_KEY).then(v => { remember = v !== '0'; }).catch(() => {});

export const wasRemembered = async () => { await loaded; return remember; };

export async function setRemember(on: boolean) {
  await loaded;
  if (on === remember) return;
  remember = on;
  await AsyncStorage.setItem(REMEMBER_KEY, on ? '1' : '0');
  // Move whatever session exists to the newly chosen place.
  const keys = (await AsyncStorage.getAllKeys()).filter(k => k.startsWith('sb-'));
  if (on) {
    for (const [k, v] of memory) await AsyncStorage.setItem(k, v);
    memory.clear();
  } else {
    for (const k of keys) { const v = await AsyncStorage.getItem(k); if (v) memory.set(k, v); }
    await AsyncStorage.multiRemove(keys);
  }
}

const sessionStorage = {
  getItem: async (k: string) => { await loaded; return remember ? AsyncStorage.getItem(k) : memory.get(k) ?? null; },
  setItem: async (k: string, v: string) => { await loaded; if (remember) await AsyncStorage.setItem(k, v); else memory.set(k, v); },
  removeItem: async (k: string) => { memory.delete(k); await AsyncStorage.removeItem(k); },
};

// ── Client ────────────────────────────────────────────────────────────────────
let client: SupabaseClient | null = null;

// Created lazily so the static web export (which renders without a browser) never touches storage.
export function supabase(): SupabaseClient | null {
  if (!url || !key) return null;
  if (Platform.OS === 'web' && typeof window === 'undefined') return null;
  client ??= createClient(url, key, {
    auth: { storage: sessionStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
  });
  return client;
}

// Every person gets a quiet anonymous account on first open, so their plan is
// saved without a sign-up form. Signing up later upgrades this same account.
export async function ensureUser(): Promise<string | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: signed, error } = await sb.auth.signInAnonymously();
  if (error) { console.warn('[moi] anonymous sign-in failed:', error.message); return null; }
  return signed.user?.id ?? null;
}
