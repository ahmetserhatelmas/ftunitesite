import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutGrid, ListFilter, Users, Shield, Award, Flame, MessageSquare, Lock } from 'lucide-react';
import { TeamLogo } from './TeamLogo';

export const MatchHero: React.FC = () => {
  const {
    selectedMatch,
    activeView,
    setActiveView,
    teamTab,
    setTeamTab,
    positionFilter,
    setPositionFilter,
    reviews,
    isPastWeek,
  } = useApp();

  if (!selectedMatch) return null;

  const totalReviews = reviews.filter((r) => r.matchId === selectedMatch.id).length;
  const isMatchInPastWeek = isPastWeek(selectedMatch.week);
  const isLive = selectedMatch.status === 'LIVE';
  const liveMin = selectedMatch.minute ?? 78;
  const liveSec = typeof selectedMatch.liveSeconds === 'number' ? selectedMatch.liveSeconds : 0;
  const formattedLiveTime = `${liveMin}:${String(liveSec).padStart(2, '0')}`;

  return (
    <div className="w-full space-y-3">
      {/* Big Score Card */}
      <div className={`bg-white rounded-3xl p-4 sm:p-6 shadow-md relative overflow-hidden transition-all ${
        isLive ? 'border-2 border-rose-400 ring-2 ring-rose-300/40 shadow-rose-900/10' : 'border-2 border-emerald-100'
      }`}>
        {/* Top-Right LIVE Ribbon / Tag - ONLY for this live match panel */}
        {isLive && (
          <div className="absolute top-0 right-0 z-10">
            <div className="bg-gradient-to-l from-rose-600 via-rose-600 to-red-600 text-white text-xs font-black px-4 py-1.5 rounded-bl-2xl shadow-lg flex items-center gap-2 border-b border-l border-rose-300 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span className="font-mono tracking-wider">CANLI MAÇ • {formattedLiveTime}</span>
            </div>
          </div>
        )}

        {/* Subtle decorative background bubbles */}
        <div
          className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ backgroundColor: selectedMatch.homeTeam?.primaryColor || '#059669' }}
        />
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ backgroundColor: selectedMatch.awayTeam?.primaryColor || '#059669' }}
        />

        {/* Top bar with league & referee */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-50 pb-3 mb-4 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">{selectedMatch.leagueName}</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {selectedMatch.week}. Hafta Karşılaşması
            </span>
            {isLive && (
              <span className="text-rose-700 font-black bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1.5 text-[11px] animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                <span>Karşılaşma Devam Ediyor</span>
              </span>
            )}
            {isMatchInPastWeek && (
              <span className="text-amber-800 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 text-[11px]">
                <Lock className="w-3 h-3 text-amber-600" />
                <span>Geçmiş Hafta (Kilitli)</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500 font-semibold pr-24 sm:pr-28">
            <span>🏟️ {selectedMatch.stadium}</span>
            <span>👔 Hakem: {selectedMatch.referee}</span>
          </div>
        </div>

        {/* Main Matchup Arena */}
        <div className="grid grid-cols-12 items-center gap-4 py-2">
          {/* Home Team */}
          <div className="col-span-5 flex items-center justify-end gap-3 sm:gap-4 text-right">
            <div>
              <h1 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight">
                {selectedMatch.homeTeam.name}
              </h1>
            </div>
            <TeamLogo
              team={selectedMatch.homeTeam}
              size="2xl"
              shape="circle"
              className="ring-4 ring-slate-100 shadow-md shrink-0 sm:w-16 sm:h-16 sm:text-3xl"
            />
          </div>

          {/* Scoreboard in center */}
          <div className="col-span-2 flex flex-col items-center justify-center text-center">
            <div className={`px-4 py-2 rounded-2xl shadow-lg font-mono border ${
              isLive
                ? 'bg-rose-950 border-rose-500 ring-2 ring-rose-400/40 animate-pulse'
                : 'bg-slate-900 border-slate-700'
            }`}>
              <span className="text-2xl sm:text-4xl font-black text-white tracking-wider">
                {selectedMatch.homeScore} - {selectedMatch.awayScore}
              </span>
            </div>
            <span className={`text-[10px] uppercase font-black tracking-wider mt-1.5 px-2.5 py-0.5 rounded-full border ${
              isLive
                ? 'bg-rose-500 text-white border-rose-400 animate-pulse font-mono shadow-xs'
                : selectedMatch.status === 'FT'
                ? 'text-emerald-800 bg-emerald-100 border-emerald-200'
                : 'text-amber-800 bg-amber-100 border-amber-200'
            }`}>
              {isLive ? `CANLI • ${formattedLiveTime}` : selectedMatch.status === 'FT' ? 'Bitti' : 'Başlamadı'}
            </span>
          </div>

          {/* Away Team */}
          <div className="col-span-5 flex items-center justify-start gap-3 sm:gap-4 text-left">
            <TeamLogo
              team={selectedMatch.awayTeam}
              size="2xl"
              shape="circle"
              className="ring-4 ring-slate-100 shadow-md shrink-0 sm:w-16 sm:h-16 sm:text-3xl"
            />
            <div>
              <h1 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight">
                {selectedMatch.awayTeam.name}
              </h1>
            </div>
          </div>
        </div>

        {/* Match Events timeline bar */}
        {selectedMatch.events && selectedMatch.events.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-400 font-bold text-[11px] uppercase mr-1">Önemli Anlar:</span>
            {selectedMatch.events.map((event, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-slate-700 text-[11px] shadow-sm"
              >
                <span className="font-mono font-black text-emerald-600">{event.minute}'</span>
                <span>
                  {event.type === 'goal' && '⚽'}
                  {event.type === 'yellow-card' && '🟨'}
                  {event.type === 'red-card' && '🟥'}
                  {event.type === 'penalty' && '🎯'}
                </span>
                <span className="font-bold text-slate-900">{event.playerName}</span>
                {event.detail && (
                  <span className="text-slate-500 text-[10px]">({event.detail})</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Mode Bar & Team / Position Filters */}
      <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white border-2 border-emerald-100 p-2.5 rounded-2xl text-xs shadow-sm">
        
        {/* Left: View Switcher (Pitch / Tactical vs Roster List) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            id="view-mode-pitch-btn"
            onClick={() => setActiveView('pitch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black transition ${
              activeView === 'pitch'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Saha Taktik Dizilişi</span>
          </button>
          
          <button
            id="view-mode-list-btn"
            onClick={() => setActiveView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black transition ${
              activeView === 'list'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Kadro & Oyuncu Notları</span>
          </button>
        </div>

        {/* Center: Team Tab Filter */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            id="team-filter-home"
            onClick={() => setTeamTab('home')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black transition cursor-pointer ${
              teamTab === 'home'
                ? 'bg-white text-emerald-950 shadow-sm border border-emerald-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TeamLogo team={selectedMatch.homeTeam} size="xs" shape="circle" showShadow={false} />
            <span>{selectedMatch.homeTeam.shortName} (Ev)</span>
          </button>
          <button
            id="team-filter-away"
            onClick={() => setTeamTab('away')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black transition cursor-pointer ${
              teamTab === 'away'
                ? 'bg-white text-emerald-950 shadow-sm border border-emerald-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TeamLogo team={selectedMatch.awayTeam} size="xs" shape="circle" showShadow={false} />
            <span>{selectedMatch.awayTeam.shortName} (Dep)</span>
          </button>
          <button
            id="team-filter-all"
            onClick={() => setTeamTab('all')}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              teamTab === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Tümü
          </button>
        </div>

        {/* Right: Position Filter */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {['ALL', 'GK', 'DEF', 'MID', 'FWD'].map((pos) => {
            const labels: Record<string, string> = {
              ALL: 'Tümü',
              GK: 'Kaleci',
              DEF: 'Savunma',
              MID: 'Orta Saha',
              FWD: 'Hücum',
            };
            const isSelected = positionFilter === pos;
            return (
              <button
                key={pos}
                id={`pos-filter-${pos}`}
                onClick={() => setPositionFilter(pos)}
                className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {labels[pos]}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
