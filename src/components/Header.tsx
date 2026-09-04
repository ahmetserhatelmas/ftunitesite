import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, Calendar, Search, Star, MessageSquare, ChevronLeft, ChevronRight, Shield, Crown, LayoutGrid, RefreshCw, Radio, CheckCircle2, User, UserPlus, Flame, TrendingUp, Briefcase } from 'lucide-react';
import { SearchAutocomplete } from './SearchAutocomplete';

interface HeaderProps {
  onOpenAddMatch?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const {
    leagues,
    selectedLeagueId,
    setSelectedLeagueId,
    selectedWeek,
    setSelectedWeek,
    activeView,
    setActiveView,
    searchQuery,
    setSearchQuery,
    reviews,
    setIsMyReviewsOpen,
    getUserReviews,
    myReviewsRepliesCount,
    markAllRepliesAsRead,
    simulateIncomingReply,
    userProfile,
    isRegistered,
    setIsProfileOpen,
    setIsQuickRegisterOpen,
    lastLiveSyncTime,
    liveDataSource,
    userLevelInfo,
  } = useApp();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const currentLeague = leagues.find(l => l.id === selectedLeagueId) || leagues[0];
  const userReviewsCount = getUserReviews().length;
  const totalReviewsCount = reviews.length;

  const handlePrevWeek = () => {
    if (selectedWeek > 1) {
      setSelectedWeek(selectedWeek - 1);
    }
  };

  const handleNextWeek = () => {
    if (selectedWeek < currentLeague.totalWeeks) {
      setSelectedWeek(selectedWeek + 1);
    }
  };

