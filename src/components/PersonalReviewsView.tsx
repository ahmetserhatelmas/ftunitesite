import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  Trash2,
  Edit3,
  PlusCircle,
  Filter,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Award,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  BarChart3,
  Shield,
  HelpCircle,
  Check,
  X,
} from 'lucide-react';
import { Player, Match, CommentTag } from '../types';
import { AVAILABLE_TAGS } from '../data/tags';
import { compareNewest } from '../lib/matchTime';
import { ReviewRepliesSection } from './ReviewRepliesSection';

export const PersonalReviewsView: React.FC = () => {
  const {
    reviews,
    matches,
    selectedWeek,
    selectedLeagueId,
    addReview,
    deleteReview,
    openPlayerModal,
    setSelectedMatchId,
    setActiveView,
    userProfile,
    getPlayerAverageRating,
    isRegistered,
    requireAuth,
    canWriteMatchReview,
    canRateTeam,
    setIsQuickRegisterOpen,
    myReviewsRepliesCount,
    simulateIncomingReply,
    markAllRepliesAsRead,
    markReviewRepliesAsRead,
    isOwnReview,
  } = useApp();

  // Automatically mark all notifications as read when opening personal reviews
  React.useEffect(() => {
    markAllRepliesAsRead();
  }, []);

  // User's own reviews
  const myReviews = useMemo(() => {
    return reviews.filter((r) => isOwnReview(r));
  }, [reviews, isOwnReview]);

  // Current week matches
  const currentWeekMatches = useMemo(() => {
    return matches.filter(
      (m) => m.leagueId === selectedLeagueId && m.week === selectedWeek && canWriteMatchReview(m)
    );
  }, [matches, selectedLeagueId, selectedWeek, canWriteMatchReview]);

  // All players in current week
  const allWeekPlayersWithMatch = useMemo(() => {
    const list: Array<{ player: Player; match: Match; team: any; isHome: boolean }> = [];
    currentWeekMatches.forEach((m) => {
      m.homePlayers.forEach((p) => {
        list.push({ player: p, match: m, team: m.homeTeam, isHome: true });
      });
      m.awayPlayers.forEach((p) => {
        list.push({ player: p, match: m, team: m.awayTeam, isHome: false });
      });
    });
    return list;
  }, [currentWeekMatches]);

  // Set of playerIds that user has already reviewed
  const reviewedPlayerIds = useMemo(() => {
    return new Set(myReviews.map((r) => `${r.matchId}-${r.playerId}`));
  }, [myReviews]);

  // Unreviewed players in current week (suggestions)
  const unreviewedPlayers = useMemo(() => {
    return allWeekPlayersWithMatch
      .filter((item) => !reviewedPlayerIds.has(`${item.match.id}-${item.player.id}`))
      .slice(0, 8);
  }, [allWeekPlayersWithMatch, reviewedPlayerIds]);

  // Personal statistics
  const totalMyReviews = myReviews.length;
  const scoredMyReviews = myReviews.filter((r) => typeof r.rating === 'number' && r.rating > 0);
  const avgMyRating = scoredMyReviews.length > 0
    ? (scoredMyReviews.reduce((acc, r) => acc + (r.rating || 0), 0) / scoredMyReviews.length).toFixed(1)
    : '—';
  const totalLikesReceived = myReviews.reduce((acc, r) => acc + (r.likes || 0), 0);

  const highestRated = useMemo(() => {
    if (myReviews.length === 0) return null;
    return [...myReviews].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];
  }, [myReviews]);

  // Quick review form state
  const [isQuickRateOpen, setIsQuickRateOpen] = useState(false);
  const [formMatchId, setFormMatchId] = useState<string>('');
  const [formPlayerId, setFormPlayerId] = useState<string>('');
  const [formRating, setFormRating] = useState<number>(8.0);
  const [formComment, setFormComment] = useState<string>('');
  const [formNoComment, setFormNoComment] = useState<boolean>(false);
  const [formSelectedTags, setFormSelectedTags] = useState<string[]>([]);
  const [formSubmittedSuccess, setFormSubmittedSuccess] = useState(false);

  const formSelectedPlayer = useMemo(() => {
    if (!formMatchId || !formPlayerId) return undefined;
    const match = matches.find((m) => m.id === formMatchId);
    return match
      ? [...match.homePlayers, ...match.awayPlayers].find((p) => p.id === formPlayerId)
      : undefined;
  }, [formMatchId, formPlayerId, matches]);
  const formCanScore = canRateTeam(formSelectedPlayer?.teamId);

  // List filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeam, setFilterTeam] = useState('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest' | 'likes'>('newest');

  // Enriched personal reviews
  const enrichedMyReviews = useMemo(() => {
    return myReviews.map((review) => {
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

      // General consensus rating for this player
      const generalRating = player && match
        ? getPlayerAverageRating(player.id, match.id).rating
        : 0;

      const diff =
        typeof review.rating === 'number' && generalRating > 0
          ? (review.rating - generalRating).toFixed(1)
          : '0.0';

      return {
        ...review,
        match,
        player,
        playerTeam,
        generalRating,
        diff: Number(diff),
      };
    });
  }, [myReviews, matches, getPlayerAverageRating]);

  // Filtered personal reviews
  const filteredMyReviews = useMemo(() => {
    return enrichedMyReviews
      .filter((item) => {
        if (filterTeam !== 'ALL') {
          if (
            item.playerTeam?.id !== filterTeam &&
            item.match?.homeTeam.id !== filterTeam &&
            item.match?.awayTeam.id !== filterTeam
          ) {
            return false;
          }
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchPlayer = item.player?.name.toLowerCase().includes(q);
          const matchComment = item.comment.toLowerCase().includes(q);
          const matchTeam = item.playerTeam?.name.toLowerCase().includes(q);
          const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchPlayer && !matchComment && !matchTeam && !matchTags) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'highest') return (b.rating ?? -1) - (a.rating ?? -1);
        if (sortBy === 'lowest') return (a.rating ?? 99) - (b.rating ?? 99);
        if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0);
        return compareNewest(a, b);
      });
  }, [enrichedMyReviews, filterTeam, searchQuery, sortBy]);

  // Handle Tag toggle in form
  const toggleTag = (label: string) => {
    if (formSelectedTags.includes(label)) {
      setFormSelectedTags(formSelectedTags.filter((t) => t !== label));
    } else {
      if (formSelectedTags.length < 4) {
        setFormSelectedTags([...formSelectedTags, label]);
      }
    }
  };

  // Open form pre-filled for a specific player
  const startRatingForPlayer = (matchId: string, playerId: string) => {
    setFormMatchId(matchId);
    setFormPlayerId(playerId);
    setFormRating(8.0);
    setFormComment('');
    setFormNoComment(false);
    setFormSelectedTags(['Maçın Adamı', 'Usta Ayak']);
    setIsQuickRateOpen(true);
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  // Submit new review
  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMatchId || !formPlayerId) return;

    requireAuth(() => {
      const match = matches.find((m) => m.id === formMatchId);
      if (!canWriteMatchReview(match)) {
        return;
      }
      const player = match
        ? [...match.homePlayers, ...match.awayPlayers].find((p) => p.id === formPlayerId)
        : undefined;
      const canScore = canRateTeam(player?.teamId);
      const comment = formNoComment && canScore ? '' : formComment.trim();
      if (!canScore && !comment) {
        return;
      }

      addReview({
        playerId: formPlayerId,
        matchId: formMatchId,
        teamId: player?.teamId,
        authorName: userProfile.nickname || userProfile.name,
        authorTeamBadge: userProfile.favoriteTeamBadge,
        authorFanOf: userProfile.favoriteTeamName,
        rating: canScore ? Number(formRating.toFixed(1)) : undefined,
        comment: comment || (canScore ? 'Taktik ve oyun içi katkısı ile dikkat çeken bir performans sergiledi.' : ''),
        tags: canScore && formSelectedTags.length > 0 ? formSelectedTags : [],
      });

      setFormSubmittedSuccess(true);
      setTimeout(() => {
        setFormSubmittedSuccess(false);
        setIsQuickRateOpen(false);
        setFormComment('');
        setFormSelectedTags([]);
        setFormNoComment(false);
      }, 1200);
    });
  };

  return (
    <div className="w-full max-w-[1760px] mx-auto px-3 sm:px-5 lg:px-7 pt-4 pb-14 space-y-6">
      
      {/* 1. Top Personal Hub Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl border-2 border-emerald-600/60 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* User Persona & Title */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center text-3xl font-black shadow-lg ring-4 ring-emerald-500/80 shrink-0">
              {userProfile.avatar || '⚽'}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-lg uppercase tracking-wide flex items-center gap-1 shadow-sm">
                  <UserCheck className="w-3.5 h-3.5" />
                  KİŞİSEL PUANLAMA & YORUM MERKEZİ
                </span>
                <span className="bg-emerald-700/80 text-emerald-100 text-xs px-2 py-0.5 rounded-md font-mono font-bold border border-emerald-500/60">
                  {userProfile.favoriteTeamBadge} {userProfile.favoriteTeamName}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {userProfile.name} • Kişisel Değerlendirmelerim
              </h1>
              
              <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl font-medium">
                Bu ekranda sadece <span className="font-bold text-amber-300">kendi verdiğiniz oyuncu puanlarını</span>, yazdığınız taktik analizleri ve genel oylama konsensüsü ile aranızdaki farkları inceleyebilirsiniz.
              </p>
            </div>
          </div>

          {/* Quick Personal Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="bg-emerald-900/80 border border-emerald-600/80 p-3.5 rounded-2xl text-center shadow-xs">
              <span className="text-[11px] text-emerald-200 block font-bold mb-0.5">Puanladığım Oyuncular</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-white">{totalMyReviews}</span>
              <span className="text-[10px] text-emerald-300 block">Kişisel Değerlendirme</span>
            </div>

            <div className="bg-emerald-900/80 border border-emerald-600/80 p-3.5 rounded-2xl text-center shadow-xs">
              <span className="text-[11px] text-amber-300 block font-bold mb-0.5">Verdiğim Ort. Not</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">{avgMyRating}</span>
              <span className="text-[10px] text-emerald-300 block">10 Üzerinden</span>
            </div>

            <div className="bg-emerald-900/80 border border-emerald-600/80 p-3.5 rounded-2xl text-center shadow-xs">
              <span className="text-[11px] text-rose-300 block font-bold mb-0.5">Aldığım Beğeni</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-white">{totalLikesReceived}</span>
              <span className="text-[10px] text-emerald-300 block">Topluluk Alkışı</span>
            </div>

            <div className="bg-emerald-900/80 border border-emerald-600/80 p-3.5 rounded-2xl text-center shadow-xs">
              <span className="text-[11px] text-emerald-200 block font-bold mb-0.5">Gelen Cevaplar</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-white">{myReviewsRepliesCount}</span>
              <span className="text-[10px] text-emerald-300 block">Kullanıcı Yanıtı</span>
            </div>
          </div>

        </div>

        {/* Action button in banner */}
        <div className="mt-5 pt-4 border-t border-emerald-700/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-emerald-200">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Farklı bir oyuncuya hemen kendi notunu ve taktik yorumunu ekle:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsQuickRateOpen(!isQuickRateOpen)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition shadow-md cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isQuickRateOpen ? 'Puanlama Formunu Kapat' : 'Yeni Oyuncu Puanla & Yorum Yaz'}</span>
            </button>

            <button
              onClick={() => setActiveView('ranking')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-900/80 hover:bg-emerald-950 text-emerald-100 rounded-xl text-xs font-bold transition border border-emerald-600/60 cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
              <span>Genel Oyuncu Puanlarına Git</span>
            </button>
          </div>
        </div>

      </div>

      {/* 2. Interactive Quick Rating & Review Form Card (When Opened) */}
      {isQuickRateOpen && (
        <div className="bg-white border-2 border-amber-300 rounded-3xl p-5 sm:p-7 shadow-lg space-y-5 animate-fadeIn">
          
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                ✍️
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Yeni Kişisel Oyuncu Notu & Analiz Formu
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedWeek}. Hafta karşılaşmalarından desteklediğiniz kulübün ({userProfile.favoriteTeamBadge} {userProfile.favoriteTeamName}) futbolcusunu seçip notunuzu kaydedin.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsQuickRateOpen(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl transition"
            >
              Kapat
            </button>
          </div>

          {/* Important Rule Banner */}
          <div className="bg-gradient-to-r from-amber-500/15 to-amber-500/5 border border-amber-300 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-amber-950">
            <span className="font-black bg-amber-400 text-slate-950 text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wide shrink-0">
              ÖNEMLİ KURAL
            </span>
            <span className="font-medium text-slate-800">
              Kural gereği yalnızca tuttuğunuz takım olan <strong>{userProfile.favoriteTeamName} ({userProfile.favoriteTeamBadge})</strong> futbolcularına not verebilir ve yorum yazabilirsiniz.
            </span>
          </div>

          <form onSubmit={handleSaveReview} className="space-y-4">
            
            {/* Step A: Select Match & Player */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Match Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">1. Karşılaşmayı Seçin:</label>
                <select
                  value={formMatchId}
                  onChange={(e) => {
                    setFormMatchId(e.target.value);
                    setFormPlayerId('');
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">-- Karşılaşma Seçiniz --</option>
                  {currentWeekMatches.map((m) => {
                    const isFavTeamMatch =
                      m.homeTeam.id === userProfile.favoriteTeamId ||
                      m.awayTeam.id === userProfile.favoriteTeamId;
                    return (
                      <option key={m.id} value={m.id}>
                        {isFavTeamMatch ? '⭐ [Takımınız] ' : ''}{m.homeTeam.name} {m.homeScore} - {m.awayScore} {m.awayTeam.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Player Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">2. Futbolcuyu Seçin:</label>
                <select
                  value={formPlayerId}
                  onChange={(e) => setFormPlayerId(e.target.value)}
                  disabled={!formMatchId}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-40"
                  required
                >
                  <option value="">-- Futbolcu Seçiniz --</option>
                  {formMatchId && (() => {
                    const match = matches.find((m) => m.id === formMatchId);
                    if (!match) return null;

                    const isHomeFav = match.homeTeam.id === userProfile.favoriteTeamId;
                    const isAwayFav = match.awayTeam.id === userProfile.favoriteTeamId;

                    return (
                      <>
                        <optgroup label={`${match.homeTeam.name} Oyuncuları ${isHomeFav ? '(Takımınız - Puan + Yorum)' : '(Yalnızca yorum)'}`}>
                          {match.homePlayers.map((p) => (
                            <option key={p.id} value={p.id}>
                              #{p.number} {p.name} ({p.position}){!isHomeFav && userProfile.favoriteTeamId ? ' — yorum' : ''}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label={`${match.awayTeam.name} Oyuncuları ${isAwayFav ? '(Takımınız - Puan + Yorum)' : '(Yalnızca yorum)'}`}>
                          {match.awayPlayers.map((p) => (
                            <option key={p.id} value={p.id}>
                              #{p.number} {p.name} ({p.position}){!isAwayFav && userProfile.favoriteTeamId ? ' — yorum' : ''}
                            </option>
                          ))}
                        </optgroup>
                      </>
                    );
                  })()}
                </select>
              </div>

            </div>

            {formCanScore && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800">
                  3. Kişisel Oyuncu Puanınız (1.0 - 10.0):
                </label>
                <div className="flex items-center gap-1.5 bg-amber-400 text-slate-950 px-3 py-1 rounded-xl font-mono font-black text-base shadow-sm">
                  <Star className="w-4 h-4 fill-slate-950" />
                  <span>{formRating.toFixed(1)}</span>
                </div>
              </div>

              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.1"
                value={formRating}
                onChange={(e) => setFormRating(parseFloat(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
              />

              <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1 font-mono">
                <span>1.0 (Çok Yetersiz)</span>
                <span>5.0 (Vasat)</span>
                <span>7.5 (İyi)</span>
                <span>9.0 (Yıldız)</span>
                <span>10.0 (Mükemmel)</span>
              </div>
            </div>
            )}

            {!formCanScore && formPlayerId && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-950">
                <p className="font-black">Puan veremezsiniz, yorum yazabilirsiniz.</p>
                <p className="mt-1 text-slate-600">
                  Taraftarı olmadığınız takımın oyuncularına not verilemez; maç başladıysa yorum bırakabilirsiniz.
                </p>
              </div>
            )}

            {formCanScore && (
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">
                4. Performans Etiketleri Seçin (Maks 4):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_TAGS.map((tag) => {
                  const isSelected = formSelectedTags.includes(tag.label);
                  return (
                    <button
                      type="button"
                      key={tag.id}
                      onClick={() => toggleTag(tag.label)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>{tag.emoji}</span>
                      <span>{tag.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            )}

            {/* Step D: Tactical Comment & No-Comment Option */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <label className="text-xs font-black text-slate-700">
                  {formCanScore ? '5. Kişisel Yorumunuz & Taktik Analiziniz:' : '3. Yorumunuz:'}
                </label>
                
                {formCanScore && (
                <button
                  type="button"
                  id="personal-no-comment-button"
                  onClick={() => {
                    const nextVal = !formNoComment;
                    setFormNoComment(nextVal);
                    if (nextVal) {
                      setFormComment('');
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                    formNoComment
                      ? 'bg-amber-400 text-slate-950 border-amber-500 font-black shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formNoComment}
                    readOnly
                    className="w-3.5 h-3.5 rounded text-amber-500 pointer-events-none accent-amber-500"
                  />
                  <span>Yorum yapmak istemiyorum</span>
                </button>
                )}
              </div>

              {formCanScore && formNoComment ? (
                <div className="bg-amber-50/90 border-2 border-dashed border-amber-300 rounded-xl p-3 flex items-center gap-2.5 text-slate-800 text-xs font-medium animate-fadeIn">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-400 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900">Yorumsuz Puanlama Seçildi</p>
                    <p className="text-[11px] text-slate-600">
                      Yorum yazmadan yalnızca <strong>{formRating.toFixed(1)} ★</strong> kişisel notunuz ve etiketleriniz kaydedilecektir.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <textarea
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value.slice(0, 1000))}
                    maxLength={1000}
                    placeholder="Örn: Maç boyunca savunma arkasına attığı kritik paslar ve pres gücüyle galibiyeti getiren isim oldu... (Maksimum 1000 karakter)"
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
                    <span>Maksimum 1000 karakter</span>
                    <span
                      className={`font-mono font-bold transition-colors ${
                        formComment.length >= 950
                          ? 'text-rose-600 font-black'
                          : formComment.length >= 800
                          ? 'text-amber-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {formComment.length} / 1000
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsQuickRateOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={!formMatchId || !formPlayerId || (!formCanScore && !formComment.trim())}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition shadow-md disabled:opacity-40 cursor-pointer ${
                  formCanScore && formNoComment
                    ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-amber-400/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {formSubmittedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>Kaydedildi!</span>
                  </>
                ) : (
                  <>
                    <Star className={`w-4 h-4 ${formCanScore && formNoComment ? 'fill-slate-950' : 'fill-white'}`} />
                    <span>
                      {formCanScore && formNoComment
                        ? `${formRating.toFixed(1)} ★ Puanı Hemen Kaydet`
                        : formCanScore
                        ? 'Kişisel Değerlendirmeyi Kaydet'
                        : 'Yorumu Kaydet'}
                    </span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      )}

      {/* 3. Unrated Players Suggestions Ribbon */}
      {unreviewedPlayers.length > 0 && (
        <div className="bg-white border-2 border-emerald-100 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                Henüz Puanlamadığın Oyuncular (Hızlı Değerlendir)
              </h3>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono">
              {selectedWeek}. Hafta
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {unreviewedPlayers.map((item) => (
              <div
                key={`${item.match.id}-${item.player.id}`}
                className="bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 rounded-2xl p-2.5 flex flex-col justify-between items-center text-center space-y-2 transition shadow-xs group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white font-mono font-black text-xs flex items-center justify-center shadow-xs">
                  {item.player.number}
                </div>
                <div className="min-w-0 w-full">
                  <p className="text-xs font-black text-slate-900 truncate">
                    {item.player.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold truncate">
                    {item.team.shortName} • {item.player.position}
                  </p>
                </div>
                <button
                  onClick={() => startRatingForPlayer(item.match.id, item.player.id)}
                  className="w-full py-1 bg-white hover:bg-emerald-600 text-slate-700 hover:text-white border border-slate-300 hover:border-emerald-600 rounded-xl text-[10px] font-black transition shadow-xs"
                >
                  {canRateTeam(item.player.teamId) ? '+ Puanla' : '+ Yorumla'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Filter Toolbar for Personal Reviews */}
      <div className="bg-white border-2 border-slate-100 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Yaptığım Bütün Puanlamalar & Yorumlarım
            </h2>
            <span className="bg-emerald-100 text-emerald-800 font-mono font-black text-xs px-2.5 py-0.5 rounded-full">
              {filteredMyReviews.length} Değerlendirme
            </span>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Puanladığım oyuncu veya yorum ara..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        {/* Sort & Quick Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-slate-500 font-bold mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Sırala:
            </span>
            <button
              onClick={() => setSortBy('newest')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                sortBy === 'newest' ? 'bg-emerald-700 text-white font-black' : 'bg-slate-100 text-slate-700'
              }`}
            >
              En Yeniler
            </button>
            <button
              onClick={() => setSortBy('highest')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                sortBy === 'highest' ? 'bg-emerald-700 text-white font-black' : 'bg-slate-100 text-slate-700'
              }`}
            >
              En Yüksek Notlarım
            </button>
            <button
              onClick={() => setSortBy('lowest')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                sortBy === 'lowest' ? 'bg-emerald-700 text-white font-black' : 'bg-slate-100 text-slate-700'
              }`}
            >
              En Düşük Notlarım
            </button>
            <button
              onClick={() => setSortBy('likes')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                sortBy === 'likes' ? 'bg-emerald-700 text-white font-black' : 'bg-slate-100 text-slate-700'
              }`}
            >
              En Çok Beğenilen
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Karşılaştırma: <span className="text-emerald-700 font-bold">Kişisel Not vs Genel Konsensüs</span>
            </span>
          </div>
        </div>

      </div>

      {/* 5. Personal Reviews Grid with General Consensus Comparison */}
      {filteredMyReviews.length === 0 ? (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-12 text-center space-y-4">
          <UserCheck className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-base font-black text-slate-800">
            Henüz Kişisel Bir Puanlama Bulunmuyor
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Yukarıdaki "Yeni Oyuncu Puanla & Yorum Yaz" butonunu veya saha ekranındaki futbolcuları kullanarak ilk değerlendirmenizi yapabilirsiniz.
          </p>
          <button
            onClick={() => setIsQuickRateOpen(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-sm"
          >
            İlk Puanlamayı Yap
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMyReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border-2 border-slate-100 hover:border-emerald-400 rounded-3xl p-5 transition shadow-sm hover:shadow-md flex flex-col justify-between space-y-4 group"
            >
              <div>
                {/* Header: Player info & Ratings Side-by-Side */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  
                  {/* Player info */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white font-mono font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                      {review.player?.number || '⚽'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-slate-900 truncate">
                        {review.player?.name || 'Futbolcu'}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-bold truncate">
                        {review.playerTeam?.name} • {review.player?.position}
                      </p>
                    </div>
                  </div>

                  {/* Rating comparison box */}
                  <div className="flex flex-col items-end shrink-0">
                    <div className="flex items-center gap-1 bg-amber-400 text-slate-950 px-2.5 py-1 rounded-xl font-mono font-black text-xs shadow-xs border border-amber-300">
                      <Star className="w-3.5 h-3.5 fill-slate-950" />
                      <span>{typeof review.rating === 'number' ? `Senin Notun: ${review.rating.toFixed(1)}` : 'Yorumun'}</span>
                    </div>

                    {typeof review.rating === 'number' && review.generalRating > 0 && (
                      <span className="text-[10px] font-bold text-slate-500 mt-1 flex items-center gap-1">
                        Genel: <strong className="text-slate-800">{review.generalRating.toFixed(1)}</strong>
                        <span
                          className={`font-mono font-black text-[9px] px-1 rounded ${
                            review.diff > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : review.diff < 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {review.diff > 0 ? `+${review.diff}` : review.diff}
                        </span>
                      </span>
                    )}
                  </div>

                </div>

                {/* Match context */}
                {review.match && (
                  <div className="mt-2.5 flex items-center justify-between text-[11px] bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
                    <span className="text-slate-600 font-bold">
                      {review.match.homeTeam.shortName} vs {review.match.awayTeam.shortName}
                    </span>
                    <span className="font-mono font-black text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-md">
                      {review.match.homeScore} - {review.match.awayScore}
                    </span>
                  </div>
                )}

                {/* Personal Comment */}
                {review.comment ? (
                  <p className="mt-3 text-xs text-slate-700 leading-relaxed font-medium bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                    "{review.comment}"
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-slate-400 italic bg-slate-50/70 p-2.5 rounded-2xl border border-slate-100 flex items-center gap-1.5 font-medium">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                    <span>Yorum yapılmadı, yalnızca puan verildi.</span>
                  </p>
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

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px]">
                  <ThumbsUp className="w-3.5 h-3.5 text-rose-500" />
                  <span>{review.likes || 0} Beğeni</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-400 font-normal">{review.createdAt}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Puanlamayı Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {review.match && review.player && (
                    <button
                      onClick={() => {
                        setSelectedMatchId(review.match!.id);
                        openPlayerModal(review.player!, review.match!.id);
                        setActiveView('pitch');
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[11px] transition shadow-xs"
                    >
                      <span>Sahada Gör</span>
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
          ))}
        </div>
      )}

      {/* 6. Comparison Guide Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black shrink-0">
            ⚖️
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900">
              Kişisel Puanlama ile Genel Konsensüs Arasındaki Fark Nedir?
            </h4>
            <p className="text-xs text-slate-600 font-medium max-w-2xl mt-0.5">
              <strong>Kişisel Ekranınız</strong>, yalnızca sizin verdiğiniz notları ve taktik analizlerinizi yönettiğiniz alandır. 
              <strong> Genel Oyuncu Puanları Ekranı</strong> ise yüzlerce taraftarın oylarıyla hesaplanan ortak lig ortalamasını ve haftanın resmi sıralamasını sunar.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveView('ranking')}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition whitespace-nowrap shadow-sm"
        >
          Genel Oyuncu Puanlarına Göz At
        </button>
      </div>

    </div>
  );
};
