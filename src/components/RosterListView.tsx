import React from 'react';
import { useApp } from '../context/AppContext';
import { Player, PositionCategory } from '../types';
import { Star, MessageSquare, Award, ArrowUpRight, Shield, Briefcase, ChevronRight } from 'lucide-react';
import { FootballJersey } from './FootballJersey';
import { TeamLogo } from './TeamLogo';

export const RosterListView: React.FC = () => {
  const {
    selectedMatch,
    teamTab,
    positionFilter,
    searchQuery,
    openPlayerModal,
    openManagerModal,
    getPlayerAverageRating,
    getPlayerCommentCount,
    getManagerAverageRating,
    getManagerCommentCount,
    canWriteMatchReview,
    canRateTeam,
  } = useApp();

  if (!selectedMatch) return null;

  const canWrite = canWriteMatchReview(selectedMatch);

  const allMatchPlayers = [...selectedMatch.homePlayers, ...selectedMatch.awayPlayers];

  const filteredPlayers = allMatchPlayers.filter((p) => {
    if (teamTab === 'home' && p.teamId !== selectedMatch.homeTeam.id) return false;
    if (teamTab === 'away' && p.teamId !== selectedMatch.awayTeam.id) return false;
    if (positionFilter !== 'ALL' && p.category !== positionFilter) return false;
    return true;
  });

  const categories: { category: PositionCategory; title: string; emoji: string }[] = [
    { category: 'GK', title: 'Kaleciler', emoji: '🧤' },
    { category: 'DEF', title: 'Savunma Oyuncuları', emoji: '🛡️' },
    { category: 'MID', title: 'Orta Saha', emoji: '⚙️' },
    { category: 'FWD', title: 'Hücum & Forvetler', emoji: '⚡' },
  ];

  const managers = [
    ...(teamTab === 'all' || teamTab === 'home' ? (selectedMatch.homeTeam.manager ? [{ mgr: selectedMatch.homeTeam.manager, team: selectedMatch.homeTeam }] : []) : []),
    ...(teamTab === 'all' || teamTab === 'away' ? (selectedMatch.awayTeam.manager ? [{ mgr: selectedMatch.awayTeam.manager, team: selectedMatch.awayTeam }] : []) : []),
  ];

  return (
    <div className="w-full space-y-4">
      {/* Technical Directors Section */}
      {managers.length > 0 && positionFilter === 'ALL' && (
        <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-base">👔</span>
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                Teknik Direktörler (Kulübe Liderleri)
              </h3>
              <span className="text-xs text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                {managers.length} Teknik Adam
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {managers.map(({ mgr, team }) => {
              const { rating, count } = getManagerAverageRating(mgr.id, selectedMatch.id);
              const commentsCount = getManagerCommentCount(mgr.id, selectedMatch.id);

              return (
                <div
                  key={mgr.id}
                  id={`roster-manager-${mgr.id}`}
                  onClick={() => openManagerModal(mgr, selectedMatch.id)}
                  className="bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-amber-400 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition group cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <TeamLogo
                      team={team}
                      size="xl"
                      shape="rounded"
                      className="shrink-0 ring-1 ring-slate-600 shadow-xs"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-black text-white text-sm group-hover:text-amber-400 transition truncate">
                          {mgr.name}
                        </h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 uppercase shrink-0">
                          {team.shortName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {mgr.formation || team.formation}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-lg text-amber-400 font-bold text-xs justify-end">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{count > 0 ? rating.toFixed(1) : '—'}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {count} oy ({commentsCount} yorum)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {categories.map(({ category, title, emoji }) => {
        const playersInCategory = filteredPlayers.filter((p) => p.category === category);
        if (playersInCategory.length === 0) return null;

        return (
          <div
            key={category}
            className="bg-white border-2 border-emerald-100 rounded-3xl p-4 sm:p-5 shadow-sm"
          >
            {/* Category Title */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-50">
              <div className="flex items-center gap-2">
                <span className="text-base">{emoji}</span>
                <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                  {title}
                </h3>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {playersInCategory.length} Oyuncu
                </span>
              </div>
            </div>

            {/* Grid of Players */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {playersInCategory.map((player) => {
                const isHome = player.teamId === selectedMatch.homeTeam.id;
                const team = isHome ? selectedMatch.homeTeam : selectedMatch.awayTeam;
                const { rating, count } = getPlayerAverageRating(player.id, selectedMatch.id);
                const commentsCount = getPlayerCommentCount(player.id, selectedMatch.id);

                return (
                  <div
                    key={player.id}
                    id={`roster-card-${player.id}`}
                    onClick={() => openPlayerModal(player, selectedMatch.id)}
                    className="bg-slate-50/70 hover:bg-emerald-50/70 border-2 border-slate-100 hover:border-emerald-300 rounded-2xl p-3.5 flex flex-col justify-between transition group cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div>
                      {/* Top: Team badge, Number, Name, Position */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <FootballJersey
                            number={player.number}
                            team={team}
                            isGoalkeeper={player.category === 'GK'}
                            size="sm"
                            className="shrink-0 group-hover:scale-105 transition"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-700 transition truncate max-w-[140px]">
                                {player.name}
                              </h4>
                              {player.stats.goals > 0 && (
                                <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full border border-emerald-300">
                                  ⚽ {player.stats.goals}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                              <span className="text-slate-700">{team.shortName}</span>
                              <span>•</span>
                              <span className="font-bold text-emerald-800 bg-emerald-50 px-1 rounded">{player.position}</span>
                              <span>•</span>
                              <span>{player.stats.minutesPlayed}' dk</span>
                            </p>
                          </div>
                        </div>

                        {/* Rating Pill */}
                        <div className="text-right">
                          <div className="flex items-center gap-1 bg-white border border-emerald-200 px-2 py-0.5 rounded-xl shadow-sm">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-mono font-black text-xs text-slate-900">
                              {count > 0 ? rating.toFixed(1) : '—'}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-500 font-bold block mt-0.5">
                            {count > 0 ? `${count} oy` : 'Puan Yok'}
                          </span>
                        </div>
                      </div>

                      {/* Stats snippet */}
                      <div className="grid grid-cols-4 gap-1.5 bg-white p-2 rounded-xl text-center text-[10px] text-slate-600 border border-slate-100 my-2">
                        <div>
                          <span className="block text-slate-400 font-bold text-[9px] uppercase">Pas %</span>
                          <span className="font-black text-slate-800 font-mono">%{player.stats.passAccuracy}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 font-bold text-[9px] uppercase">İkili Müc.</span>
                          <span className="font-black text-slate-800 font-mono">{player.stats.tackles}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 font-bold text-[9px] uppercase">Şut/Kurtarış</span>
                          <span className="font-black text-slate-800 font-mono">
                            {player.category === 'GK' ? (player.stats.saves || 0) : player.stats.shots}
                          </span>
                        </div>
                        <div>
                          <span className="block text-slate-400 font-bold text-[9px] uppercase">Asist</span>
                          <span className="font-black text-slate-800 font-mono">{player.stats.assists}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom action */}
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                        <MessageSquare className="w-3 h-3" />
                        {commentsCount} Yorum
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-black text-emerald-600 group-hover:text-emerald-700 transition">
                        <span>{canWrite ? (canRateTeam(player.teamId) ? 'Puanla & Yorumla' : 'Yorumla') : 'İncele'}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