  return (
    <header className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white shadow-lg sticky top-0 z-40">
      <div className="w-full max-w-[1760px] mx-auto px-3 sm:px-5 lg:px-7">
        
        {/* Main top bar - Brand, Search & Quick Status */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          
          {/* Logo & Brand */}
          <div 
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group"
            onClick={() => setActiveView('pitch')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md ring-2 ring-emerald-500 group-hover:scale-105 transition shrink-0">
              <span className="text-sm sm:text-base tracking-tighter">FU</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-xl tracking-tight text-white group-hover:text-amber-300 transition whitespace-nowrap">
                  FUTBOL UNITE
                </span>
                <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-md shadow-xs uppercase tracking-wider flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-ping"></span>
                  CANLI LİG
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 font-medium hidden md:block">
                Canlı Süper Lig Oyuncu Kadroları, Maç Sonuçları & Taraftar Puanlama Merkezi
              </p>
            </div>
          </div>

          {/* Search Bar with Dropdown Autocomplete */}
          <SearchAutocomplete />

          {/* Week Selector in top right */}
          <div className="flex items-center gap-1.5 bg-emerald-950/60 p-1 rounded-xl border border-emerald-600/60 shrink-0">
            <button
              id="prev-week-btn"
              onClick={handlePrevWeek}
              disabled={selectedWeek <= 1}
              className="p-1 rounded-lg hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition text-emerald-200 hover:text-white"
              title="Önceki Hafta"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-1.5 sm:px-2 font-mono font-black text-xs text-white">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{selectedWeek}. HAFTA</span>
            </div>

            <button
              id="next-week-btn"
              onClick={handleNextWeek}
              disabled={selectedWeek >= currentLeague.totalWeeks}
              className="p-1 rounded-lg hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition text-emerald-200 hover:text-white"
              title="Sonraki Hafta"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Bottom Section of Top Panel - Fixed side-by-side Navigation & Action Buttons */}
        <div className="py-2.5 border-t border-emerald-600/60 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
          
          {/* Side-by-Side Main Action & Navigation Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Maç / Saha Görünümü Button */}
            <button
              id="pitch-view-button"
              onClick={() => setActiveView('pitch')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap ${
                activeView === 'pitch' || activeView === 'list'
                  ? 'bg-emerald-500 text-white ring-2 ring-white shadow-md font-black'
                  : 'bg-emerald-700/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/60'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Maç & Saha</span>
            </button>

            {/* 1. GENEL OYUNCU PUANLARI (Bütün puanlamalar sonucu oluşan puan tablosu) */}
            <button
              id="weekly-ranking-button"
              onClick={() => setActiveView('ranking')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap cursor-pointer ${
                activeView === 'ranking'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-white shadow-md font-black'
                  : 'bg-emerald-700/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/60'
              }`}
            >
              <Crown className={`w-3.5 h-3.5 ${activeView === 'ranking' ? 'fill-slate-950 text-slate-950' : 'text-amber-300 fill-amber-300'}`} />
              <span>Genel Oyuncu Puanları</span>
            </button>

            {/* TEKNİK DİREKTÖR SIRALAMASI (Ayrı buton ve teknik direktör puan sıralaması) */}
            <button
              id="manager-ranking-button"
              onClick={() => setActiveView('managers')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap cursor-pointer ${
                activeView === 'managers'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-white shadow-md font-black'
                  : 'bg-emerald-700/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/60'
              }`}
            >
              <Briefcase className={`w-3.5 h-3.5 ${activeView === 'managers' ? 'text-slate-950' : 'text-amber-300'}`} />
              <span>Teknik Direktör Sıralaması</span>
            </button>

            {/* 2. HAFTA HAFTA OYUNCU PUANLARI (Bütün haftalarda oyuncu puan ortalamaları) */}
            <button
              id="all-weeks-ratings-button"
              onClick={() => setActiveView('player-history')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap cursor-pointer ${
                activeView === 'player-history'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-white shadow-md font-black'
                  : 'bg-emerald-700/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/60'
              }`}
            >
              <TrendingUp className={`w-3.5 h-3.5 ${activeView === 'player-history' ? 'text-slate-950' : 'text-amber-300'}`} />
              <span>Hafta Hafta Puanlar</span>
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                activeView === 'player-history' ? 'bg-slate-900 text-amber-300' : 'bg-emerald-950 text-emerald-200'
              }`}>
                1-4. Hafta
              </span>
            </button>

            {/* 2. KİŞİSEL PUANLAMA & YORUMLARIM (Kullanıcının kendi puan ve değerlendirme ekranı) */}
            <button
              id="my-reviews-view-button"
              onClick={() => {
                setActiveView('my-reviews');
                markAllRepliesAsRead();
              }}
              className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap cursor-pointer ${
                activeView === 'my-reviews'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-white shadow-md font-black'
                  : 'bg-emerald-700/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/60'
              }`}
            >
              <User className={`w-3.5 h-3.5 ${activeView === 'my-reviews' ? 'text-slate-950' : 'text-emerald-300'}`} />
              <span>Kişisel Puanlarım & Yorumlarım</span>
              
              {userReviewsCount > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-sm ml-0.5 ${
                  activeView === 'my-reviews' ? 'bg-slate-900 text-amber-300' : 'bg-orange-500 text-white'
                }`}>
                  {userReviewsCount}
                </span>
              )}

              {/* Kırmızı Bildirim Noktası & Sayacı (Sadece Rakam) */}
              {myReviewsRepliesCount > 0 && (
                <span
                  id="my-reviews-floating-red-dot"
                  className="absolute -top-2 -right-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-black text-white shadow-xl ring-2 ring-white animate-bounce z-20"
                  title={`Yorumlarınıza ${myReviewsRepliesCount} yeni cevap`}
                >
                  {myReviewsRepliesCount}
                </span>
              )}
            </button>

            {/* 3. Haftanın 11'i (Altın Kadro) */}
            <button
              id="totw-view-button"
              onClick={() => setActiveView('totw')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap ${
                activeView === 'totw'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-white shadow-md font-black'
                  : 'bg-emerald-700/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/60'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${activeView === 'totw' ? 'fill-slate-950 text-slate-950' : 'fill-amber-300 text-amber-300'}`} />
              <span>Haftanın 11'i</span>
            </button>

            {/* 4. Tüm Yorumlar & Tribün Akışı Button */}
            <button
              id="all-reviews-view-button"
              onClick={() => setActiveView('all-reviews')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap ${
                activeView === 'all-reviews'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-white shadow-md font-black'
                  : 'bg-emerald-700/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/60'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${activeView === 'all-reviews' ? 'fill-slate-950 text-slate-950' : 'text-amber-300'}`} />
              <span>Tüm Yorumlar & Akış</span>
              {totalReviewsCount > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-sm ml-0.5 ${
                  activeView === 'all-reviews' ? 'bg-slate-900 text-amber-300' : 'bg-emerald-950 text-amber-300 border border-emerald-500'
                }`}>
                  {totalReviewsCount}
                </span>
              )}
            </button>

            {/* Profil / Kayıt Ol Button */}
            {isRegistered ? (
              <button
                id="profile-panel-button"
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-white text-slate-900 hover:bg-amber-50 hover:text-emerald-900 transition shadow-sm border border-white whitespace-nowrap cursor-pointer group"
                title="Profil Paneli ve Taraftar İstatistikleri"
              >
                <span className="text-sm">{userProfile.avatar || '⚽'}</span>
                <span>{userProfile.nickname || userProfile.name}</span>
                <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300/80 px-1.5 py-0.2 rounded-md font-mono font-bold">
                  Lv.{userLevelInfo.level}
                </span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-mono font-bold">
                  {userProfile.favoriteTeamBadge}
                </span>
              </button>
            ) : (
              <button
                id="quick-register-header-button"
                onClick={() => setIsQuickRegisterOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 transition shadow-md whitespace-nowrap cursor-pointer hover:scale-105 active:scale-95 animate-pulse"
                title="Yorum ve puanlama yapmak için hızlı kayıt ol"
              >
                <UserPlus className="w-3.5 h-3.5 text-slate-950" />
                <span>Kayıt Ol / Giriş</span>
                <span className="bg-slate-950 text-amber-300 text-[9px] px-1 py-0.2 rounded font-black">
                  Hızlı
                </span>
              </button>
            )}
          </div>

          {/* Live Stream Status info */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-emerald-200 font-medium shrink-0" title={`Canlı Veri Kaynağı: ${liveDataSource}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-bold text-white bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded-md">
              📡 Canlı: {lastLiveSyncTime}
            </span>
          </div>

        </div>

      </div>
    </header>
  );
};
