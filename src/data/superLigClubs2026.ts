export interface SuperLigClubOption {
  id: string;
  name: string;
  badge: string;
  color: string;
}

/** 2026/27 Trendyol Süper Lig kadrosu (API-SPORTS league 203) */
export const SUPER_LIG_CLUBS_2026: SuperLigClubOption[] = [
  { id: 'gs', name: 'Galatasaray', badge: '🦁', color: '#A90432' },
  { id: 'fb', name: 'Fenerbahçe', badge: '🟡', color: '#002D72' },
  { id: 'bjk', name: 'Beşiktaş', badge: '🦅', color: '#111111' },
  { id: 'ts', name: 'Trabzonspor', badge: '🌊', color: '#800020' },
  { id: 'bsk', name: 'İstanbul Başakşehir', badge: '🟠', color: '#F26522' },
  { id: 'eyp', name: 'Eyüpspor', badge: '🟣', color: '#5C2D91' },
  { id: 'goz', name: 'Göztepe', badge: '🟡', color: '#E30613' },
  { id: 'sam', name: 'Samsunspor', badge: '🔴', color: '#E30613' },
  { id: 'rize', name: 'Çaykur Rizespor', badge: '🟢', color: '#00875A' },
  { id: 'gzt', name: 'Gaziantep FK', badge: '🔴', color: '#E30613' },
  { id: 'aln', name: 'Alanyaspor', badge: '🟠', color: '#FF6600' },
  { id: 'kon', name: 'Konyaspor', badge: '🟢', color: '#007A3D' },
  { id: 'kas', name: 'Kasımpaşa', badge: '🔵', color: '#002B7F' },
  { id: 'gen', name: 'Gençlerbirliği', badge: '🔴', color: '#E30613' },
  { id: 'erz', name: 'Erzurumspor FK', badge: '🔵', color: '#0033A0' },
  { id: 'amd', name: 'Amed SK', badge: '🟢', color: '#00843D' },
  { id: 'cor', name: 'Çorum FK', badge: '🔴', color: '#C8102E' },
  { id: 'koc', name: 'Kocaelispor', badge: '🟢', color: '#007A33' },
];

export const SUPER_LIG_TEAMS_MAP: Record<string, { name: string; badge: string }> = Object.fromEntries(
  SUPER_LIG_CLUBS_2026.map((club) => [club.id, { name: club.name, badge: club.badge }]),
);
