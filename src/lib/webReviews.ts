import { PlayerReview } from '../types';
import { getBrowserSupabase } from './supabase';

export async function loadWebReviews(): Promise<PlayerReview[]> {
  const sb = getBrowserSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('fu_web_reviews')
    .select('payload, user_id')
    .order('created_at', { ascending: true });
  if (error) return [];
  return (data || [])
    .map((row) => {
      const payload = row.payload as PlayerReview | null;
      if (!payload) return null;
      return {
        ...payload,
        authorUserId: payload.authorUserId || row.user_id || undefined,
        isUserSubmission: false,
      };
    })
    .filter(Boolean) as PlayerReview[];
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

export async function deleteWebReview(reviewId: string): Promise<void> {
  const sb = getBrowserSupabase();
  if (!sb || !reviewId) return;
  const { error } = await sb.from('fu_web_reviews').delete().eq('id', reviewId);
  if (error) {
    console.info('Yorum buluttan silinemedi.');
  }
}
