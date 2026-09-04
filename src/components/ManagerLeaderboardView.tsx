import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Briefcase,
  Star,
  MessageSquare,
  Crown,
  Award,
  ChevronRight,
  Search,
  Filter,
  Shield,
  Layers,
  Globe,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Manager } from '../types';
import { TeamLogo } from './TeamLogo';

export const ManagerLeaderboardView: React.FC = () => {
  const {
    getAllManagersRanking,
    selectedWeek,
    setSelectedWeek,
    openManagerModal,
    setSelectedMatchId,
    setActiveView,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<number>(selectedWeek);

  const managerRankings = getAllManagersRanking(selectedWeekFilter);

  const filteredRankings = managerRankings.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      item.manager.name.toLowerCase().includes(query) ||
      item.team.name.toLowerCase().includes(query) ||
      item.manager.shortName.toLowerCase().includes(query) ||
      (item.manager.nationality && item.manager.nationality.toLowerCase().includes(query)) ||
      (item.manager.formation && item.manager.formation.toLowerCase().includes(query))
    );
  });

  const top3 = filteredRankings.slice(0, 3);
  const remaining = filteredRankings.slice(3);

  const handleManagerClick = (mgr: Manager, matchId?: string) => {
    if (matchId) {
      setSelectedMatchId(matchId);
    }
    openManagerModal(mgr, matchId);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-8 animate-fade-in" id="manager-leaderboard-view">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 border border-emerald-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              Süper Lig Taktik Liderleri
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Teknik Direktör Sıralaması
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              Trendyol Süper Lig teknik direktörlerinin tribün ve taraftar puanlama ortalamaları, taktiksel analizleri ve maç başı performans tablosu.
            </p>
          </div>

          {/* Week Selector Chips */}
          <div className="flex items-center gap-2 bg-slate-950/70 p-1.5 rounded-2xl border border-slate-800 shrink-0">
            <span className="text-xs font-bold text-slate-400 px-2 flex items-center gap-1">
              Hafta:
            </span>
            {[1, 2, 3, 4].map((wk) => (
              <button
                key={wk}
                onClick={() => {
                  setSelectedWeekFilter(wk);
                  setSelectedWeek(wk);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedWeekFilter === wk
                    ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {wk}. Hafta
              </button>
            ))}
          </div>
        </div>

        {/* Search Input Filter */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Teknik direktör veya kulüp ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 self-end sm:self-auto">
            <span>Toplam <strong className="text-white">{filteredRankings.length}</strong> Teknik Direktör</span>
          </div>
        </div>
      </div>

      {/* Top 3 Podium (If available) */}
      {top3.length > 0 && !searchQuery && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Haftanın Zirvesindeki Teknik Direktörler</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {top3.map((item, index) => {
              const rank = index + 1;
              const isFirst = rank === 1;
              const displayRating = item.count > 0 ? item.rating.toFixed(1) : '—';

              return (
                <div
                  key={item.manager.id}
                  onClick={() => handleManagerClick(item.manager, item.match?.id)}
                  className={`rounded-3xl p-5 sm:p-6 transition-all duration-300 cursor-pointer relative group flex flex-col justify-between border ${
                    isFirst
                      ? 'bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 border-amber-400/50 shadow-xl shadow-amber-500/10 hover:border-amber-400'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-lg'
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-xl font-black flex items-center justify-center text-xs shadow-sm ${
                          rank === 1
                            ? 'bg-amber-400 text-slate-950'
                            : rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : 'bg-amber-700 text-white'
                        }`}
                      >
                        #{rank}
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {item.team.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-xl text-amber-400 font-black text-sm">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{displayRating}</span>
                    </div>
                  </div>

                  {/* Center Manager Info */}
                  <div className="my-5 flex items-center gap-4">
                    <TeamLogo
                      team={item.team}
                      size="3xl"
                      shape="rounded"
                      className="shrink-0 ring-2 ring-slate-700 shadow-md group-hover:scale-105 transition"
                    />

                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition truncate">
                        {item.manager.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-500" />
                          {item.manager.nationality || item.team.shortName}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium truncate">
                          {item.manager.formation || item.team.formation}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Match info and Action button */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                      <span>{item.count} oy / {item.commentsCount} yorum</span>
                    </div>

                    <button
                      type="button"
                      className="text-xs font-bold text-amber-400 group-hover:translate-x-1 transition flex items-center gap-1"
                    >
                      <span>Puanla & İncele</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Leaderboard Table / Cards */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-amber-400" />
            <h2 className="font-black text-white text-base">Tüm Teknik Direktörler Listesi</h2>
          </div>
          <span className="text-xs text-slate-400">
            Puanlamak veya yorumları görmek için teknik direktöre tıklayın
          </span>
        </div>

        <div className="divide-y divide-slate-800">
          {filteredRankings.map((item, index) => {
            const rank = index + 1;
            const displayRating = item.count > 0 ? item.rating.toFixed(1) : '—';

            return (
              <div
                key={item.manager.id}
                onClick={() => handleManagerClick(item.manager, item.match?.id)}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-850 transition cursor-pointer group"
              >
                {/* Left: Rank, Avatar, Name & Club */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                      rank === 1
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    #{rank}
                  </div>

                  <TeamLogo
                    team={item.team}
                    size="lg"
                    shape="rounded"
                    className="shrink-0 ring-1 ring-slate-700 shadow-sm"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-white text-sm sm:text-base group-hover:text-amber-400 transition truncate">
                        {item.manager.name}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.2 rounded-md border border-slate-700/60 hidden sm:inline-block">
                        {item.team.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                      {item.manager.nationality && (
                        <span className="text-slate-400 text-[11px]">{item.manager.nationality}</span>
                      )}
                      <span className="hidden sm:inline">•</span>
                      <span className="text-slate-400 text-[11px] truncate max-w-xs">
                        {item.manager.formation || 'Taktik Lider'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Rating & Review CTA */}
                <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-base sm:text-lg font-black text-amber-400 font-mono">
                        {displayRating}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">/ 10</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 justify-end mt-0.5">
                      <MessageSquare className="w-3 h-3 text-slate-500" />
                      <span>{item.count} oy ({item.commentsCount} yorum)</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 group-hover:bg-amber-400 group-hover:text-slate-950 text-slate-200 text-xs font-bold transition flex items-center gap-1 border border-slate-700 group-hover:border-amber-400 cursor-pointer shrink-0"
                  >
                    <span>Puanla</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
