import React from 'react';
import { useApp } from '../context/AppContext';
import { Player, Team } from '../types';
import { Star, Crown, Trophy, Sparkles, ArrowLeft, Award } from 'lucide-react';
import { FootballJersey } from './FootballJersey';

export const TotwView: React.FC = () => {
  const {
    selectedLeagueId,
    selectedWeek,
    leagues,
    matches,
    getTotw,
    openPlayerModal,
    getPlayerAverageRating,
    setActiveView,
  } = useApp();

  const currentLeague = leagues.find((l) => l.id === selectedLeagueId) || leagues[0];
  const { xi, mvp } = getTotw(selectedLeagueId, selectedWeek);

  // Group by category
  const gks = xi.filter((p) => p.category === 'GK');
  const defs = xi.filter((p) => p.category === 'DEF');
  const mids = xi.filter((p) => p.category === 'MID');
  const fwds = xi.filter((p) => p.category === 'FWD');

  // Helper to find player's team for proper jersey rendering
  const getPlayerTeam = (player: Player): Team => {
    for (const match of matches) {
      if (match.homePlayers.some((p) => p.id === player.id)) {
        return match.homeTeam;
      }
      if (match.awayPlayers.some((p) => p.id === player.id)) {
        return match.awayTeam;
      }
    }
    // Fallback based on teamId
    const fallbackTeams: Record<string, Team> = {
      gs: { id: 'gs', name: 'Galatasaray', shortName: 'GS', logo: '🦁', primaryColor: '#A90432', secondaryColor: '#FDB913', formation: '4-2-3-1' },
      fb: { id: 'fb', name: 'Fenerbahçe', shortName: 'FB', logo: '🟡', primaryColor: '#002D72', secondaryColor: '#FFED00', formation: '4-2-3-1' },
      bjk: { id: 'bjk', name: 'Beşiktaş', shortName: 'BJK', logo: '🦅', primaryColor: '#000000', secondaryColor: '#FFFFFF', formation: '4-2-3-1' },
      ts: { id: 'ts', name: 'Trabzonspor', shortName: 'TS', logo: '🌊', primaryColor: '#800000', secondaryColor: '#6CA0DC', formation: '4-3-3' },
      ibfk: { id: 'ibfk', name: 'Başakşehir FK', shortName: 'İBFK', logo: '🦉', primaryColor: '#002B49', secondaryColor: '#FF671F', formation: '4-3-3' },
      samsun: { id: 'samsun', name: 'Samsunspor', shortName: 'SAM', logo: '🔴', primaryColor: '#E30613', secondaryColor: '#FFFFFF', formation: '4-2-3-1' },
      eyup: { id: 'eyup', name: 'ikas Eyüpspor', shortName: 'EYP', logo: '🟣', primaryColor: '#5C2D91', secondaryColor: '#FFD700', formation: '4-1-4-1' },
    };
    return fallbackTeams[player.teamId] || {
      id: player.teamId || 'team',
      name: 'Süper Lig',
      shortName: 'SL',
      logo: '⚽',
      primaryColor: '#059669',
      secondaryColor: '#f59e0b',
      formation: '4-4-2',
    };
  };

  const getPlayerWeekMatch = (player: Player) => {
    return matches.find(
      (m) =>
        m.week === selectedWeek &&
        m.leagueId === selectedLeagueId &&
        (m.homePlayers.some((p) => p.id === player.id) || m.awayPlayers.some((p) => p.id === player.id))
    );
  };

  const renderPitchPlayer = (player: Player) => {
    const match = getPlayerWeekMatch(player);
    const { rating, count } = getPlayerAverageRating(player.id, match?.id);
    const team = getPlayerTeam(player);

    return (
      <div
        key={player.id}
        onClick={() => openPlayerModal(player, match?.id)}
        className="flex flex-col items-center cursor-pointer group transition transform hover:scale-110"
      >
        <div className="relative">
          <FootballJersey
            number={player.number}
            team={team}
            isGoalkeeper={player.category === 'GK'}
            size="md"
            className="group-hover:scale-105 transition filter drop-shadow-lg"
          />
          {count > 0 ? (
            <div className="absolute -bottom-1 -right-1.5 bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full border border-white flex items-center gap-0.5 shadow-md">
              <Star className="w-2.5 h-2.5 fill-current" />
              <span>{rating.toFixed(1)}</span>
            </div>
          ) : (
            <div className="absolute -bottom-1 -right-1.5 bg-slate-800/80 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-slate-700 flex items-center shadow-sm">
              <span>—</span>
            </div>
          )}
        </div>
        <span className="mt-1 px-2 py-0.5 bg-white/95 text-slate-900 rounded-lg text-[11px] font-black shadow-sm group-hover:bg-amber-100 transition truncate max-w-[105px]">
          {player.shortName}
        </span>
        <span className="text-[9px] font-black text-amber-200 uppercase drop-shadow">
          {player.position}
        </span>
      </div>
    );
  };

  // Sort the xi list for display in the right sidebar by rating desc
  const sortedXiForList = [...xi].sort((a, b) => {
    const matchA = getPlayerWeekMatch(a);
    const matchB = getPlayerWeekMatch(b);
    const ratingA = getPlayerAverageRating(a.id, matchA?.id);
    const ratingB = getPlayerAverageRating(b.id, matchB?.id);
    if (ratingB.rating !== ratingA.rating) return ratingB.rating - ratingA.rating;
    return ratingB.count - ratingA.count;
  });

  const mvpMatch = mvp ? getPlayerWeekMatch(mvp) : undefined;
  const mvpRatingData = mvp ? getPlayerAverageRating(mvp.id, mvpMatch?.id) : { rating: 0, count: 0 };

  return (
    <div className="w-full max-w-[1760px] mx-auto px-3 sm:px-5 lg:px-7 my-4 space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-2 ring-white">
              <Trophy className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-black tracking-widest text-amber-200">
                  TOPLULUK OYLARIYLA
                </span>
                <span className="text-xs bg-emerald-800/60 text-white px-2 py-0.5 rounded-full border border-emerald-400/40 font-bold">
                  {selectedWeek}. Hafta
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Haftanın Altın 11'i (Team of the Week)
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('ranking')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition shadow-sm"
            >
              <Crown className="w-4 h-4" />
              <span>Haftanın Sıralaması</span>
            </button>
            <button
              onClick={() => setActiveView('pitch')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-emerald-800 hover:bg-emerald-50 transition shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Maç Görünümüne Dön</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Spread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Golden Pitch Visualization (lg:col-span-7 xl:col-span-8) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white border-2 border-emerald-100 rounded-3xl p-4 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-50 text-xs">
            <h3 className="font-black text-slate-800 uppercase tracking-wider">
              Altın 11 Sahası
            </h3>
            <span className="text-slate-500 font-bold text-[11px]">
              Oyuncuya tıklayarak detay ve yorumları görüntüleyebilirsiniz
            </span>
          </div>

          {/* Pitch container */}
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] min-h-[480px] rounded-3xl overflow-hidden border-4 border-white shadow-inner bg-gradient-to-b from-emerald-600 via-emerald-500 to-emerald-700 p-4 flex flex-col justify-between select-none">
            
            {/* Turf lines background */}
            <div className="absolute inset-0 grid grid-rows-5 pointer-events-none opacity-20">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={i % 2 === 0 ? 'bg-black/20' : 'bg-transparent'} />
              ))}
            </div>

            {/* Pitch Lines SVG */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none stroke-white/40 fill-none"
              viewBox="0 0 800 600"
              preserveAspectRatio="none"
              strokeWidth="2"
            >
              <rect x="20" y="20" width="760" height="560" rx="4" />
              <line x1="20" y1="300" x2="780" y2="300" />
              <circle cx="400" cy="300" r="70" />
              <rect x="220" y="20" width="360" height="120" />
              <rect x="220" y="460" width="360" height="120" />
            </svg>

            {/* Forwards (Top) */}
            <div className="flex justify-around items-center z-10 pt-2">
              {fwds.map(renderPitchPlayer)}
            </div>

            {/* Midfielders (Center) */}
            <div className="flex justify-around items-center z-10 py-2">
              {mids.map(renderPitchPlayer)}
            </div>

            {/* Defenders */}
            <div className="flex justify-around items-center z-10 py-2">
              {defs.map(renderPitchPlayer)}
            </div>

            {/* Goalkeeper (Bottom) */}
            <div className="flex justify-center items-center z-10 pb-2">
              {gks.map(renderPitchPlayer)}
            </div>

          </div>
        </div>

        {/* Right Column: MVP Card + 11 Player Roster List (lg:col-span-5 xl:col-span-4) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* MVP Showcase Card */}
          {mvp && (
            <div className="bg-white border-2 border-amber-300 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-lg border border-amber-300 flex items-center gap-1">
                  <span>👑 Haftanın En Yüksek Puanlı Oyuncusu</span>
                </span>
                <button
                  onClick={() => openPlayerModal(mvp, mvpMatch?.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-orange-500 hover:bg-orange-600 text-white shadow-sm transition flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Puanla / İncele</span>
                </button>
              </div>

              <div className="flex items-center gap-3.5 pt-1">
                <FootballJersey
                  number={mvp.number}
                  team={getPlayerTeam(mvp)}
                  isGoalkeeper={mvp.category === 'GK'}
                  size="lg"
                  className="shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-black text-slate-900 truncate">
                      {mvp.name}
                    </h2>
                    {mvpRatingData.count > 0 ? (
                      <div className="bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-xl font-mono font-black text-xs flex items-center gap-1 shadow-sm shrink-0 border border-amber-300">
                        <Star className="w-3 h-3 fill-slate-950" />
                        <span>{mvpRatingData.rating.toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-lg">
                        Not Bekliyor
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-bold">{mvp.position} • {getPlayerTeam(mvp).name}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-1">
                    <span>Gol: <strong className="text-emerald-700">{mvp.stats.goals}</strong></span>
                    <span>•</span>
                    <span>Asist: <strong className="text-emerald-700">{mvp.stats.assists}</strong></span>
                    <span>•</span>
                    <span>Pas: <strong className="text-slate-800">%{mvp.stats.passAccuracy}</strong></span>
                  </div>
                  {mvpRatingData.count > 0 && (
                    <p className="text-[10px] font-bold text-amber-800 mt-1">
                      {mvpRatingData.count} taraftar oyu ile haftanın zirvesinde
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* List of 11 Players with ratings */}
          <div className="bg-white border-2 border-emerald-100 rounded-3xl p-4 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-50">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Haftanın En Yüksek Puanlı 11'i
              </h4>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Puan Sıralı
              </span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {sortedXiForList.map((player, index) => {
                const match = getPlayerWeekMatch(player);
                const { rating, count } = getPlayerAverageRating(player.id, match?.id);
                const team = getPlayerTeam(player);
                return (
                  <div
                    key={player.id}
                    onClick={() => openPlayerModal(player, match?.id)}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-black text-[10px] shrink-0 ${
                        index === 0 ? 'bg-amber-400 text-slate-950' : index < 3 ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {index + 1}
                      </span>
                      <FootballJersey
                        number={player.number}
                        team={team}
                        isGoalkeeper={player.category === 'GK'}
                        size="xs"
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 truncate">{player.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold">{player.position} • {team.shortName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {count > 0 ? (
                        <div className="flex items-center gap-1 bg-white border border-amber-200 px-2 py-1 rounded-xl shadow-xs font-mono font-black text-xs text-slate-900">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                          <span>{rating.toFixed(1)}</span>
                          <span className="text-[9px] text-slate-400 font-normal">({count})</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold px-2 py-1 bg-white rounded-lg border border-slate-200">
                          —
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
