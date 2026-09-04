import { PlayerReview } from '../types';
import { getBrowserSupabase } from './supabase';

export async function loadWebReviews(): Promise<PlayerReview[]> {
  const sb = getBrowserSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from('fu_web_reviews').select('payload').order('created_at', { ascending: true });
  if (error) return [];
  return (data || []).map((row) => row.payload as PlayerReview).filter(Boolean);
}

export async function saveWebReview(review: PlayerReview, userId?: string): Promise<void> {
  const sb = getBrowserSupabase();
  if (!sb) return;
  const { error } = await sb.from('fu_web_reviews').upsert(
    {
      id: review.id,
      user_id: userId || null,
      match_id: review.matchId,
      player_id: review.playerId,
      payload: review,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  if (error) {
    console.info('Yorum buluta yazılamadı (fu_web_reviews tablosu henüz yok olabilir).');
  }
}
