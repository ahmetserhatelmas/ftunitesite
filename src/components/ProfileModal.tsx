import React, { useState } from 'react';
import { useApp, LEVEL_TIERS } from '../context/AppContext';
import { ReviewRepliesSection } from './ReviewRepliesSection';
import { TeamLogo } from './TeamLogo';
import { CommentatorLevelBadge } from './CommentatorLevelBadge';
import { SUPER_LIG_CLUBS_2026 } from '../data/superLigClubs2026';
import { hasChosenFavoriteClub } from '../lib/auth';
import {
  X,
  User,
  Shield,
  Star,
  MessageSquare,
  Trophy,
  Award,
  CheckCircle2,
  Edit3,
  Save,
  Flame,
  TrendingUp,
  Heart,
  Trash2,
  ArrowRight,
  MapPin,
  Calendar,
  Sparkles,
  Search,
  ThumbsUp,
  RotateCcw,
  UserPlus,
  LogOut,
  Mail,
  Users,
  UserCheck,
  UserMinus,
  Zap,
  ChevronRight,
} from 'lucide-react';

const AVATAR_OPTIONS = ['⚽', '🦁', '🦅', '🟡', '🌊', '🟣', '🟠', '🟢', '⭐', '🏆', '👑', '🎯', '⚡', '🔥', '👟', '🏟️'];

const SUPER_LIG_TEAMS = SUPER_LIG_CLUBS_2026;

const FAN_TITLES = [
  'Baş Analist',
  'Kıdemli Scout',
  'Tribün Lideri',
  'Objektif Hakem',
  'Taktik Dehası',
  'Futbol Sevdalısı',
];

