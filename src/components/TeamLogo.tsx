import React from 'react';
import { Team } from '../types';
import { StandingTeam } from '../data/superLigStandings';

export interface TeamBadgeInfo {
  letter: string;
  primaryColor: string;
  secondaryColor: string;
  name: string;
  shortName: string;
}

// Master mapping of Süper Lig teams with their authentic 2 colors and single initial letter
export const SUPERLIG_TEAM_BADGE_MAP: Record<string, TeamBadgeInfo> = {
  gs: {
    letter: 'G',
    primaryColor: '#A90432', // Galatasaray Kırmızı / Crimson
    secondaryColor: '#FDB913', // Galatasaray Sarı / Gold
    name: 'Galatasaray',
    shortName: 'GS',
  },
  fb: {
    letter: 'F',
    primaryColor: '#002D72', // Fenerbahçe Lacivert / Navy
    secondaryColor: '#FFED00', // Fenerbahçe Sarı / Yellow
    name: 'Fenerbahçe',
    shortName: 'FB',
  },
  bjk: {
    letter: 'B',
    primaryColor: '#111111', // Beşiktaş Siyah / Black
    secondaryColor: '#FFFFFF', // Beşiktaş Beyaz / White
    name: 'Beşiktaş',
    shortName: 'BJK',
  },
  ts: {
    letter: 'T',
    primaryColor: '#800020', // Trabzonspor Bordo / Maroon
    secondaryColor: '#6CA0DC', // Trabzonspor Mavi / Sky Blue
    name: 'Trabzonspor',
    shortName: 'TS',
  },
  bsk: {
    letter: 'B',
    primaryColor: '#F26522', // Başakşehir Turuncu / Orange
    secondaryColor: '#1C3F94', // Başakşehir Lacivert / Navy
    name: 'RAMS Başakşehir',
    shortName: 'İBFK',
  },
  ibfk: {
    letter: 'B',
    primaryColor: '#F26522',
    secondaryColor: '#1C3F94',
    name: 'RAMS Başakşehir',
    shortName: 'İBFK',
  },
  sam: {
    letter: 'S',
    primaryColor: '#E30613', // Samsunspor Kırmızı / Red
    secondaryColor: '#FFFFFF', // Samsunspor Beyaz / White
    name: 'Samsunspor',
    shortName: 'SAM',
  },
  samsun: {
    letter: 'S',
    primaryColor: '#E30613',
    secondaryColor: '#FFFFFF',
    name: 'Samsunspor',
    shortName: 'SAM',
  },
  eyp: {
    letter: 'E',
    primaryColor: '#5C2D91', // Eyüpspor Eflatun / Purple
    secondaryColor: '#FDB913', // Eyüpspor Sarı / Gold
    name: 'ikas Eyüpspor',
    shortName: 'EYÜP',
  },
  eyup: {
    letter: 'E',
    primaryColor: '#5C2D91',
    secondaryColor: '#FDB913',
    name: 'ikas Eyüpspor',
    shortName: 'EYP',
  },
  goz: {
    letter: 'G',
    primaryColor: '#E30613', // Göztepe Kırmızı / Red
    secondaryColor: '#FFED00', // Göztepe Sarı / Yellow
    name: 'Göztepe',
    shortName: 'GÖZ',
  },
  goztepe: {
    letter: 'G',
    primaryColor: '#E30613',
    secondaryColor: '#FFED00',
    name: 'Göztepe',
    shortName: 'GÖZ',
  },
  rize: {
    letter: 'R',
    primaryColor: '#00875A', // Çaykur Rizespor Yeşil / Green
    secondaryColor: '#003399', // Çaykur Rizespor Mavi / Blue
    name: 'Çaykur Rizespor',
    shortName: 'RİZ',
  },
  riz: {
    letter: 'R',
    primaryColor: '#00875A',
    secondaryColor: '#003399',
    name: 'Çaykur Rizespor',
    shortName: 'RİZ',
  },
  gzt: {
    letter: 'G',
    primaryColor: '#E30613', // Gaziantep FK Kırmızı / Red
    secondaryColor: '#111111', // Gaziantep FK Siyah / Black
    name: 'Gaziantep FK',
    shortName: 'GFK',
  },
  gfk: {
    letter: 'G',
    primaryColor: '#E30613',
    secondaryColor: '#111111',
    name: 'Gaziantep FK',
    shortName: 'GFK',
  },
  siv: {
    letter: 'S',
    primaryColor: '#E30613', // Sivasspor Kırmızı / Red
    secondaryColor: '#FFFFFF', // Sivasspor Beyaz / White
    name: 'Net Global Sivasspor',
    shortName: 'SİV',
  },
  sivasspor: {
    letter: 'S',
    primaryColor: '#E30613',
    secondaryColor: '#FFFFFF',
    name: 'Net Global Sivasspor',
    shortName: 'SİV',
  },
  ant: {
    letter: 'A',
    primaryColor: '#ED1C24', // Antalyaspor Kırmızı / Red
    secondaryColor: '#FFFFFF', // Antalyaspor Beyaz / White
    name: 'Antalyaspor',
    shortName: 'ANT',
  },
  aln: {
    letter: 'A',
    primaryColor: '#FF6600', // Alanyaspor Turuncu / Orange
    secondaryColor: '#008000', // Alanyaspor Yeşil / Green
    name: 'Corendon Alanyaspor',
    shortName: 'ALN',
  },
  kon: {
    letter: 'K',
    primaryColor: '#007A3D', // Konyaspor Yeşil / Green
    secondaryColor: '#FFFFFF', // Konyaspor Beyaz / White
    name: 'TÜMOSAN Konyaspor',
    shortName: 'KON',
  },
  kay: {
    letter: 'K',
    primaryColor: '#FFCC00', // Kayserispor Sarı / Yellow
    secondaryColor: '#CC0000', // Kayserispor Kırmızı / Red
    name: 'Bellona Kayserispor',
    shortName: 'KAY',
  },
  bod: {
    letter: 'B',
    primaryColor: '#006633', // Bodrum FK Yeşil / Green
    secondaryColor: '#FFFFFF', // Bodrum FK Beyaz / White
    name: 'Sipay Bodrum FK',
    shortName: 'BOD',
  },
  ads: {
    letter: 'A',
    primaryColor: '#0055A5', // Adana Demirspor Mavi / Blue
    secondaryColor: '#80BFFF', // Adana Demirspor Açık Mavi / Sky Blue
    name: 'Adana Demirspor',
    shortName: 'ADS',
  },
  hat: {
    letter: 'H',
    primaryColor: '#800000', // Hatayspor Bordo / Maroon
    secondaryColor: '#FFFFFF', // Hatayspor Beyaz / White
    name: 'Atakaş Hatayspor',
    shortName: 'HAT',
  },
  kas: {
    letter: 'K',
    primaryColor: '#002B7F', // Kasımpaşa Lacivert / Navy
    secondaryColor: '#FFFFFF', // Kasımpaşa Beyaz / White
    name: 'Kasımpaşa',
    shortName: 'KAS',
  },
  gen: {
    letter: 'G',
    primaryColor: '#E30613',
    secondaryColor: '#111111',
    name: 'Gençlerbirliği',
    shortName: 'GEN',
  },
  genc: {
    letter: 'G',
    primaryColor: '#E30613',
    secondaryColor: '#111111',
    name: 'Gençlerbirliği',
    shortName: 'GEN',
  },
  erz: {
    letter: 'E',
    primaryColor: '#0033A0',
    secondaryColor: '#FFFFFF',
    name: 'Erzurumspor FK',
    shortName: 'ERZ',
  },
  amd: {
    letter: 'A',
    primaryColor: '#00843D',
    secondaryColor: '#E30613',
    name: 'Amed SK',
    shortName: 'AMD',
  },
  amed: {
    letter: 'A',
    primaryColor: '#00843D',
    secondaryColor: '#E30613',
    name: 'Amed SK',
    shortName: 'AMD',
  },
  cor: {
    letter: 'Ç',
    primaryColor: '#C8102E',
    secondaryColor: '#111111',
    name: 'Çorum FK',
    shortName: 'ÇOR',
  },
  koc: {
    letter: 'K',
    primaryColor: '#007A33',
    secondaryColor: '#111111',
    name: 'Kocaelispor',
    shortName: 'KOC',
  },
};

