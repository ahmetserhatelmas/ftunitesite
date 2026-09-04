import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Player, Match } from '../types';
import { FootballJersey } from './FootballJersey';
import { TeamLogo } from './TeamLogo';
import {
  TrendingUp,
  Star,
  Search,
  Filter,
  Crown,
  Trophy,
  ChevronRight,
  Flame,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Eye,
  SlidersHorizontal,
  Calendar,
  MessageSquare,
  Sparkles,
  Zap,
  BarChart2,
  Table,
  LayoutGrid,
  CheckCircle2,
  X,
} from 'lucide-react';

interface PlayerWeekData {
  week: number;
  match: Match;
  player: Player;
  isHome: boolean;
  opponentTeam: { id: string; name: string; shortName: string; logo: string };
  rating: number;
  voteCount: number;
  commentsCount: number;
  userRating?: number;
  hasUserReview?: boolean;
  motmVotes: number;
  stats: Player['stats'];
}

interface ConsolidatedPlayer {
  id: string;
  name: string;
  shortName: string;
  number: number;
  position: string;
  category: Player['category'];
  avatar: string;
  teamId: string;
  teamName: string;
  teamLogo: string;
  teamShortName: string;
  teamColor: string;
  seasonAverageRating: number;
  totalVotesCount: number;
  totalCommentsCount: number;
  totalGoals: number;
  totalAssists: number;
  totalMinutesPlayed: number;
  totalMotmVotes: number;
  userReviewsCount: number;
  weeksData: Record<number, PlayerWeekData>;
  trend: 'up' | 'down' | 'neutral';
  trendDiff: number;
}

