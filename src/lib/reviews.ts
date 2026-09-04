import { PlayerReview, UserProfile } from '../types';
import { normalizePersonName } from './matchTime';

export function isOwnReview(
  review?: Pick<PlayerReview, 'authorUserId' | 'authorName' | 'isUserSubmission'> | null,
  profile?: Pick<UserProfile, 'id' | 'name' | 'nickname' | 'isRegistered'> | null,
): boolean {
  if (!review || !profile) return false;

  if (review.authorUserId && profile.isRegistered && profile.id && profile.id !== 'guest-user') {
    return review.authorUserId === profile.id;
  }

  if (!review.isUserSubmission) return false;

  const author = normalizePersonName(review.authorName);
  if (!author) return false;
  return (
    author === normalizePersonName(profile.name) ||
    author === normalizePersonName(profile.nickname)
  );
}

export function stampReviewOwnership(
  review: PlayerReview,
  profile?: Pick<UserProfile, 'id' | 'name' | 'nickname' | 'isRegistered'> | null,
): PlayerReview {
  return {
    ...review,
    isUserSubmission: isOwnReview(review, profile),
  };
}

export function mergeReviewLists(
  previous: PlayerReview[],
  incoming: PlayerReview[],
  profile?: Pick<UserProfile, 'id' | 'name' | 'nickname' | 'isRegistered'> | null,
): PlayerReview[] {
  const incomingIds = new Set(incoming.map((review) => review.id));
  const prevById = new Map(previous.map((review) => [review.id, review]));

  const merged = incoming.map((review) => {
    const existing = prevById.get(review.id);
    const combined: PlayerReview = {
      ...review,
      authorUserId: review.authorUserId || existing?.authorUserId,
      likedByMe: existing?.likedByMe,
      dislikedByMe: existing?.dislikedByMe,
      isReportedByMe: existing?.isReportedByMe,
      replies: review.replies ?? existing?.replies,
    };
    if (existing?.isUserSubmission && !combined.authorUserId) {
      combined.isUserSubmission = existing.isUserSubmission;
    }
    return stampReviewOwnership(combined, profile);
  });

  const localOnly = previous.filter(
    (review) => !incomingIds.has(review.id) && isOwnReview(review, profile),
  );

  return [...localOnly, ...merged];
}
