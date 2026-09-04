export interface ClubStyle {
  id: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
}

export const TEAM_BY_API_ID: Record<number, ClubStyle> = {
  549: { id: 'bjk', shortName: 'BJK', primaryColor: '#111111', secondaryColor: '#FFFFFF' },
  564: { id: 'bsk', shortName: 'İBFK', primaryColor: '#F26522', secondaryColor: '#1C3F94' },
  607: { id: 'kon', shortName: 'KON', primaryColor: '#007A3D', secondaryColor: '#FFFFFF' },
  611: { id: 'fb', shortName: 'FB', primaryColor: '#002D72', secondaryColor: '#FFED00' },
  645: { id: 'gs', shortName: 'GS', primaryColor: '#A90432', secondaryColor: '#FDB913' },
  994: { id: 'goz', shortName: 'GÖZ', primaryColor: '#E30613', secondaryColor: '#FFED00' },
  996: { id: 'aln', shortName: 'ALN', primaryColor: '#FF6600', secondaryColor: '#008000' },
  997: { id: 'gen', shortName: 'GEN', primaryColor: '#E30613', secondaryColor: '#111111' },
  998: { id: 'ts', shortName: 'TS', primaryColor: '#800020', secondaryColor: '#6CA0DC' },
  1004: { id: 'kas', shortName: 'KAS', primaryColor: '#002B7F', secondaryColor: '#FFFFFF' },
  1007: { id: 'rize', shortName: 'RİZ', primaryColor: '#00875A', secondaryColor: '#003399' },
  1009: { id: 'erz', shortName: 'ERZ', primaryColor: '#0033A0', secondaryColor: '#FFFFFF' },
  3573: { id: 'gzt', shortName: 'GFK', primaryColor: '#E30613', secondaryColor: '#111111' },
  3579: { id: 'amd', shortName: 'AMD', primaryColor: '#00843D', secondaryColor: '#E30613' },
  3588: { id: 'eyp', shortName: 'EYP', primaryColor: '#5C2D91', secondaryColor: '#FDB913' },
  3603: { id: 'sam', shortName: 'SAM', primaryColor: '#E30613', secondaryColor: '#FFFFFF' },
  6343: { id: 'cor', shortName: 'ÇOR', primaryColor: '#C8102E', secondaryColor: '#111111' },
  7411: { id: 'koc', shortName: 'KOC', primaryColor: '#007A33', secondaryColor: '#111111' },
};

const NAME_ALIASES: Array<{ needle: string; style: ClubStyle }> = [
  { needle: 'galatasaray', style: TEAM_BY_API_ID[645] },
  { needle: 'fenerbahçe', style: TEAM_BY_API_ID[611] },
  { needle: 'fenerbahce', style: TEAM_BY_API_ID[611] },
  { needle: 'beşiktaş', style: TEAM_BY_API_ID[549] },
  { needle: 'besiktas', style: TEAM_BY_API_ID[549] },
  { needle: 'trabzonspor', style: TEAM_BY_API_ID[998] },
  { needle: 'başakşehir', style: TEAM_BY_API_ID[564] },
  { needle: 'basaksehir', style: TEAM_BY_API_ID[564] },
  { needle: 'göztepe', style: TEAM_BY_API_ID[994] },
  { needle: 'goztepe', style: TEAM_BY_API_ID[994] },
  { needle: 'alanya', style: TEAM_BY_API_ID[996] },
  { needle: 'gençlerbirliği', style: TEAM_BY_API_ID[997] },
  { needle: 'genclerbirligi', style: TEAM_BY_API_ID[997] },
  { needle: 'kasımpaşa', style: TEAM_BY_API_ID[1004] },
  { needle: 'kasimpasa', style: TEAM_BY_API_ID[1004] },
  { needle: 'rize', style: TEAM_BY_API_ID[1007] },
  { needle: 'erzurum', style: TEAM_BY_API_ID[1009] },
  { needle: 'gaziantep', style: TEAM_BY_API_ID[3573] },
  { needle: 'amed', style: TEAM_BY_API_ID[3579] },
  { needle: 'eyüp', style: TEAM_BY_API_ID[3588] },
  { needle: 'eyup', style: TEAM_BY_API_ID[3588] },
  { needle: 'samsun', style: TEAM_BY_API_ID[3603] },
  { needle: 'çorum', style: TEAM_BY_API_ID[6343] },
  { needle: 'corum', style: TEAM_BY_API_ID[6343] },
  { needle: 'kocaeli', style: TEAM_BY_API_ID[7411] },
  { needle: 'konya', style: TEAM_BY_API_ID[607] },
];

export function resolveClubStyle(apiId: number | undefined, name: string): ClubStyle {
  if (apiId && TEAM_BY_API_ID[apiId]) return TEAM_BY_API_ID[apiId];
  const haystack = (name || '').toLocaleLowerCase('tr-TR');
  const alias = NAME_ALIASES.find((entry) => haystack.includes(entry.needle));
  if (alias) return alias.style;
  const slug = haystack.replace(/[^a-z0-9çğıöşü]+/gi, '').slice(0, 8) || `t${apiId || 0}`;
  return {
    id: slug,
    shortName: name.slice(0, 3).toUpperCase(),
    primaryColor: '#047857',
    secondaryColor: '#FFFFFF',
  };
}

export function parseRoundWeek(round?: string): number {
  const match = String(round || '').match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}
