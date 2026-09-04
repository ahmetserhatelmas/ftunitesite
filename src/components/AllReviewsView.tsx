import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  MessageSquare,
  Star,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Search,
  Filter,
  Flame,
  ArrowRight,
  User,
  Sparkles,
  Trophy,
  Activity,
  Calendar,
  Layers,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Share2,
  TrendingUp,
  UserPlus,
  Users,
  UserCheck,
} from 'lucide-react';
import { FootballJersey } from './FootballJersey';
import { ReviewRepliesSection } from './ReviewRepliesSection';
import { TeamLogo } from './TeamLogo';
import { FollowButton } from './FollowButton';
import { CommentatorLevelBadge } from './CommentatorLevelBadge';
import { Player, Match } from '../types';
import { compareNewest } from '../lib/matchTime';

const SUPER_LIG_TEAMS = [
  { id: 'all', name: 'Tüm Kulüpler', badge: '🇹🇷' },
  { id: 'gs', name: 'Galatasaray', badge: '🦁' },
  { id: 'fb', name: 'Fenerbahçe', badge: '🟡' },
  { id: 'bjk', name: 'Beşiktaş', badge: '🦅' },
  { id: 'ts', name: 'Trabzonspor', badge: '🌊' },
  { id: 'bsk', name: 'Başakşehir', badge: '🟠' },
  { id: 'eyp', name: 'Eyüpspor', badge: '🟣' },
  { id: 'goz', name: 'Göztepe', badge: '🟡' },
  { id: 'samsun', name: 'Samsunspor', badge: '🔴' },
  { id: 'rize', name: 'Rizespor', badge: '🟢' },
  { id: 'sivas', name: 'Sivasspor', badge: '🔴' },
  { id: 'gzt', name: 'Gaziantep FK', badge: '🔴' },
];

