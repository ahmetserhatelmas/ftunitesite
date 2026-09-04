import React, { useState } from 'react';
import { SUPER_LIG_STANDINGS_2026, StandingTeam } from '../data/superLigStandings';
import { Trophy, TrendingUp, ChevronDown, ChevronUp, Search, Shield, Info, Sparkles, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TeamLogo } from './TeamLogo';

interface LeagueStandingsProps {
  compact?: boolean;
  highlightTeamIds?: string[];
  onTeamClick?: (teamId: string) => void;
  className?: string;
  maxRows?: number;
}

export const LeagueStandingsCard: React.FC<LeagueStandingsProps> = ({
  compact = false,
  highlightTeamIds = [],
  onTeamClick,
  className = '',
  maxRows,
}) => {
  const { selectedMatch, standings, standingsMeta } = useApp();
  const table = standings.length > 0 ? standings : SUPER_LIG_STANDINGS_2026;
  const [filterMode, setFilterMode] = useState<'all' | 'home' | 'away' | 'form'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLegend, setShowLegend] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compact);

  // Active match teams to highlight if none provided
  const activeHighlightedTeams = highlightTeamIds.length > 0
    ? highlightTeamIds
    : selectedMatch
    ? [selectedMatch.homeTeam.id, selectedMatch.awayTeam.id]
    : [];

  const filteredStandings = table.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.shortName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayList = maxRows && !isExpanded ? filteredStandings.slice(0, maxRows) : filteredStandings;

  const getZoneBadge = (zone?: StandingTeam['zone']) => {
    switch (zone) {
      case 'ucl':
        return <span className="w-1.5 h-full rounded-r bg-emerald-500 absolute left-0 top-0 bottom-0" title="Şampiyonlar Ligi (Grup/Lig)" />;
      case 'ucl-qual':
        return <span className="w-1.5 h-full rounded-r bg-sky-500 absolute left-0 top-0 bottom-0" title="Şampiyonlar Ligi Elemeleri" />;
      case 'uel':
        return <span className="w-1.5 h-full rounded-r bg-amber-500 absolute left-0 top-0 bottom-0" title="UEFA Avrupa Ligi" />;
      case 'uecl':
        return <span className="w-1.5 h-full rounded-r bg-teal-500 absolute left-0 top-0 bottom-0" title="UEFA Konferans Ligi" />;
      case 'relegation':
        return <span className="w-1.5 h-full rounded-r bg-rose-500 absolute left-0 top-0 bottom-0" title="Düşme Hattı" />;
      default:
        return null;
    }
  };

  return (
    <div id="league-standings-card" className={`bg-white border-2 border-emerald-100 rounded-3xl p-4 shadow-sm space-y-3.5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-emerald-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-slate-900 text-sm tracking-tight">Süper Lig Puan Durumu</h3>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.2 rounded border border-emerald-300">
                {standingsMeta.seasonLabel} • {standingsMeta.week}. Hafta
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {standingsMeta.updatedAt
                ? new Date(standingsMeta.updatedAt).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'Canlı API-SPORTS tablosu'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowLegend(!showLegend)}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
            title="Kupa & Düşme Lejantı"
          >
            <Info className="w-4 h-4" />
          </button>

          {maxRows && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition"
              title={isExpanded ? 'Daralt' : 'Tüm Tabloyu Göster'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Legend Popover Info */}
      {showLegend && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-[11px] space-y-1.5 text-slate-600 animate-fadeIn">
          <div className="font-bold text-slate-800 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kupa & Düşme Kontenjanları:</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>1. Şampiyonlar Ligi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
              <span>2. Şampiyonlar Ligi Ön Eleme</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span>3. UEFA Avrupa Ligi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
              <span>4. UEFA Konferans Ligi</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <span>16-19. Trendyol 1. Lig (Düşme Hattı)</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl font-bold">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg transition ${
              filterMode === 'all' ? 'bg-white text-emerald-800 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Genel
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('home')}
            className={`px-2.5 py-1 rounded-lg transition ${
              filterMode === 'home' ? 'bg-white text-emerald-800 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            İç Saha
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('away')}
            className={`px-2.5 py-1 rounded-lg transition ${
              filterMode === 'away' ? 'bg-white text-emerald-800 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dış Saha
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('form')}
            className={`px-2.5 py-1 rounded-lg transition ${
              filterMode === 'form' ? 'bg-white text-emerald-800 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Form
          </button>
        </div>

        {/* Small Search Bar */}
        <div className="relative flex-1 min-w-[120px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Takım ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Standings Table */}
      <div className="overflow-x-auto -mx-1 sm:mx-0">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-black text-slate-400 uppercase tracking-wider">
              <th className="py-2 px-1 text-center w-6">#</th>
              <th className="py-2 px-2">Kulüp</th>
              <th className="py-2 px-1.5 text-center" title="Oynanan">O</th>
              <th className="py-2 px-1.5 text-center" title="Galibiyet">G</th>
              <th className="py-2 px-1.5 text-center" title="Beraberlik">B</th>
              <th className="py-2 px-1.5 text-center" title="Mağlubiyet">M</th>
              {filterMode === 'form' ? (
                <th className="py-2 px-2 text-center">Son 3 Maç</th>
              ) : (
                <>
                  <th className="py-2 px-1.5 text-center" title="Averaj">AV</th>
                  <th className="py-2 px-2 text-center font-black text-slate-800">P</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {displayList.map((t) => {
              const isMatchTeam = activeHighlightedTeams.includes(t.id);
              const played = filterMode === 'home' ? t.home.played : filterMode === 'away' ? t.away.played : t.played;
              const won = filterMode === 'home' ? t.home.won : filterMode === 'away' ? t.away.won : t.won;
              const drawn = filterMode === 'home' ? t.home.drawn : filterMode === 'away' ? t.away.drawn : t.drawn;
              const lost = filterMode === 'home' ? t.home.lost : filterMode === 'away' ? t.away.lost : t.lost;
              const gf = filterMode === 'home' ? t.home.goalsFor : filterMode === 'away' ? t.away.goalsFor : t.goalsFor;
              const ga = filterMode === 'home' ? t.home.goalsAgainst : filterMode === 'away' ? t.away.goalsAgainst : t.goalsAgainst;
              const diff = gf - ga;
              const pts = filterMode === 'home' ? t.home.points : filterMode === 'away' ? t.away.points : t.points;

              return (
                <tr
                  key={t.id}
                  id={`standing-row-${t.id}`}
                  onClick={() => onTeamClick && onTeamClick(t.id)}
                  className={`relative transition group ${
                    isMatchTeam
                      ? 'bg-emerald-50/90 font-bold hover:bg-emerald-100/80 text-emerald-950'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {/* Position Bar */}
                  <td className="py-2.5 px-1 text-center font-mono font-bold text-slate-500 relative">
                    {getZoneBadge(t.zone)}
                    <span className={`inline-block text-[11px] ${t.rank <= 4 ? 'font-black text-slate-900' : ''}`}>
                      {t.rank}
                    </span>
                  </td>

                  {/* Club Logo & Name */}
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-2">
                      <TeamLogo team={t} size="sm" shape="circle" className="shrink-0" />
                      <div className="min-w-0">
                        <span className={`block truncate ${isMatchTeam ? 'text-emerald-900 font-black' : 'text-slate-800 font-bold'}`}>
                          {t.name}
                        </span>
                      </div>
                      {isMatchTeam && (
                        <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded shadow-xs">
                          Maçta
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Stats */}
                  <td className="py-2.5 px-1.5 text-center font-mono text-slate-600">{played}</td>
                  <td className="py-2.5 px-1.5 text-center font-mono text-emerald-700 font-bold">{won}</td>
                  <td className="py-2.5 px-1.5 text-center font-mono text-amber-700">{drawn}</td>
                  <td className="py-2.5 px-1.5 text-center font-mono text-rose-700">{lost}</td>

                  {filterMode === 'form' ? (
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {t.form.map((f, i) => (
                          <span
                            key={i}
                            className={`w-4 h-4 rounded-md text-[9px] font-black font-mono flex items-center justify-center text-white shadow-2xs ${
                              f === 'W' ? 'bg-emerald-500' : f === 'D' ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            title={f === 'W' ? 'Galibiyet' : f === 'D' ? 'Beraberlik' : 'Mağlubiyet'}
                          >
                            {f === 'W' ? 'G' : f === 'D' ? 'B' : 'M'}
                          </span>
                        ))}
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="py-2.5 px-1.5 text-center font-mono text-slate-500">
                        {diff > 0 ? `+${diff}` : diff}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-black text-slate-950 text-sm bg-slate-100/50 group-hover:bg-slate-200/50 rounded-lg">
                        {pts}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Show more toggle if maxRows provided */}
      {maxRows && filteredStandings.length > maxRows && (
        <div className="text-center pt-1 border-t border-slate-100">
          <button
            type="button"
            id="toggle-all-standings-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center justify-center gap-1 mx-auto py-1 px-3 rounded-xl hover:bg-emerald-50 transition"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>İlk {maxRows} Takımı Göster</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Tüm {filteredStandings.length} Takımı Göster ({filteredStandings.length - maxRows} Takım Daha)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
