import React from 'react';
import { useApp } from '../context/AppContext';
import { X, MessageSquare, Star, ArrowRight, UserCheck, Trash2 } from 'lucide-react';
import { ReviewRepliesSection } from './ReviewRepliesSection';

export const MyReviewsModal: React.FC = () => {
  const {
    isMyReviewsOpen,
    setIsMyReviewsOpen,
    getUserReviews,
    matches,
    openPlayerModal,
    setSelectedMatchId,
  } = useApp();

  if (!isMyReviewsOpen) return null;

  const userReviews = getUserReviews();

  const handleJumpToPlayer = (matchId: string, playerId: string) => {
    setSelectedMatchId(matchId);
    const targetMatch = matches.find((m) => m.id === matchId);
    if (targetMatch) {
      const player = [...targetMatch.homePlayers, ...targetMatch.awayPlayers].find(
        (p) => p.id === playerId
      );
      if (player) {
        openPlayerModal(player, matchId);
      }
    }
    setIsMyReviewsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border-2 border-emerald-100 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fadeIn">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-emerald-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-300">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Yorumlarım ve Notlarım</h2>
              <p className="text-xs text-slate-500 font-bold">
                Bu platformda yaptığınız tüm oyuncu değerlendirmeleri ({userReviews.length})
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMyReviewsOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reviews List */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3">
          {userReviews.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <MessageSquare className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">
                Henüz bir oyuncu için yorum bırakmadınız.
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Haftanın maçlarından herhangi bir oyuncuya tıklayarak puanınızı ve analizlerinizi yazabilirsiniz.
              </p>
            </div>
          ) : (
            userReviews.map((review) => {
              const match = matches.find((m) => m.id === review.matchId);
              const player = match
                ? [...match.homePlayers, ...match.awayPlayers].find((p) => p.id === review.playerId)
                : null;

              return (
                <div
                  key={review.id}
                  className="bg-slate-50/70 border-2 border-slate-100 rounded-2xl p-4 transition hover:border-emerald-300 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center font-mono font-black text-xs text-white shadow-sm">
                        {player?.number || '#'}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">
                          {player?.name || 'Oyuncu'}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-bold">
                          {match ? `${match.homeTeam.name} vs ${match.awayTeam.name}` : 'Maç'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white border border-emerald-200 px-2.5 py-1 rounded-xl shadow-sm">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-mono font-black text-xs text-slate-900">
                        {typeof review.rating === 'number' ? review.rating.toFixed(1) : 'Yorum'}
                      </span>
                    </div>
                  </div>

                  {review.comment ? (
                    <p className="text-xs text-slate-700 my-2 leading-relaxed font-normal">
                      "{review.comment}"
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic my-2 flex items-center gap-1.5 font-medium">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0" />
                      <span>Yorum yapılmadı, yalnızca puan verildi.</span>
                    </p>
                  )}

                  {review.tags && review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2.5">
                      {review.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 font-bold"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                    <span className="text-[10px] font-bold text-slate-400">{review.createdAt}</span>
                    <button
                      onClick={() => handleJumpToPlayer(review.matchId, review.playerId)}
                      className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-black transition"
                    >
                      <span>Oyuncu Sayfasına Git</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Review Replies Loop / Thread Section */}
                  <ReviewRepliesSection
                    reviewId={review.id}
                    replies={review.replies}
                    authorName={review.authorName}
                    theme="light"
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-emerald-100 flex justify-end">
          <button
            onClick={() => setIsMyReviewsOpen(false)}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
