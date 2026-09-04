import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { WeeklyMatchSlider } from './components/WeeklyMatchSlider';
import { MatchHero } from './components/MatchHero';
import { TacticalPitch } from './components/TacticalPitch';
import { RosterListView } from './components/RosterListView';
import { MatchSidePanel } from './components/MatchSidePanel';
import { TotwView } from './components/TotwView';
import { WeeklyLeaderboardView } from './components/WeeklyLeaderboardView';
import { ManagerLeaderboardView } from './components/ManagerLeaderboardView';
import { AllWeeksPlayerRatingsView } from './components/AllWeeksPlayerRatingsView';
import { AllReviewsView } from './components/AllReviewsView';
import { PersonalReviewsView } from './components/PersonalReviewsView';
import { HomeReviewsPanel } from './components/HomeReviewsPanel';
import { PlayerReviewDrawer } from './components/PlayerReviewDrawer';
import { ManagerReviewDrawer } from './components/ManagerReviewDrawer';
import { MyReviewsModal } from './components/MyReviewsModal';
import { ProfileModal } from './components/ProfileModal';
import { SpamReportModal } from './components/SpamReportModal';
import { QuickRegisterModal } from './components/QuickRegisterModal';
import { FloatingLeagueStandings } from './components/FloatingLeagueStandings';

function MainAppContent() {
  const { activeView } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-emerald-500 selection:text-white font-sans antialiased">
      {/* Navigation Header */}
      <Header />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {activeView === 'my-reviews' ? (
          <PersonalReviewsView />
        ) : activeView === 'player-history' ? (
          <AllWeeksPlayerRatingsView />
        ) : activeView === 'all-reviews' ? (
          <AllReviewsView />
        ) : activeView === 'totw' ? (
          <TotwView />
        ) : activeView === 'ranking' ? (
          <WeeklyLeaderboardView />
        ) : activeView === 'managers' ? (
          <ManagerLeaderboardView />
        ) : (
          <div className="w-full max-w-[1760px] mx-auto px-3 sm:px-5 lg:px-7 pt-4 space-y-5">
            {/* Weekly Matches Browser Horizontal Ribbon */}
            <WeeklyMatchSlider />

            {/* Main 2-Column Responsive Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Major Workspace: Score Hero + Tactical Pitch / Roster */}
              <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-4">
                <MatchHero />
                {activeView === 'pitch' ? <TacticalPitch /> : <RosterListView />}
              </div>

              {/* Right Side Panel: MOTM Leaderboard, Community Reviews Feed, Timeline */}
              <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 space-y-4">
                <MatchSidePanel />
              </div>
            </div>

            {/* Home Page Dedicated All Reviews & Comments Hub Panel */}
            <HomeReviewsPanel />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-100 bg-white py-6 px-4 text-xs text-slate-500 shadow-inner">
        <div className="w-full max-w-[1760px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-white font-black text-xs">
              FU
            </div>
            <span className="font-black text-slate-800 tracking-tight">FUTBOL UNITE</span>
            <span>—</span>
            <span className="font-medium text-slate-600">Trendyol Süper Lig Canlı Futbolcu Performans & Taraftar Yorum Platformu</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold text-slate-600">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Canlı Sistem Aktif</span>
            <span>👔 Teknik Direktörler</span>
            <span>🔥 Tüm Yorumlar Akışı</span>
            <span>👑 Haftanın Sıralaması</span>
            <span>★ Altın 11</span>
          </div>
        </div>
      </footer>

      {/* Drawers & Modals */}
      <PlayerReviewDrawer />
      <ManagerReviewDrawer />
      <MyReviewsModal />
      <ProfileModal />
      <SpamReportModal />
      <QuickRegisterModal />
      
      {/* Floating Bottom-Right League Standings Widget */}
      <FloatingLeagueStandings />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
