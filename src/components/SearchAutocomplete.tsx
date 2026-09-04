import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Match, Player } from '../types';
import { TeamLogo } from './TeamLogo';
import {
  Search,
  X,
  Shield,
  User,
  Star,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Flame,
  Sparkles,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface MatchedPlayerItem {
  player: Player;
  match: Match;
  teamName: string;
  teamLogo: string;
  teamId: string;
  ratingAvg: number;
  ratingCount: number;
  commentCount: number;
}

interface MatchedTeamItem {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  primaryColor?: string;
  secondaryColor?: string;
  latestMatch?: Match;
  playerCount: number;
}

// Position synonyms in Turkish for intelligent search
const POSITION_SYNONYMS: Record<string, string[]> = {
  GK: ['kaleci', 'file bekçisi', 'gk', 'goalkeeper'],
  CB: ['stoper', 'merkez defans', 'defans', 'cb', 'defender'],
  RB: ['sağ bek', 'sag bek', 'defans', 'rb', 'right back'],
  LB: ['sol bek', 'defans', 'lb', 'left back'],
  CDM: ['ön libero', 'on libero', 'defansif orta saha', 'cdm', 'orta saha'],
  CM: ['orta saha', 'merkez orta saha', 'cm', 'midfielder'],
  CAM: ['on numara', '10 numara', 'ofansif orta saha', 'cam', 'playmaker'],
  RW: ['sağ kanat', 'sag kanat', 'kanat', 'rw', 'winger'],
  LW: ['sol kanat', 'kanat', 'lw', 'winger'],
  ST: ['santrfor', 'forvet', 'golcü', 'golcu', 'st', 'striker', 'ileri uç'],
};

const POPULAR_SEARCH_SUGGESTIONS = [
  { label: 'Victor Osimhen', type: 'player', icon: '🦁' },
  { label: 'Dries Mertens', type: 'player', icon: '🦁' },
  { label: 'Fred', type: 'player', icon: '🟡' },
  { label: 'Rafa Silva', type: 'player', icon: '🦅' },
  { label: 'Fernando Muslera', type: 'player', icon: '🦁' },
  { label: 'Galatasaray', type: 'team', icon: '🦁' },
  { label: 'Fenerbahçe', type: 'team', icon: '🟡' },
  { label: 'Beşiktaş', type: 'team', icon: '🦅' },
  { label: 'Trabzonspor', type: 'team', icon: '🌊' },
];

function normalizeTurkish(str: string): string {
  return (str || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

export const SearchAutocomplete: React.FC = () => {
  const {
    matches,
    searchQuery,
    setSearchQuery,
    selectedWeek,
    setSelectedWeek,
    setSelectedMatchId,
    setActiveView,
    openPlayerModal,
    getPlayerAverageRating,
    getPlayerCommentCount,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'players' | 'teams'>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute matched teams and players
  const { matchedTeams, matchedPlayers } = useMemo(() => {
    const rawQuery = searchQuery.trim();
    if (!rawQuery) {
      return { matchedTeams: [], matchedPlayers: [] };
    }

    const normQuery = normalizeTurkish(rawQuery);
    const lowerQuery = rawQuery.toLocaleLowerCase('tr-TR');

    // 1. Extract Unique Teams from all matches
    const teamsMap = new Map<string, MatchedTeamItem>();
    const playersMap = new Map<string, MatchedPlayerItem>();

    // Scan all matches
    matches.forEach((match) => {
      // Home Team
      if (!teamsMap.has(match.homeTeam.id)) {
        teamsMap.set(match.homeTeam.id, {
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          shortName: match.homeTeam.shortName,
          logo: match.homeTeam.logo,
          primaryColor: match.homeTeam.primaryColor,
          secondaryColor: match.homeTeam.secondaryColor,
          latestMatch: match,
          playerCount: match.homePlayers.length,
        });
      }

      // Away Team
      if (!teamsMap.has(match.awayTeam.id)) {
        teamsMap.set(match.awayTeam.id, {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          shortName: match.awayTeam.shortName,
          logo: match.awayTeam.logo,
          primaryColor: match.awayTeam.primaryColor,
          secondaryColor: match.awayTeam.secondaryColor,
          latestMatch: match,
          playerCount: match.awayPlayers.length,
        });
      }

      // Home Players
      match.homePlayers.forEach((p) => {
        const key = `${p.id}-${match.homeTeam.id}`;
        if (!playersMap.has(key)) {
          const stats = getPlayerAverageRating(p.id, match.id);
          const cCount = getPlayerCommentCount(p.id, match.id);
          playersMap.set(key, {
            player: p,
            match,
            teamName: match.homeTeam.name,
            teamLogo: match.homeTeam.logo,
            teamId: match.homeTeam.id,
            ratingAvg: stats.count > 0 ? stats.rating : 0,
            ratingCount: stats.count || 0,
            commentCount: cCount || 0,
          });
        }
      });

      // Away Players
      match.awayPlayers.forEach((p) => {
        const key = `${p.id}-${match.awayTeam.id}`;
        if (!playersMap.has(key)) {
          const stats = getPlayerAverageRating(p.id, match.id);
          const cCount = getPlayerCommentCount(p.id, match.id);
          playersMap.set(key, {
            player: p,
            match,
            teamName: match.awayTeam.name,
            teamLogo: match.awayTeam.logo,
            teamId: match.awayTeam.id,
            ratingAvg: stats.count > 0 ? stats.rating : 0,
            ratingCount: stats.count || 0,
            commentCount: cCount || 0,
          });
        }
      });
    });

    // Filter Teams
    const teamsResult: MatchedTeamItem[] = [];
    teamsMap.forEach((team) => {
      const nameNorm = normalizeTurkish(team.name);
      const shortNorm = normalizeTurkish(team.shortName);
      const idNorm = normalizeTurkish(team.id);

      if (
        nameNorm.includes(normQuery) ||
        shortNorm.includes(normQuery) ||
        idNorm.includes(normQuery) ||
        team.name.toLocaleLowerCase('tr-TR').includes(lowerQuery)
      ) {
        teamsResult.push(team);
      }
    });

    // Filter Players
    const playersResult: MatchedPlayerItem[] = [];
    playersMap.forEach((item) => {
      const p = item.player;
      const nameNorm = normalizeTurkish(p.name);
      const shortNorm = normalizeTurkish(p.shortName || '');
      const teamNorm = normalizeTurkish(item.teamName);
      const numberStr = String(p.number);
      const posNorm = normalizeTurkish(p.position);
      const posSynonyms = POSITION_SYNONYMS[p.position] || [];

      const matchesSynonym = posSynonyms.some((syn) => normalizeTurkish(syn).includes(normQuery));

      if (
        nameNorm.includes(normQuery) ||
        shortNorm.includes(normQuery) ||
        teamNorm.includes(normQuery) ||
        numberStr === rawQuery.replace('#', '').trim() ||
        posNorm.includes(normQuery) ||
        matchesSynonym ||
        p.name.toLocaleLowerCase('tr-TR').includes(lowerQuery)
      ) {
        playersResult.push(item);
      }
    });

    return {
      matchedTeams: teamsResult,
      matchedPlayers: playersResult,
    };
  }, [matches, searchQuery, getPlayerAverageRating, getPlayerCommentCount]);

  const totalResultsCount = matchedTeams.length + matchedPlayers.length;

  // Flattened array for keyboard navigation
  const visibleItems = useMemo(() => {
    const list: Array<
      | { type: 'team'; item: MatchedTeamItem }
      | { type: 'player'; item: MatchedPlayerItem }
    > = [];

    if (activeFilter === 'all' || activeFilter === 'teams') {
      matchedTeams.forEach((t) => list.push({ type: 'team', item: t }));
    }
    if (activeFilter === 'all' || activeFilter === 'players') {
      matchedPlayers.forEach((p) => list.push({ type: 'player', item: p }));
    }
    return list;
  }, [matchedTeams, matchedPlayers, activeFilter]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < visibleItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : visibleItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < visibleItems.length) {
        const chosen = visibleItems[selectedIndex];
        if (chosen.type === 'team') {
          handleSelectTeam(chosen.item);
        } else {
          handleSelectPlayer(chosen.item);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Selection handlers
  const handleSelectTeam = (team: MatchedTeamItem) => {
    // Find the latest match for this team
    const match = matches.find(
      (m) =>
        (m.homeTeam.id === team.id || m.awayTeam.id === team.id) &&
        (m.week === selectedWeek || m.week === 3 || m.week === 4)
    ) || matches.find((m) => m.homeTeam.id === team.id || m.awayTeam.id === team.id);

    if (match) {
      setSelectedWeek(match.week);
      setSelectedMatchId(match.id);
    }
    setActiveView('pitch');
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleSelectPlayer = (item: MatchedPlayerItem) => {
    const { player, match } = item;
    setSelectedWeek(match.week);
    setSelectedMatchId(match.id);
    setActiveView('pitch');
    openPlayerModal(player, match.id);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleQuickSuggestionClick = (suggestionText: string) => {
    setSearchQuery(suggestionText);
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div ref={containerRef} className="flex-1 max-w-lg mx-2 sm:mx-4 relative">
      {/* Search Input Box */}
      <div className="relative">
        <Search className="w-4 h-4 text-emerald-200 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={inputRef}
          id="desktop-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Oyuncu, takım veya mevki ara (Osimhen, Fred, Rafa Silva, Kaleci)..."
          className="w-full bg-emerald-700/60 hover:bg-emerald-700/80 focus:bg-white focus:text-slate-900 border border-emerald-500/80 focus:border-white rounded-full pl-10 pr-9 py-1.5 text-xs text-white placeholder-emerald-200 focus:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition shadow-inner"
        />

        {searchQuery && (
          <button
            id="clear-search-btn"
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedIndex(-1);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-200 hover:text-white bg-emerald-800/60 hover:bg-emerald-800 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer transition"
            title="Temizle"
          >
            ✕
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div
          id="search-autocomplete-dropdown"
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-emerald-500/40 text-slate-900 overflow-hidden z-50 animate-fadeIn divide-y divide-slate-100 max-h-[78vh] flex flex-col"
        >
          {/* Header Bar inside Dropdown */}
          <div className="p-3 bg-gradient-to-r from-emerald-50 to-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-black text-slate-800">
                {searchQuery.trim()
                  ? `"${searchQuery}" için ${totalResultsCount} sonuç bulundu`
                  : 'Süper Lig Hızlı Arama & Öneriler'}
              </span>
            </div>

            {/* Filter Tabs */}
            {searchQuery.trim() && totalResultsCount > 0 && (
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-2 py-0.5 rounded-md transition ${
                    activeFilter === 'all'
                      ? 'bg-emerald-600 text-white font-black shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Tümü ({totalResultsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('players')}
                  className={`px-2 py-0.5 rounded-md transition flex items-center gap-1 ${
                    activeFilter === 'players'
                      ? 'bg-emerald-600 text-white font-black shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-3 h-3" />
                  <span>Oyuncular ({matchedPlayers.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('teams')}
                  className={`px-2 py-0.5 rounded-md transition flex items-center gap-1 ${
                    activeFilter === 'teams'
                      ? 'bg-emerald-600 text-white font-black shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  <span>Takımlar ({matchedTeams.length})</span>
                </button>
              </div>
            )}
          </div>

          {/* Body Section with Scroll */}
          <div className="overflow-y-auto max-h-[62vh] divide-y divide-slate-100 no-scrollbar">
            
            {/* If user hasn't typed anything yet: Show quick suggestions */}
            {!searchQuery.trim() && (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Popüler Aramalar & Yıldızlar</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SEARCH_SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickSuggestionClick(item.label)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-950 border border-slate-200 hover:border-emerald-300 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 pt-1">
                  💡 İpucu: Oyuncu adı, takım adı, forma numarası veya mevki (ör. "Kaleci", "Stoper", "10 Numara") yazarak anında arayabilirsiniz.
                </p>
              </div>
            )}

            {/* When results are found */}
            {searchQuery.trim() && totalResultsCount > 0 && (
              <>
                {/* 1. MATCHED TEAMS LIST */}
                {(activeFilter === 'all' || activeFilter === 'teams') && matchedTeams.length > 0 && (
                  <div className="p-2 space-y-1">
                    <div className="px-2.5 py-1.5 flex items-center justify-between text-[11px] font-black text-slate-500 uppercase tracking-wider bg-slate-50/80 rounded-lg">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Süper Lig Kulüpleri ({matchedTeams.length})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 lowercase">tıklayarak kadroya git</span>
                    </div>

                    <div className="grid grid-cols-1 gap-1">
                      {matchedTeams.map((team, idx) => {
                        const isFocused =
                          selectedIndex >= 0 &&
                          visibleItems[selectedIndex]?.type === 'team' &&
                          (visibleItems[selectedIndex]?.item as MatchedTeamItem).id === team.id;

                        return (
                          <button
                            key={team.id}
                            id={`search-team-${team.id}`}
                            type="button"
                            onClick={() => handleSelectTeam(team)}
                            className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between gap-3 group cursor-pointer ${
                              isFocused
                                ? 'bg-emerald-50 border-2 border-emerald-500 shadow-xs'
                                : 'hover:bg-emerald-50/70 border border-transparent hover:border-emerald-200'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <TeamLogo
                                team={team}
                                size="lg"
                                shape="circle"
                                className="shrink-0 group-hover:scale-105 transition ring-1 ring-slate-200"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-800 transition truncate">
                                    {team.name}
                                  </h4>
                                  <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-1.5 py-0.2 rounded border border-slate-200">
                                    {team.shortName}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {team.latestMatch
                                    ? `${team.latestMatch.week}. Hafta: ${team.latestMatch.homeTeam.shortName} ${team.latestMatch.homeScore} - ${team.latestMatch.awayScore} ${team.latestMatch.awayTeam.shortName}`
                                    : 'Trendyol Süper Lig Kulübü'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 group-hover:bg-emerald-600 group-hover:text-white transition">
                                <span>Maça Git</span>
                                <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. MATCHED PLAYERS LIST */}
                {(activeFilter === 'all' || activeFilter === 'players') && matchedPlayers.length > 0 && (
                  <div className="p-2 space-y-1">
                    <div className="px-2.5 py-1.5 flex items-center justify-between text-[11px] font-black text-slate-500 uppercase tracking-wider bg-slate-50/80 rounded-lg">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Futbolcular ({matchedPlayers.length})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 lowercase">puanlamak için tıkla</span>
                    </div>

                    <div className="grid grid-cols-1 gap-1">
                      {matchedPlayers.map((item, idx) => {
                        const { player, match, teamName, teamLogo, ratingAvg, ratingCount, commentCount } = item;
                        const isFocused =
                          selectedIndex >= 0 &&
                          visibleItems[selectedIndex]?.type === 'player' &&
                          (visibleItems[selectedIndex]?.item as MatchedPlayerItem).player.id === player.id;

                        return (
                          <button
                            key={`${player.id}-${match.id}`}
                            id={`search-player-${player.id}`}
                            type="button"
                            onClick={() => handleSelectPlayer(item)}
                            className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between gap-3 group cursor-pointer ${
                              isFocused
                                ? 'bg-emerald-50 border-2 border-emerald-500 shadow-xs'
                                : 'hover:bg-emerald-50/70 border border-transparent hover:border-emerald-200'
                            }`}
                          >
                            {/* Left: Team Badge & Info (No Player Photo) */}
                            <div className="flex items-center gap-3 min-w-0">
                              <TeamLogo
                                teamId={item.teamId}
                                teamName={teamName}
                                size="lg"
                                shape="circle"
                                className="shrink-0 group-hover:scale-105 transition ring-1 ring-slate-200"
                              />

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-800 transition truncate">
                                    {player.name}
                                  </h4>
                                  <span className="bg-slate-900 text-amber-400 text-[10px] font-black px-1.5 py-0.2 rounded font-mono">
                                    #{player.number}
                                  </span>
                                  <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-1.5 py-0.2 rounded">
                                    {player.position}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 truncate">
                                  <span className="font-semibold text-slate-700">{teamName}</span>
                                  <span>•</span>
                                  <span>{match.week}. Hafta Karşılaşması</span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Rating & Review stats */}
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-right hidden sm:block">
                                <div className={`inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-lg shadow-2xs border ${
                                  ratingCount > 0
                                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                                    : 'bg-slate-50 text-slate-500 border-slate-200'
                                }`}>
                                  <Star className={`w-3 h-3 ${ratingCount > 0 ? 'fill-amber-400 text-amber-500' : 'fill-slate-300 text-slate-400'}`} />
                                  <span>{ratingCount > 0 ? ratingAvg.toFixed(1) : '—'}</span>
                                </div>
                                {commentCount > 0 && (
                                  <div className="text-[10px] text-slate-500 font-medium flex items-center justify-end gap-1 mt-0.5">
                                    <MessageSquare className="w-2.5 h-2.5 text-slate-400" />
                                    <span>{commentCount} yorum</span>
                                  </div>
                                )}
                              </div>

                              <div className="w-8 h-8 rounded-lg bg-emerald-100/80 group-hover:bg-emerald-600 text-emerald-800 group-hover:text-white flex items-center justify-center transition shadow-2xs">
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Empty State: No results found */}
            {searchQuery.trim() && totalResultsCount === 0 && (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center font-bold text-xl border border-amber-200">
                  🔍
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900">
                    "{searchQuery}" ile eşleşen oyuncu veya takım bulunamadı
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Farklı bir futbolcu adı, takım (GS, FB, BJK, TS) veya mevki (Kaleci, Stoper, Forvet) aramayı deneyebilirsiniz.
                  </p>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-400 block mb-2">Önerilen Aramalar:</span>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {POPULAR_SEARCH_SUGGESTIONS.slice(0, 5).map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleQuickSuggestionClick(item.label)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 text-xs font-semibold transition"
                      >
                        {item.icon} {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer Bar */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
            <div className="flex items-center gap-2">
              <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">↑↓</span>
              <span>Gezin</span>
              <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">Enter</span>
              <span>Seç</span>
              <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">Esc</span>
              <span>Kapat</span>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 px-2 py-0.5 rounded hover:bg-emerald-100/60 transition cursor-pointer"
            >
              Kapat
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
