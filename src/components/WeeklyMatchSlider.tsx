import React from 'react';
import { useApp } from '../context/AppContext';
import { Match } from '../types';
import { MessageSquare, MapPin, Award } from 'lucide-react';
import { TeamLogo } from './TeamLogo';
import { StadiumBackdrop } from './StadiumBackdrop';
import { formatMatchKickoff, hasPredictedLineup, hasPublishedLineup, inferredLiveMinute, isMatchLive } from '../lib/matchTime';

const TR_MONTHS: Record<string, number> = {
  ocak: 0,
  şubat: 1,
  subat: 1,
  mart: 2,
  nisan: 3,
  mayıs: 4,
  mayis: 4,
  haziran: 5,
  temmuz: 6,
  ağustos: 7,
  agustos: 7,
  eylül: 8,
  eylul: 8,
  ekim: 9,
  kasım: 10,
  kasim: 10,
  aralık: 11,
  aralik: 11,
};

function istanbulYmd(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
}

function parseKickoff(match: Match): Date | null {
  if (match.kickoffAt) {
    const parsed = new Date(match.kickoffAt);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const raw = (match.date || '').replace(/[•·]/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = raw.match(/(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)\s+(\d{4})/);
  if (!parts) return null;
  const month = TR_MONTHS[parts[2].toLocaleLowerCase('tr-TR')];
  if (month == null) return null;
  const time = raw.match(/(\d{1,2})[:.](\d{2})/);
  const hour = time ? Number(time[1]) : 12;
  const minute = time ? Number(time[2]) : 0;
  const iso = `${parts[3]}-${String(month + 1).padStart(2, '0')}-${String(Number(parts[1])).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+03:00`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function upcomingStatusLabel(match: Match): string {
  const kickoff = parseKickoff(match);
  if (!kickoff) return 'YAKLAŞAN';
  const matchDay = istanbulYmd(kickoff);
  const today = istanbulYmd(new Date());
  const todayStart = Date.parse(`${today}T00:00:00+03:00`);
  const matchStart = Date.parse(`${matchDay}T00:00:00+03:00`);
  const diffDays = Math.round((matchStart - todayStart) / 86_400_000);
  if (diffDays === 0) return 'BUGÜN';
  if (diffDays === 1) return 'YARIN';
  return 'YAKLAŞAN';
}

export const WeeklyMatchSlider: React.FC = () => {
  const {
    matches,
    selectedLeagueId,
    selectedWeek,
    selectedMatchId,
    setSelectedMatchId,
    reviews,
  } = useApp();

  const weekMatches = matches.filter(
    (m) => m.leagueId === selectedLeagueId && m.week === selectedWeek
  );

  const getMatchTotalComments = (matchId: string) => {
    return reviews.filter((r) => r.matchId === matchId).length;
  };

  if (weekMatches.length === 0) {
    return (
      <div className="bg-white border-2 border-emerald-100 rounded-3xl p-6 text-center text-slate-500 my-2 w-full shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Bu hafta için henüz maç kaydı bulunmuyor.</p>
        <p className="text-xs text-slate-400 mt-1">Farklı bir hafta seçerek maçları ve oyuncu notlarını inceleyebilirsiniz.</p>
      </div>
    );
  }

  return (
    <div className="w-full pb-1">
      <div className="flex items-center justify-between gap-2 mb-2.5 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <h2 className="text-xs font-black tracking-tight text-slate-900 uppercase truncate dark:text-white">
            <span className="sm:hidden">{selectedWeek}. Hafta Maçları</span>
            <span className="hidden sm:inline">{selectedWeek}. Hafta Fikstürü & Karşılaşmalar</span>
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-emerald-100 shadow-sm whitespace-nowrap dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700">
            {weekMatches.length} Maç
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {weekMatches.map((match) => {
          const isSelected = match.id === selectedMatchId;
          const commentCount = getMatchTotalComments(match.id);
          const isLive = isMatchLive(match);
          const officialXi = hasPublishedLineup(match);
          const predictedXi = hasPredictedLineup(match);
          const statusLabel = match.status === 'FT' ? 'BİTTİ' : upcomingStatusLabel(match);
          const liveMin = inferredLiveMinute(match);
          const liveSec = typeof match.liveSeconds === 'number' ? match.liveSeconds : 0;
          const formattedLiveTime = `${liveMin}:${String(liveSec).padStart(2, '0')}`;

          return (
            <button
              key={match.id}
              id={`match-card-${match.id}`}
              onClick={() => setSelectedMatchId(match.id)}
              className={`relative text-left p-3 sm:p-4 rounded-2xl transition-all group overflow-hidden w-full min-w-0 text-white ${
                isLive
                  ? isSelected
                    ? 'shadow-xl shadow-emerald-800/30 border-2 border-rose-500 ring-2 ring-rose-400'
                    : 'border-2 border-rose-400 shadow-md hover:shadow-lg ring-1 ring-rose-300'
                  : isSelected
                  ? 'shadow-xl shadow-emerald-700/20 border-2 border-emerald-400 ring-2 ring-emerald-300'
                  : 'border-2 border-white/15 hover:border-emerald-300/70 shadow-sm hover:shadow-md'
              }`}
            >
              <StadiumBackdrop variant="night" overlayClassName={isSelected ? 'bg-slate-950/55' : 'bg-slate-950/68'} />
              {/* Top-Right LIVE Indicator Badge / Ribbon - ONLY on the live match card */}
              {isLive && (
                <div className="absolute top-0 right-0 z-10">
                  <div className="bg-gradient-to-l from-rose-600 to-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-bl-xl shadow-md flex items-center gap-1.5 border-b border-l border-rose-300 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span className="font-mono">CANLI • {formattedLiveTime}</span>
                  </div>
                </div>
              )}

              {/* Active Match top glow */}
              {isSelected && (
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-400/30 rounded-full blur-xl pointer-events-none" />
              )}

              {/* Match Header: Status & Stadium */}
              <div className="relative z-[1] flex items-center justify-between text-[11px] mb-3">
                <span className={`relative z-[1] flex items-center gap-1 font-medium min-w-0 flex-1 ${isSelected ? 'text-emerald-100' : 'text-white/70'}`}>
                  <MapPin className={`w-3 h-3 shrink-0 ${isSelected ? 'text-emerald-200' : 'text-white/55'}`} />
                  <span className="truncate">{match.stadium}</span>
                </span>
                
                {/* Status Pill (if not live, or secondary status) */}
                {!isLive ? (
                  <span
                    className={`px-2 py-0.5 rounded-full font-black uppercase tracking-wider text-[10px] ${
                      isSelected
                        ? 'bg-white/20 text-white border border-white/30'
                        : match.status === 'FT'
                        ? 'bg-slate-100 text-slate-700 border border-slate-200'
                        : statusLabel === 'BUGÜN'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : statusLabel === 'YARIN'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-sky-50 text-sky-800 border border-sky-200'
                    }`}
                  >
                    {statusLabel}
                  </span>
                ) : (
                  <div className="w-16 h-4" /> /* spacer for top-right corner badge */
                )}
              </div>

              {/* Match Teams & Scoreboard */}
              <div className="relative z-[1] flex items-center justify-between py-1 gap-1.5 min-w-0">
                {/* Home Team */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 flex-1 min-w-0">
                  <TeamLogo team={match.homeTeam} size="md" shape="circle" className="ring-2 ring-white shrink-0 sm:w-10 sm:h-10" />
                  <div className="min-w-0">
                    <p className="font-black text-[11px] sm:text-sm truncate text-white">
                      <span className="sm:hidden">{match.homeTeam.shortName || match.homeTeam.name}</span>
                      <span className="hidden sm:inline">{match.homeTeam.name}</span>
                    </p>
                  </div>
                </div>

                {/* Score */}
                <div className={`px-2 sm:px-3.5 py-1 rounded-xl font-mono font-black text-xs sm:text-base tracking-tight sm:tracking-widest mx-1 sm:mx-2 shadow-sm shrink-0 ${
                  isSelected
                    ? 'bg-emerald-800 text-white border border-emerald-500'
                    : 'bg-slate-900 text-white'
                }`}>
                  {match.homeScore} - {match.awayScore}
                </div>

                {/* Away Team */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 flex-1 min-w-0 justify-end text-right">
                  <div className="min-w-0">
                    <p className="font-black text-[11px] sm:text-sm truncate text-white">
                      <span className="sm:hidden">{match.awayTeam.shortName || match.awayTeam.name}</span>
                      <span className="hidden sm:inline">{match.awayTeam.name}</span>
                    </p>
                  </div>
                  <TeamLogo team={match.awayTeam} size="md" shape="circle" className="ring-2 ring-white shrink-0 sm:w-10 sm:h-10" />
                </div>
              </div>

              {/* Bottom Info: Date & Comments Count */}
              <div className={`relative z-[1] mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] ${
                isSelected ? 'border-emerald-400/40 text-emerald-100' : 'border-white/15 text-white/70'
              }`}>
                <span className="truncate font-medium min-w-0 pr-2">{formatMatchKickoff(match.kickoffAt, match.date)}</span>
                <div className="flex items-center gap-2">
                  {officialXi && match.status === 'UPCOMING' && (
                    <span className={`flex items-center gap-1 font-black px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-violet-200 text-violet-950'
                        : 'bg-violet-50 text-violet-800 border border-violet-200'
                    }`}>
                      Resmi 11
                    </span>
                  )}
                  {!officialXi && predictedXi && match.status === 'UPCOMING' && (
                    <span className={`flex items-center gap-1 font-black px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-amber-200 text-amber-950'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}>
                      T
                    </span>
                  )}
                  <span className={`flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-white text-emerald-800'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    <MessageSquare className="w-3 h-3" />
                    {commentCount} Yorum
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
