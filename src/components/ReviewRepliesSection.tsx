import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ReviewReply } from '../types';
import { FollowButton } from './FollowButton';
import { CommentatorLevelBadge } from './CommentatorLevelBadge';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Send,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
  Trash2,
  Flag,
  Sparkles,
  Shield,
  X,
  User,
} from 'lucide-react';

interface ReviewRepliesSectionProps {
  reviewId: string;
  replies?: ReviewReply[];
  theme?: 'light' | 'dark';
  authorName?: string;
  onRepliesChange?: () => void;
}

export const ReviewRepliesSection: React.FC<ReviewRepliesSectionProps> = ({
  reviewId,
  replies = [],
  theme = 'light',
  authorName,
}) => {
  const {
    addReviewReply,
    deleteReviewReply,
    toggleLikeReply,
    toggleDislikeReply,
    reportSpamReply,
    userProfile,
    isRegistered,
    setIsQuickRegisterOpen,
    setIsProfileOpen,
    markReviewRepliesAsRead,
  } = useApp();

  const [isReplying, setIsReplying] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [showAllReplies, setShowAllReplies] = useState<boolean>(false);
  const [customAuthorName, setCustomAuthorName] = useState<string>('');
  const [customFanOf, setCustomFanOf] = useState<string>('');
  const [showAuthorInputs, setShowAuthorInputs] = useState<boolean>(false);

  const replyCount = replies.length;
  const isDark = theme === 'dark';

  const handleOpenReply = () => {
    setIsReplying(true);
    setShowAllReplies(true);
    markReviewRepliesAsRead(reviewId);
  };

  const handleToggleReplies = () => {
    const nextState = !showAllReplies;
    setShowAllReplies(nextState);
    if (nextState) {
      markReviewRepliesAsRead(reviewId);
    }
  };

  const handleCancelReply = () => {
    setIsReplying(false);
    setReplyText('');
    setShowAuthorInputs(false);
  };

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    addReviewReply(
      reviewId,
      replyText.trim(),
      customAuthorName || customFanOf
        ? {
            name: customAuthorName.trim() || undefined,
            fanOf: customFanOf.trim() || undefined,
          }
        : undefined
    );

    setReplyText('');
    setIsReplying(false);
    setShowAllReplies(true);
  };

  return (
    <div className="w-full mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
      {/* Top Reply Bar / Triggers */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-2">
          {/* Cevap Ver Button */}
          <button
            type="button"
            id={`reply-btn-${reviewId}`}
            onClick={handleOpenReply}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold transition cursor-pointer ${
              isReplying
                ? isDark
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'bg-emerald-700 text-white shadow-xs'
                : isDark
                ? 'bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700 hover:border-amber-400/50'
                : 'bg-slate-100 hover:bg-emerald-50 text-emerald-800 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300'
            }`}
          >
            <CornerDownRight className="w-3.5 h-3.5" />
            <span>Cevap Ver</span>
          </button>

          {/* Toggle / View Replies button */}
          {replyCount > 0 && (
            <button
              type="button"
              id={`toggle-replies-btn-${reviewId}`}
              onClick={handleToggleReplies}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-3 h-3 text-emerald-500" />
              <span>
                {replyCount} {replyCount === 1 ? 'Cevap' : 'Cevap'}
              </span>
              {showAllReplies ? (
                <ChevronUp className="w-3 h-3 ml-0.5" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-0.5" />
              )}
            </button>
          )}
        </div>

        {replyCount > 0 && !showAllReplies && (
          <span
            className={`text-[11px] font-medium cursor-pointer ${
              isDark ? 'text-slate-500 hover:text-amber-400' : 'text-slate-400 hover:text-emerald-700'
            }`}
            onClick={() => {
              setShowAllReplies(true);
              markReviewRepliesAsRead(reviewId);
            }}
          >
            {replies[replies.length - 1].authorName}: "{replies[replies.length - 1].comment.slice(0, 35)}..."
          </span>
        )}
      </div>

      {/* Inline Reply Input Box */}
      {isReplying && (
        <form
          onSubmit={handleSubmitReply}
          className={`mt-3 p-3 rounded-2xl border transition-all animate-fadeIn ${
            isDark
              ? 'bg-slate-900/90 border-slate-700'
              : 'bg-emerald-50/60 border-emerald-200 shadow-xs'
          }`}
        >
          {/* User profile indicator */}
          <div className="flex items-center justify-between text-[11px] mb-2">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-base">{userProfile.avatar || '👤'}</span>
              <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                {userProfile.nickname || userProfile.name || 'Futbolsever'}
              </span>
              {userProfile.favoriteTeamId !== 'general' && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                    isDark ? 'bg-amber-400/20 text-amber-300' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {userProfile.favoriteTeamName}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAuthorInputs(!showAuthorInputs)}
              className={`text-[10px] underline font-medium cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              {showAuthorInputs ? 'Profilimi Kullan' : 'Farklı İsimle Yaz'}
            </button>
          </div>

          {/* Optional Custom Author Inputs */}
          {showAuthorInputs && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2 p-2 bg-slate-950/40 rounded-xl">
              <input
                type="text"
                value={customAuthorName}
                onChange={(e) => setCustomAuthorName(e.target.value)}
                placeholder="Görünecek Rumuz"
                className={`w-full px-2.5 py-1 rounded-lg text-xs border focus:outline-none ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <input
                type="text"
                value={customFanOf}
                onChange={(e) => setCustomFanOf(e.target.value)}
                placeholder="Desteklenen Kulüp (opsiyonel)"
                className={`w-full px-2.5 py-1 rounded-lg text-xs border focus:outline-none ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          )}

          {/* Textarea */}
          <div className="relative">
            <textarea
              autoFocus
              id={`reply-textarea-${reviewId}`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value.slice(0, 1000))}
              placeholder={
                authorName
                  ? `${authorName} adlı kullanıcının yorumuna cevap yazın...`
                  : 'Bu yoruma katıl veya kendi taktiksel görüşünü ekle...'
              }
              rows={2}
              maxLength={1000}
              className={`w-full p-2.5 rounded-xl text-xs sm:text-sm focus:outline-none transition resize-none ${
                isDark
                  ? 'bg-slate-950 border border-slate-700 focus:border-amber-400 text-white placeholder-slate-500'
                  : 'bg-white border-2 border-emerald-200 focus:border-emerald-500 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Action buttons row */}
          <div className="flex items-center justify-between mt-2 pt-1">
            <span
              className={`text-[10px] font-mono ${
                replyText.length >= 900
                  ? 'text-rose-500 font-bold'
                  : isDark
                  ? 'text-slate-500'
                  : 'text-slate-400'
              }`}
            >
              {replyText.length} / 1000
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelReply}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isDark
                    ? 'text-slate-400 hover:text-white bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                Vazgeç
              </button>

              <button
                type="submit"
                id={`submit-reply-btn-${reviewId}`}
                disabled={!replyText.trim()}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                  isDark
                    ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <Send className="w-3 h-3" />
                <span>Yanıtı Gönder</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Replies Thread List */}
      {showAllReplies && replyCount > 0 && (
        <div className="mt-3 space-y-2 pl-2 sm:pl-4 border-l-2 border-emerald-500/40 dark:border-amber-400/40 animate-fadeIn">
          {replies.map((reply) => (
            <div
              key={reply.id}
              className={`p-2.5 sm:p-3 rounded-xl transition ${
                isDark
                  ? 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
                  : 'bg-slate-50 border border-slate-200/80 hover:border-emerald-200'
              }`}
            >
              {/* Reply Author header */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isDark
                        ? 'bg-slate-800 text-amber-300 border border-slate-700'
                        : 'bg-emerald-600 text-white shadow-2xs'
                    }`}
                  >
                    {reply.authorAvatar && reply.authorAvatar.length <= 2 ? (
                      <span>{reply.authorAvatar}</span>
                    ) : (
                      <span>{reply.authorName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-xs font-black ${
                        isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}
                    >
                      {reply.authorName}
                    </span>
                    <CommentatorLevelBadge authorName={reply.authorName} size="xs" />
                    {reply.authorFanOf && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          isDark
                            ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {reply.authorFanOf}
                      </span>
                    )}
                    <FollowButton
                      targetAuthorName={reply.authorName}
                      targetFanOf={reply.authorFanOf}
                      targetAvatar={reply.authorAvatar}
                      size="xs"
                      theme={theme}
                    />
                    <span className="text-[10px] text-slate-400 font-medium">
                      • {reply.createdAt}
                    </span>
                  </div>
                </div>

                {/* Delete button if user's submission */}
                {reply.isUserSubmission && (
                  <button
                    type="button"
                    onClick={() => deleteReviewReply(reviewId, reply.id)}
                    className="text-slate-400 hover:text-rose-500 transition p-1 cursor-pointer"
                    title="Cevabımı Sil"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Reply comment text */}
              <p
                className={`text-xs leading-relaxed font-normal my-1 pl-8 ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                {reply.comment}
              </p>

              {/* Reply reaction footer */}
              <div className="flex items-center justify-between pt-1.5 pl-8 text-[10px]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleLikeReply(reviewId, reply.id)}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold transition cursor-pointer ${
                      reply.likedByMe
                        ? isDark
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : isDark
                        ? 'text-slate-400 hover:text-emerald-400'
                        : 'text-slate-500 hover:text-emerald-700'
                    }`}
                  >
                    <ThumbsUp
                      className={`w-3 h-3 ${
                        reply.likedByMe ? 'fill-current' : ''
                      }`}
                    />
                    <span>{reply.likes || 0}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleDislikeReply(reviewId, reply.id)}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold transition cursor-pointer ${
                      reply.dislikedByMe
                        ? isDark
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-rose-100 text-rose-900 border border-rose-300'
                        : isDark
                        ? 'text-slate-400 hover:text-rose-400'
                        : 'text-slate-500 hover:text-rose-700'
                    }`}
                  >
                    <ThumbsDown
                      className={`w-3 h-3 ${
                        reply.dislikedByMe ? 'fill-current' : ''
                      }`}
                    />
                    <span>{reply.dislikes || 0}</span>
                  </button>
                </div>

                {/* Spam flag */}
                <button
                  type="button"
                  onClick={() => reportSpamReply(reviewId, reply.id, 'Spam / Uygunsuz')}
                  className={`hover:text-rose-500 transition flex items-center gap-1 ${
                    reply.isReportedByMe
                      ? 'text-rose-500 font-bold'
                      : isDark
                      ? 'text-slate-500'
                      : 'text-slate-400'
                  }`}
                  title="Şikayet Et"
                >
                  <Flag className="w-2.5 h-2.5" />
                  <span>{reply.isReportedByMe ? 'Bildirildi' : 'Şikayet'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
