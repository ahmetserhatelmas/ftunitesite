import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Crown, Star, MessageSquare, Flame, TrendingUp, ThumbsUp, ThumbsDown, Flag, Sparkles, Activity, Clock, Shield, Trophy } from 'lucide-react';
import { Player } from '../types';
import { FootballJersey } from './FootballJersey';
import { LeagueStandingsCard } from './LeagueStandingsCard';
import { TeamLogo } from './TeamLogo';
import { FollowButton } from './FollowButton';
import { CommentatorLevelBadge } from './CommentatorLevelBadge';

export const MatchSidePanel: React.FC = () => {
  const {
    selectedMatch,
    reviews,
    openPlayerModal,
    getPlayerAverageRating,
    getPlayerCommentCount,
    voteMotm,
    toggleLikeReview,
    toggleDislikeReview,
    cancelSpamReport,
    setSpamReportingReview,
  } = useApp();

  const [activeSideTab, setActiveSideTab] = useState<'stars' | 'reviews' | 'timeline' | 'standings'>('stars');

  if (!selectedMatch) return null;

  const allPlayers = [...selectedMatch.homePlayers, ...selectedMatch.awayPlayers];
  const matchReviews = reviews
    .filter((r) => r.matchId === selectedMatch.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Rank players by rating & MOTM votes
  const rankedPlayers = [...allPlayers]
    .map((p) => {
      const { rating, count } = getPlayerAverageRating(p.id, selectedMatch.id);
      const comments = getPlayerCommentCount(p.id, selectedMatch.id);
      return { player: p, rating, count, comments, motmVotes: p.motmVotes || 0 };
    })
    .sort((a, b) => b.rating - a.rating || b.motmVotes - a.motmVotes);

  const topStars = rankedPlayers.slice(0, 4);

  // Home vs Away average rating
  const homeRatings = selectedMatch.homePlayers
    .map((p) => getPlayerAverageRating(p.id, selectedMatch.id))
    .filter((s) => s.count > 0)
    .map((s) => s.rating);
  const awayRatings = selectedMatch.awayPlayers
    .map((p) => getPlayerAverageRating(p.id, selectedMatch.id))
    .filter((s) => s.count > 0)
    .map((s) => s.rating);

  const avgHome = homeRatings.length > 0
    ? (homeRatings.reduce((a, b) => a + b, 0) / homeRatings.length).toFixed(1)
    : '—';
  const avgAway = awayRatings.length > 0
    ? (awayRatings.reduce((a, b) => a + b, 0) / awayRatings.length).toFixed(1)
    : '—';

  const isLive = selectedMatch.status === 'LIVE';
  const liveMin = selectedMatch.minute ?? 78;
  const liveSec = typeof selectedMatch.liveSeconds === 'number' ? selectedMatch.liveSeconds : 0;
  const formattedLiveTime = `${liveMin}:${String(liveSec).padStart(2, '0')}`;

  return (
    <div className="space-y-4">
      {/* Quick Team Comparison Card */}
      <div className={`bg-white rounded-3xl p-4 shadow-sm relative overflow-hidden ${
        isLive ? 'border-2 border-rose-400 ring-1 ring-rose-300' : 'border-2 border-emerald-100'
      }`}>
        {isLive && (
          <div className="absolute top-0 right-0">
            <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-bl-xl shadow-xs flex items-center gap-1 animate-pulse border-b border-l border-rose-300 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              CANLI • {formattedLiveTime}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-emerald-50 text-xs pr-16">
          <span className="font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tribün Not Ortalamaları</span>
          </span>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {matchReviews.length} Yorum
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          {/* Home Avg */}
          <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-2xl">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TeamLogo team={selectedMatch.homeTeam} size="xs" shape="circle" showShadow={false} />
              <span className="text-xs font-black text-slate-800 truncate">{selectedMatch.homeTeam.shortName}</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono flex items-center justify-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>{avgHome}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-bold">Takım Notu</span>
          </div>

          {/* Away Avg */}
          <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-2xl">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TeamLogo team={selectedMatch.awayTeam} size="xs" shape="circle" showShadow={false} />
              <span className="text-xs font-black text-slate-800 truncate">{selectedMatch.awayTeam.shortName}</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono flex items-center justify-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>{avgAway}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-bold">Takım Notu</span>
          </div>
        </div>
      </div>

      {/* Main Side Panel Widget with Tabs */}
      <div className="bg-white border-2 border-emerald-100 rounded-3xl p-4 shadow-sm">
        
        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-slate-100 p-1 rounded-2xl text-[11px] font-bold mb-3.5">
          <button
            id="side-tab-stars"
            onClick={() => setActiveSideTab('stars')}
            className={`py-1.5 rounded-xl transition flex items-center justify-center gap-1 ${
              activeSideTab === 'stars'
                ? 'bg-emerald-600 text-white font-black shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Crown className="w-3 h-3 shrink-0" />
            <span className="truncate">Yıldızlar</span>
          </button>

          <button
            id="side-tab-reviews"
            onClick={() => setActiveSideTab('reviews')}
            className={`py-1.5 rounded-xl transition flex items-center justify-center gap-1 ${
              activeSideTab === 'reviews'
                ? 'bg-emerald-600 text-white font-black shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3 h-3 shrink-0" />
            <span className="truncate">Tribün ({matchReviews.length})</span>
          </button>

          <button
            id="side-tab-timeline"
            onClick={() => setActiveSideTab('timeline')}
            className={`py-1.5 rounded-xl transition flex items-center justify-center gap-1 ${
              activeSideTab === 'timeline'
                ? 'bg-emerald-600 text-white font-black shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span className="truncate">Olaylar</span>
          </button>

          <button
            id="side-tab-standings"
            onClick={() => setActiveSideTab('standings')}
            className={`py-1.5 rounded-xl transition flex items-center justify-center gap-1 ${
              activeSideTab === 'standings'
                ? 'bg-emerald-600 text-white font-black shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-3 h-3" />
            <span className="truncate">Puan</span>
          </button>
        </div>

        {/* Tab Content 1: Top Stars / MOTM Leaderboard */}
        {activeSideTab === 'stars' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-semibold">
              <span>Maçın En Yüksek Puanlıları</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">Topluluk Puanı</span>
            </div>

            {topStars.map(({ player, rating, count, comments, motmVotes }, idx) => {
              const isHome = player.teamId === selectedMatch.homeTeam.id;
              const team = isHome ? selectedMatch.homeTeam : selectedMatch.awayTeam;

              return (
                <div
                  key={player.id}
                  id={`side-star-card-${player.id}`}
                  className="bg-slate-50/90 hover:bg-emerald-50/80 border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-3 transition group flex items-center justify-between gap-3 shadow-xs"
                >
                  <div
                    className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1"
                    onClick={() => openPlayerModal(player, selectedMatch.id)}
                  >
                    {/* Rank Badge */}
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                      idx === 0 ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {idx + 1}
                    </div>

                    {/* Team jersey number */}
                    <FootballJersey
                      number={player.number}
                      team={team}
                      isGoalkeeper={player.category === 'GK'}
                      size="xs"
                      className="shrink-0 group-hover:scale-105 transition"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition truncate">
                          {player.name}
                        </p>
                        {idx === 0 && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded border border-amber-300">
                            👑 MOTM
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                        <span>{team.shortName} • {player.position}</span>
                        {player.stats.goals > 0 && (
                          <span className="font-bold text-slate-800">⚽ {player.stats.goals}</span>
                        )}
                        {player.stats.assists > 0 && (
                          <span className="font-bold text-slate-800">🅰️ {player.stats.assists}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rating + Action Button */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="bg-white border border-emerald-200 px-2 py-1 rounded-xl shadow-xs text-center">
                      <div className="flex items-center gap-0.5 text-xs font-black text-slate-900 font-mono">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        <span>{rating}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 block">{count} oy</span>
                    </div>

                    <button
                      id={`vote-motm-btn-${player.id}`}
                      onClick={() => voteMotm(selectedMatch.id, player.id)}
                      title="Maçın Adamı (MOTM) Oyu Ver"
                      className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-400 text-amber-700 hover:text-slate-950 border border-amber-200 transition shadow-xs"
                    >
                      <Crown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="pt-2 text-center">
              <p className="text-[11px] text-slate-500 font-medium">
                Tüm oyuncuların notları ve detaylı istatistikleri için sol taraftaki sahaya veya kadro listesine göz atabilirsiniz.
              </p>
            </div>
          </div>
        )}

        {/* Tab Content 2: Community Reviews Feed */}
        {activeSideTab === 'reviews' && (
          <div className="space-y-3">
            {matchReviews.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-600" />
                <p className="font-bold text-slate-600">Bu maç için henüz taraftar yorumu yok.</p>
                <p className="mt-1">Sahadaki bir oyuncuya tıklayarak ilk notu siz verin!</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {matchReviews.map((rev) => {
                  const targetPlayer = allPlayers.find((p) => p.id === rev.playerId);
                  const authorDisplayName = rev.authorName || 'Futbol Sever';
                  return (
                    <div
                      key={rev.id}
                      id={`side-review-${rev.id}`}
                      className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3 text-xs space-y-1.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          <span className="font-black text-slate-900 truncate">{authorDisplayName}</span>
                          <CommentatorLevelBadge authorName={authorDisplayName} size="xs" />
                          {rev.authorFanOf && (
                            <span className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.2 rounded-md font-bold">
                              {rev.authorFanOf}
                            </span>
                          )}
                          <FollowButton
                            targetAuthorName={authorDisplayName}
                            targetFanOf={rev.authorFanOf}
                            targetAvatar={rev.authorAvatar}
                            size="xs"
                            variant="light"
                          />
                        </div>

                        {/* Player name & Rating */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {targetPlayer && (
                            <span
                              onClick={() => openPlayerModal(targetPlayer, selectedMatch.id)}
                              className="font-black text-emerald-800 hover:underline cursor-pointer text-[11px]"
                            >
                              {targetPlayer.shortName}
                            </span>
                          )}
                          <span className="bg-amber-400 text-slate-950 font-mono font-black text-[10px] px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 shadow-xs">
                            <Star className="w-2.5 h-2.5 fill-slate-950" />
                            {typeof rev.rating === 'number' ? rev.rating.toFixed(1) : 'Yorum'}
                          </span>
                        </div>
                      </div>

                      {/* Comment text */}
                      {rev.comment ? (
                        <p className="text-slate-700 font-medium leading-relaxed bg-white/70 p-2 rounded-xl border border-slate-100">
                          "{rev.comment}"
                        </p>
                      ) : (
                        <p className="text-slate-400 italic text-[11px]">
                          Yalnızca puan verildi.
                        </p>
                      )}

                      {/* Reported Status Notice */}
                      {rev.isReportedByMe && (
                        <div className="bg-rose-50 border border-rose-200 rounded-lg p-1.5 flex items-center justify-between text-[10px] text-rose-900 animate-fadeIn">
                          <span className="flex items-center gap-1 font-bold">
                            <Flag className="w-2.5 h-2.5 text-rose-600 fill-rose-600" />
                            <span>Şikayet edildi ({rev.reportReason || 'Spam'})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => cancelSpamReport(rev.id)}
                            className="font-black underline text-rose-700 hover:text-rose-950 cursor-pointer"
                          >
                            Geri Al
                          </button>
                        </div>
                      )}

                      {/* Tags & Action buttons */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1 flex-wrap">
                          {rev.tags?.map((t, i) => (
                            <span key={i} className="bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded font-bold border border-emerald-200">
                              #{t}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Like */}
                          <button
                            type="button"
                            onClick={() => toggleLikeReview(rev.id)}
                            className={`flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded-lg transition cursor-pointer ${
                              rev.likedByMe ? 'text-emerald-700 bg-emerald-100' : 'text-slate-500 hover:text-slate-800 bg-white border border-slate-200'
                            }`}
                            title="Beğen"
                          >
                            <ThumbsUp className={`w-3 h-3 ${rev.likedByMe ? 'fill-emerald-700' : ''}`} />
                            <span>{rev.likes || 0}</span>
                          </button>

                          {/* Dislike */}
                          <button
                            type="button"
                            onClick={() => toggleDislikeReview(rev.id)}
                            className={`flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded-lg transition cursor-pointer ${
                              rev.dislikedByMe ? 'text-rose-700 bg-rose-100' : 'text-slate-500 hover:text-slate-800 bg-white border border-slate-200'
                            }`}
                            title="Beğenme"
                          >
                            <ThumbsDown className={`w-3 h-3 ${rev.dislikedByMe ? 'fill-rose-700' : ''}`} />
                            <span>{rev.dislikes || 0}</span>
                          </button>

                          {/* Spam */}
                          <button
                            type="button"
                            onClick={() => setSpamReportingReview(rev)}
                            className={`p-1 rounded-lg transition cursor-pointer ${
                              rev.isReportedByMe ? 'text-rose-700 bg-rose-100' : 'text-slate-400 hover:text-rose-600'
                            }`}
                            title="Spam / Şikayet Bildir"
                          >
                            <Flag className={`w-3 h-3 ${rev.isReportedByMe ? 'fill-rose-600' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 3: Chronological Match Timeline Events */}
        {activeSideTab === 'timeline' && (
          <div className="space-y-2">
            {!selectedMatch.events || selectedMatch.events.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <Clock className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-emerald-600" />
                <p className="font-bold text-slate-600">Önemli olay kaydı bulunmuyor.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {selectedMatch.events.map((ev, idx) => {
                  const evPlayer = allPlayers.find((p) => p.id === ev.playerId);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-mono font-black text-xs flex items-center justify-center shrink-0">
                          {ev.minute}'
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">
                              {ev.type === 'goal' && '⚽'}
                              {ev.type === 'yellow-card' && '🟨'}
                              {ev.type === 'red-card' && '🟥'}
                              {ev.type === 'penalty' && '🎯'}
                            </span>
                            <span
                              onClick={() => evPlayer && openPlayerModal(evPlayer, selectedMatch.id)}
                              className="font-black text-slate-900 hover:text-emerald-700 cursor-pointer"
                            >
                              {ev.playerName}
                            </span>
                          </div>
                          {ev.detail && (
                            <p className="text-[10px] text-slate-500 font-medium">{ev.detail}</p>
                          )}
                        </div>
                      </div>

                      {evPlayer && (
                        <button
                          onClick={() => openPlayerModal(evPlayer, selectedMatch.id)}
                          className="px-2 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold text-[10px] border border-emerald-200 transition"
                        >
                          Not Ver
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 4: League Standings inside Side Panel */}
        {activeSideTab === 'standings' && (
          <div className="space-y-2">
            <LeagueStandingsCard
              compact={false}
              maxRows={10}
              className="border-0 p-0 shadow-none"
            />
          </div>
        )}

      </div>

      {/* Standalone Bottom-Right League Standings Section */}
      <LeagueStandingsCard
        compact={true}
        maxRows={8}
      />
    </div>
  );
};