export const ProfileModal: React.FC = () => {
  const {
    isProfileOpen,
    setIsProfileOpen,
    userProfile,
    isRegistered,
    updateUserProfile,
    logoutUser,
    setIsQuickRegisterOpen,
    getUserReviews,
    matches,
    openPlayerModal,
    setSelectedMatchId,
    deleteReview,
    followersCount,
    followingCount,
    followedCommentators,
    unfollowUser,
    userLevelInfo,
    userMotmVoteCount,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'level' | 'following' | 'stats' | 'reviews' | 'badges'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [followingSearch, setFollowingSearch] = useState('');

  // Edit form state
  const [formData, setFormData] = useState({
    name: userProfile.nickname || userProfile.name,
    nickname: userProfile.nickname || userProfile.name,
    email: userProfile.email || '',
    username: userProfile.username,
    avatar: userProfile.avatar,
    bio: userProfile.bio,
    city: userProfile.city,
    favoriteTeamId: userProfile.favoriteTeamId,
    title: userProfile.title,
  });

  const [saveNotification, setSaveNotification] = useState(false);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState<'all' | 'high' | 'low'>('all');

  if (!isProfileOpen) return null;

  const userReviews = getUserReviews();
  const totalReviewsCount = userReviews.length;
  const avgRatingGiven =
    totalReviewsCount > 0
      ? userReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviewsCount
      : 0;
  const totalLikesReceived = userReviews.reduce((sum, r) => sum + (r.likes || 0), 0);

  // Handle save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTeam = SUPER_LIG_TEAMS.find((t) => t.id === formData.favoriteTeamId);
    if (!selectedTeam) {
      return;
    }
    updateUserProfile({
      name: formData.name.trim() || formData.nickname.trim() || 'Tribün Lideri',
      nickname: formData.nickname.trim() || formData.name.trim() || 'Tribün Lideri',
      email: formData.email.trim(),
      username: formData.username.trim().replace(/^@/, '') || 'tribun_analisti',
      avatar: formData.avatar,
      bio: formData.bio.trim(),
      city: formData.city.trim(),
      title: formData.title,
      favoriteTeamId: formData.favoriteTeamId,
      favoriteTeamName: selectedTeam?.name || 'Süper Lig',
      favoriteTeamBadge: selectedTeam?.badge || '⚽',
      isRegistered: true,
    });
    setIsEditing(false);
    setSaveNotification(true);
    setTimeout(() => setSaveNotification(false), 3000);
  };

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
    setIsProfileOpen(false);
  };

  // Filter reviews
  const filteredReviews = userReviews.filter((r) => {
    const match = matches.find((m) => m.id === r.matchId);
    const player = match
      ? [...match.homePlayers, ...match.awayPlayers].find((p) => p.id === r.playerId)
      : null;
    const nameMatch =
      player?.name.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      r.comment.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      match?.homeTeam.name.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      match?.awayTeam.name.toLowerCase().includes(reviewSearch.toLowerCase());

    if (!nameMatch) return false;
    if (reviewRatingFilter === 'high') return r.rating >= 7.5;
    if (reviewRatingFilter === 'low') return r.rating < 6.0;
    return true;
  });

  // Badges calculations
  const badges = [
    {
      id: 'b1',
      title: 'İlk Düdük',
      desc: 'İlk futbolcu değerlendirmeni ve yorumunu yap',
      icon: '⚽',
      unlocked: totalReviewsCount >= 1,
      progress: Math.min(100, (totalReviewsCount / 1) * 100),
    },
    {
      id: 'b2',
      title: 'Tribün Sesi',
      desc: '5 veya daha fazla oyuncuya maç puanı ver',
      icon: '📢',
      unlocked: totalReviewsCount >= 5,
      progress: Math.min(100, (totalReviewsCount / 5) * 100),
    },
    {
      id: 'b3',
      title: 'Usta Scout',
      desc: '10 veya daha fazla oyuncuyu analiz et',
      icon: '🔎',
      unlocked: totalReviewsCount >= 10,
      progress: Math.min(100, (totalReviewsCount / 10) * 100),
    },
    {
      id: 'b4',
      title: 'Topluluk Favorisi',
      desc: 'Yorumlarına toplamda 10 beğeni topla',
      icon: '❤️',
      unlocked: totalLikesReceived >= 10,
      progress: Math.min(100, (totalLikesReceived / 10) * 100),
    },
    {
      id: 'b5',
      title: 'Objektif Hakem',
      desc: 'Farklı takımlardan oyunculara adil notlar ver',
      icon: '⚖️',
      unlocked: totalReviewsCount >= 3,
      progress: Math.min(100, (totalReviewsCount / 3) * 100),
    },
    {
      id: 'b6',
      title: 'Günün Seçicisi',
      desc: 'Maçın Adamı (MOTM) oylamalarına katıl',
      icon: '👑',
      unlocked: userMotmVoteCount >= 1,
      progress: Math.min(100, userMotmVoteCount * 100),
    },
  ];

  const unlockedBadgesCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white border-2 border-emerald-100 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-fadeIn flex flex-col max-h-[92vh]">
        
        {/* Top Banner & Header */}
        <div className="relative bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-5 sm:p-6 pb-4">
          <button
            id="close-profile-modal-btn"
            onClick={() => setIsProfileOpen(false)}
            className="absolute right-4 top-4 p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-700/60 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* User Profile Card Summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 flex items-center justify-center text-3xl sm:text-4xl font-black shadow-lg ring-4 ring-white/20 shrink-0">
                {userProfile.avatar || '⚽'}
              </div>
              <span className="absolute -bottom-1 -right-1 text-lg bg-white rounded-full p-0.5 shadow-md">
                {userProfile.favoriteTeamBadge || '⚽'}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {userProfile.name}
                </h2>
                
                {/* Level Tag */}
                <button
                  type="button"
                  onClick={() => setActiveTab('level')}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wide flex items-center gap-1 transition cursor-pointer"
                  title="Yorumcu Seviye Detayı"
                >
                  <span>{userLevelInfo.badgeEmoji}</span>
                  <span>Seviye {userLevelInfo.level}</span>
                  <span className="opacity-75">• {userLevelInfo.title}</span>
                </button>
              </div>

              <p className="text-xs text-emerald-200 font-mono font-medium mt-0.5">
                @{userProfile.username} • {hasChosenFavoriteClub(userProfile) ? `${userProfile.favoriteTeamName} Taraftarı` : 'Kulüp henüz seçilmedi'}
              </p>

              {userProfile.bio && (
                <p className="text-xs text-emerald-100/90 mt-1 line-clamp-2 max-w-xl font-medium">
                  {userProfile.bio}
                </p>
              )}

              {/* Followers, Following & Info Strip */}
              <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-emerald-100 font-bold">
                {/* Followers Count */}
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-900/60 border border-emerald-600/40 text-emerald-200 text-[11px]"
                  title="Yorumlarınıza ve puanlamalarınıza gelen beğenilerle artan takipçi kitleniz"
                >
                  <Users className="w-3.5 h-3.5 text-amber-300" />
                  <span><strong className="text-white font-mono font-black text-xs">{followersCount}</strong> Takipçi</span>
                </div>

                {/* Following Count */}
                <button
                  type="button"
                  onClick={() => setActiveTab('following')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-700/80 border border-emerald-600/40 hover:border-emerald-400 text-emerald-200 hover:text-white text-[11px] transition cursor-pointer"
                  title="Takip ettiğiniz yorumcuları listele"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span><strong className="text-white font-mono font-black text-xs">{followingCount}</strong> Takip Edilen</span>
                </button>

                <span className="text-emerald-400/60 hidden sm:inline">•</span>

                <span className="flex items-center gap-1 text-[11px] text-emerald-300/90">
                  <MapPin className="w-3 h-3 text-emerald-300" />
                  {userProfile.city || 'Türkiye'}
                </span>

                <span className="flex items-center gap-1 text-[11px] text-emerald-300/90">
                  <Calendar className="w-3 h-3 text-emerald-300" />
                  {userProfile.memberSince || '2026'}
                </span>
              </div>
            </div>
          </div>

          {/* Level Progress Bar Strip */}
          <div
            onClick={() => setActiveTab('level')}
            className="mt-4 bg-emerald-950/60 hover:bg-emerald-950/80 border border-emerald-700/50 rounded-2xl p-3 sm:p-3.5 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{userLevelInfo.badgeEmoji}</span>
                <span className="font-black text-white">Seviye {userLevelInfo.level}:</span>
                <span className="font-bold text-amber-300">{userLevelInfo.title}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-200">
                <span className="text-amber-300">{userLevelInfo.currentXp.toLocaleString('tr-TR')} XP</span>
                <span className="text-emerald-500">/</span>
                <span>{userLevelInfo.nextLevelXp.toLocaleString('tr-TR')} XP</span>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded font-black text-[10px]">
                  %{userLevelInfo.progressPercentage}
                </span>
              </div>
            </div>

            {/* Visual Bar */}
            <div className="w-full bg-emerald-900/90 rounded-full h-2.5 overflow-hidden p-0.5 border border-emerald-700/60 relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 transition-all duration-500 relative shadow-sm"
                style={{ width: `${Math.max(4, userLevelInfo.progressPercentage)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-emerald-300/80 mt-1.5 font-medium">
              <span>Beğenilerle level atlayın (Her beğeni +25 XP)</span>
              <span className="text-amber-300 group-hover:underline font-bold flex items-center gap-0.5">
                <span>Detaylı Level Ağacı</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Toast Notification */}
          {saveNotification && (
            <div className="mt-3 bg-emerald-500 text-white text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 shadow-md animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profil bilgileriniz başarıyla kaydedildi ve güncellendi.</span>
            </div>
          )}

          {/* Navigation Subtabs */}
          <div className="flex items-center gap-1.5 mt-4 border-t border-emerald-700/60 pt-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-white text-emerald-900 shadow-sm font-black'
                  : 'text-emerald-100 hover:bg-emerald-700/50'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profil</span>
            </button>

            <button
              onClick={() => setActiveTab('level')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'level'
                  ? 'bg-amber-400 text-slate-950 shadow-sm font-black'
                  : 'text-emerald-100 hover:bg-emerald-700/50'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Seviye & XP Barı (Lv.{userLevelInfo.level})</span>
            </button>

            <button
              onClick={() => setActiveTab('following')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'following'
                  ? 'bg-white text-emerald-900 shadow-sm font-black'
                  : 'text-emerald-100 hover:bg-emerald-700/50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Takip Edilenler ({followingCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-white text-emerald-900 shadow-sm font-black'
                  : 'text-emerald-100 hover:bg-emerald-700/50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Analiz & İstatistikler</span>
            </button>

            <button
              onClick={() => setActiveTab('badges')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'badges'
                  ? 'bg-amber-400 text-slate-950 shadow-sm font-black'
                  : 'text-emerald-100 hover:bg-emerald-700/50'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Rozetler ({unlockedBadgesCount}/{badges.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          
          {/* TAB 1: Profile & Identity Edit */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Taraftar Kimliği ve Tercihler
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Yorumlarınızda ve puanlamalarınızda görünecek taraftar profilini özelleştirin.
                  </p>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => {
                      setFormData({
                        name: userProfile.name,
                        username: userProfile.username,
                        avatar: userProfile.avatar,
                        bio: userProfile.bio,
                        city: userProfile.city,
                        favoriteTeamId: userProfile.favoriteTeamId,
                        title: userProfile.title,
                      });
                      setIsEditing(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Profili Düzenle</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-4 bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
                  {/* Avatar Picker */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-2">
                      Profil Avatarı Seçin
                    </label>
                    <div className="grid grid-cols-8 gap-2">
                      {AVATAR_OPTIONS.map((av) => (
                        <button
                          key={av}
                          type="button"
                          onClick={() => setFormData({ ...formData, avatar: av })}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition border-2 ${
                            formData.avatar === av
                              ? 'border-emerald-600 bg-emerald-50 scale-105 shadow-sm'
                              : 'border-slate-200 hover:border-emerald-300 bg-slate-50'
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nickname & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Takma Ad / Rumuz (Nickname)
                      </label>
                      <input
                        type="text"
                        value={formData.nickname}
                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value, name: e.target.value })}
                        required
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-200 transition"
                        placeholder="Örn: KralForvet, TaktikUstasi"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        E-posta Adresi
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-200 transition"
                        placeholder="ornek@email.com"
                      />
                    </div>
                  </div>

                  {/* Handle & Title */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kullanıcı Adı (@handle)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">@</span>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          required
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl pl-7 pr-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-200 transition font-mono"
                          placeholder="tribun_analisti"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Analist Unvanı
                      </label>
                      <select
                        value={FAN_TITLES.includes(formData.title) ? formData.title : ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-200 transition"
                      >
                        <option value="" disabled>
                          Unvan seçiniz
                        </option>
                        {FAN_TITLES.map((title) => (
                          <option key={title} value={title}>
                            {title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Favorite Team & City */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Tuttuğunuz Süper Lig Kulübü
                        </label>
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          Puanlama Kulübünüz
                        </span>
                      </div>
                      <select
                        value={SUPER_LIG_TEAMS.some((t) => t.id === formData.favoriteTeamId) ? formData.favoriteTeamId : ''}
                        onChange={(e) => setFormData({ ...formData, favoriteTeamId: e.target.value })}
                        required
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-200 transition"
                      >
                        <option value="" disabled>
                          Kulüp seçiniz
                        </option>
                        {SUPER_LIG_TEAMS.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.badge} {team.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-500 mt-1">
                        ⚡ Kural gereği yalnızca seçtiğiniz bu kulübün oyuncularına puan ve yorum kaydedebilirsiniz.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Şehir / Bölge
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-200 transition"
                        placeholder="Örn: İstanbul, Kadıköy"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Hakkımda & Futbol Felsefesi (Bio)
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition resize-none"
                      placeholder="Favori taktik dizilişiniz, futbol anlayışınız ve yorum tarzınız..."
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-md"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Değişiklikleri Kaydet</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {/* Account status header banner */}
                  {!isRegistered ? (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-base shrink-0 mt-0.5">
                          <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">
                            Misafir Modundasınız
                          </h4>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Yorum ve puanlama yapmak için hızlıca kayıt olun. Rumuz ve e-posta belirleyerek taraftar liginde yerinizi alın.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          setIsQuickRegisterOpen(true);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl transition shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Hızlı Kayıt Ol</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-base shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900">
                              Kayıtlı & Onaylı Taraftar Hesabı
                            </h4>
                            <span className="bg-emerald-200 text-emerald-900 text-[10px] font-black px-1.5 py-0.2 rounded-md">
                              Aktif
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{userProfile.email || 'E-posta tanımlı'}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          logoutUser();
                          setIsEditing(false);
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs rounded-xl transition shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Misafir moduna dön"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Çıkış Yap</span>
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                        Kulüp ve Taraftar Bilgisi
                      </h4>
                      <div className="flex items-center gap-3">
                        <TeamLogo
                          teamId={userProfile.favoriteTeamId}
                          teamName={userProfile.favoriteTeamName}
                          size="lg"
                          shape="rounded"
                          className="shrink-0 ring-1 ring-slate-200 shadow-xs"
                        />
                        <div>
                          <p className="text-sm font-black text-slate-900">
                            {userProfile.favoriteTeamName}
                          </p>
                          <p className="text-xs text-emerald-700 font-bold">
                            {isRegistered ? 'Kayıtlı Taraftar' : 'Misafir Taraftar'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                        Topluluk Durumu & Seviye
                      </h4>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl shadow-inner border border-amber-300">
                          <Trophy className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">
                            {userProfile.title}
                          </p>
                          <p className="text-xs text-slate-500 font-medium">
                            {totalReviewsCount} değerlendirme • {unlockedBadgesCount} rozet
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Level & XP Progression Bar System */}
          {activeTab === 'level' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Main Level Progress Banner */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white p-5 sm:p-6 rounded-3xl border border-emerald-500/30 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 flex items-center justify-center text-3xl font-black shadow-lg">
                      {userLevelInfo.badgeEmoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                          Yorumcu Kademesi
                        </span>
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Seviye {userLevelInfo.level}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {userLevelInfo.title}
                      </h3>
                    </div>
                  </div>

                  <div className="text-left sm:text-right bg-slate-800/80 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-slate-700 sm:border-0">
                    <p className="text-xs text-slate-400 font-bold">Toplam Kazanılan XP</p>
                    <p className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                      {userLevelInfo.currentXp.toLocaleString('tr-TR')} <span className="text-xs text-slate-300 font-sans">XP</span>
                    </p>
                  </div>
                </div>

                {/* Main Level Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span className="text-emerald-300">
                      Mevcut: {userLevelInfo.currentXp.toLocaleString('tr-TR')} XP
                    </span>
                    <span className="text-amber-300">
                      Hedef: {userLevelInfo.nextLevelXp.toLocaleString('tr-TR')} XP (%{userLevelInfo.progressPercentage})
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-4 p-0.5 border border-slate-700 relative overflow-hidden shadow-inner">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-300 to-yellow-200 transition-all duration-700 relative shadow-sm"
                      style={{ width: `${Math.max(3, userLevelInfo.progressPercentage)}%` }}
                    >
                      <div className="absolute inset-0 bg-white/25 animate-pulse rounded-full" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>
                      {userLevelInfo.remainingXp > 0
                        ? `Sonraki seviyeye yükselmek için ${userLevelInfo.remainingXp} XP gerekiyor.`
                        : '🎉 Tebrikler! Zirve seviyeye ulaştınız.'}
                    </span>
                    <span className="text-amber-400 font-bold">
                      {userLevelInfo.xpInLevel} / {userLevelInfo.xpNeededForLevel} Seviye Puanı
                    </span>
                  </div>
                </div>
              </div>

              {/* XP Breakdown by Activity */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  XP Kazanım ve Beğeni Detayları
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                        Gelen Beğeniler
                      </span>
                      <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                        ×25 XP
                      </span>
                    </div>
                    <p className="text-2xl font-black text-rose-600 font-mono">
                      +{userLevelInfo.likesXp} <span className="text-xs font-sans text-slate-400">XP</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Yorumlarınıza gelen toplam <strong>{userLevelInfo.totalLikesReceived}</strong> beğeni
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                        Değerlendirmeler
                      </span>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                        ×50 XP
                      </span>
                    </div>
                    <p className="text-2xl font-black text-emerald-700 font-mono">
                      +{userLevelInfo.reviewsXp} <span className="text-xs font-sans text-slate-400">XP</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Yazdığınız <strong>{userLevelInfo.reviewsCount}</strong> oyuncu/hoca analizi
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        Verilen Cevaplar
                      </span>
                      <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                        ×20 XP
                      </span>
                    </div>
                    <p className="text-2xl font-black text-blue-600 font-mono">
                      +{userLevelInfo.repliesXp} <span className="text-xs font-sans text-slate-400">XP</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Yorumlara yazdığınız <strong>{userLevelInfo.repliesCount}</strong> yanıt
                    </p>
                  </div>
                </div>
              </div>

              {/* How to Level Up Guide */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 text-base shadow-xs">
                  💡
                </div>
                <div className="space-y-1 text-xs">
                  <h5 className="font-black text-amber-950">Level Sistemi Nasıl Çalışır?</h5>
                  <p className="text-amber-900 leading-relaxed font-medium">
                    Yaptığınız oyuncu ve teknik direktör değerlendirmelerine diğer futbolseverler beğeni (👍) verdikçe <strong>her beğeni için +25 XP</strong> kazanırsınız. Toplulukta beğeni topladıkça level barınız hızla dolar ve rozetiniz yükselir!
                  </p>
                </div>
              </div>

              {/* All Level Tiers Roadmap */}
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-emerald-600" />
                  Tüm Yorumcu Kademeleri & Seviyeler
                </h4>

                <div className="space-y-2">
                  {LEVEL_TIERS.map((tier) => {
                    const isCurrent = tier.level === userLevelInfo.level;
                    const isUnlocked = userLevelInfo.currentXp >= tier.minXp;

                    return (
                      <div
                        key={tier.level}
                        className={`p-3.5 rounded-2xl border-2 transition flex items-center justify-between gap-3 ${
                          isCurrent
                            ? 'bg-amber-50 border-amber-400 shadow-sm ring-1 ring-amber-300'
                            : isUnlocked
                            ? 'bg-white border-emerald-200/80'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold shrink-0 ${
                              isCurrent
                                ? 'bg-amber-400 text-slate-950 shadow-xs'
                                : isUnlocked
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {tier.emoji}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-900">
                                Seviye {tier.level}: {tier.title}
                              </span>
                              {isCurrent && (
                                <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded shadow-2xs">
                                  Şu Anki Seviyeniz
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono">
                              Gereken: <strong>{tier.minXp.toLocaleString('tr-TR')} XP</strong>
                            </p>
                          </div>
                        </div>

                        <div>
                          {isUnlocked ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Açık</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                              <span>🔒 Kilitli</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Following List (Takip Edilen Yorumcular) */}
          {activeTab === 'following' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Takip Ettiğiniz Yorumcular ({followedCommentators.length})</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Değerlendirmelerini ve maç notlarını yakından izlediğiniz futbolseverler.
                  </p>
                </div>

                {/* Search in followed */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={followingSearch}
                    onChange={(e) => setFollowingSearch(e.target.value)}
                    placeholder="Yorumcu ara..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl text-xs text-slate-900 font-bold focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Followed Commentators List */}
              {followedCommentators.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-slate-900">Henüz kimseyi takip etmiyorsunuz</h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Maç detaylarında ve tüm değerlendirmeler sayfasında ilginizi çeken yorumcuların yanındaki <strong>"Takip Et"</strong> butonuna tıklayarak onları listenize ekleyin.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {followedCommentators
                    .filter((c) =>
                      c.name.toLowerCase().includes(followingSearch.toLowerCase()) ||
                      (c.fanOf && c.fanOf.toLowerCase().includes(followingSearch.toLowerCase()))
                    )
                    .map((commentator) => (
                      <div
                        key={commentator.id}
                        className="bg-white border border-slate-200/80 hover:border-emerald-300 rounded-2xl p-4 transition shadow-xs flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-base font-bold shadow-2xs shrink-0">
                            {commentator.avatar || '👤'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-black text-slate-900 truncate">
                                {commentator.name}
                              </span>
                              <CommentatorLevelBadge authorName={commentator.name} size="xs" />
                            </div>
                            <p className="text-[11px] text-slate-500 truncate font-medium">
                              {commentator.fanOf ? `${commentator.fanOf} Taraftarı` : 'Futbol Sever'}
                            </p>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              {commentator.followedAt}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => unfollowUser(commentator.name)}
                          className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition flex items-center gap-1 shrink-0 cursor-pointer"
                          title="Takibi Bırak"
                        >
                          <UserMinus className="w-3 h-3" />
                          <span className="hidden sm:inline">Bırak</span>
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Stats & Analysis */}
          {activeTab === 'stats' && (
            <div className="space-y-5">
              {/* Quick 4-box metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs text-center">
                  <p className="text-xs text-slate-500 font-bold">Toplam Not</p>
                  <p className="text-2xl font-black text-emerald-700 font-mono mt-1">
                    {totalReviewsCount}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Değerlendirme</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs text-center">
                  <p className="text-xs text-slate-500 font-bold">Not Ortalamanız</p>
                  <p className="text-2xl font-black text-amber-500 font-mono mt-1">
                    {avgRatingGiven ? avgRatingGiven.toFixed(1) : '—'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">10 üzerinden</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs text-center">
                  <p className="text-xs text-slate-500 font-bold">Toplanan Beğeni</p>
                  <p className="text-2xl font-black text-rose-500 font-mono mt-1">
                    {totalLikesReceived}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Topluluk Alkışı</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs text-center">
                  <p className="text-xs text-slate-500 font-bold">Kazanılan Rozet</p>
                  <p className="text-2xl font-black text-indigo-600 font-mono mt-1">
                    {unlockedBadgesCount} / {badges.length}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Başarı Kilidi</p>
                </div>
              </div>

              {/* Analysis Highlights */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Yorumculuk Eğilimleriniz
                </h4>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-slate-600">Yüksek Puan Cömertliği (8.0 ve Üzeri)</span>
                      <span className="text-emerald-600 font-mono">
                        {userReviews.filter((r) => r.rating >= 8.0).length} oyuncu
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            totalReviewsCount > 0
                              ? (userReviews.filter((r) => r.rating >= 8.0).length / totalReviewsCount) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-slate-600">Orta Seviye Notlar (6.0 - 7.9)</span>
                      <span className="text-amber-600 font-mono">
                        {userReviews.filter((r) => r.rating >= 6.0 && r.rating < 8.0).length} oyuncu
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            totalReviewsCount > 0
                              ? (userReviews.filter((r) => r.rating >= 6.0 && r.rating < 8.0).length / totalReviewsCount) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-slate-600">Sert ve Kritik Notlar (6.0 Altı)</span>
                      <span className="text-rose-600 font-mono">
                        {userReviews.filter((r) => r.rating < 6.0).length} oyuncu
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            totalReviewsCount > 0
                              ? (userReviews.filter((r) => r.rating < 6.0).length / totalReviewsCount) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: My Reviews & Ratings List */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {/* Search & Filter bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    placeholder="Oyuncu veya yorum ara..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl w-full sm:w-auto justify-center">
                  <button
                    onClick={() => setReviewRatingFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      reviewRatingFilter === 'all'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Tümü ({userReviews.length})
                  </button>
                  <button
                    onClick={() => setReviewRatingFilter('high')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      reviewRatingFilter === 'high'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Yüksek Notlar (★7.5+)
                  </button>
                  <button
                    onClick={() => setReviewRatingFilter('low')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      reviewRatingFilter === 'low'
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Düşük Notlar (&lt;6.0)
                  </button>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-3">
                {filteredReviews.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                    <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">
                      Henüz kriterlere uygun bir değerlendirme bulunamadı.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Maçlardaki herhangi bir oyuncuya tıklayarak ilk notunuzu bırakabilirsiniz.
                    </p>
                  </div>
                ) : (
                  filteredReviews.map((review) => {
                    const match = matches.find((m) => m.id === review.matchId);
                    const player = match
                      ? [...match.homePlayers, ...match.awayPlayers].find((p) => p.id === review.playerId)
                      : null;

                    return (
                      <div
                        key={review.id}
                        className="bg-white border-2 border-slate-100 hover:border-emerald-300 rounded-2xl p-4 transition shadow-xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-mono font-black text-xs shadow-sm">
                              {player?.number || '#'}
                            </div>
                            <div>
                              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                                {player?.name || 'Oyuncu'}
                              </h4>
                              <p className="text-[10px] text-slate-500 font-bold">
                                {match ? `${match.homeTeam.name} vs ${match.awayTeam.name}` : 'Süper Lig'} • {review.createdAt}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl shadow-xs">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className="font-mono font-black text-xs text-slate-900">
                                {review.rating.toFixed(1)}
                              </span>
                            </div>

                            <button
                              onClick={() => deleteReview(review.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Yorumu Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {review.comment && (
                          <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed font-medium">
                            "{review.comment}"
                          </p>
                        )}

                        {review.tags && review.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {review.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-100"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-[11px]">
                          <div className="flex items-center gap-1 text-slate-500 font-medium">
                            <ThumbsUp className="w-3 h-3 text-slate-400" />
                            <span>{review.likes || 0} beğeni</span>
                          </div>

                          {match && player && (
                            <button
                              onClick={() => handleJumpToPlayer(match.id, player.id)}
                              className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 text-[11px] hover:underline"
                            >
                              <span>Oyuncu Detayına Git</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
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
            </div>
          )}

          {/* TAB 4: Badges & Achievements */}
          {activeTab === 'badges' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-50 to-amber-100/60 p-4 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-amber-950">
                    Taraftar Başarı İlerlemesi
                  </h4>
                  <p className="text-xs text-amber-800 font-medium mt-0.5">
                    {unlockedBadgesCount} / {badges.length} Rozet Kazanıldı
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
                  {Math.round((unlockedBadgesCount / badges.length) * 100)}%
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {badges.map((b) => (
                  <div
                    key={b.id}
                    className={`p-4 rounded-2xl border-2 transition flex items-start gap-3.5 ${
                      b.unlocked
                        ? 'bg-white border-emerald-200 shadow-xs'
                        : 'bg-slate-100/80 border-slate-200 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner ${
                        b.unlocked ? 'bg-emerald-100' : 'bg-slate-200'
                      }`}
                    >
                      {b.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs sm:text-sm font-black text-slate-900">
                          {b.title}
                        </h5>
                        {b.unlocked ? (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                            Açıldı ✓
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded-md">
                            Kilitli 🔒
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        {b.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
