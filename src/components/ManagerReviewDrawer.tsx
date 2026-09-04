import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Flag,
  ShieldAlert,
  Award,
  Crown,
  Shield,
  Send,
  Sparkles,
  CheckCircle,
  TrendingUp,
  Activity,
  Lock,
  Calendar,
  Briefcase,
  Layers,
  Globe,
} from 'lucide-react';
import { ReviewRepliesSection } from './ReviewRepliesSection';
import { TeamLogo } from './TeamLogo';
import { FollowButton } from './FollowButton';
import { CommentatorLevelBadge } from './CommentatorLevelBadge';

export const ManagerReviewDrawer: React.FC = () => {
  const {
    selectedManager,
    setSelectedManager,
    selectedMatch,
    getManagerReviews,
    getManagerAverageRating,
    addReview,
    toggleLikeReview,
    toggleDislikeReview,
    cancelSpamReport,
    setSpamReportingReview,
    userProfile,
    isRegistered,
    requireAuth,
    setIsProfileOpen,
    setIsQuickRegisterOpen,
    isPastWeek,
    matches,
  } = useApp();

  const [ratingInput, setRatingInput] = useState<number>(7.5);
  const [commentInput, setCommentInput] = useState<string>('');
  const [noComment, setNoComment] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'likes' | 'newest' | 'highest' | 'lowest'>('likes');
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);

  if (!selectedManager) return null;

  // Find match associated with this manager if selectedMatch doesn't match
  const relevantMatch =
    selectedMatch &&
    (selectedMatch.homeTeam.id === selectedManager.teamId ||
      selectedMatch.awayTeam.id === selectedManager.teamId)
      ? selectedMatch
      : matches.find(
          (m) =>
            m.homeTeam.id === selectedManager.teamId ||
            m.awayTeam.id === selectedManager.teamId
        ) || selectedMatch;

  const matchId = relevantMatch?.id || 'general';
  const managerReviews = getManagerReviews(selectedManager.id, matchId);
  const { rating: avgRating, count: voteCount } = getManagerAverageRating(
    selectedManager.id,
    matchId
  );

  const isMatchInPastWeek = relevantMatch ? isPastWeek(relevantMatch.week) : false;

  const team =
    relevantMatch?.homeTeam.id === selectedManager.teamId
      ? relevantMatch.homeTeam
      : relevantMatch?.awayTeam.id === selectedManager.teamId
      ? relevantMatch.awayTeam
      : {
          id: selectedManager.teamId,
          name: 'Kulüp',
          shortName: 'KLP',
          logo: selectedManager.avatar || '⚽',
          primaryColor: '#047857',
          secondaryColor: '#FFFFFF',
          formation: selectedManager.formation || '4-2-3-1',
        };

  // Check if user is supporter of another team (if registered with team alignment)
  const isOpponentManager =
    isRegistered &&
    Boolean(userProfile.favoriteTeamId) &&
    userProfile.favoriteTeamId !== 'general' &&
    selectedManager.teamId !== userProfile.favoriteTeamId &&
    team.id !== userProfile.favoriteTeamId;

  const doSubmitReview = () => {
    if (isMatchInPastWeek) {
      alert('Geçmiş haftaların maçları için yeni değerlendirme yapılamaz.');
      return;
    }

    const reviewComment = noComment ? '' : commentInput.trim();

    addReview({
      matchId: matchId,
      playerId: selectedManager.id,
      managerId: selectedManager.id,
      targetType: 'manager',
      playerName: selectedManager.name,
      playerNumber: 0,
      teamId: team.id,
      teamName: team.name,
      rating: ratingInput,
      comment: reviewComment,
      authorName: userProfile.nickname || userProfile.name || 'Futbolsever',
      authorAvatar: userProfile.avatar || '⚽',
      fanOf: userProfile.favoriteTeamName || team.name,
      userTeamId: userProfile.favoriteTeamId || 'general',
      tags: [], // STRICT REQUIREMENT: NO TAGS for managers
    });

    setCommentInput('');
    setNoComment(false);
    setIsSubmittedSuccess(true);
    setTimeout(() => setIsSubmittedSuccess(false), 3000);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOpponentManager) {
      return;
    }
    if (!requireAuth(() => doSubmitReview())) {
      return;
    }
    doSubmitReview();
  };

  const sortedReviews = [...managerReviews].sort((a, b) => {
    if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0);
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'highest') return b.rating - a.rating;
    if (sortBy === 'lowest') return a.rating - b.rating;
    return 0;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex justify-end animate-fade-in">
      <div
        className="w-full max-w-xl bg-slate-900 border-l border-slate-700 text-white h-full flex flex-col shadow-2xl overflow-hidden"
        id="manager-review-drawer"
      >
        {/* Top Header Card */}
        <div
          className="relative px-4 sm:px-6 py-5 border-b border-slate-800 shrink-0"
          style={{
            background: `linear-gradient(135deg, ${team.primaryColor}25 0%, #0f172a 100%)`,
          }}
        >
          <button
            id="close-manager-drawer-btn"
            onClick={() => setSelectedManager(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <TeamLogo
                team={team}
                size="3xl"
                shape="rounded"
                className="ring-2 ring-amber-400/40 shadow-lg"
              />
              <div className="absolute -bottom-1.5 -right-1.5 bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                <Briefcase className="w-2.5 h-2.5" />
                TD
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {team.name}
                </span>
                {selectedManager.nationality && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700/50">
                    <Globe className="w-3 h-3 text-slate-400" />
                    {selectedManager.nationality}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-black tracking-tight text-white truncate mt-0.5">
                {selectedManager.name}
              </h2>

              <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-slate-300 font-medium">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  {selectedManager.formation || 'Taktik Lider'}
                </span>
                {relevantMatch && (
                  <span className="text-slate-400 text-[11px]">
                    {relevantMatch.week}. Hafta: {relevantMatch.homeTeam.shortName} vs {relevantMatch.awayTeam.shortName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Average Rating Banner */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Tribün Puanı
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-amber-400">
                    {voteCount > 0 ? avgRating.toFixed(1) : '—'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ 10</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <Star className="w-5 h-5 fill-amber-400" />
              </div>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Toplam Değerlendirme
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-emerald-400">{voteCount}</span>
                  <span className="text-xs text-slate-400 font-medium">taraftar</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content (Form + Comments) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Opponent Lock Alert */}
          {isOpponentManager && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-amber-300">Taraftar Takım Koruması</strong>
                Profilinizde desteklediğiniz takım <span className="font-bold text-white">{userProfile.favoriteTeamName}</span> olarak ayarlı. Yalnızca kendi takımınızın teknik direktörünü ve oyuncularını puanlayabilirsiniz.
              </div>
            </div>
          )}

          {/* Past Week Lock Alert */}
          {isMatchInPastWeek && (
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs flex items-center gap-3">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Geçmiş haftaların maçları kilitlidir. Yalnızca mevcut ve canlı maçlara puan verilebilir.</span>
            </div>
          )}

          {/* Rating Submission Form */}
          {!isOpponentManager && !isMatchInPastWeek && (
            <form onSubmit={handleSubmitReview} className="bg-slate-850 p-5 rounded-2xl border border-slate-700/80 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  Teknik Direktörü Puanla & Taktiksel Yorum Yap
                </h3>
                <span className="text-xs text-amber-400 font-mono font-bold bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                  {ratingInput.toFixed(1)} Puan
                </span>
              </div>

              {/* Slider for rating */}
              <div className="space-y-2">
                <input
                  id="manager-rating-slider"
                  type="range"
                  min="1"
                  max="10"
                  step="0.1"
                  value={ratingInput}
                  onChange={(e) => setRatingInput(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>1.0 (Yetersiz)</span>
                  <span>5.0 (Vasat)</span>
                  <span>7.5 (İyi)</span>
                  <span>10.0 (Kusursuz)</span>
                </div>
              </div>

              {/* Quick score buttons */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setRatingInput(score)}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition ${
                      Math.round(ratingInput) === score
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {score}.0
                  </button>
                ))}
              </div>

              {/* Comment Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="manager-comment-textarea" className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    Taktiksel Değerlendirme & Yorum
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={noComment}
                      onChange={(e) => setNoComment(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-400 w-3.5 h-3.5"
                    />
                    <span>Yorumsuz sadece puan ver</span>
                  </label>
                </div>

                {!noComment && (
                  <textarea
                    id="manager-comment-textarea"
                    rows={3}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Oyuna müdahaleleri, kadro tercihi, oyuncu değişiklikleri ve oyun planı nasıldı?.."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition resize-none"
                  />
                )}
              </div>

              {/* Notice: No Tags For Manager as per user rule */}
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 bg-slate-800/40 px-3 py-2 rounded-lg border border-slate-700/40">
                <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Teknik direktör puanlamasında etiket kullanılmaz; doğrudan taktiksel performans değerlendirilir.</span>
              </div>

              {/* Submit button */}
              <button
                id="submit-manager-review-btn"
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Değerlendirmeyi Gönder ({ratingInput.toFixed(1)} Puan)</span>
              </button>

              {isSubmittedSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Puanınız ve yorumunuz başarıyla kaydedildi!
                </div>
              )}
            </form>
          )}

          {/* Reviews List Header & Sorting */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                Tribün Yorumları ({managerReviews.length})
              </h3>

              {managerReviews.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
                  <button
                    onClick={() => setSortBy('likes')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      sortBy === 'likes' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Beğeni
                  </button>
                  <button
                    onClick={() => setSortBy('newest')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      sortBy === 'newest' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    En Yeni
                  </button>
                  <button
                    onClick={() => setSortBy('highest')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      sortBy === 'highest' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    En Yüksek
                  </button>
                </div>
              )}
            </div>

            {/* List of Reviews */}
            {sortedReviews.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-850 rounded-2xl border border-slate-800">
                <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold text-slate-300">Henüz yorum yapılmamış</p>
                <p className="text-xs text-slate-500 mt-1">
                  Teknik direktörün oyun planı ve müdahaleleri hakkında ilk değerlendirmeyi sen yap!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedReviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 rounded-xl bg-slate-850 border border-slate-750 space-y-2.5 transition hover:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-750 flex items-center justify-center text-sm border border-slate-700">
                          {review.authorAvatar || '👤'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-white">{review.authorName}</span>
                            <CommentatorLevelBadge authorName={review.authorName} size="xs" />
                            {review.fanOf && (
                              <span className="text-[10px] text-amber-400/90 font-medium bg-amber-400/10 px-1.5 py-0.2 rounded">
                                {review.fanOf}
                              </span>
                            )}
                            <FollowButton
                              targetAuthorName={review.authorName}
                              targetFanOf={review.fanOf}
                              targetAvatar={review.authorAvatar}
                              size="xs"
                              theme="dark"
                            />
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {new Date(review.createdAt).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-lg text-amber-400 font-bold text-xs">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{review.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    {review.comment && (
                      <p className="text-xs text-slate-200 leading-relaxed font-normal">
                        {review.comment}
                      </p>
                    )}

                    {/* Like / Dislike / Report Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleLikeReview(review.id)}
                          className={`flex items-center gap-1 hover:text-emerald-400 transition ${
                            review.likedByMe ? 'text-emerald-400 font-bold' : ''
                          }`}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${review.likedByMe ? 'fill-emerald-400' : ''}`} />
                          <span>{review.likes || 0}</span>
                        </button>

                        <button
                          onClick={() => toggleDislikeReview(review.id)}
                          className={`flex items-center gap-1 hover:text-red-400 transition ${
                            review.dislikedByMe ? 'text-red-400 font-bold' : ''
                          }`}
                        >
                          <ThumbsDown className={`w-3.5 h-3.5 ${review.dislikedByMe ? 'fill-red-400' : ''}`} />
                          <span>{review.dislikes || 0}</span>
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          if (review.isReportedByMe) {
                            cancelSpamReport(review.id);
                          } else {
                            setSpamReportingReview(review);
                          }
                        }}
                        className={`hover:text-amber-400 transition flex items-center gap-1 ${
                          review.isReportedByMe ? 'text-amber-400 font-bold' : ''
                        }`}
                        title="Rapor Et"
                      >
                        <Flag className="w-3 h-3" />
                        <span>{review.isReportedByMe ? 'Bildirildi' : 'Rapor'}</span>
                      </button>
                    </div>

                    {/* Review Replies Loop / Thread Section */}
                    <ReviewRepliesSection
                      reviewId={review.id}
                      replies={review.replies}
                      authorName={review.authorName}
                      theme="dark"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
