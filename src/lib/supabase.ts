import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

let client: SupabaseClient | null = null;

// Created lazily so the static web export (which renders without a browser) never touches storage.
export function supabase(): SupabaseClient | null {
  if (!url || !key) return null;
  if (Platform.OS === 'web' && typeof window === 'undefined') return null;
  if (!client) {
    client = createClient(url, key, {
      auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    });
  }
  return client;
}

// Every person gets a quiet anonymous account on first open, so their plan is
// saved without a sign-up form. It can be upgraded to email/Apple later.
export async function ensureUser(): Promise<string | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: signed, error } = await sb.auth.signInAnonymously();
  if (error) { console.warn('[moi] anonymous sign-in failed:', error.message); return null; }
  return signed.user?.id ?? null;
}
