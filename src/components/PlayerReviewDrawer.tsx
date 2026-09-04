import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { hasChosenFavoriteClub } from '../lib/auth';
import { AVAILABLE_TAGS } from '../data/tags';
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
  UserPlus,
  LockKeyhole,
  UserCheck,
  Users,
} from 'lucide-react';
import { FootballJersey } from './FootballJersey';
import { ReviewRepliesSection } from './ReviewRepliesSection';
import { FollowButton } from './FollowButton';
import { CommentatorLevelBadge } from './CommentatorLevelBadge';
import { compareNewest } from '../lib/matchTime';

export const PlayerReviewDrawer: React.FC = () => {
  const {
    selectedPlayer,
    setSelectedPlayer,
    selectedMatch,
    getPlayerReviews,
    getPlayerAverageRating,
    addReview,
    toggleLikeReview,
    toggleDislikeReview,
    cancelSpamReport,
    setSpamReportingReview,
    voteMotm,
    userProfile,
    isRegistered,
    requireAuth,
    setIsProfileOpen,
    setIsQuickRegisterOpen,
    setActiveView,
    currentWeek,
    matchWriteLock,
    canRateTeam,
    setSelectedWeek,
    isFollowingUser,
    followingCount,
  } = useApp();

  const [ratingInput, setRatingInput] = useState<number>(8.0);
  const [commentInput, setCommentInput] = useState<string>('');
  const [noComment, setNoComment] = useState<boolean>(false);
  const [authorNameInput, setAuthorNameInput] = useState<string>(userProfile.nickname || userProfile.name || '');
  const [fanOfInput, setFanOfInput] = useState<string>(
    hasChosenFavoriteClub(userProfile) ? userProfile.favoriteTeamName || '' : ''
  );

  useEffect(() => {
    setAuthorNameInput(userProfile.nickname || userProfile.name || '');
    setFanOfInput(hasChosenFavoriteClub(userProfile) ? userProfile.favoriteTeamName || '' : '');
  }, [
    userProfile.nickname,
    userProfile.name,
    userProfile.favoriteTeamName,
    userProfile.favoriteTeamId,
    userProfile.isRegistered,
  ]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'likes' | 'followed' | 'newest' | 'highest' | 'lowest'>('likes');
  const [onlyFollowedFilter, setOnlyFollowedFilter] = useState<boolean>(false);
  const [hasVotedMotm, setHasVotedMotm] = useState<boolean>(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);

  if (!selectedPlayer || !selectedMatch) return null;

  const playerReviews = getPlayerReviews(selectedPlayer.id, selectedMatch.id);
  const { rating: avgRating, count: voteCount } = getPlayerAverageRating(
    selectedPlayer.id,
    selectedMatch.id
  );

  const writeLock = matchWriteLock(selectedMatch);
  const canWriteReview = writeLock === 'none';
  const canScorePlayer = canRateTeam(selectedPlayer.teamId);

  const team =
    selectedPlayer.teamId === selectedMatch.homeTeam.id
      ? selectedMatch.homeTeam
      : selectedMatch.awayTeam;

  // Check if player belongs to user's supported team
  const isOpponentPlayer =
    isRegistered &&
    Boolean(userProfile.favoriteTeamId) &&
    userProfile.favoriteTeamId !== 'general' &&
    selectedPlayer.teamId !== userProfile.favoriteTeamId &&
    team.id !== userProfile.favoriteTeamId;

  // Tag toggle helper
  const handleTagToggle = (tagLabel: string) => {
    if (selectedTags.includes(tagLabel)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagLabel));
    } else {
      setSelectedTags([...selectedTags, tagLabel]);
    }
  };

  // Submit review
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    requireAuth(() => doSubmitReview());
  };

  const doSubmitReview = () => {
    if (!canWriteReview) return;
    if (!canScorePlayer && !commentInput.trim()) return;
    if (canScorePlayer && !noComment && !commentInput.trim()) return;

    addReview({
      playerId: selectedPlayer.id,
      matchId: selectedMatch.id,
      teamId: selectedPlayer.teamId,
      teamName: team.name,
      authorName: userProfile.nickname || userProfile.name || authorNameInput.trim() || 'Tribün Sever',
      authorFanOf: userProfile.favoriteTeamName || fanOfInput.trim() || team.name,
      authorTeamBadge: userProfile.favoriteTeamBadge,
      rating: canScorePlayer ? ratingInput : undefined,
      comment: canScorePlayer && noComment ? '' : commentInput.trim(),
      tags: canScorePlayer ? selectedTags : [],
    });

    setIsSubmittedSuccess(true);
    setCommentInput('');
    setSelectedTags([]);

    setTimeout(() => {
      setIsSubmittedSuccess(false);
    }, 2500);
  };

  // Handle MOTM vote
  const handleMotmVote = () => {
    requireAuth(() => doMotmVote());
  };

  const doMotmVote = () => {
    if (!hasVotedMotm) {
      voteMotm(selectedMatch.id, selectedPlayer.id);
      setHasVotedMotm(true);
    }
  };

  // Filter and sort reviews
  const visibleReviews = onlyFollowedFilter
    ? playerReviews.filter((r) => isFollowingUser(r.authorName))
    : playerReviews;

  const sortedReviews = [...visibleReviews].sort((a, b) => {
    if (sortBy === 'followed') {
      const aFollowed = isFollowingUser(a.authorName) ? 1 : 0;
      const bFollowed = isFollowingUser(b.authorName) ? 1 : 0;
      if (bFollowed !== aFollowed) return bFollowed - aFollowed;
      return (b.likes || 0) - (a.likes || 0) || compareNewest(a, b);
    }
    if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0) || compareNewest(a, b);
    if (sortBy === 'highest') return (b.rating ?? -1) - (a.rating ?? -1) || compareNewest(a, b);
    if (sortBy === 'lowest') return (a.rating ?? 99) - (b.rating ?? 99) || compareNewest(a, b);
    return compareNewest(a, b);
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex justify-end animate-fadeIn">
      {/* Click outside to close */}
      <div
        className="flex-1 cursor-pointer"
        onClick={() => setSelectedPlayer(null)}
      />

      {/* Drawer Container */}
      <div className="w-full max-w-2xl bg-white border-l-2 border-emerald-100 h-full flex flex-col shadow-2xl text-slate-800 overflow-y-auto">
        
        {/* Top Header with Close Button */}
        <div className="sticky top-0 z-20 bg-emerald-600 px-4 sm:px-6 py-4 flex items-center justify-between text-white shadow-md gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-100 truncate">
              Oyuncu Değerlendirme
            </span>
          </div>
          <button
            id="close-player-drawer-btn"
            onClick={() => setSelectedPlayer(null)}
            className="p-1.5 rounded-xl text-white hover:bg-emerald-700 transition"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Profile & Match Stats Card */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-emerald-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            {/* Player Info */}
            <div className="flex items-center gap-4">
              <FootballJersey
                number={selectedPlayer.number}
                team={team}
                isGoalkeeper={selectedPlayer.category === 'GK'}
                size="lg"
                className="shrink-0 drop-shadow-md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">
                    {selectedPlayer.name}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-lg font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {selectedPlayer.position}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-bold mt-0.5 flex items-center gap-1.5">
                  <span className="text-slate-800">{team.name}</span>
                  <span>•</span>
                  <span>{selectedMatch.homeTeam.name} vs {selectedMatch.awayTeam.name}</span>
                </p>
              </div>
            </div>

            {/* Overall Rating & MOTM Vote */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="bg-white border-2 border-emerald-100 px-4 py-2 rounded-2xl text-center shadow-sm">
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-xl font-black font-mono text-slate-900">
                    {voteCount > 0 ? avgRating.toFixed(1) : '—'}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 block mt-0.5">
                  {voteCount > 0 ? `${voteCount} Taraftar Oyu` : 'Henüz Not Verilmedi'}
                </span>
              </div>

              {/* Vote MOTM */}
              {!canWriteReview || !canScorePlayer ? (
                <div
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 border-2 border-slate-200 shadow-none select-none cursor-not-allowed"
                  title={!canScorePlayer ? 'Maçın Adamı oyu yalnızca tuttuğunuz takım için verilebilir.' : 'Oynanmamış maçlarda Maçın Adamı oylanamaz.'}
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Oylama Kapandı</span>
                  <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-black text-[10px]">
                    {selectedPlayer.motmVotes || 0}
                  </span>
                </div>
              ) : (
                <button
                  id="vote-motm-btn"
                  onClick={handleMotmVote}
                  disabled={hasVotedMotm}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
                    hasVotedMotm
                      ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-md'
                      : 'bg-white hover:bg-amber-50 text-amber-900 border-2 border-amber-200'
                  }`}
                >
                  <Crown className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span>{hasVotedMotm ? 'Maçın Adamı Seçildi' : 'Maçın Adamı Oyu'}</span>
                  <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-black text-[10px]">
                    {selectedPlayer.motmVotes || 0}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Match Statistics Grid */}
          <div className="mt-5 grid grid-cols-3 sm:grid-cols-6 gap-2 bg-white p-3 rounded-2xl border-2 border-emerald-100 text-center shadow-sm">
            <div className="p-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Süre</span>
              <span className="text-sm font-black text-slate-800 font-mono">{selectedPlayer.stats.minutesPlayed}' dk</span>
            </div>
            <div className="p-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Gol / Asist</span>
              <span className="text-sm font-black text-emerald-700 font-mono">
                {selectedPlayer.stats.goals} / {selectedPlayer.stats.assists}
              </span>
            </div>
            <div className="p-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">İsabetli Pas</span>
              <span className="text-sm font-black text-slate-800 font-mono">%{selectedPlayer.stats.passAccuracy}</span>
            </div>
            <div className="p-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">İkili Müc.</span>
              <span className="text-sm font-black text-slate-800 font-mono">{selectedPlayer.stats.tackles}</span>
            </div>
            <div className="p-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {selectedPlayer.category === 'GK' ? 'Kurtarış' : 'Şut (İsabet)'}
              </span>
              <span className="text-sm font-black text-slate-800 font-mono">
                {selectedPlayer.category === 'GK'
                  ? selectedPlayer.stats.saves || 0
                  : `${selectedPlayer.stats.shots} (${selectedPlayer.stats.shotsOnTarget})`}
              </span>
            </div>
            <div className="p-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Kart</span>
              <span className="text-sm font-black font-mono">
                {selectedPlayer.stats.redCard ? '🟥 Kırmızı' : selectedPlayer.stats.yellowCard ? '🟨 Sarı' : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content: Review Form & Reviews List */}
        <div className="p-6 space-y-6">

          {/* Quick Link to All Weeks Rating History */}
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="text-xs font-bold text-emerald-950">
                {selectedPlayer.name} için 1., 2. ve 3. haftalardaki tüm maç puanlarını inceleyin:
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedPlayer(null);
                setActiveView('player-history');
              }}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl shrink-0 transition flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <span>Haftalık Puan Geçmişi</span>
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {/* Write a Review Section or Past Week Locked Card */}
          {!canWriteReview ? (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 border-2 border-amber-200 rounded-3xl p-6 shadow-sm text-center animate-fadeIn">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto mb-3 text-amber-800 shadow-xs">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 mb-1 flex items-center justify-center gap-1.5">
                <span>Oynanmamış Maç — Yorum Kapalı</span>
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Bu karşılaşma henüz başlamadı. Maç başladıktan veya bittikten sonra yorum yazabilirsiniz.
              </p>
              
              <div className="mt-4 pt-3.5 border-t border-amber-200/70 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWeek(currentWeek);
                    setSelectedPlayer(null);
                    setActiveView('pitch');
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Güncel {currentWeek}. Hafta Maçlarına Git</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlayer(null);
                    setActiveView('player-history');
                  }}
                  className="w-full sm:w-auto px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Tüm Haftalık Puanları İncele</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-emerald-100 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>{selectedPlayer.name} İçin Yorum & Not Bırak</span>
                </h3>
                {isRegistered ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span>{userProfile.favoriteTeamBadge}</span>
                    <span>{userProfile.nickname || userProfile.name}</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span>👤 Misafir Modu</span>
                  </span>
                )}
              </div>

              {!isRegistered && (
                <div className="mb-4 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/10 border border-amber-300/80 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 mt-0.5 shadow-xs">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">
                        Yorum ve Puanlama İçin Hızlı Kayıt Gereklidir
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Tüm yorumları ve puanları serbestçe inceleyebilirsiniz. Kendi puanınızı ve yorumunuzu kaydetmek için 10 saniyede rumuz ve e-posta belirleyin.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    id="drawer-quick-register-cta"
                    onClick={() => setIsQuickRegisterOpen(true)}
                    className="w-full sm:w-auto px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Hızlı Kayıt Ol</span>
                  </button>
                </div>
              )}

              {/* Success Notification */}
              {isSubmittedSuccess && (
                <div className="bg-emerald-600 text-white p-3.5 rounded-2xl flex items-center justify-between gap-2 shadow-md mb-3 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 fill-white text-emerald-800 shrink-0" />
                    <span className="text-xs font-black">
                      {canScorePlayer
                        ? `${selectedPlayer.name} için ${ratingInput.toFixed(1)} ★ puanınız başarıyla kaydedildi!`
                        : `${selectedPlayer.name} için yorumunuz kaydedildi.`}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    Teşekkürler!
                  </span>
                </div>
              )}

              {isOpponentPlayer && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-950">
                  <p className="font-black">Puan veremezsiniz, yorum yazabilirsiniz.</p>
                  <p className="mt-1 text-slate-600">
                    {userProfile.favoriteTeamName} taraftarı olarak {team.name} oyuncularına not veremezsiniz; maç başladıysa yorum bırakabilirsiniz.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="space-y-4">
                
                {/* Rating Mode Selector Tabs */}
                {canScorePlayer && (
                <>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    id="mode-with-comment-btn"
                    onClick={() => setNoComment(false)}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                      !noComment
                        ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Puanla & Yorum Yaz</span>
                  </button>

                  <button
                    type="button"
                    id="mode-no-comment-btn"
                    onClick={() => {
                      setNoComment(true);
                      setCommentInput('');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                      noComment
                        ? 'bg-amber-400 text-slate-950 shadow-sm border border-amber-500 font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>Sadece Puan Ver</span>
                  </button>
                </div>

                {/* Rating Selector */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-700">Maç Puanınız (1 - 10):</span>
                    <span className="font-mono font-black text-base text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-xl border border-emerald-200">
                      {ratingInput.toFixed(1)} ★
                    </span>
                  </div>
                  
                  {/* Range Slider */}
                  <input
                    id="player-rating-slider"
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={ratingInput}
                    onChange={(e) => setRatingInput(parseFloat(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  
                  {/* Quick Rating Buttons */}
                  <div className="flex items-center justify-between gap-1 mt-2">
                    {[5.0, 6.0, 7.0, 8.0, 8.5, 9.0, 9.5, 10.0].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setRatingInput(score)}
                        className={`text-[11px] font-mono px-2 py-1 rounded-xl transition font-black ${
                          ratingInput === score
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tag Selector */}
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-2">
                    Performans Etiketleri (Seçmeli):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_TAGS.map((tag) => {
                      const isSelected = selectedTags.includes(tag.label);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleTagToggle(tag.label)}
                          className={`text-xs px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1 border-2 ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-slate-900'
                          }`}
                        >
                          <span>{tag.emoji}</span>
                          <span>{tag.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                </>
                )}

                {/* Comment Textarea & No-Comment Checkbox */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Yorumunuz & Analiziniz:
                    </label>
                    
                    {canScorePlayer && (
                    <button
                      type="button"
                      id="no-comment-toggle-button"
                      onClick={() => {
                        const nextVal = !noComment;
                        setNoComment(nextVal);
                        if (nextVal) {
                          setCommentInput('');
                        }
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        noComment
                          ? 'bg-amber-400 text-slate-950 border-amber-500 font-black shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={noComment}
                        readOnly
                        className="w-3.5 h-3.5 rounded text-amber-500 pointer-events-none accent-amber-500"
                      />
                      <span>Yorum yapmak istemiyorum</span>
                    </button>
                    )}
                  </div>

                  {canScorePlayer && noComment ? (
                    <div className="bg-amber-50/90 border-2 border-dashed border-amber-300 rounded-2xl p-3.5 flex items-center gap-2.5 text-slate-800 text-xs font-medium animate-fadeIn">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-400 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-900">Yorumsuz Puanlama Modu Aktif</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Yorum yazmadan yalnızca <strong>{ratingInput.toFixed(1)} ★</strong> maç notunuz sisteme eklenecektir.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <textarea
                        id="player-comment-textarea"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value.slice(0, 1000))}
                        maxLength={1000}
                        placeholder={`${selectedPlayer.name} bu maçta nasıldı? Mücadelesi, taktiksel katkısı veya yaptığı hatalar hakkında ne düşünüyorsunuz? (Maksimum 1000 karakter)`}
                        rows={3}
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:bg-white focus:border-emerald-500 rounded-2xl p-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition resize-none shadow-inner"
                      />
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
                        <span>Maksimum 1000 karakter</span>
                        <span
                          className={`font-mono font-bold transition-colors ${
                            commentInput.length >= 950
                              ? 'text-rose-600 font-black'
                              : commentInput.length >= 800
                              ? 'text-amber-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {commentInput.length} / 1000
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Author Info row — profil kaydından gelir */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Rumuzunuz:
                    </label>
                    <input
                      id="author-name-input"
                      type="text"
                      value={authorNameInput}
                      readOnly={isRegistered}
                      onChange={(e) => {
                        if (!isRegistered) setAuthorNameInput(e.target.value);
                      }}
                      placeholder="Adınız veya Rumuz"
                      className={`w-full border-2 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none ${
                        isRegistered
                          ? 'bg-emerald-50 border-emerald-200 cursor-default'
                          : 'bg-slate-50 border-slate-200 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Desteklediğiniz Takım:
                    </label>
                    <input
                      id="author-fanof-input"
                      type="text"
                      value={fanOfInput}
                      readOnly={isRegistered}
                      onChange={(e) => {
                        if (!isRegistered) setFanOfInput(e.target.value);
                      }}
                      placeholder="Örn: Galatasaray, Beşiktaş"
                      className={`w-full border-2 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none ${
                        isRegistered
                          ? 'bg-emerald-50 border-emerald-200 cursor-default'
                          : 'bg-slate-50 border-slate-200 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  id="submit-review-btn"
                  type="submit"
                  disabled={(!canScorePlayer || !noComment) && !commentInput.trim()}
                  className={`w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                    canScorePlayer && noComment
                      ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-amber-400/30'
                      : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {canScorePlayer && noComment ? (
                    <>
                      <Star className="w-4 h-4 fill-slate-950" />
                      <span>{ratingInput.toFixed(1)} ★ Puanı Hemen Kaydet</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{canScorePlayer ? 'Yorumu ve Puanı Paylaş' : 'Yorumu Paylaş'}</span>
                    </>
                  )}
                </button>
              </form>
          </div>
        )}

          {/* Community Reviews Feed */}
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>{!canWriteReview ? 'Arşivlenmiş Taraftar Değerlendirmeleri' : 'Taraftar Değerlendirmeleri'} ({playerReviews.length})</span>
                  {!canWriteReview && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-bold">
                      🔒 Salt Okunur
                    </span>
                  )}
                </h3>
              </div>

              {/* Sorting & Filter Tabs */}
              <div className="flex items-center gap-1 text-[11px] bg-slate-100 p-1 rounded-xl flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setOnlyFollowedFilter(!onlyFollowedFilter);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                    onlyFollowedFilter
                      ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                      : 'text-amber-900 hover:bg-amber-100/60'
                  }`}
                >
                  <UserCheck className="w-3 h-3 text-amber-950" />
                  <span>Takip Ettiklerim</span>
                  <span className={`text-[9px] px-1 rounded font-mono ${onlyFollowedFilter ? 'bg-slate-950 text-amber-400 font-black' : 'bg-amber-200/80 text-amber-900'}`}>
                    {followingCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSortBy('likes');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    sortBy === 'likes' && !onlyFollowedFilter ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Popüler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy('highest');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    sortBy === 'highest' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  En Yüksek Not
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy('newest');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    sortBy === 'newest' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  En Yeni
                </button>
              </div>
            </div>

            {/* List of Reviews */}
            {sortedReviews.length === 0 ? (
              <div className="bg-white border-2 border-emerald-100 rounded-3xl p-8 text-center text-slate-500 shadow-sm">
                <MessageSquare className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  {onlyFollowedFilter
                    ? 'Takip ettiğiniz yorumculardan bu futbolcuya henüz bir yorum yapılmadı.'
                    : 'Henüz bu oyuncu için yorum yapılmadı.'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {onlyFollowedFilter ? (
                    <button
                      onClick={() => setOnlyFollowedFilter(false)}
                      className="text-emerald-700 font-bold underline hover:text-emerald-800"
                    >
                      Tüm taraftar yorumlarını görüntüleyin
                    </button>
                  ) : (
                    'İlk değerlendirmeyi yukarıdaki formu kullanarak siz yapın!'
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedReviews.map((review) => {
                  const isMyReview = review.isUserSubmission || review.authorName === userProfile.name;
                  const isFollowed = !isMyReview && isFollowingUser(review.authorName);

                  return (
                    <div
                      key={review.id}
                      className={`border-2 rounded-2xl p-4 transition shadow-sm ${
                        isFollowed
                          ? 'bg-gradient-to-b from-amber-50/40 to-white border-amber-300 ring-2 ring-amber-400/20'
                          : 'bg-white border-emerald-100 hover:border-emerald-300'
                      }`}
                    >
                      {isFollowed && (
                        <div className="mb-2 flex items-center">
                          <span className="bg-amber-100 text-amber-900 border border-amber-300/80 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                            <UserCheck className="w-2.5 h-2.5 text-amber-700" />
                            <span>Takip Ettiğiniz Yorumcu</span>
                          </span>
                        </div>
                      )}

                      {/* Review Card Top: Author, Fan of, Rating, Date */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shadow-sm ${
                            isFollowed ? 'bg-amber-400 text-slate-950 font-black' : 'bg-emerald-600 text-white'
                          }`}>
                            {review.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-black text-slate-900">
                                {review.authorName}
                              </span>
                              <CommentatorLevelBadge authorName={review.authorName} size="xs" />
                              {review.authorFanOf && (
                                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                                  {review.authorFanOf}
                                </span>
                              )}
                              <FollowButton
                                targetAuthorName={review.authorName}
                                targetFanOf={review.authorFanOf}
                                targetAvatar={review.authorAvatar}
                                size="xs"
                                theme="light"
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              {review.createdAt}
                            </span>
                          </div>
                        </div>

                      {/* Rating pill */}
                      <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-xl">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-mono font-black text-xs text-emerald-900">
                          {typeof review.rating === 'number' ? review.rating.toFixed(1) : 'Yorum'}
                        </span>
                      </div>
                    </div>

                    {/* Review comment text */}
                    {review.comment ? (
                      <p className="text-xs text-slate-700 leading-relaxed my-2.5 font-normal">
                        "{review.comment}"
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic my-2 flex items-center gap-1.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0" />
                        <span>Sadece puanlama yapıldı, yorum yazılmadı.</span>
                      </p>
                    )}

                    {/* Reported Badge */}
                    {review.isReportedByMe && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 my-2 flex items-center justify-between text-xs text-rose-900 animate-fadeIn">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Flag className="w-3.5 h-3.5 text-rose-600 fill-rose-600 shrink-0" />
                          <span>Bu yorumu "{review.reportReason || 'Spam'}" gerekçesiyle şikayet ettiniz.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => cancelSpamReport(review.id)}
                          className="text-[11px] font-black text-rose-700 hover:text-rose-950 underline ml-2 shrink-0 cursor-pointer"
                        >
                          Geri Al
                        </button>
                      </div>
                    )}

                    {/* Tags */}
                    {review.tags && review.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {review.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer: Like, Dislike, Spam Action Buttons */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                      
                      {/* Left: Like & Dislike */}
                      <div className="flex items-center gap-1.5">
                        {/* Like Button */}
                        <button
                          type="button"
                          onClick={() => toggleLikeReview(review.id)}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                            review.likedByMe
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                          title="Beğen"
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${review.likedByMe ? 'fill-emerald-700 text-emerald-700' : 'text-slate-500'}`} />
                          <span className="font-mono text-[11px]">{review.likes || 0}</span>
                        </button>

                        {/* Dislike Button */}
                        <button
                          type="button"
                          onClick={() => toggleDislikeReview(review.id)}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                            review.dislikedByMe
                              ? 'bg-rose-100 text-rose-900 border border-rose-300 shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                          title="Beğenme"
                        >
                          <ThumbsDown className={`w-3.5 h-3.5 ${review.dislikedByMe ? 'fill-rose-600 text-rose-600' : 'text-slate-500'}`} />
                          <span className="font-mono text-[11px]">{review.dislikes || 0}</span>
                        </button>
                      </div>

                      {/* Right: Spam / Report Button */}
                      <button
                        type="button"
                        onClick={() => setSpamReportingReview(review)}
                        className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                          review.isReportedByMe
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title="Spam / Şikayet Bildir"
                      >
                        <Flag className={`w-3.5 h-3.5 ${review.isReportedByMe ? 'fill-rose-600 text-rose-600' : ''}`} />
                        <span className="text-[11px]">{review.isReportedByMe ? 'Bildirildi' : 'Spam / Şikayet'}</span>
                      </button>

                    </div>

                    {/* Review Replies Loop / Thread Section */}
                    <ReviewRepliesSection
                      reviewId={review.id}
                      replies={review.replies}
                      authorName={review.authorName}
                      theme="light"
                    />
                  </div>
                );
              })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
