import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Player } from '../types';
import { MessageSquare, Star, Crown, Shield, BarChart3, Eye, EyeOff, Sparkles, CheckCircle2, Briefcase, ChevronRight } from 'lucide-react';
import { FootballJersey } from './FootballJersey';
import { TeamLogo } from './TeamLogo';
import { ensurePitchPositions } from '../lib/lineupLayout';
import { hasPredictedLineup, hasPublishedLineup } from '../lib/matchTime';

export const TacticalPitch: React.FC = () => {
  const {
    selectedMatch,
    teamTab,
    setTeamTab,
    positionFilter,
    searchQuery,
    openPlayerModal,
    openManagerModal,
    getPlayerAverageRating,
    getPlayerCommentCount,
    getManagerAverageRating,
    getManagerCommentCount,
    reviews,
    canWriteMatchReview,
    canRateTeam,
  } = useApp();

  // Genel Puanlamalar Toggle: By default FALSE (clean rating mode where user scores independently)
  const [showGeneralRatings, setShowGeneralRatings] = useState<boolean>(false);

  if (!selectedMatch) return null;

  const canWrite = canWriteMatchReview(selectedMatch);
  const officialXi = hasPublishedLineup(selectedMatch);
  const predictedXi = hasPredictedLineup(selectedMatch);

  // Filter players based on teamTab and positionFilter (search engine results do not affect pitch layout)
  const filterPlayer = (player: Player) => {
    if (teamTab === 'home' && player.teamId !== selectedMatch.homeTeam.id) return false;
    if (teamTab === 'away' && player.teamId !== selectedMatch.awayTeam.id) return false;
    if (positionFilter !== 'ALL' && player.category !== positionFilter) return false;
    return true;
  };

  const homePlayers = ensurePitchPositions(selectedMatch.homePlayers, true);
  const awayPlayers = ensurePitchPositions(selectedMatch.awayPlayers, false);
  const homeStarters = homePlayers.filter((p) => p.isStarting);
  const awayStarters = awayPlayers.filter((p) => p.isStarting);

  // Bench players filtered by active team
  const homeSubs = homePlayers.filter((p) => !p.isStarting);
  const awaySubs = awayPlayers.filter((p) => !p.isStarting);

  const visibleSubs = (
    teamTab === 'home'
      ? homeSubs
      : teamTab === 'away'
      ? awaySubs
      : [...homeSubs, ...awaySubs]
  ).filter(filterPlayer);

  const renderPlayerNode = (player: Player, isHome: boolean) => {
    const isFilteredIn = filterPlayer(player);
    // STRICT RULE: If not filtered in (i.e. not the selected team or position), do not render at all
    if (!isFilteredIn) {
      return null;
    }

    const { rating, count } = getPlayerAverageRating(player.id, selectedMatch.id);
    const commentsCount = getPlayerCommentCount(player.id, selectedMatch.id);
    const team = isHome ? selectedMatch.homeTeam : selectedMatch.awayTeam;

    // Check if the current user has already submitted a review/rating for this player
    const userReview = reviews.find(
      (r) => r.playerId === player.id && r.matchId === selectedMatch.id && r.isUserSubmission
    );

    // Position coordinates
    const posX = player.pitchPosition?.x ?? 50;
    const posY = player.pitchPosition?.y ?? 50;

    // Rating color
    const getRatingColor = (r: number) => {
      if (r >= 8.5) return 'bg-emerald-500 text-white border-white ring-2 ring-emerald-300';
      if (r >= 7.0) return 'bg-teal-500 text-white border-white ring-2 ring-teal-300';
      if (r >= 6.0) return 'bg-amber-400 text-slate-950 border-white ring-2 ring-amber-200';
      return 'bg-rose-500 text-white border-white ring-2 ring-rose-200';
    };

    return (
      <div
        key={player.id}
        id={`pitch-player-${player.id}`}
        style={{
          left: `${posX}%`,
          top: `${posY}%`,
        }}
        onClick={() => openPlayerModal(player, selectedMatch.id)}
        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer z-10 transition-all duration-300 opacity-100 scale-[0.72] sm:scale-100 hover:scale-90 sm:hover:scale-115 hover:z-30"
      >
        {/* Badges on top of player */}
        <div className="flex items-center gap-1 mb-0.5 relative">
          {/* Top MOTM Crown (only in general mode or if significant) */}
          {showGeneralRatings && player.motmVotes && player.motmVotes > 40 && (
            <span className="bg-amber-400 text-slate-950 p-1 rounded-full shadow-md animate-bounce">
              <Crown className="w-3.5 h-3.5 fill-slate-950" />
            </span>
          )}

          {/* Goal Scored badge */}
          {player.stats.goals > 0 && (
            <span className="bg-white text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full border border-emerald-300 shadow flex items-center gap-0.5">
              ⚽ {player.stats.goals > 1 ? `x${player.stats.goals}` : ''}
            </span>
          )}

          {/* Yellow/Red Card */}
          {player.stats.redCard ? (
            <span className="w-2.5 h-3.5 bg-rose-600 rounded-sm shadow-sm" />
          ) : player.stats.yellowCard ? (
            <span className="w-2.5 h-3.5 bg-amber-400 rounded-sm shadow-sm" />
          ) : null}
        </div>

        {/* Realistic Team Football Jersey */}
        <div className="relative">
          <FootballJersey
            number={player.number}
            team={team}
            isGoalkeeper={player.category === 'GK'}
            size="md"
            className="group-hover:scale-110 transition filter drop-shadow-lg"
          />

          {/* Rating Badge or Clean Rating Prompt */}
          {showGeneralRatings ? (
            /* Mode 1: GENEL PUANLAMALAR (Tüm kullanıcıların ortalaması) */
            count > 0 ? (
              <div
                className={`absolute -bottom-1 -right-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-black border shadow-md flex items-center gap-0.5 ${getRatingColor(
                  rating
                )}`}
              >
                <Star className="w-2.5 h-2.5 fill-current" />
                <span>{rating.toFixed(1)}</span>
              </div>
            ) : (
              <div className="absolute -bottom-1 -right-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-300 shadow-xs flex items-center gap-0.5">
                <span>—</span>
              </div>
            )
          ) : userReview ? (
            /* Mode 2: KİŞİSEL PUANLAMA ALANI (Kullanıcının kendi verdiği not) */
            <div className="absolute -bottom-1 -right-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 border border-white shadow-md flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-slate-950 text-slate-950" />
              <span>{typeof userReview.rating === 'number' ? userReview.rating.toFixed(1) : '✓'}</span>
            </div>
          ) : (
            /* Mode 2: Henüz puan verilmemişse sade Puanla butonu */
            <div className={`absolute -bottom-1 -right-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold border shadow-sm flex items-center gap-0.5 ${
              canWrite
                ? 'bg-white/95 text-emerald-800 border-emerald-300 group-hover:bg-emerald-600 group-hover:text-white transition'
                : 'bg-slate-100 text-slate-500 border-slate-300'
            }`}>
              <Star className={`w-2 h-2 ${canWrite ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}`} />
              <span>{canWrite ? (canRateTeam(player.teamId) ? 'Puanla' : 'Yorumla') : 'Kilitli'}</span>
            </div>
          )}

          {/* Comments count bubble (shown in general ratings mode) */}
          {showGeneralRatings && commentsCount > 0 && (
            <div className="absolute -top-1 -right-2 bg-white text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-emerald-300 shadow flex items-center">
              <MessageSquare className="w-2.5 h-2.5 mr-0.5 text-emerald-600" />
              {commentsCount}
            </div>
          )}
        </div>

        {/* Player Name and Position label */}
        <div className="mt-1 px-2 py-0.5 rounded-lg bg-white/95 backdrop-blur-sm border border-emerald-100 text-center shadow-md pointer-events-none group-hover:bg-emerald-50 group-hover:border-emerald-400 transition">
          <p className="text-[10px] sm:text-[11px] font-black text-slate-900 leading-none whitespace-nowrap truncate max-w-[72px] sm:max-w-[95px]">
            {player.shortName}
          </p>
          <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">
            {player.position}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Tactical Pitch Container */}
      <div className="bg-white border-2 border-emerald-100 rounded-3xl p-3 sm:p-5 shadow-md overflow-hidden dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
        
        {/* Pitch Top Bar info & "Genel Puanlamalar" Toggle Button */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3 px-1">
          
          {/* Team Switcher for the pitch */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner min-w-0 overflow-x-auto no-scrollbar">
            <button
              id="pitch-team-home-btn"
              type="button"
              onClick={() => setTeamTab('home')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                teamTab === 'home'
                  ? 'bg-white text-emerald-950 shadow-sm border border-emerald-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TeamLogo team={selectedMatch.homeTeam} size="xs" shape="circle" showShadow={false} />
              <span className="sm:hidden">{selectedMatch.homeTeam.shortName}</span>
              <span className="hidden sm:inline">{selectedMatch.homeTeam.name}</span>
              <span className="hidden sm:inline text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 rounded-md">
                Ev Sahibi
              </span>
            </button>

            <button
              id="pitch-team-away-btn"
              type="button"
              onClick={() => setTeamTab('away')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                teamTab === 'away'
                  ? 'bg-white text-emerald-950 shadow-sm border border-emerald-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TeamLogo team={selectedMatch.awayTeam} size="xs" shape="circle" showShadow={false} />
              <span className="sm:hidden">{selectedMatch.awayTeam.shortName}</span>
              <span className="hidden sm:inline">{selectedMatch.awayTeam.name}</span>
              <span className="hidden sm:inline text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 rounded-md">
                Deplasman
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* GENEL PUANLAMALAR BUTTON */}
            <button
              id="toggle-general-ratings-btn"
              type="button"
              onClick={() => setShowGeneralRatings(!showGeneralRatings)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition shadow-sm cursor-pointer whitespace-nowrap ${
                showGeneralRatings
                  ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 ring-2 ring-amber-300 shadow-md'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 hover:border-emerald-400'
              }`}
            >
              {showGeneralRatings ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-950" />
                  <span>Genel Puanlamalar</span>
                  <span className="text-[10px] font-black bg-slate-950 text-amber-300 px-1.5 py-0.2 rounded-full ml-0.5">
                    Açık
                  </span>
                </>
              ) : (
                <>
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Genel Puanlamalar</span>
                  <span className="hidden sm:inline text-[10px] font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-full ml-0.5">
                    Ortalamaları Gör
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {selectedMatch.status === 'UPCOMING' && (
          <div className={`mb-3 px-3 py-2 rounded-2xl border text-[11px] sm:text-xs font-bold dark:border-slate-600 ${
            officialXi
              ? 'bg-violet-50 text-violet-900 border-violet-200'
              : predictedXi
                ? 'bg-amber-50 text-amber-950 border-amber-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}>
            {officialXi
              ? 'Resmi 11 yayınlandı — tahmini kadro kaldırıldı.'
              : predictedXi
                ? `Tahmini 11: son resmi kadro, sakatlık ve ceza düşülerek. Resmi yayınlanınca değişir.${
                    selectedMatch.unavailablePlayers?.length
                      ? ` Dışarıda: ${selectedMatch.unavailablePlayers.map((row) => row.name).slice(0, 4).join(', ')}.`
                      : ''
                  }`
                : 'Resmi ilk 11 henüz açıklanmadı. Yayınlanınca otomatik sahaya yazılacak.'}
          </div>
        )}

        {/* Football Grass Pitch Arena */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] min-h-[260px] sm:min-h-[480px] md:min-h-[540px] rounded-2xl overflow-hidden shadow-inner border-2 border-emerald-600 bg-gradient-to-r from-emerald-600 via-emerald-650 to-emerald-600 select-none">
          
          {/* Turf Stripes Pattern */}
          <div className="absolute inset-0 grid grid-cols-12 pointer-events-none opacity-25">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={i % 2 === 0 ? 'bg-black/20' : 'bg-transparent'}
              />
            ))}
          </div>

          {/* Pitch Lines (SVG) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none stroke-white/60 fill-none"
            viewBox="0 0 1000 600"
            preserveAspectRatio="none"
            strokeWidth="3"
          >
            {/* Outer Pitch Border */}
            <rect x="25" y="25" width="950" height="550" rx="4" />

            {/* Halfway Line */}
            <line x1="500" y1="25" x2="500" y2="575" />

            {/* Center Circle & Spot */}
            <circle cx="500" cy="300" r="75" />
            <circle cx="500" cy="300" r="4" className="fill-white/80" />

            {/* Left Penalty Area (Home) */}
            <rect x="25" y="140" width="160" height="320" />
            <rect x="25" y="210" width="60" height="180" />
            <circle cx="130" cy="300" r="3" className="fill-white/80" />
            <path d="M 185 240 A 75 75 0 0 1 185 360" />

            {/* Right Penalty Area (Away) */}
            <rect x="815" y="140" width="160" height="320" />
            <rect x="915" y="210" width="60" height="180" />
            <circle cx="870" cy="300" r="3" className="fill-white/80" />
            <path d="M 815 240 A 75 75 0 0 0 815 360" />

            {/* Corner Arcs */}
            <path d="M 25 45 A 20 20 0 0 0 45 25" />
            <path d="M 25 555 A 20 20 0 0 1 45 575" />
            <path d="M 975 45 A 20 20 0 0 1 955 25" />
            <path d="M 975 555 A 20 20 0 0 0 955 575" />
          </svg>

          {/* Home Team Side Watermark / Banner */}
          {teamTab !== 'away' && (
            <div className="absolute left-3 top-2 pointer-events-none opacity-40 flex items-center gap-1.5 max-w-[46%]">
              <TeamLogo team={selectedMatch.homeTeam} size="sm" shape="circle" showShadow={false} />
              <span className="font-black text-xs sm:text-sm text-white tracking-wider truncate">
                {selectedMatch.homeTeam.name.toUpperCase()} ({homeStarters.length})
              </span>
            </div>
          )}

          {/* Away Team Side Watermark / Banner */}
          {teamTab !== 'home' && (
            <div className="absolute right-3 top-2 pointer-events-none opacity-40 flex items-center gap-1.5 flex-row-reverse max-w-[46%]">
              <TeamLogo team={selectedMatch.awayTeam} size="sm" shape="circle" showShadow={false} />
              <span className="font-black text-xs sm:text-sm text-white tracking-wider truncate">
                {selectedMatch.awayTeam.name.toUpperCase()} ({awayStarters.length})
              </span>
            </div>
          )}

          {selectedMatch.status === 'UPCOMING' && !officialXi && !predictedXi && homeStarters.length === 0 && awayStarters.length === 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none px-6">
              <div className="bg-slate-950/70 text-white text-center text-[11px] sm:text-sm font-black px-4 py-3 rounded-2xl border border-white/20 max-w-md">
                İlk 11 henüz yayınlanmadı
              </div>
            </div>
          )}

          {/* Home Team Starter Nodes */}
          {homeStarters.map((p) => renderPlayerNode(p, true))}

          {/* Away Team Starter Nodes */}
          {awayStarters.map((p) => renderPlayerNode(p, false))}
        </div>

        {/* Managers / Technical Directors Dugout Section */}
        <div className="mt-4 pt-4 border-t border-emerald-100 bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider truncate">
                <span className="sm:hidden">Teknik Direktörler</span>
                <span className="hidden sm:inline">Teknik Direktörler & Taktik Kulübesi</span>
              </h3>
            </div>
            <span className="text-[11px] text-amber-400 font-bold hidden sm:inline-block">
              Taktiksel analiz ve puan vermek için teknik direktöre tıklayın
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Home Manager Card */}
            {(teamTab === 'all' || teamTab === 'home') && selectedMatch.homeTeam.manager && (
              (() => {
                const mgr = selectedMatch.homeTeam.manager;
                const { rating, count } = getManagerAverageRating(mgr.id, selectedMatch.id);
                const commentsCount = getManagerCommentCount(mgr.id, selectedMatch.id);
                const userReview = reviews.find(
                  (r) => (r.playerId === mgr.id || r.managerId === mgr.id) && r.matchId === selectedMatch.id && r.isUserSubmission
                );

                return (
                  <div
                    key={mgr.id}
                    id={`home-manager-card-${mgr.id}`}
                    onClick={() => openManagerModal(mgr, selectedMatch.id)}
                    className="p-3 sm:p-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 hover:border-amber-400 transition cursor-pointer flex items-center justify-between gap-3 group shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <TeamLogo
                        team={selectedMatch.homeTeam}
                        size="lg"
                        shape="rounded"
                        className="shrink-0 ring-1 ring-slate-600 shadow-xs"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white group-hover:text-amber-400 transition truncate">
                            {mgr.name}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 uppercase shrink-0">
                            {selectedMatch.homeTeam.shortName} TD
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {mgr.formation || selectedMatch.homeTeam.formation}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-lg text-amber-400 font-black text-xs justify-end">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{count > 0 ? rating.toFixed(1) : '—'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {count > 0 ? `${count} oy (${commentsCount} yorum)` : userReview ? 'Puanladın' : canWrite ? '+ Puanla' : 'Kilitli'}
                      </span>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Away Manager Card */}
            {(teamTab === 'all' || teamTab === 'away') && selectedMatch.awayTeam.manager && (
              (() => {
                const mgr = selectedMatch.awayTeam.manager;
                const { rating, count } = getManagerAverageRating(mgr.id, selectedMatch.id);
                const commentsCount = getManagerCommentCount(mgr.id, selectedMatch.id);
                const userReview = reviews.find(
                  (r) => (r.playerId === mgr.id || r.managerId === mgr.id) && r.matchId === selectedMatch.id && r.isUserSubmission
                );

                return (
                  <div
                    key={mgr.id}
                    id={`away-manager-card-${mgr.id}`}
                    onClick={() => openManagerModal(mgr, selectedMatch.id)}
                    className="p-3 sm:p-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 hover:border-amber-400 transition cursor-pointer flex items-center justify-between gap-3 group shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <TeamLogo
                        team={selectedMatch.awayTeam}
                        size="lg"
                        shape="rounded"
                        className="shrink-0 ring-1 ring-slate-600 shadow-xs"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white group-hover:text-amber-400 transition truncate">
                            {mgr.name}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 uppercase shrink-0">
                            {selectedMatch.awayTeam.shortName} TD
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {mgr.formation || selectedMatch.awayTeam.formation}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-lg text-amber-400 font-black text-xs justify-end">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{count > 0 ? rating.toFixed(1) : '—'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {count > 0 ? `${count} oy (${commentsCount} yorum)` : userReview ? 'Puanladın' : canWrite ? '+ Puanla' : 'Kilitli'}
                      </span>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>

        {/* Bench / Substitutes Bar below pitch */}
        {visibleSubs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-emerald-100 bg-slate-50/70 p-3 rounded-2xl">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>🔄 {teamTab === 'home' ? selectedMatch.homeTeam.name : teamTab === 'away' ? selectedMatch.awayTeam.name : 'Maç'} Yedek Kulübesi</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">
                Değerlendirmek için oyuncuya tıklayın
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {visibleSubs.map((sub) => {
                const { rating, count } = getPlayerAverageRating(sub.id, selectedMatch.id);
                const userReview = reviews.find(
                  (r) => r.playerId === sub.id && r.matchId === selectedMatch.id && r.isUserSubmission
                );
                const team = sub.teamId === selectedMatch.homeTeam.id ? selectedMatch.homeTeam : selectedMatch.awayTeam;

                return (
                  <button
                    key={sub.id}
                    id={`bench-player-${sub.id}`}
                    onClick={() => openPlayerModal(sub, selectedMatch.id)}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-100 hover:border-emerald-300 transition text-left group shadow-sm cursor-pointer"
                  >
                    <FootballJersey
                      number={sub.number}
                      team={team}
                      isGoalkeeper={sub.category === 'GK'}
                      size="xs"
                      className="shrink-0 group-hover:scale-105 transition"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-slate-900 truncate group-hover:text-emerald-700 transition">
                        {sub.shortName}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        {showGeneralRatings ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                            ★ {count > 0 ? rating.toFixed(1) : '—'}
                          </span>
                        ) : userReview ? (
                          <span className="font-black text-slate-950 bg-amber-300 px-1 rounded">
                            ★ {typeof userReview.rating === 'number' ? `${userReview.rating.toFixed(1)} (Notun)` : 'Yorumun'}
                          </span>
                        ) : (
                          <span className={`font-medium px-1 rounded ${canWrite ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'}`}>
                            {canWrite ? (canRateTeam(sub.teamId) ? '+ Puanla' : 'Yorumla') : 'Kilitli'}
                          </span>
                        )}
                        <span>•</span>
                        <span>{sub.stats.minutesPlayed}' dk</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