export const AllWeeksPlayerRatingsView: React.FC = () => {
  const {
    matches,
    reviews,
    selectedLeagueId,
    setSelectedMatchId,
    setSelectedWeek,
    setActiveView,
    openPlayerModal,
    getPlayerAverageRating,
    getPlayerCommentCount,
    canWriteMatchReview,
    canRateTeam,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('ALL');
  const [selectedPosFilter, setSelectedPosFilter] = useState<'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD'>('ALL');
  const [sortBy, setSortBy] = useState<'seasonAvg' | 'week3' | 'week2' | 'week1' | 'votes' | 'goals' | 'name'>('seasonAvg');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix');
  const [selectedPlayerDeepDive, setSelectedPlayerDeepDive] = useState<ConsolidatedPlayer | null>(null);

  // Available weeks in database
  const availableWeeks = useMemo(() => {
    const weekSet = new Set<number>();
    matches.forEach((m) => {
      if (m.leagueId === selectedLeagueId) {
        weekSet.add(m.week);
      }
    });
    return Array.from(weekSet).sort((a, b) => a - b);
  }, [matches, selectedLeagueId]);

  // Extract all teams
  const allTeams = useMemo(() => {
    const map = new Map<string, { id: string; name: string; shortName: string; logo: string }>();
    matches.forEach((m) => {
      if (m.leagueId === selectedLeagueId) {
        map.set(m.homeTeam.id, m.homeTeam);
        map.set(m.awayTeam.id, m.awayTeam);
      }
    });
    return Array.from(map.values());
  }, [matches, selectedLeagueId]);

  // Aggregate all players across all matches and weeks
  const aggregatedPlayers = useMemo(() => {
    const playerMap = new Map<string, ConsolidatedPlayer>();

    matches.forEach((match) => {
      if (match.leagueId !== selectedLeagueId) return;

      const processPlayerList = (players: Player[], isHome: boolean) => {
        const team = isHome ? match.homeTeam : match.awayTeam;
        const opponentTeam = isHome ? match.awayTeam : match.homeTeam;

        players.forEach((p) => {
          // Normalize key so player is tracked consistently across weeks
          const playerKey = `${p.id}_${p.teamId}`;

          const { rating, count } = getPlayerAverageRating(p.id, match.id);
          const commentsCount = getPlayerCommentCount(p.id, match.id);
          const userRev = reviews.find(
            (r) => r.playerId === p.id && r.matchId === match.id && r.isUserSubmission
          );

          const weekData: PlayerWeekData = {
            week: match.week,
            match,
            player: p,
            isHome,
            opponentTeam,
            rating,
            voteCount: count,
            commentsCount,
            userRating: userRev ? userRev.rating : undefined,
            hasUserReview: Boolean(userRev),
            motmVotes: p.motmVotes || 0,
            stats: p.stats,
          };

          if (!playerMap.has(playerKey)) {
            playerMap.set(playerKey, {
              id: p.id,
              name: p.name,
              shortName: p.shortName,
              number: p.number,
              position: p.position,
              category: p.category,
              avatar: p.avatar,
              teamId: team.id,
              teamName: team.name,
              teamLogo: team.logo,
              teamShortName: team.shortName,
              teamColor: team.primaryColor || '#059669',
              seasonAverageRating: 0,
              totalVotesCount: 0,
              totalCommentsCount: 0,
              totalGoals: 0,
              totalAssists: 0,
              totalMinutesPlayed: 0,
              totalMotmVotes: 0,
              userReviewsCount: 0,
              weeksData: {},
              trend: 'neutral',
              trendDiff: 0,
            });
          }

          const existing = playerMap.get(playerKey)!;
          existing.weeksData[match.week] = weekData;
          existing.totalVotesCount += count;
          existing.totalCommentsCount += commentsCount;
          existing.totalGoals += p.stats?.goals || 0;
          existing.totalAssists += p.stats?.assists || 0;
          existing.totalMinutesPlayed += p.stats?.minutesPlayed || 0;
          existing.totalMotmVotes += p.motmVotes || 0;
          if (userRev) existing.userReviewsCount += 1;
        });
      };

      processPlayerList(match.homePlayers, true);
      processPlayerList(match.awayPlayers, false);
    });

    // Calculate averages and trends for each player
    const resultList: ConsolidatedPlayer[] = [];
    playerMap.forEach((player) => {
      const weeksWithData = Object.values(player.weeksData);
      if (weeksWithData.length === 0) return;

      const votedWeeks = weeksWithData.filter((w) => w.voteCount > 0);
      if (votedWeeks.length === 0) {
        player.seasonAverageRating = 0;
      } else {
        const sumRating = votedWeeks.reduce((acc, w) => acc + w.rating, 0);
        player.seasonAverageRating = parseFloat((sumRating / votedWeeks.length).toFixed(1));
      }

      // Calculate trend from last two weeks that actually have tribün votes
      const sortedWeekNums = Object.keys(player.weeksData)
        .map(Number)
        .filter((weekNum) => (player.weeksData[weekNum]?.voteCount || 0) > 0)
        .sort((a, b) => a - b);

      if (sortedWeekNums.length >= 2) {
        const lastWeek = player.weeksData[sortedWeekNums[sortedWeekNums.length - 1]];
        const prevWeek = player.weeksData[sortedWeekNums[sortedWeekNums.length - 2]];
        const diff = parseFloat((lastWeek.rating - prevWeek.rating).toFixed(1));
        player.trendDiff = diff;
        if (diff > 0.2) player.trend = 'up';
        else if (diff < -0.2) player.trend = 'down';
        else player.trend = 'neutral';
      }

      resultList.push(player);
    });

    return resultList;
  }, [matches, reviews, selectedLeagueId, getPlayerAverageRating, getPlayerCommentCount]);

  // Filter & Sort
  const filteredPlayers = useMemo(() => {
    let result = aggregatedPlayers.filter((player) => {
      if (selectedTeamFilter !== 'ALL' && player.teamId !== selectedTeamFilter) return false;
      if (selectedPosFilter !== 'ALL' && player.category !== selectedPosFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          player.name.toLowerCase().includes(q) ||
          player.shortName.toLowerCase().includes(q) ||
          player.teamName.toLowerCase().includes(q) ||
          player.position.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'seasonAvg') {
        comparison = b.seasonAverageRating - a.seasonAverageRating;
      } else if (sortBy === 'week1') {
        const wA = a.weeksData[1]?.rating || 0;
        const wB = b.weeksData[1]?.rating || 0;
        comparison = wB - wA;
      } else if (sortBy === 'week2') {
        const wA = a.weeksData[2]?.rating || 0;
        const wB = b.weeksData[2]?.rating || 0;
        comparison = wB - wA;
      } else if (sortBy === 'week3') {
        const wA = a.weeksData[3]?.rating || 0;
        const wB = b.weeksData[3]?.rating || 0;
        comparison = wB - wA;
      } else if (sortBy === 'votes') {
        comparison = b.totalVotesCount - a.totalVotesCount;
      } else if (sortBy === 'goals') {
        const gA = a.totalGoals * 2 + a.totalAssists;
        const gB = b.totalGoals * 2 + b.totalAssists;
        comparison = gB - gA;
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });

    return result;
  }, [aggregatedPlayers, selectedTeamFilter, selectedPosFilter, searchQuery, sortBy, sortOrder]);

  // Overall Season Metrics
  const metrics = useMemo(() => {
    if (aggregatedPlayers.length === 0) return { topPlayer: null, leagueAvg: 0, totalRatings: 0 };
    const votedPlayers = aggregatedPlayers.filter((p) => p.totalVotesCount > 0);
    const sorted = [...votedPlayers].sort((a, b) => b.seasonAverageRating - a.seasonAverageRating);
    const top = sorted[0] || null;
    const sum = votedPlayers.reduce((acc, p) => acc + p.seasonAverageRating, 0);
    const avg = votedPlayers.length > 0 ? sum / votedPlayers.length : 0;
    const totalVotes = aggregatedPlayers.reduce((acc, p) => acc + p.totalVotesCount, 0);

    return {
      topPlayer: top,
      leagueAvg: parseFloat(avg.toFixed(1)),
      totalRatings: totalVotes,
    };
  }, [aggregatedPlayers]);

  const getRatingBadgeStyle = (rating?: number) => {
    if (rating === undefined || rating === null) return 'bg-slate-100 text-slate-400 border-slate-200';
    if (rating >= 9.3) return 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs font-black';
    if (rating >= 8.5) return 'bg-emerald-500 text-white border-emerald-400 font-black';
    if (rating >= 7.5) return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
    if (rating >= 6.5) return 'bg-sky-100 text-sky-900 border-sky-300 font-semibold';
    if (rating >= 5.5) return 'bg-amber-100 text-amber-900 border-amber-300 font-semibold';
    return 'bg-rose-100 text-rose-900 border-rose-300 font-semibold';
  };

  const handleGoToMatchWeek = (match: Match, player: Player) => {
    setSelectedWeek(match.week);
    setSelectedMatchId(match.id);
    setActiveView('pitch');
    setSelectedPlayerDeepDive(null);
  };

  const handleRatePlayerInWeek = (weekData: PlayerWeekData) => {
    setSelectedWeek(weekData.week);
    setSelectedMatchId(weekData.match.id);
    openPlayerModal(weekData.player, weekData.match.id);
  };

  return (
    <div className="w-full max-w-[1760px] mx-auto px-3 sm:px-5 lg:px-7 pt-4 space-y-6">
      
      {/* Top Banner Hero & Overview */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-emerald-700/50 relative overflow-hidden">
        {/* Decorative background grid effect */}
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 pointer-events-none flex items-center justify-center">
          <TrendingUp className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/80 border border-emerald-500/80 text-emerald-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Sezonluk Performans & Bütün Haftalar Analizi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Oyuncuların Hafta Hafta Puan Ortalamaları
            </h1>
            <p className="text-sm text-emerald-100/90 font-medium">
              Süper Lig futbolcularının 1. Haftadan itibaren tüm haftalardaki performans notlarını, 
              taraftar değerlendirmelerini ve sezon ortalamalarını oyuncu oyuncu karşılaştırın.
            </p>
          </div>

          {/* Quick Season Highlights Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
            {/* Top Performer Card */}
            {metrics.topPlayer && (
              <div 
                onClick={() => setSelectedPlayerDeepDive(metrics.topPlayer)}
                className="bg-emerald-800/80 hover:bg-emerald-700/80 border border-emerald-600/70 p-3 rounded-2xl flex flex-col justify-between shadow-sm cursor-pointer transition group"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-black uppercase text-amber-300 flex items-center gap-1">
                    <Crown className="w-3 h-3 fill-amber-300" /> Sezon Lideri
                  </span>
                  <span className="text-xs bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-md">
                    {metrics.topPlayer.seasonAverageRating} ★
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <TeamLogo
                    teamId={metrics.topPlayer.teamId}
                    teamName={metrics.topPlayer.teamName}
                    size="sm"
                    shape="rounded"
                    showShadow={false}
                    className="shrink-0"
                  />
                  <div>
                    <div className="text-xs font-black text-white group-hover:text-amber-300 truncate">
                      {metrics.topPlayer.name}
                    </div>
                    <div className="text-[10px] text-emerald-200">
                      {metrics.topPlayer.teamShortName} • {metrics.topPlayer.position}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Total Rated Weeks */}
            <div className="bg-emerald-800/60 border border-emerald-600/60 p-3 rounded-2xl flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-black uppercase text-emerald-300 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-300" /> Oynanan Haftalar
              </span>
              <div className="mt-1">
                <div className="text-lg font-black text-white">
                  1 - {Math.max(...availableWeeks, 3)}. Hafta
                </div>
                <div className="text-[10px] text-emerald-200">
                  {aggregatedPlayers.length} Futbolcu Kaydı
                </div>
              </div>
            </div>

            {/* Total Community Votes */}
            <div className="bg-emerald-800/60 border border-emerald-600/60 p-3 rounded-2xl flex flex-col justify-between shadow-sm col-span-2 sm:col-span-1">
              <span className="text-[10px] font-black uppercase text-emerald-300 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" /> Toplam Katılım
              </span>
              <div className="mt-1">
                <div className="text-lg font-black text-white">
                  {metrics.totalRatings.toLocaleString()} Oy
                </div>
                <div className="text-[10px] text-emerald-200">
                  Ort. Not: {metrics.leagueAvg} ★
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 space-y-4">
        
        {/* Row 1: Search & Team Tabs */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Oyuncu adı, mevki veya takım ara (Osimhen, Fred, Rafa Silva)..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl pl-10 pr-8 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Position Filters */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {(
              [
                { id: 'ALL', label: 'Tüm Mevkiler' },
                { id: 'GK', label: 'Kaleci (GK)' },
                { id: 'DEF', label: 'Defans (DEF)' },
                { id: 'MID', label: 'Orta Saha (MID)' },
                { id: 'FWD', label: 'Forvet (FWD)' },
              ] as const
            ).map((pos) => (
              <button
                key={pos.id}
                onClick={() => setSelectedPosFilter(pos.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                  selectedPosFilter === pos.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition ${
                viewMode === 'matrix'
                  ? 'bg-white text-emerald-950 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Hafta Hafta Matris Tablo Görünümü"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Matris Tablo</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition ${
                viewMode === 'cards'
                  ? 'bg-white text-emerald-950 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Kartlar & Trend Görünümü"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Detaylı Kartlar</span>
            </button>
          </div>

        </div>

        {/* Row 2: Team Selector & Sort Options */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          
          {/* Teams Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedTeamFilter('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-black transition shrink-0 ${
                selectedTeamFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tüm Takımlar ({aggregatedPlayers.length})
            </button>
            {allTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeamFilter(team.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition shrink-0 ${
                  selectedTeamFilter === team.id
                    ? 'bg-emerald-600 text-white shadow-sm font-black'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <TeamLogo team={team} size="xs" shape="circle" showShadow={false} />
                <span>{team.shortName}</span>
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" /> Sırala:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-black rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value="seasonAvg">👑 Sezon Puan Ortalaması</option>
              <option value="week3">⚡ 3. Hafta Puanı</option>
              <option value="week2">⚡ 2. Hafta Puanı</option>
              <option value="week1">⚡ 1. Hafta Puanı</option>
              <option value="votes">👥 En Çok Puanlanan</option>
              <option value="goals">⚽ Gol / Asist Katkısı</option>
              <option value="name">🔤 İsim (A-Z)</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black"
              title={sortOrder === 'desc' ? 'Azalan Sıralama' : 'Artan Sıralama'}
            >
              {sortOrder === 'desc' ? '↓ Azalan' : '↑ Artan'}
            </button>
          </div>

        </div>

      </div>

      {/* Main Content Area */}
      {filteredPlayers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
            🔍
          </div>
          <h3 className="text-base font-black text-slate-800">Aradığınız kriterlere uygun oyuncu bulunamadı</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Filtreleri sıfırlayarak veya arama terimini değiştirerek tüm oyuncuları görebilirsiniz.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTeamFilter('ALL');
              setSelectedPosFilter('ALL');
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition"
          >
            Filtreleri Sıfırla
          </button>
        </div>
      ) : viewMode === 'matrix' ? (
        /* MATRIX TABLE VIEW */
        <div className="bg-white rounded-3xl shadow-md border border-emerald-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">Futbolcu & Takım</th>
                  <th className="py-3.5 px-3 text-center">Mevki</th>
                  <th className="py-3.5 px-4 text-center bg-emerald-950 text-amber-300">
                    Sezon Ort.
                  </th>
                  {availableWeeks.map((w) => (
                    <th key={w} className="py-3.5 px-3 text-center min-w-[130px]">
                      {w}. Hafta
                    </th>
                  ))}
                  <th className="py-3.5 px-3 text-center">Form Trendi</th>
                  <th className="py-3.5 px-4 text-center">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPlayers.map((player, idx) => {
                  return (
                    <tr
                      key={`${player.id}-${player.teamId}`}
                      className="hover:bg-emerald-50/50 transition cursor-pointer group"
                      onClick={() => setSelectedPlayerDeepDive(player)}
                    >
                      {/* Ranking Index */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                        {idx + 1 <= 3 ? (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-xs ${
                            idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-200 text-slate-800' : 'bg-amber-700 text-white'
                          }`}>
                            {idx + 1}
                          </span>
                        ) : (
                          idx + 1
                        )}
                      </td>

                      {/* Player Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <FootballJersey
                              number={player.number}
                              primaryColor={player.teamColor}
                              secondaryColor="#FFFFFF"
                              teamLogo={player.teamLogo}
                              size="sm"
                            />
                          </div>
                          <div>
                            <div className="font-black text-slate-900 group-hover:text-emerald-700 transition flex items-center gap-1.5">
                              <span>{player.name}</span>
                              {player.totalGoals > 0 && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded font-bold">
                                  ⚽ {player.totalGoals}G
                                </span>
                              )}
                              {player.totalAssists > 0 && (
                                <span className="text-[10px] bg-blue-100 text-blue-800 px-1 rounded font-bold">
                                  🎯 {player.totalAssists}A
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                              <TeamLogo teamId={player.teamId} teamName={player.teamName} size="xs" shape="circle" showShadow={false} />
                              <span>{player.teamName}</span>
                              <span>•</span>
                              <span className="font-mono">#{player.number}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="py-3 px-3 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          player.category === 'FWD'
                            ? 'bg-rose-100 text-rose-800'
                            : player.category === 'MID'
                            ? 'bg-blue-100 text-blue-800'
                            : player.category === 'DEF'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {player.position}
                        </span>
                      </td>

                      {/* Season Average Rating */}
                      <td className="py-3 px-4 text-center bg-emerald-50/80 font-black">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-sm border shadow-xs">
                          <span className={`px-2 py-0.5 rounded-lg border ${getRatingBadgeStyle(player.totalVotesCount > 0 ? player.seasonAverageRating : undefined)}`}>
                            {player.totalVotesCount > 0 ? `${player.seasonAverageRating} ★` : '—'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {Object.keys(player.weeksData).length} Maç
                        </div>
                      </td>

                      {/* Week-by-Week Rating Cells */}
                      {availableWeeks.map((weekNum) => {
                        const weekData = player.weeksData[weekNum];

                        if (!weekData) {
                          return (
                            <td key={weekNum} className="py-3 px-3 text-center text-slate-300 font-bold">
                              <span className="text-[11px]">—</span>
                            </td>
                          );
                        }

                        return (
                          <td key={weekNum} className="py-3 px-3 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`px-2 py-0.5 rounded-lg border text-xs ${getRatingBadgeStyle(weekData.voteCount > 0 ? weekData.rating : undefined)}`}>
                                {weekData.voteCount > 0 ? `${weekData.rating} ★` : '—'}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-600 truncate max-w-[120px]">
                                vs {weekData.opponentTeam.shortName}{' '}
                                <span className="font-mono text-slate-400">
                                  ({weekData.match.homeScore}-{weekData.match.awayScore})
                                </span>
                              </span>
                              {weekData.userRating && (
                                <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 rounded">
                                  Sen: {weekData.userRating}★
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Form Trend */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold">
                          {player.trend === 'up' ? (
                            <span className="text-emerald-600 font-black flex items-center gap-0.5">
                              <ArrowUpRight className="w-4 h-4" /> +{player.trendDiff}
                            </span>
                          ) : player.trend === 'down' ? (
                            <span className="text-rose-600 font-black flex items-center gap-0.5">
                              <ArrowDownRight className="w-4 h-4" /> {player.trendDiff}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-semibold flex items-center gap-0.5">
                              <Minus className="w-3.5 h-3.5" /> Stabil
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlayerDeepDive(player);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 font-black text-xs rounded-xl border border-emerald-200 transition shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>İncele</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* DETAILED CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPlayers.map((player) => {
            return (
              <div
                key={`${player.id}-${player.teamId}`}
                onClick={() => setSelectedPlayerDeepDive(player)}
                className="bg-white border-2 border-emerald-100/80 hover:border-emerald-400 rounded-3xl p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Card Top */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <FootballJersey
                        number={player.number}
                        primaryColor={player.teamColor}
                        secondaryColor="#FFFFFF"
                        teamLogo={player.teamLogo}
                        size="md"
                      />
                      <div>
                        <div className="font-black text-sm text-slate-900 group-hover:text-emerald-700 transition">
                          {player.name}
                        </div>
                        <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                          <TeamLogo teamId={player.teamId} teamName={player.teamName} size="xs" shape="circle" showShadow={false} />
                          <span>{player.teamName}</span>
                          <span>•</span>
                          <span className="font-bold text-slate-700">{player.position}</span>
                        </div>
                      </div>
                    </div>

                    {/* Season Average Badge */}
                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-black uppercase text-slate-400 mb-0.5">
                        Sezon Ort.
                      </div>
                      <span className={`inline-block px-2.5 py-1 rounded-xl text-xs border ${getRatingBadgeStyle(player.totalVotesCount > 0 ? player.seasonAverageRating : undefined)}`}>
                        {player.totalVotesCount > 0 ? `${player.seasonAverageRating} ★` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Week by Week Progress Chips */}
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 mb-3 space-y-2">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Haftalık Puan Dağılımı</span>
                      <span className="font-mono">{Object.keys(player.weeksData).length} Maç</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {availableWeeks.map((w) => {
                        const weekData = player.weeksData[w];
                        if (!weekData) {
                          return (
                            <div key={w} className="bg-white border border-slate-100 rounded-xl p-2 text-center opacity-40">
                              <div className="text-[10px] text-slate-400 font-bold">{w}. Hafta</div>
                              <div className="text-xs font-mono font-bold text-slate-400 mt-0.5">—</div>
                            </div>
                          );
                        }

                        return (
                          <div key={w} className="bg-white border border-slate-200 rounded-xl p-2 text-center shadow-2xs">
                            <div className="text-[10px] font-black text-slate-700">{w}. Hafta</div>
                            <div className="my-1">
                              <span className={`inline-block px-1.5 py-0.2 rounded-md text-xs font-black border ${getRatingBadgeStyle(weekData.voteCount > 0 ? weekData.rating : undefined)}`}>
                                {weekData.voteCount > 0 ? `${weekData.rating} ★` : '—'}
                              </span>
                            </div>
                            <div className="text-[9px] text-slate-500 truncate font-semibold">
                              vs {weekData.opponentTeam.shortName}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Bottom / Action Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px]">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>{player.totalVotesCount} Toplam Değerlendirme</span>
                  </div>
                  <span className="font-black text-emerald-700 flex items-center gap-0.5 group-hover:translate-x-1 transition">
                    Detaylar <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DEEP DIVE MODAL FOR SELECTED PLAYER (All Weeks Breakdown) */}
      {selectedPlayerDeepDive && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-emerald-300 overflow-hidden my-auto max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 sm:p-6 relative shrink-0">
              <button
                onClick={() => setSelectedPlayerDeepDive(null)}
                className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4">
                <FootballJersey
                  number={selectedPlayerDeepDive.number}
                  primaryColor={selectedPlayerDeepDive.teamColor}
                  secondaryColor="#FFFFFF"
                  teamLogo={selectedPlayerDeepDive.teamLogo}
                  size="lg"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl font-black text-white">
                      {selectedPlayerDeepDive.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-black border ${getRatingBadgeStyle(selectedPlayerDeepDive.totalVotesCount > 0 ? selectedPlayerDeepDive.seasonAverageRating : undefined)}`}>
                      {selectedPlayerDeepDive.totalVotesCount > 0 ? `${selectedPlayerDeepDive.seasonAverageRating} ★` : '—'}
                    </span>
                  </div>
                  <div className="text-xs text-emerald-200 font-semibold flex items-center gap-2 mt-1">
                    <TeamLogo teamId={selectedPlayerDeepDive.teamId} teamName={selectedPlayerDeepDive.teamName} size="xs" shape="circle" showShadow={false} />
                    <span>{selectedPlayerDeepDive.teamName}</span>
                    <span>•</span>
                    <span className="bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded-md font-mono font-bold">
                      {selectedPlayerDeepDive.position} (#{selectedPlayerDeepDive.number})
                    </span>
                  </div>
                </div>
              </div>

              {/* Season summary stats bar */}
              <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-emerald-700/60 text-center">
                <div className="bg-emerald-950/60 p-2 rounded-xl border border-emerald-800">
                  <div className="text-[10px] text-emerald-300 font-bold uppercase">Sezon Ort.</div>
                  <div className="text-sm font-black text-amber-300">{selectedPlayerDeepDive.totalVotesCount > 0 ? `${selectedPlayerDeepDive.seasonAverageRating} ★` : '—'}</div>
                </div>
                <div className="bg-emerald-950/60 p-2 rounded-xl border border-emerald-800">
                  <div className="text-[10px] text-emerald-300 font-bold uppercase">Toplam Gol</div>
                  <div className="text-sm font-black text-white">{selectedPlayerDeepDive.totalGoals} Gol</div>
                </div>
                <div className="bg-emerald-950/60 p-2 rounded-xl border border-emerald-800">
                  <div className="text-[10px] text-emerald-300 font-bold uppercase">Toplam Asist</div>
                  <div className="text-sm font-black text-white">{selectedPlayerDeepDive.totalAssists} Asist</div>
                </div>
                <div className="bg-emerald-950/60 p-2 rounded-xl border border-emerald-800">
                  <div className="text-[10px] text-emerald-300 font-bold uppercase">Toplam Oy</div>
                  <div className="text-sm font-black text-white">{selectedPlayerDeepDive.totalVotesCount} Oy</div>
                </div>
              </div>
            </div>

            {/* Modal Body: Week by Week Match Records List */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Hafta Hafta Maç Karnesi & Puanlamalar</span>
                </h3>
                <span className="text-xs text-slate-500 font-semibold">
                  Tüm Süper Lig Maçları
                </span>
              </div>

              <div className="space-y-3">
                {(Object.values(selectedPlayerDeepDive.weeksData) as PlayerWeekData[])
                  .sort((a, b) => a.week - b.week)
                  .map((weekData) => {
                    const match = weekData.match;
                    const stats = weekData.stats;

                    return (
                      <div
                        key={weekData.week}
                        className="bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 shadow-xs space-y-3"
                      >
                        {/* Week Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-white font-black text-xs">
                              {weekData.week}. HAFTA
                            </span>
                            <span className="text-xs font-bold text-slate-600">
                              {match.date}
                            </span>
                          </div>

                          {/* Rating & User Rating */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-slate-500">Ortalama:</span>
                              <span className={`px-2 py-0.5 rounded-lg border text-xs font-black ${getRatingBadgeStyle(weekData.voteCount > 0 ? weekData.rating : undefined)}`}>
                                {weekData.voteCount > 0 ? `${weekData.rating} ★` : '—'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">({weekData.voteCount} oy)</span>
                            </div>

                            {weekData.userRating && (
                              <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-xs font-black">
                                Notun: {weekData.userRating} ★
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Match Info & Score */}
                        <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                            <TeamLogo team={match.homeTeam} size="xs" shape="circle" showShadow={false} />
                            <span>{match.homeTeam.name}</span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-900">
                              {match.homeScore} - {match.awayScore}
                            </span>
                            <span>{match.awayTeam.name}</span>
                            <TeamLogo team={match.awayTeam} size="xs" shape="circle" showShadow={false} />
                          </div>

                          <div className="text-[11px] font-semibold text-slate-500">
                            {match.stadium}
                          </div>
                        </div>

                        {/* Player Performance Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                          <div className="bg-white p-2 rounded-xl border border-slate-100">
                            <div className="text-[10px] text-slate-400 font-bold">Oynanan Süre</div>
                            <div className="font-black text-slate-800 font-mono">{stats?.minutesPlayed || 90}'</div>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-slate-100">
                            <div className="text-[10px] text-slate-400 font-bold">Gol / Asist</div>
                            <div className="font-black text-slate-800 font-mono">
                              {stats?.goals || 0}G / {stats?.assists || 0}A
                            </div>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-slate-100">
                            <div className="text-[10px] text-slate-400 font-bold">Pas İsabeti</div>
                            <div className="font-black text-slate-800 font-mono">%{stats?.passAccuracy || 85}</div>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-slate-100">
                            <div className="text-[10px] text-slate-400 font-bold">Şut / İsabet</div>
                            <div className="font-black text-slate-800 font-mono">
                              {stats?.shots || 0} / {stats?.shotsOnTarget || 0}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons for this specific week */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleRatePlayerInWeek(weekData)}
                            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5 fill-slate-950" />
                            <span>
                              {canWriteMatchReview(weekData.match)
                                ? canRateTeam(weekData.player.teamId)
                                  ? weekData.userRating != null
                                    ? 'Notunu Güncelle'
                                    : 'Bu Haftayı Puanla'
                                  : weekData.hasUserReview
                                    ? 'Yorumunu Güncelle'
                                    : 'Yorum Yaz'
                                : 'İncele'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleGoToMatchWeek(match, weekData.player)}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>Maç Sahasına Git</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-semibold">
                Toplam {Object.keys(selectedPlayerDeepDive.weeksData).length} hafta kaydı incelendi
              </span>
              <button
                onClick={() => setSelectedPlayerDeepDive(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
