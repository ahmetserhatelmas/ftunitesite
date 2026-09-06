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

function combineReview(
  incoming: PlayerReview,
  existing?: PlayerReview,
  profile?: Pick<UserProfile, 'id' | 'name' | 'nickname' | 'isRegistered'> | null,
): PlayerReview {
  const combined: PlayerReview = {
    ...existing,
    ...incoming,
    authorUserId: incoming.authorUserId || existing?.authorUserId,
    likedByMe: existing?.likedByMe,
    dislikedByMe: existing?.dislikedByMe,
    isReportedByMe: existing?.isReportedByMe,
    replies: incoming.replies ?? existing?.replies,
  };
  if (existing?.isUserSubmission && !combined.authorUserId) {
    combined.isUserSubmission = existing.isUserSubmission;
  }
  return stampReviewOwnership(combined, profile);
}

/** Eski listeyi silmeden birleştirir — senkron diğerlerinin yorumunu silmesin. */
export function mergeReviewLists(
  previous: PlayerReview[],
  incoming: PlayerReview[],
  profile?: Pick<UserProfile, 'id' | 'name' | 'nickname' | 'isRegistered'> | null,
): PlayerReview[] {
  const map = new Map<string, PlayerReview>();
  for (const review of previous) {
    map.set(review.id, stampReviewOwnership(review, profile));
  }
  for (const review of incoming) {
    map.set(review.id, combineReview(review, map.get(review.id), profile));
  }
  return [...map.values()];
}

/** Bulut asıl kaynak; henüz yazılmamış kendi yorumunu korur. */
export function replaceReviewsFromCloud(
  previous: PlayerReview[],
  cloud: PlayerReview[],
  profile?: Pick<UserProfile, 'id' | 'name' | 'nickname' | 'isRegistered'> | null,
): PlayerReview[] {
  const cloudIds = new Set(cloud.map((review) => review.id));
  const localOnly = previous.filter((review) => !cloudIds.has(review.id) && isOwnReview(review, profile));
  const fromCloud = cloud.map((review) => {
    const existing = previous.find((item) => item.id === review.id);
    return combineReview(review, existing, profile);
  });
  return [...localOnly, ...fromCloud];
}
