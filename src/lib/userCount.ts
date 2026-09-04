import { getBrowserSupabase } from './supabase';

export async function fetchRegisteredUserCount(): Promise<number | null> {
  const sb = getBrowserSupabase();
  if (!sb) return null;

  const rpc = await sb.rpc('fu_web_registered_user_count');
  if (!rpc.error && typeof rpc.data === 'number' && Number.isFinite(rpc.data)) {
    return rpc.data;
  }

  const counted = await sb
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .not('auth_provider', 'ilike', 'misafir')
    .not('auth_provider', 'ilike', 'guest')
    .not('auth_provider', 'ilike', 'anonymous');
  if (!counted.error && typeof counted.count === 'number') {
    return counted.count;
  }

  return null;
}
