import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Player } from '../types';
import { FootballJersey } from './FootballJersey';
import { TeamLogo } from './TeamLogo';
import {
  Trophy,
  Crown,
  Star,
  MessageSquare,
  Flame,
  Search,
  Filter,
  TrendingUp,
  Sparkles,
  Award,
  ChevronRight,
  Shield,
} from 'lucide-react';

export const WeeklyLeaderboardView: React.FC = () => {
  const {
    matches,
    selectedWeek,
    selectedLeagueId,
    openPlayerModal,
    getPlayerAverageRating,
    getPlayerCommentCount,
    voteMotm,
  } = useApp();

  const [positionFilter, setPositionFilter] = useState<'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD'>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'rating' | 'votes' | 'motm' | 'goals'>('rating');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Collect all players from matches in this week
  const weekMatches = useMemo(() => {
    return matches.filter(
      (m) => m.leagueId === selectedLeagueId && m.week === selectedWeek
    );
  }, [matches, selectedLeagueId, selectedWeek]);

  // Extract all unique teams playing this week
  const teamsInWeek = useMemo(() => {
    const map = new Map();
    weekMatches.forEach((m) => {
      map.set(m.homeTeam.id, m.homeTeam);
      map.set(m.awayTeam.id, m.awayTeam);
    });
    return Array.from(map.values());
  }, [weekMatches]);

  // Consolidate all players with calculated statistics and ratings
  const allWeekPlayers = useMemo(() => {
    const list: Array<{
      player: Player;
      matchId: string;
      team: any;
      opponentTeam: any;
      rating: number;
      voteCount: number;
      commentsCount: number;
      motmVotes: number;
      scoreContribution: number;
    }> = [];

    weekMatches.forEach((m) => {
      // Home Players
      m.homePlayers.forEach((p) => {
        const { rating, count } = getPlayerAverageRating(p.id, m.id);
        const commentsCount = getPlayerCommentCount(p.id, m.id);
        list.push({
          player: p,
          matchId: m.id,
          team: m.homeTeam,
          opponentTeam: m.awayTeam,
          rating,
          voteCount: count,
          commentsCount,
          motmVotes: p.motmVotes || 0,
          scoreContribution: (p.stats.goals || 0) + (p.stats.assists || 0),
        });
      });

      // Away Players
      m.awayPlayers.forEach((p) => {
        const { rating, count } = getPlayerAverageRating(p.id, m.id);
        const commentsCount = getPlayerCommentCount(p.id, m.id);
        list.push({
          player: p,
          matchId: m.id,
          team: m.awayTeam,
          opponentTeam: m.homeTeam,
          rating,
          voteCount: count,
          commentsCount,
          motmVotes: p.motmVotes || 0,
          scoreContribution: (p.stats.goals || 0) + (p.stats.assists || 0),
        });
      });
    });

    return list;
  }, [weekMatches, getPlayerAverageRating, getPlayerCommentCount]);

  // Filter & Sort
  const filteredRankings = useMemo(() => {
    let result = allWeekPlayers.filter(({ player, team }) => {
      if (positionFilter !== 'ALL' && player.category !== positionFilter) return false;
      if (teamFilter !== 'ALL' && team.id !== teamFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName =
          player.name.toLowerCase().includes(q) ||
          player.shortName.toLowerCase().includes(q) ||
          team.name.toLowerCase().includes(q) ||
          player.position.toLowerCase().includes(q);
        if (!matchesName) return false;
      }
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'rating') {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.voteCount - a.voteCount;
      }
      if (sortBy === 'votes') {
        if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
        return b.rating - a.rating;
      }
      if (sortBy === 'motm') {
        if (b.motmVotes !== a.motmVotes) return b.motmVotes - a.motmVotes;
        return b.rating - a.rating;
      }
      if (sortBy === 'goals') {
        if (b.scoreContribution !== a.scoreContribution) return b.scoreContribution - a.scoreContribution;
        return b.rating - a.rating;
      }
      return 0;
    });

    return result;
  }, [allWeekPlayers, positionFilter, teamFilter, sortBy, searchQuery]);

  // Top 3 Podium
  const podiumTop3 = filteredRankings.filter((p) => p.voteCount > 0).slice(0, 3);

  return (
    <div className="w-full max-w-[1760px] mx-auto px-3 sm:px-5 lg:px-7 my-4 space-y-5">
      {/* Hero Banner - General Aggregated Player Ratings & Leaderboard */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden border-2 border-emerald-600/50">
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-400 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <Crown className="w-3.5 h-3.5 fill-slate-950" />
                Süper Lig {selectedWeek}. Hafta • Genel Konsensüs
              </span>
              <span className="hidden sm:inline text-emerald-200 text-xs font-bold">
                Tüm Taraftarların Ortak Puanlama Sonuçları
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
              Genel Oyuncu Puanları & Lig Sıralaması
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl font-medium">
              Süper Lig'de yapılan bütün taraftar oylamaları, maç içi performans verileri ve ortak puanlama havuzunun sonucunda oluşan resmi oyuncu notları tablosu.
            </p>
          </div>

          {/* Quick stats pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-2 rounded-2xl text-center">
              <span className="text-xs text-emerald-200 block font-bold">Puanlanan Oyuncu</span>
              <span className="text-lg font-black font-mono">{allWeekPlayers.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-2 rounded-2xl text-center">
              <span className="text-xs text-emerald-200 block font-bold">Aktif Karşılaşma</span>
              <span className="text-lg font-black font-mono">{weekMatches.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Podium Showcase: Top 3 Players */}
      {podiumTop3.length >= 3 && (
        <div className="bg-white border-2 border-emerald-100 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-50">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                Haftanın Liderleri (Podyum)
              </h2>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Canlı Tribün Puanı
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            
            {/* 2nd Place: Silver */}
            {podiumTop3[1] && (
              <div
                onClick={() => openPlayerModal(podiumTop3[1].player, podiumTop3[1].matchId)}
                className="bg-slate-50 hover:bg-slate-100/80 border-2 border-slate-200 rounded-3xl p-4 transition cursor-pointer relative group flex flex-col justify-between shadow-xs order-2 md:order-1"
              >
                <div className="absolute -top-3 left-4 bg-slate-300 text-slate-900 font-black text-xs px-2.5 py-0.5 rounded-full border border-slate-400 shadow-sm flex items-center gap-1">
                  <span>🥈 #2 İkinci</span>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <FootballJersey
                    number={podiumTop3[1].player.number}
                    team={podiumTop3[1].team}
                    isGoalkeeper={podiumTop3[1].player.category === 'GK'}
                    size="md"
                    className="group-hover:scale-105 transition"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <TeamLogo team={podiumTop3[1].team} size="xs" shape="circle" showShadow={false} />
                      <span className="text-xs font-bold text-slate-500 truncate">{podiumTop3[1].team.shortName}</span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition truncate">
                      {podiumTop3[1].player.name}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{podiumTop3[1].player.position}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-[11px] text-slate-600 font-medium">
                    ⚽ {podiumTop3[1].player.stats.goals} Gol • 🅰️ {podiumTop3[1].player.stats.assists} Asist
                  </div>
                  <div className="flex items-center gap-1 bg-white border border-slate-300 px-2 py-0.5 rounded-xl font-mono font-black text-xs text-slate-900 shadow-xs">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    <span>{podiumTop3[1].rating}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place: Gold MVP */}
            {podiumTop3[0] && (
              <div
                onClick={() => openPlayerModal(podiumTop3[0].player, podiumTop3[0].matchId)}
                className="bg-gradient-to-b from-amber-50/90 to-amber-100/50 hover:from-amber-100 hover:to-amber-100 border-2 border-amber-300 rounded-3xl p-4 transition cursor-pointer relative group flex flex-col justify-between shadow-md ring-2 ring-amber-200 order-1 md:order-2 md:-mt-2"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-black text-xs px-3 py-0.5 rounded-full border border-amber-300 shadow-md flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 fill-slate-950" />
                  <span>👑 #1 HAFTANIN OYUNCUSU (MVP)</span>
                </div>

                <div className="flex items-center gap-3.5 mt-3">
                  <FootballJersey
                    number={podiumTop3[0].player.number}
                    team={podiumTop3[0].team}
                    isGoalkeeper={podiumTop3[0].player.category === 'GK'}
                    size="lg"
                    className="group-hover:scale-105 transition"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <TeamLogo team={podiumTop3[0].team} size="xs" shape="circle" showShadow={false} />
                      <span className="text-xs font-black text-amber-900 truncate">{podiumTop3[0].team.name}</span>
                    </div>
                    <h3 className="text-base font-black text-slate-950 group-hover:text-amber-900 transition truncate">
                      {podiumTop3[0].player.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-amber-200 text-amber-950 font-black px-2 py-0.2 rounded-md uppercase">
                        {podiumTop3[0].player.position}
                      </span>
                      <span className="text-[11px] text-amber-800 font-bold">
                        {podiumTop3[0].voteCount} Taraftar Oyu
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-amber-200/80 flex items-center justify-between">
                  <div className="text-xs text-slate-700 font-bold">
                    ⚽ {podiumTop3[0].player.stats.goals} Gol • 🅰️ {podiumTop3[0].player.stats.assists} Asist • %{podiumTop3[0].player.stats.passAccuracy} Pas
                  </div>
                  <div className="flex items-center gap-1.5 bg-amber-400 text-slate-950 px-2.5 py-1 rounded-xl font-mono font-black text-sm shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-slate-950" />
                    <span>{podiumTop3[0].rating}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place: Bronze */}
            {podiumTop3[2] && (
              <div
                onClick={() => openPlayerModal(podiumTop3[2].player, podiumTop3[2].matchId)}
                className="bg-slate-50 hover:bg-slate-100/80 border-2 border-orange-200 rounded-3xl p-4 transition cursor-pointer relative group flex flex-col justify-between shadow-xs order-3"
              >
                <div className="absolute -top-3 left-4 bg-amber-700 text-white font-black text-xs px-2.5 py-0.5 rounded-full border border-amber-800 shadow-sm flex items-center gap-1">
                  <span>🥉 #3 Üçüncü</span>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <FootballJersey
                    number={podiumTop3[2].player.number}
                    team={podiumTop3[2].team}
                    isGoalkeeper={podiumTop3[2].player.category === 'GK'}
                    size="md"
                    className="group-hover:scale-105 transition"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <TeamLogo team={podiumTop3[2].team} size="xs" shape="circle" showShadow={false} />
                      <span className="text-xs font-bold text-slate-500 truncate">{podiumTop3[2].team.shortName}</span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition truncate">
                      {podiumTop3[2].player.name}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{podiumTop3[2].player.position}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-[11px] text-slate-600 font-medium">
                    ⚽ {podiumTop3[2].player.stats.goals} Gol • 🅰️ {podiumTop3[2].player.stats.assists} Asist
                  </div>
                  <div className="flex items-center gap-1 bg-white border border-slate-300 px-2 py-0.5 rounded-xl font-mono font-black text-xs text-slate-900 shadow-xs">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    <span>{podiumTop3[2].rating}</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Filter and Search Bar Controls */}
      <div className="bg-white border-2 border-emerald-100 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Position Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'ALL', label: 'Tüm Mevkiler' },
              { id: 'GK', label: 'Kaleciler (GK)' },
              { id: 'DEF', label: 'Defans (DEF)' },
              { id: 'MID', label: 'Orta Saha (MID)' },
              { id: 'FWD', label: 'Forvetler (FWD)' },
            ].map((tab) => (
              <button
                key={tab.id}
                id={`pos-filter-${tab.id}`}
                onClick={() => setPositionFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  positionFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort By Selector */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Sırala:
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'rating', label: 'En Yüksek Puan' },
                { id: 'votes', label: 'En Çok Oy' },
                { id: 'motm', label: 'MOTM Oyları' },
                { id: 'goals', label: 'Skor Katkısı' },
              ].map((s) => (
                <button
                  key={s.id}
                  id={`sort-btn-${s.id}`}
                  onClick={() => setSortBy(s.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    sortBy === s.id
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Second Filter Row: Team select & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          
          {/* Team Filter Dropdown / Pills */}
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <label htmlFor="team-select-filter" className="font-bold text-slate-500 whitespace-nowrap">
              Takım:
            </label>
            <select
              id="team-select-filter"
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="ALL">Tüm Süper Lig Takımları</option>
              {teamsInWeek.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Oyuncu veya takım adı ile filtrele..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <span className="text-slate-500 font-bold self-center">
            <strong>{filteredRankings.length}</strong> oyuncu listeleniyor
          </span>
        </div>
      </div>

      {/* Main Ranking Table / Card List */}
      <div className="bg-white border-2 border-emerald-100 rounded-3xl p-4 sm:p-5 shadow-sm space-y-2">
        <div className="hidden md:grid grid-cols-12 gap-3 pb-2 px-3 border-b border-emerald-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
          <div className="col-span-1 text-center">Sıra</div>
          <div className="col-span-4">Futbolcu & Takım</div>
          <div className="col-span-2 text-center">Mevki</div>
          <div className="col-span-2 text-center">Maç İstatistiği</div>
          <div className="col-span-2 text-center">Tribün Notu / Oy</div>
          <div className="col-span-1 text-right">İşlem</div>
        </div>

        {filteredRankings.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-600" />
            <p className="font-bold text-slate-700">Aramanıza veya filtrenize uygun futbolcu bulunamadı.</p>
            <p className="mt-1">Filtreleri sıfırlayarak tüm listeyi görüntüleyebilirsiniz.</p>
          </div>
        ) : (
          filteredRankings.map(({ player, matchId, team, rating, voteCount, commentsCount, motmVotes }, idx) => {
            const rank = idx + 1;
            const isTop3 = rank <= 3;

            return (
              <div
                key={player.id}
                id={`ranking-row-${player.id}`}
                className="group p-3 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-300 transition flex flex-col md:grid md:grid-cols-12 gap-3 items-center"
              >
                {/* Rank Badge */}
                <div className="flex md:justify-center items-center gap-2 w-full md:w-auto md:col-span-1">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-black text-xs shadow-xs ${
                      rank === 1
                        ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                        : rank === 2
                        ? 'bg-slate-300 text-slate-900'
                        : rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    {rank}
                  </div>
                  <span className="md:hidden text-xs font-bold text-slate-500">Sıralama</span>
                </div>

                {/* Player & Jersey & Team info */}
                <div
                  className="col-span-4 flex items-center gap-3 w-full cursor-pointer min-w-0"
                  onClick={() => openPlayerModal(player, matchId)}
                >
                  <FootballJersey
                    number={player.number}
                    team={team}
                    isGoalkeeper={player.category === 'GK'}
                    size="sm"
                    className="shrink-0 group-hover:scale-105 transition"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <TeamLogo team={team} size="xs" shape="circle" showShadow={false} className="shrink-0" />
                      <p className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-700 transition truncate">
                        {player.name}
                      </p>
                      {motmVotes > 20 && (
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded border border-amber-300 shrink-0">
                          👑 MOTM
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium truncate">
                      {team.name}
                    </p>
                  </div>
                </div>

                {/* Position */}
                <div className="col-span-2 flex md:justify-center items-center gap-1.5 w-full md:w-auto">
                  <span className="md:hidden text-xs font-bold text-slate-500">Mevki:</span>
                  <span className="bg-white border border-slate-200 text-slate-800 px-2.5 py-0.5 rounded-xl text-[11px] font-black uppercase shadow-xs">
                    {player.position} ({player.category})
                  </span>
                </div>

                {/* Match Stats */}
                <div className="col-span-2 flex md:justify-center items-center gap-2 text-xs text-slate-700 w-full md:w-auto">
                  <span className="md:hidden font-bold text-slate-500">İstatistik:</span>
                  <div className="flex items-center gap-2 text-[11px] font-bold">
                    {player.stats.goals > 0 && (
                      <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded-md">
                        ⚽ {player.stats.goals}
                      </span>
                    )}
                    {player.stats.assists > 0 && (
                      <span className="bg-teal-100 text-teal-900 px-1.5 py-0.5 rounded-md">
                        🅰️ {player.stats.assists}
                      </span>
                    )}
                    <span className="text-slate-500">
                      %{player.stats.passAccuracy} Pas
                    </span>
                  </div>
                </div>

                {/* Rating & Votes */}
                <div className="col-span-2 flex md:justify-center items-center gap-2 w-full md:w-auto">
                  <div className="flex items-center gap-1.5 bg-white border border-emerald-200 px-3 py-1 rounded-xl shadow-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                    <span className="font-mono font-black text-xs sm:text-sm text-slate-900">
                      {voteCount > 0 ? rating : '—'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold border-l border-slate-200 pl-1.5">
                      {voteCount} oy
                    </span>
                  </div>
                </div>

                {/* Actions button */}
                <div className="col-span-1 flex md:justify-end items-center gap-1 w-full md:w-auto">
                  <button
                    onClick={() => openPlayerModal(player, matchId)}
                    className="w-full md:w-auto px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] transition shadow-xs flex items-center justify-center gap-1"
                  >
                    <span>Not Ver</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
