import React, { useState } from 'react';
import { Trophy, X, ChevronUp, ChevronDown, Maximize2, Minimize2, Shield, Activity } from 'lucide-react';
import { LeagueStandingsCard } from './LeagueStandingsCard';
import { SUPER_LIG_STANDINGS_2026 } from '../data/superLigStandings';
import { TeamLogo } from './TeamLogo';
import { useApp } from '../context/AppContext';

export const FloatingLeagueStandings: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullView, setIsFullView] = useState(false);
  const { standings, standingsMeta } = useApp();
  const table = standings.length > 0 ? standings : SUPER_LIG_STANDINGS_2026;
  const leader = table[0];
  const updatedLabel = standingsMeta.updatedAt
    ? new Date(standingsMeta.updatedAt).toLocaleDateString('tr-TR')
    : `${standingsMeta.seasonLabel}`;

  return (
    <>
      {/* Floating Bottom-Right Trigger Button / Pill */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end">
        {!isOpen && (
          <button
            id="floating-standings-trigger"
            type="button"
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2 bg-slate-900/95 hover:bg-emerald-700 text-white pl-2.5 pr-3 sm:pl-3.5 sm:pr-4 py-2 sm:py-2.5 rounded-full shadow-2xl border-2 border-emerald-400/40 hover:border-emerald-300 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 active:scale-95 max-w-[calc(100vw-2rem)]"
            title="Süper Lig Puan Durumu"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-black shadow-inner">
              <Trophy className="w-3.5 h-3.5" />
            </div>

            <div className="text-left flex flex-col">
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="text-xs font-black tracking-tight text-white group-hover:text-emerald-100">
                  Puan Durumu
                </span>
                <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                  {standingsMeta.week}. Hafta
                </span>
              </div>
              <div className="text-[10px] text-slate-300 font-medium leading-none mt-1 flex items-center gap-1">
                <span>Lider:</span>
                {leader && <TeamLogo team={leader} size="xs" shape="circle" showShadow={false} />}
                <span>{leader ? `${leader.shortName} (${leader.points}P)` : 'Yükleniyor'}</span>
              </div>
            </div>

            <ChevronUp className="w-4 h-4 text-emerald-400 group-hover:text-white transition ml-1" />
          </button>
        )}

        {/* Floating Expanded Popover Modal / Widget */}
        {isOpen && (
          <div
            id="floating-standings-popup"
            className={`bg-white rounded-3xl shadow-2xl border-2 border-emerald-500/30 overflow-hidden flex flex-col transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
              isFullView
                ? 'fixed inset-3 sm:inset-6 md:inset-10 lg:inset-x-auto lg:right-6 lg:bottom-6 lg:top-16 lg:w-[620px] z-50'
                : 'w-[min(95vw,calc(100vw-1.5rem))] sm:w-[480px] max-w-[calc(100vw-1.5rem)] max-h-[82vh] z-50'
            }`}
          >
            {/* Popover Top Bar */}
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-tight flex items-center gap-1.5">
                    <span>Trendyol Süper Lig Puan Tablosu</span>
                    <span className="text-[10px] bg-emerald-800 text-emerald-200 px-1.5 py-0.2 rounded">
                      {updatedLabel}
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400">{standingsMeta.seasonLabel} • {standingsMeta.week}. Hafta Sıralaması</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsFullView(!isFullView)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title={isFullView ? 'Küçült' : 'Büyüt'}
                >
                  {isFullView ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-rose-900/50 hover:text-rose-300 transition"
                  title="Kapat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Standings Component Inside Popover */}
            <div className="flex-1 overflow-y-auto p-3">
              <LeagueStandingsCard className="border-0 shadow-none p-1" />
            </div>

            {/* Bottom Footer Info */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 text-[10px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1 font-medium">
                <Activity className="w-3 h-3 text-emerald-600" />
                <span>API-SPORTS güncel Süper Lig verisi</span>
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-black text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
