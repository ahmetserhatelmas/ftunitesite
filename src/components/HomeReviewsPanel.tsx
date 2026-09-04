import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  MessageSquare,
  Star,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Flame,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { Player } from '../types';
import { ReviewRepliesSection } from './ReviewRepliesSection';
import { TeamLogo } from './TeamLogo';
import { FollowButton } from './FollowButton';
import { CommentatorLevelBadge } from './CommentatorLevelBadge';
import { compareNewest } from '../lib/matchTime';

export const HomeReviewsPanel: React.FC = () => {
  const {
    reviews,
    matches,
    toggleLikeReview,
    toggleDislikeReview,
    cancelSpamReport,
    setSpamReportingReview,
    openPlayerModal,
    setSelectedMatchId,
    setActiveView,
    userProfile,
    isFollowingUser,
    followingCount,
  } = useApp();

  const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | 'popular' | 'top-rated' | 'followed' | 'gs' | 'fb' | 'bjk' | 'ts'>('all');

  // Enriched reviews with player and match
  const enrichedReviews = useMemo(() => {
    return reviews.map((review) => {
      const match = matches.find((m) => m.id === review.matchId);
      let player: Player | null = null;
      let playerTeam = null;

      if (match) {
        const foundHome = match.homePlayers.find((p) => p.id === review.playerId);
        if (foundHome) {
          player = foundHome;
          playerTeam = match.homeTeam;
        } else {
          const foundAway = match.awayPlayers.find((p) => p.id === review.playerId);
          if (foundAway) {
            player = foundAway;
            playerTeam = match.awayTeam;
          }
        }
      }

      return {
        ...review,
        match,
        player,
        playerTeam,
      };
    });
  }, [reviews, matches]);

  const filteredReviews = useMemo(() => {
    let list = [...enrichedReviews];

    if (activeQuickFilter === 'followed') {
      list = list.filter((r) => isFollowingUser(r.authorName)).sort(compareNewest);
    } else if (activeQuickFilter === 'popular') {
      list.sort((a, b) => (b.likes || 0) - (a.likes || 0) || compareNewest(a, b));
    } else if (activeQuickFilter === 'top-rated') {
      list = list.filter((r) => typeof r.rating === 'number' && r.rating >= 9.0).sort((a, b) => (b.rating || 0) - (a.rating || 0) || compareNewest(a, b));
    } else if (activeQuickFilter === 'gs') {
      list = list.filter(
        (r) =>
          r.authorFanOf?.toLowerCase().includes('galatasaray') ||
          r.playerTeam?.id === 'gs' ||
          r.match?.homeTeam.id === 'gs' ||
          r.match?.awayTeam.id === 'gs'
      );
    } else if (activeQuickFilter === 'fb') {
      list = list.filter(
        (r) =>
          r.authorFanOf?.toLowerCase().includes('fenerbahçe') ||
          r.playerTeam?.id === 'fb' ||
          r.match?.homeTeam.id === 'fb' ||
          r.match?.awayTeam.id === 'fb'
      );
    } else if (activeQuickFilter === 'bjk') {
      list = list.filter(
        (r) =>
          r.authorFanOf?.toLowerCase().includes('beşiktaş') ||
          r.playerTeam?.id === 'bjk' ||
          r.match?.homeTeam.id === 'bjk' ||
          r.match?.awayTeam.id === 'bjk'
      );
    } else if (activeQuickFilter === 'ts') {
      list = list.filter(
        (r) =>
          r.authorFanOf?.toLowerCase().includes('trabzon') ||
          r.playerTeam?.id === 'ts' ||
          r.match?.homeTeam.id === 'ts' ||
          r.match?.awayTeam.id === 'ts'
      );
    } else {
      list.sort(compareNewest);
    }

    return list.slice(0, 6); // Show top 6 on home page with view-all CTA
  }, [enrichedReviews, activeQuickFilter, isFollowingUser]);

  const handleInspectOnPitch = (matchId: string, playerId: string) => {
    setSelectedMatchId(matchId);
    const targetMatch = matches.find((m) => m.id === matchId);
    if (targetMatch) {
      const player = [...targetMatch.homePlayers, ...targetMatch.awayPlayers].find((p) => p.id === playerId);
      if (player) {
        openPlayerModal(player, matchId);
      }
    }
  };

  return (
    <section className="bg-white border-2 border-emerald-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
      
      {/* Header with Title and View All Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-50">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-wider shadow-xs">
              <Flame className="w-3 h-3 fill-slate-950" />
              CANLI TRİBÜN AKIŞI
            </span>
            <span className="bg-emerald-100 text-emerald-800 font-mono font-black text-xs px-2 py-0.5 rounded-full">
              {reviews.length} Toplam Yorum
            </span>
          </div>
          
          <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
            Yapılan Bütün Taraftar Yorumları & Puanları
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Süper Lig genelinde futbolculara verilen anlık puanlar, taraftar analizleri ve öne çıkan değerlendirmeler.
          </p>
        </div>

        <button
          onClick={() => setActiveView('all-reviews')}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition shadow-sm self-start sm:self-auto shrink-0 group"
        >
          <span>Tüm Yorumları Gör & Filtrele</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setActiveQuickFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
            activeQuickFilter === 'all'
              ? 'bg-emerald-600 text-white font-black shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
          }`}
        >
          ⚡ En Yeniler
        </button>

        <button
          id="home-filter-followed-btn"
          onClick={() => setActiveQuickFilter('followed')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeQuickFilter === 'followed'
              ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300 shadow-xs'
              : 'bg-amber-50 text-amber-900 border border-amber-200/90 hover:bg-amber-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-amber-950" />
          <span>Takip Ettiklerim</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold ${activeQuickFilter === 'followed' ? 'bg-slate-950 text-amber-400' : 'bg-amber-200/80 text-amber-900'}`}>
            {followingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveQuickFilter('popular')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
            activeQuickFilter === 'popular'
              ? 'bg-emerald-600 text-white font-black shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
          }`}
        >
          <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span>En Çok Beğenilenler</span>
        </button>

        <button
          onClick={() => setActiveQuickFilter('top-rated')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
            activeQuickFilter === 'top-rated'
              ? 'bg-emerald-600 text-white font-black shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
          }`}
        >
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span>9.0+ Yıldız Notlar</span>
        </button>

        <button
          onClick={() => setActiveQuickFilter('gs')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeQuickFilter === 'gs'
              ? 'bg-emerald-600 text-white font-black shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
          }`}
        >
          <TeamLogo teamId="gs" teamName="Galatasaray" size="xs" shape="circle" showShadow={false} />
          <span>Galatasaray</span>
        </button>

        <button
          onClick={() => setActiveQuickFilter('fb')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeQuickFilter === 'fb'
              ? 'bg-emerald-600 text-white font-black shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
          }`}
        >
          <TeamLogo teamId="fb" teamName="Fenerbahçe" size="xs" shape="circle" showShadow={false} />
          <span>Fenerbahçe</span>
        </button>

        <button
          onClick={() => setActiveQuickFilter('bjk')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeQuickFilter === 'bjk'
              ? 'bg-emerald-600 text-white font-black shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
          }`}
        >
          <TeamLogo teamId="bjk" teamName="Beşiktaş" size="xs" shape="circle" showShadow={false} />
          <span>Beşiktaş</span>
        </button>

        <button
          onClick={() => setActiveQuickFilter('ts')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeQuickFilter === 'ts'
              ? 'bg-emerald-600 text-white font-black shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
          }`}
        >
          <TeamLogo teamId="ts" teamName="Trabzonspor" size="xs" shape="circle" showShadow={false} />
          <span>Trabzonspor</span>
        </button>
      </div>

      {/* Grid of Reviews on Home Page */}
      {filteredReviews.length === 0 ? (
        <div className="bg-slate-50/80 border-2 border-dashed border-emerald-200 rounded-3xl p-8 sm:p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-sm">
            {activeQuickFilter === 'followed' ? <UserCheck className="w-7 h-7 text-amber-600" /> : <MessageSquare className="w-7 h-7" />}
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-black text-slate-900">
              {activeQuickFilter === 'followed'
                ? followingCount === 0
                  ? 'Henüz Hiçbir Yorumcuyu Takip Etmiyorsunuz'
                  : 'Takip Ettiğiniz Yorumcuların Henüz Yorumu Bulunmuyor'
                : 'Henüz Tribün Yorumu & Puanı Bulunmuyor'}
            </h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {activeQuickFilter === 'followed'
                ? 'Beğendiğiniz yorumcuların isimlerinin yanındaki "+ Takip Et" butonuna basarak onların analizlerini ve puanlarını bu özel filtreyle anında öne çıkarabilirsiniz.'
                : 'Uygulama sıfırlandı! Maç kadrolarından istediğin futbolcuyu seçerek ilk resmi tribün puanını ve yorumunu hemen ekleyebilirsin.'}
            </p>
          </div>
          {activeQuickFilter === 'followed' ? (
            <button
              onClick={() => setActiveQuickFilter('all')}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-sm cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Tüm Yorumları Göster</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setActiveView('pitch');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-sm cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Sahadan Futbolcu Puanla</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {filteredReviews.map((review) => {
            const isMyReview = review.isUserSubmission || review.authorName === userProfile.name;
            const isFollowed = !isMyReview && isFollowingUser(review.authorName);

            return (
              <div
                key={review.id}
                className={`rounded-2xl p-4 transition shadow-xs hover:shadow-md flex flex-col justify-between space-y-3 group border-2 ${
                  isFollowed
                    ? 'bg-gradient-to-b from-amber-50/40 to-white border-amber-300 ring-2 ring-amber-400/20'
                    : 'bg-slate-50/70 hover:bg-white border-slate-200/80 hover:border-emerald-300'
                }`}
              >
                <div>
                  {isFollowed && (
                    <div className="mb-2 flex items-center">
                      <span className="bg-amber-100 text-amber-900 border border-amber-300/80 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                        <UserCheck className="w-2.5 h-2.5 text-amber-700" />
                        <span>Takip Ettiğiniz Yorumcu</span>
                      </span>
                    </div>
                  )}

                  {/* Author Info & Rating */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-sm shadow-xs shrink-0 ${
                        isFollowed ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-white border-slate-200'
                      }`}>
                        {review.authorTeamBadge || '⚽'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-slate-900 truncate">
                            {review.authorName}
                          </span>
                          <CommentatorLevelBadge authorName={review.authorName} size="xs" />
                          {isMyReview && (
                            <span className="bg-emerald-100 text-emerald-800 font-bold text-[8px] px-1 py-0.1 rounded">
                              Sen
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
                        <p className="text-[10px] text-slate-500 truncate">
                          {review.authorFanOf || 'Futbol Sever'} • {review.createdAt}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-xl font-mono font-black text-xs shrink-0 border ${
                        review.rating >= 9.0
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : review.rating >= 7.5
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-white text-slate-800 border-slate-200'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${review.rating >= 9.0 ? 'fill-slate-950' : 'fill-amber-400 text-amber-500'}`} />
                      <span>{typeof review.rating === 'number' ? review.rating.toFixed(1) : 'Yorum'}</span>
                    </div>
                  </div>

                  {/* Evaluated Player & Match Strip */}
                  {review.player && (
                    <div className="mt-2.5 bg-white border border-slate-200/80 rounded-xl p-2 flex items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-mono font-black text-[11px] flex items-center justify-center shrink-0">
                          {review.player.number}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate">
                            {review.player.name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {review.playerTeam?.name} ({review.player.position})
                          </p>
                        </div>
                      </div>

                      {review.match && (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 shrink-0">
                          {review.match.homeScore} - {review.match.awayScore}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Comment Text */}
                  {review.comment && (
                    <p className="mt-2 text-xs text-slate-700 leading-relaxed font-medium line-clamp-3">
                      "{review.comment}"
                    </p>
                  )}

                  {/* Reported Status Banner */}
                  {review.isReportedByMe && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-2 mt-2 flex items-center justify-between text-[11px] text-rose-900 animate-fadeIn">
                      <div className="flex items-center gap-1 font-bold truncate">
                        <Flag className="w-3 h-3 text-rose-600 fill-rose-600 shrink-0" />
                        <span className="truncate">Şikayet edildi ({review.reportReason || 'Spam'})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => cancelSpamReport(review.id)}
                        className="text-[10px] font-black text-rose-700 hover:text-rose-950 underline ml-1 shrink-0 cursor-pointer"
                      >
                        Geri Al
                      </button>
                    </div>
                  )}

                  {/* Tags */}
                  {review.tags && review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {review.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-white text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-100"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer: Likes, Dislikes, Spam & Action */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1.5 text-xs">
                  <div className="flex items-center gap-1">
                    {/* Like Button */}
                    <button
                      type="button"
                      onClick={() => toggleLikeReview(review.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                        review.likedByMe
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                      title="Beğen"
                    >
                      <ThumbsUp className={`w-3 h-3 ${review.likedByMe ? 'fill-emerald-600 text-emerald-600' : 'text-slate-500'}`} />
                      <span className="font-mono">{review.likes || 0}</span>
                    </button>

                    {/* Dislike Button */}
                    <button
                      type="button"
                      onClick={() => toggleDislikeReview(review.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                        review.dislikedByMe
                          ? 'bg-rose-50 text-rose-700 border border-rose-300'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                      title="Beğenme"
                    >
                      <ThumbsDown className={`w-3 h-3 ${review.dislikedByMe ? 'fill-rose-600 text-rose-600' : 'text-slate-500'}`} />
                      <span className="font-mono">{review.dislikes || 0}</span>
                    </button>

                    {/* Spam Button */}
                    <button
                      type="button"
                      onClick={() => setSpamReportingReview(review)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        review.isReportedByMe
                          ? 'bg-rose-100 text-rose-700 border border-rose-300'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent'
                      }`}
                      title="Spam / Şikayet Bildir"
                    >
                      <Flag className={`w-3 h-3 ${review.isReportedByMe ? 'fill-rose-600 text-rose-600' : ''}`} />
                    </button>
                  </div>

                  {review.match && review.player && (
                    <button
                      type="button"
                      onClick={() => handleInspectOnPitch(review.match!.id, review.player!.id)}
                      className="flex items-center gap-1 text-[11px] font-black text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition border border-emerald-200 cursor-pointer"
                    >
                      <span>İncele</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
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

      {/* Bottom Hub CTA */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-xs font-bold text-emerald-900">
            Süper Lig'deki diğer maçların tüm yorumlarını ve detaylı filtrelemeleri görmek için merkezi paneli açın.
          </p>
        </div>
        <button
          onClick={() => setActiveView('all-reviews')}
          className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition shadow-sm whitespace-nowrap"
        >
          Tüm Yorumlar Sayfasına Git
        </button>
      </div>

    </section>
  );
};