/**
 * Resolves the 2 colors and initial letter for any team representation
 */
export function getTeamBadgeInfo(
  team?: Partial<Team> | Partial<StandingTeam> | { id?: string; name?: string; shortName?: string; primaryColor?: string; secondaryColor?: string } | null,
  fallbackId?: string,
  fallbackName?: string
): TeamBadgeInfo {
  const idKey = (team?.id || fallbackId || '').toLowerCase().trim();
  if (idKey && SUPERLIG_TEAM_BADGE_MAP[idKey]) {
    return SUPERLIG_TEAM_BADGE_MAP[idKey];
  }

  // Check matching by name or shortName
  const nameToSearch = (team?.name || fallbackName || '').toLowerCase();
  const shortNameToSearch = (team?.shortName || '').toLowerCase();

  for (const key of Object.keys(SUPERLIG_TEAM_BADGE_MAP)) {
    const item = SUPERLIG_TEAM_BADGE_MAP[key];
    if (
      (nameToSearch.length >= 3 && nameToSearch.includes(item.name.toLowerCase())) ||
      (nameToSearch.length >= 3 && item.name.toLowerCase().includes(nameToSearch)) ||
      (shortNameToSearch && shortNameToSearch === item.shortName.toLowerCase()) ||
      (nameToSearch.length >= 2 && nameToSearch.includes(key))
    ) {
      return item;
    }
  }

  // Fallback: derive initial letter from name or shortName
  const rawName = team?.name || fallbackName || team?.shortName || idKey || 'T';
  const initial = rawName.trim().charAt(0).toUpperCase() || 'T';

  return {
    letter: initial,
    primaryColor: team?.primaryColor || '#059669',
    secondaryColor: team?.secondaryColor || '#FDB913',
    name: team?.name || fallbackName || 'Takım',
    shortName: team?.shortName || initial,
  };
}