export const AllReviewsView: React.FC = () => {
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
    deleteReview,
    userProfile,
    isRegistered,
    setIsQuickRegisterOpen,
    isFollowingUser,
    followedCommentators,
    followingCount,
  } = useApp();

  // Filters State
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<string>('all');
  const [ratingRangeFilter, setRatingRangeFilter] = useState<'all' | 'legend' | 'high' | 'mid' | 'low'>('all');
  const [onlyFollowedFilter, setOnlyFollowedFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'likes' | 'followed_first' | 'newest' | 'highest' | 'lowest'>('likes');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Helper to find player and match info for a review
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

  // Key Statistics
  const totalReviewsCount = enrichedReviews.length;
  const scoredReviews = enrichedReviews.filter((r) => typeof r.rating === 'number' && r.rating > 0);
  const avgRating = scoredReviews.length > 0
    ? (scoredReviews.reduce((acc, r) => acc + (r.rating || 0), 0) / scoredReviews.length).toFixed(1)
    : '0.0';
  const totalLikes = enrichedReviews.reduce((acc, r) => acc + (r.likes || 0), 0);

  // Find most commented player
  const playerCommentCounts: Record<string, { name: string; count: number; team: string; avatar: string }> = {};
  enrichedReviews.forEach((r) => {
    if (r.player) {
      if (!playerCommentCounts[r.player.id]) {
        playerCommentCounts[r.player.id] = {
          name: r.player.name,
          count: 0,
          team: r.playerTeam?.name || '',
          avatar: r.player.avatar,
        };
      }
      playerCommentCounts[r.player.id].count += 1;
    }
  });

  const trendingPlayers = Object.values(playerCommentCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Filtered & Sorted Reviews
  const filteredReviews = useMemo(() => {
    return enrichedReviews
      .filter((item) => {
        // Followed commentators only filter
        if (onlyFollowedFilter) {
          if (!isFollowingUser(item.authorName)) {
            return false;
          }
        }

        // Team filter
        if (selectedTeamFilter !== 'all') {
          const matchHomeId = item.match?.homeTeam.id;
          const matchAwayId = item.match?.awayTeam.id;
          const playerTeamId = item.player?.teamId;
          if (
            matchHomeId !== selectedTeamFilter &&
            matchAwayId !== selectedTeamFilter &&
            playerTeamId !== selectedTeamFilter
          ) {
            return false;
          }
        }

        // Week filter
        if (selectedWeekFilter !== 'all') {
          if (item.match && item.match.week.toString() !== selectedWeekFilter) {
            return false;
          }
        }

        // Rating Range Filter
        if (ratingRangeFilter === 'legend' && item.rating < 9.5) return false;
        if (ratingRangeFilter === 'high' && (item.rating < 8.0 || item.rating >= 9.5)) return false;
        if (ratingRangeFilter === 'mid' && (item.rating < 6.0 || item.rating >= 8.0)) return false;
        if (ratingRangeFilter === 'low' && item.rating >= 6.0) return false;

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.player?.name.toLowerCase().includes(q);
          const matchComment = item.comment.toLowerCase().includes(q);
          const matchAuthor = item.authorName.toLowerCase().includes(q);
          const matchTeam = item.playerTeam?.name.toLowerCase().includes(q);
          const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));

          if (!matchName && !matchComment && !matchAuthor && !matchTeam && !matchTags) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'followed_first') {
          const aFollowed = isFollowingUser(a.authorName) ? 1 : 0;
          const bFollowed = isFollowingUser(b.authorName) ? 1 : 0;
          if (bFollowed !== aFollowed) {
            return bFollowed - aFollowed;
          }
          return (b.likes || 0) - (a.likes || 0) || compareNewest(a, b);
        }
        if (sortBy === 'likes') {
          return (b.likes || 0) - (a.likes || 0) || compareNewest(a, b);
        }
        if (sortBy === 'highest') {
          return (b.rating ?? -1) - (a.rating ?? -1) || compareNewest(a, b);
        }
        if (sortBy === 'lowest') {
          return (a.rating ?? 99) - (b.rating ?? 99) || compareNewest(a, b);
        }
        return compareNewest(a, b);
      });
  }, [enrichedReviews, onlyFollowedFilter, selectedTeamFilter, selectedWeekFilter, ratingRangeFilter, searchQuery, sortBy, isFollowingUser]);

  // Navigate to player in tactical pitch
  const handleInspectOnPitch = (matchId: string, playerId: string) => {
    setSelectedMatchId(matchId);
    const targetMatch = matches.find((m) => m.id === matchId);
    if (targetMatch) {
      const player = [...targetMatch.homePlayers, ...targetMatch.awayPlayers].find((p) => p.id === playerId);
      if (player) {
        openPlayerModal(player, matchId);
      }
    }
    setActiveView('pitch');
  };

  const handleShareComment = (reviewId: string) => {
    setCopiedId(reviewId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetFilters = () => {
    setSelectedTeamFilter('all');
    setSelectedWeekFilter('all');
    setRatingRangeFilter('all');
    setOnlyFollowedFilter(false);
    setSearchQuery('');
    setSortBy('likes');
  };

  return (
    <div className="w-full max-w-[1760px] mx-auto px-3 sm:px-5 lg:px-7 pt-4 pb-12 space-y-5">
      
      {/* Top Banner & Overview Cards */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl border-2 border-emerald-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-lg uppercase tracking-wide flex items-center gap-1 shadow-sm">
                <Flame className="w-3.5 h-3.5 fill-slate-950" />
                TÜM SÜPER LİG TRİBÜN AKIŞI
              </span>
              <span className="text-emerald-300 text-xs font-mono font-medium">
                • Canlı Taraftar Değerlendirmeleri
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Taraftar Yorumları & Oyuncu Puanlama Merkezi
            </h1>
            
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl font-medium leading-relaxed">
              Süper Lig maçlarındaki tüm futbolcular için taraftarların verdiği anlık puanları, taktik analizleri ve maçın adamı yorumlarını tek ekranda inceleyin.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-emerald-800/60 backdrop-blur-sm border border-emerald-600/60 p-3.5 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-300 text-xs font-bold mb-0.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Toplam Yorum</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-white">
                {totalReviewsCount}
              </p>
              <p className="text-[10px] text-emerald-200/80 font-medium">Aktif Değerlendirme</p>
            </div>

            <div className="bg-emerald-800/60 backdrop-blur-sm border border-emerald-600/60 p-3.5 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-1 text-amber-300 text-xs font-bold mb-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>Lig Ortalaması</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                {avgRating}
              </p>
              <p className="text-[10px] text-emerald-200/80 font-medium">10 Üzerinden</p>
            </div>

            <div className="bg-emerald-800/60 backdrop-blur-sm border border-emerald-600/60 p-3.5 rounded-2xl text-center col-span-2 sm:col-span-1">
              <div className="flex items-center justify-center gap-1 text-rose-300 text-xs font-bold mb-0.5">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Topluluk Alkışı</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-white">
                {totalLikes}
              </p>
              <p className="text-[10px] text-emerald-200/80 font-medium">Beğeni & Destek</p>
            </div>
          </div>

        </div>

        {/* Trending Players Mini Ribbon */}
        {trendingPlayers.length > 0 && (
          <div className="mt-5 pt-4 border-t border-emerald-700/60 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-amber-300 font-black flex items-center gap-1 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
              En Çok Konuşulanlar:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {trendingPlayers.map((tp, idx) => (
                <div
                  key={idx}
                  className="bg-emerald-800/80 border border-emerald-600/80 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <span className="font-bold text-white">{tp.name}</span>
                  <span className="text-[10px] text-emerald-300">({tp.team})</span>
                  <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 rounded-md">
                    {tp.count} yorum
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Guest Mode Notice */}
      {!isRegistered && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-emerald-500/10 border-2 border-amber-300 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shrink-0 shadow-sm mt-0.5">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Misafir Modundasınız — Yorum ve Puan Eklemek İster misiniz?
                </h3>
                <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-md uppercase">
                  Hızlı Kayıt
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Uygulamada tüm yorumları ve puanları özgürce inceleyebilirsiniz. Kendi maç notlarınızı ve taktik yorumlarınızı paylaşmak için saniyeler içinde kaydolun.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsQuickRegisterOpen(true)}
            className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>Hemen Kayıt Ol</span>
          </button>
        </div>
      )}

      {/* Filter & Search Toolbar Card */}
      <div className="bg-white border-2 border-emerald-100 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        
        {/* Quick Scope & Follow Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyFollowedFilter(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                !onlyFollowedFilter
                  ? 'bg-emerald-800 text-white font-black shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
              }`}
            >
              <span>🌍 Tüm Yorumlar</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${!onlyFollowedFilter ? 'bg-emerald-950/60 text-emerald-200' : 'bg-slate-200 text-slate-600'}`}>
                {enrichedReviews.length}
              </span>
            </button>

            <button
              type="button"
              id="filter-followed-commentators-btn"
              onClick={() => setOnlyFollowedFilter(!onlyFollowedFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                onlyFollowedFilter
                  ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300 shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200/90'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-950" />
              <span>👥 Takip Ettiğim Yorumcular</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold ${onlyFollowedFilter ? 'bg-slate-950 text-amber-400' : 'bg-amber-200/80 text-amber-900'}`}>
                {followingCount}
              </span>
            </button>
          </div>

          {(selectedTeamFilter !== 'all' || selectedWeekFilter !== 'all' || ratingRangeFilter !== 'all' || onlyFollowedFilter || searchQuery) && (
            <button
              onClick={resetFilters}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Filtreleri Temizle</span>
            </button>
          )}
        </div>

        {/* Team Chips Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            Kulübe Göre Filtrele
          </label>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {SUPER_LIG_TEAMS.map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeamFilter(team.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shadow-xs cursor-pointer ${
                  selectedTeamFilter === team.id
                    ? 'bg-emerald-700 text-white ring-2 ring-emerald-300 font-black'
                    : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border border-slate-200/80'
                }`}
              >
                {team.id === 'all' ? (
                  <span>🇹🇷</span>
                ) : (
                  <TeamLogo teamId={team.id} teamName={team.name} size="xs" shape="circle" showShadow={false} />
                )}
                <span>{team.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Controls Bar: Search, Week, Rating, Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Oyuncu, yorumcu veya etiket ara..."
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-100 transition"
            />
          </div>

          {/* Week Filter */}
          <div>
            <select
              value={selectedWeekFilter}
              onChange={(e) => setSelectedWeekFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-100 transition"
            >
              <option value="all">🗓️ Tüm Haftalar</option>
              <option value="3">3. Hafta (Güncel)</option>
              <option value="2">2. Hafta</option>
              <option value="1">1. Hafta</option>
            </select>
          </div>

          {/* Rating Range */}
          <div>
            <select
              value={ratingRangeFilter}
              onChange={(e) => setRatingRangeFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-100 transition"
            >
              <option value="all">⭐ Tüm Puan Aralıkları</option>
              <option value="legend">👑 Efsane Performans (9.5+)</option>
              <option value="high">⭐ Yüksek Puan (8.0 - 9.4)</option>
              <option value="mid">⚖️ Standart Notlar (6.0 - 7.9)</option>
              <option value="low">⚠️ Eleştirel / Düşük (&lt;6.0)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-100 transition"
            >
              <option value="likes">🔥 En Çok Beğenilen (Popüler)</option>
              <option value="followed_first">👥 Takip Edilenler Önde</option>
              <option value="newest">🕒 En Yeni Yorumlar</option>
              <option value="highest">⬆️ En Yüksek Puan</option>
              <option value="lowest">⬇️ En Düşük Puan</option>
            </select>
          </div>

        </div>

      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            Tribün Yorumları & Puanları
          </h2>
          <span className="bg-emerald-100 text-emerald-800 font-black text-xs px-2 py-0.5 rounded-full font-mono">
            {filteredReviews.length} Değerlendirme
          </span>
        </div>

        <p className="text-xs text-slate-500 font-medium hidden sm:block">
          Canlı topluluk değerlendirmeleri ve maçın adamı oylamaları
        </p>
      </div>

      {/* Reviews Cards Grid */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-black text-slate-800">
            Seçilen Kriterlere Uygun Yorum Bulunamadı
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Filtreleri sıfırlayarak veya arama terimini değiştirerek Süper Lig'deki diğer tüm oyuncu değerlendirmelerini görebilirsiniz.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-sm"
          >
            Filtreleri Temizle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredReviews.map((review) => {
            const isMyReview = review.isUserSubmission || review.authorName === userProfile.name;
            const isFollowed = !isMyReview && isFollowingUser(review.authorName);

            return (
              <div
                key={review.id}
                className={`rounded-3xl p-5 transition shadow-sm hover:shadow-md flex flex-col justify-between space-y-4 group relative border-2 ${
                  isFollowed
                    ? 'bg-gradient-to-b from-amber-50/40 to-white border-amber-300 ring-2 ring-amber-400/20'
                    : 'bg-white border-slate-100 hover:border-emerald-300'
                }`}
              >
                {/* Header: Author Info + Rating Badge */}
                <div>
                  {isFollowed && (
                    <div className="mb-2 flex items-center justify-between">
                      <span className="bg-amber-100 text-amber-900 border border-amber-300/80 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-amber-700" />
                        <span>Takip Ettiğiniz Yorumcu</span>
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    
                    {/* Author identity */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center font-black text-base shadow-xs shrink-0 ${
                        isFollowed 
                          ? 'bg-amber-100/90 border-amber-300 text-amber-900' 
                          : 'bg-gradient-to-br from-slate-100 to-slate-200 border-slate-200 text-slate-800'
                      }`}>
                        {review.authorTeamBadge || '⚽'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                            {review.authorName}
                          </h4>
                          <CommentatorLevelBadge authorName={review.authorName} size="xs" />
                          {isMyReview && (
                            <span className="bg-emerald-100 text-emerald-800 font-bold text-[9px] px-1.5 py-0.2 rounded-md">
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
                        <p className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
                          <span>{review.authorFanOf ? `${review.authorFanOf} Taraftarı` : 'Futbol Sever'}</span>
                          <span>•</span>
                          <span>{review.createdAt}</span>
                        </p>
                      </div>
                    </div>

                    {/* Star Rating Badge */}
                    <div
                      className={`flex items-center gap-1 px-3 py-1 rounded-2xl font-mono font-black text-sm shrink-0 shadow-xs border ${
                        typeof review.rating !== 'number'
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : review.rating >= 9.0
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : review.rating >= 7.5
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : review.rating >= 6.0
                          ? 'bg-slate-100 text-slate-800 border-slate-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${typeof review.rating === 'number' && review.rating >= 9.0 ? 'fill-slate-950' : 'fill-amber-400 text-amber-500'}`} />
                      <span>{typeof review.rating === 'number' ? review.rating.toFixed(1) : 'Yorum'}</span>
                    </div>

                  </div>

                  {/* Player & Match Context Strip */}
                  {review.player && (
                    <div className="mt-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-mono font-black text-xs shrink-0 shadow-xs">
                          {review.player.number}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate">
                            {review.player.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold truncate">
                            {review.playerTeam?.name} • {review.player.position}
                          </p>
                        </div>
                      </div>

                      {review.match && (
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                            {review.match.homeScore} - {review.match.awayScore}
                          </span>
                          <p className="text-[9px] text-slate-400 font-medium mt-0.5 truncate max-w-[120px]">
                            {review.match.homeTeam.shortName} vs {review.match.awayTeam.shortName}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comment Text */}
                  {review.comment ? (
                    <p className="mt-3 text-xs text-slate-700 leading-relaxed font-medium bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                      "{review.comment}"
                    </p>
                  ) : (
                    <div className="mt-3 text-xs text-slate-400 font-medium italic bg-slate-50/40 p-2.5 rounded-2xl border border-slate-100/80 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                      <span>Yorum yapılmadı, yalnızca puan verildi.</span>
                    </div>
                  )}

                  {/* Reported Status Banner */}
                  {review.isReportedByMe && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 mt-2.5 flex items-center justify-between text-xs text-rose-900 animate-fadeIn">
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
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {review.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-100"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Actions Bar */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  
                  {/* Left: Like, Dislike & Spam Icons */}
                  <div className="flex items-center gap-1.5">
                    {/* Like Button */}
                    <button
                      type="button"
                      onClick={() => toggleLikeReview(review.id)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                        review.likedByMe
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                      title="Beğen"
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${review.likedByMe ? 'fill-emerald-600 text-emerald-600' : 'text-slate-500'}`} />
                      <span className="font-mono text-[11px]">{review.likes || 0}</span>
                    </button>

                    {/* Dislike Button */}
                    <button
                      type="button"
                      onClick={() => toggleDislikeReview(review.id)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                        review.dislikedByMe
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                      title="Beğenme"
                    >
                      <ThumbsDown className={`w-3.5 h-3.5 ${review.dislikedByMe ? 'fill-rose-600 text-rose-600' : 'text-slate-500'}`} />
                      <span className="font-mono text-[11px]">{review.dislikes || 0}</span>
                    </button>

                    {/* Spam / Şikayet Button */}
                    <button
                      type="button"
                      onClick={() => setSpamReportingReview(review)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                        review.isReportedByMe
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                      title="Spam / Şikayet Bildir"
                    >
                      <Flag className={`w-3.5 h-3.5 ${review.isReportedByMe ? 'fill-rose-600 text-rose-600' : ''}`} />
                      <span className="text-[11px]">{review.isReportedByMe ? 'Bildirildi' : 'Spam'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Share / Copy feedback */}
                    <button
                      onClick={() => handleShareComment(review.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      title="Paylaş"
                    >
                      {copiedId === review.id ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Delete button if user's own review */}
                    {isMyReview && (
                      <button
                        onClick={() => deleteReview(review.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Yorumu Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Inspect on Pitch Button */}
                    {review.match && review.player && (
                      <button
                        onClick={() => handleInspectOnPitch(review.match!.id, review.player!.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[11px] transition shadow-xs cursor-pointer"
                      >
                        <span>Sahada İncele</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

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
  );
};
