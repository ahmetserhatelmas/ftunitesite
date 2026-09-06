import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Match, PlayerReview } from '../src/types';
import { StandingTeam } from '../src/data/superLigStandings';
import { envString } from './env';

let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = envString('SUPABASE_URL') || envString('VITE_SUPABASE_URL');
  const key = envString('SUPABASE_ANON_KEY') || envString('VITE_SUPABASE_ANON_KEY');
  if (!url || !key) {
    client = null;
    return client;
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabase());
}

export async function loadCachedSeason(season: number): Promise<{
  matches: Match[];
  standings: StandingTeam[];
  reviews: PlayerReview[];
} | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const [matchesRes, standingsRes, reviewsRes] = await Promise.all([
    supabase.from('fu_web_matches').select('payload').eq('season', season),
    supabase.from('fu_web_standings').select('payload').eq('id', 'super-lig').eq('season', season).maybeSingle(),
    supabase.from('fu_web_reviews').select('payload').order('created_at', { ascending: true }),
  ]);

  if (matchesRes.error && standingsRes.error) {
    return null;
  }

  return {
    matches: (matchesRes.data || []).map((row) => row.payload as Match).filter(Boolean),
    standings: (standingsRes.data?.payload as StandingTeam[]) || [],
    reviews: (reviewsRes.data || []).map((row) => row.payload as PlayerReview).filter(Boolean),
  };
}

export async function saveMatches(_season: number, _matches: Match[]): Promise<void> {
  // Website cache tables are optional. Never write to the game's match_rooms / league_state.
}

export async function saveStandings(_season: number, _week: number, _standings: StandingTeam[]): Promise<void> {
  // Optional cache — skipped without service role.
}

export async function saveReview(_review: PlayerReview): Promise<void> {
  // Reviews are written by the signed-in browser client into fu_web_reviews.
}

export async function loadReviews(): Promise<PlayerReview[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('fu_web_reviews')
    .select('payload, user_id')
    .order('created_at', { ascending: true });
  if (error) return [];
  return (data || [])
    .map((row) => {
      const payload = row.payload as PlayerReview | null;
      if (!payload) return null;
      return { ...payload, authorUserId: payload.authorUserId || row.user_id || undefined };
    })
    .filter(Boolean) as PlayerReview[];
}