export interface TeamLogoProps {
  team?: Partial<Team> | Partial<StandingTeam> | { id?: string; name?: string; shortName?: string; logo?: string; primaryColor?: string; secondaryColor?: string } | null;
  teamId?: string;
  teamName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  customSizeClass?: string;
  className?: string;
  shape?: 'circle' | 'rounded' | 'square';
  showShadow?: boolean;
}

const SIZE_STYLES: Record<string, { container: string; text: string }> = {
  xs: { container: 'w-5 h-5 min-w-[20px]', text: 'text-[10px]' },
  sm: { container: 'w-6 h-6 min-w-[24px]', text: 'text-[11px]' },
  md: { container: 'w-8 h-8 min-w-[32px]', text: 'text-sm' },
  lg: { container: 'w-10 h-10 min-w-[40px]', text: 'text-base' },
  xl: { container: 'w-12 h-12 min-w-[48px]', text: 'text-xl' },
  '2xl': { container: 'w-14 h-14 min-w-[56px]', text: 'text-2xl' },
  '3xl': { container: 'w-16 h-16 min-w-[64px]', text: 'text-3xl' },
};

/**
 * TeamLogo: Renders a dual-color authentic club badge displaying ONLY the team's initial letter.
 */
export const TeamLogo: React.FC<TeamLogoProps> = ({
  team,
  teamId,
  teamName,
  size = 'md',
  customSizeClass,
  className = '',
  shape = 'circle',
  showShadow = true,
}) => {
  const badgeInfo = getTeamBadgeInfo(team, teamId, teamName);
  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md;

  const shapeClass =
    shape === 'circle'
      ? 'rounded-full'
      : shape === 'rounded'
      ? 'rounded-xl'
      : 'rounded-md';

  // Dual-color 50/50 diagonal split gradient
  const backgroundStyle = {
    background: `linear-gradient(135deg, ${badgeInfo.primaryColor} 0%, ${badgeInfo.primaryColor} 50%, ${badgeInfo.secondaryColor} 50%, ${badgeInfo.secondaryColor} 100%)`,
  };

  return (
    <div
      className={`inline-flex items-center justify-center font-black font-mono select-none shrink-0 relative overflow-hidden border border-white/30 ring-1 ring-black/10 ${shapeClass} ${
        customSizeClass || sizeStyle.container
      } ${showShadow ? 'shadow-xs' : ''} ${className}`}
      style={backgroundStyle}
      title={`${badgeInfo.name} (${badgeInfo.letter})`}
      aria-label={`${badgeInfo.name} Logosu`}
    >
      {/* Centered Initial Letter with sharp optical contrast */}
      <span
        className={`font-black tracking-tighter leading-none z-10 text-white ${sizeStyle.text}`}
        style={{
          textShadow:
            '0 1px 2px rgba(0, 0, 0, 0.9), 0 0 3px rgba(0, 0, 0, 0.85), 0 0 1px #000',
        }}
      >
        {badgeInfo.letter}
      </span>
    </div>
  );
};

export default TeamLogo;
