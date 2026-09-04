import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let browserClient: SupabaseClient | null = null;

export function isBrowserSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

export function getBrowserSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'fu-web-auth',
      },
    });
  }
  return browserClient;
}
