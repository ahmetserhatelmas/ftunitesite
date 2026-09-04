import { Match, Team, Player } from '../src/types';
import { INITIAL_MATCHES } from '../src/data/mockData';
import { SUPERLIG_CLUBS, getSquadForTeam } from '../src/data/superLigSquads';
import { formatMatchKickoff, hasKickoffStarted } from '../src/lib/matchTime';

const DEFAULT_API_KEY = 'fd_98b7e370b21f5b242b973d547a0f02b00126895cae178934';
const BASE_URL = 'https://api.football-data.org/v4';

export function getFootballDataApiKey(): string {
  return process.env.FOOTBALL_DATA_API_KEY || DEFAULT_API_KEY;
}

export interface FootballDataApiMatch {
  id: number;
  utcDate: string;
  status: string; // 'FINISHED' | 'IN_PLAY' | 'PAUSED' | 'SCHEDULED' | 'TIMED'
  matchday: number;
  stage: string;
  homeTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  score: {
    winner?: string | null;
    duration?: string;
    fullTime: {
      home: number | null;
      away: number | null;
    };
    halfTime?: {
      home: number | null;
      away: number | null;
    };
  };
  referees?: Array<{
    id: number;
    name: string;
    type: string;
    nationality: string;
  }>;
}

export interface FootballDataApiResponse {
  filters?: Record<string, any>;
  resultSet?: {
    count: number;
    first: string;
    last: string;
    played: number;
  };
  competition?: {
    id: number;
    name: string;
    code: string;
    type: string;
    emblem: string;
  };
  matches?: FootballDataApiMatch[];
  message?: string;
  errorCode?: number;
}

// Helper to make authenticated requests to football-data.org
export async function fetchFromFootballData(endpoint: string, apiKey?: string): Promise<{
  status: number;
  ok: boolean;
  data: any;
  error?: string;
}> {
  const token = apiKey || getFootballDataApiKey();
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  // Try standard X-Auth-Token header, then fallback variations if needed
  const attempts = [
    { headers: { 'X-Auth-Token': token } },
    { headers: { 'X-Auth-Token': token.replace(/^fd_/, '') } },
    { headers: { 'Authorization': `Bearer ${token}` } },
    { headers: { 'X-Auth-Token': token.replace(/^fd_/, '').slice(0, 32) } },
  ];

  let lastResponse: any = null;
  let lastStatus = 500;

  for (const attempt of attempts) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          ...attempt.headers,
          'Accept': 'application/json',
        },
      });

      lastStatus = res.status;
      const data = await res.json().catch(() => null);
      lastResponse = data;

      if (res.ok) {
        return { status: res.status, ok: true, data };
      }

      // If token is explicitly forbidden or unauthorized, continue or record
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        // Keep checking if another header format works
      }
    } catch (err: any) {
      return { status: 500, ok: false, data: null, error: err.message || 'Ağ hatası' };
    }
  }

  return {
    status: lastStatus,
    ok: false,
    data: lastResponse,
    error: lastResponse?.message || `API Hatası (Kod: ${lastStatus})`,
  };
}

// Convert football-data status to our App Match status
function mapMatchStatus(statusStr: string, kickoffIso?: string): 'FT' | 'LIVE' | 'UPCOMING' {
  const s = (statusStr || '').toUpperCase();
  if (s === 'FINISHED' || s === 'AWARDED') return 'FT';
  if (s === 'IN_PLAY' || s === 'PAUSED' || s === 'LIVE') return 'LIVE';
  if (hasKickoffStarted(kickoffIso)) return 'LIVE';
  return 'UPCOMING';
}

// Match TSL club name to local icon badge
function getTeamBadge(teamName: string, tla?: string): string {
  const lower = (teamName || '').toLowerCase();
  if (lower.includes('galatasaray')) return '🦁';
  if (lower.includes('fenerbahçe') || lower.includes('fenerbahce')) return '🟡';
  if (lower.includes('beşiktaş') || lower.includes('besiktas')) return '🦅';
  if (lower.includes('trabzonspor')) return '🌊';
  if (lower.includes('başakşehir') || lower.includes('basaksehir')) return '🦉';
  if (lower.includes('samsunspor')) return '🔴';
  if (lower.includes('göztepe') || lower.includes('goztepe')) return '🟡';
  if (lower.includes('eyüpspor') || lower.includes('eyupspor')) return '💜';
  if (lower.includes('kasımpaşa') || lower.includes('kasimpasa')) return '🔵';
  if (lower.includes('sivasspor')) return '⚪';
  if (lower.includes('antalyaspor')) return '🦂';
  if (lower.includes('alanya')) return '🟠';
  if (lower.includes('konyaspor')) return '🟢';
  if (lower.includes('rize')) return '🟢';
  if (lower.includes('gaziantep')) return '🔴';
  if (lower.includes('kayseri')) return '🟡';
  if (lower.includes('bodrum')) return '🟢';
  if (lower.includes('adana')) return '⚡';
  if (lower.includes('hatay')) return '🔴';
  return '⚽';
}

function findClubId(name: string): string {
  const n = (name || '').toLowerCase();
  if (n.includes('galatasaray')) return 'gs';
  if (n.includes('fenerbah')) return 'fb';
  if (n.includes('beşiktaş') || n.includes('besiktas')) return 'bjk';
  if (n.includes('trabzon')) return 'ts';
  if (n.includes('başakşehir') || n.includes('basaksehir')) return 'bsk';
  if (n.includes('samsun')) return 'sam';
  if (n.includes('eyüp') || n.includes('eyup')) return 'eyp';
  if (n.includes('göztepe') || n.includes('goztepe')) return 'goz';
  if (n.includes('rize')) return 'rize';
  if (n.includes('gaziantep')) return 'gzt';
  if (n.includes('sivas')) return 'siv';
  if (n.includes('antalya')) return 'ant';
  if (n.includes('alanya')) return 'aln';
  if (n.includes('konya')) return 'kon';
  if (n.includes('kayseri')) return 'kay';
  if (n.includes('bodrum')) return 'bod';
  if (n.includes('adana')) return 'ads';
  if (n.includes('hatay')) return 'hat';
  if (n.includes('kasımpaşa') || n.includes('kasimpasa')) return 'kas';
  return 'gs';
}

// Transform football-data.org matches into app matches format
export function transformFootballDataMatches(
  apiMatches: FootballDataApiMatch[],
  fallbackMatches: Match[] = INITIAL_MATCHES
): Match[] {
  if (!apiMatches || !Array.isArray(apiMatches) || apiMatches.length === 0) {
    return fallbackMatches;
  }

  return apiMatches.map((am) => {
    // Check if we have existing player rosters and stats in fallback for this matchup
    const matchedExisting = fallbackMatches.find(
      (em) =>
        em.homeTeam.name.toLowerCase().includes(am.homeTeam.shortName.toLowerCase()) ||
        em.awayTeam.name.toLowerCase().includes(am.awayTeam.shortName.toLowerCase()) ||
        em.id === `match-${am.id}`
    );

    const homeClubId = findClubId(am.homeTeam.name || am.homeTeam.shortName);
    const awayClubId = findClubId(am.awayTeam.name || am.awayTeam.shortName);

    const homeKnownClub = SUPERLIG_CLUBS[homeClubId];
    const awayKnownClub = SUPERLIG_CLUBS[awayClubId];

    const homeSquad = getSquadForTeam(homeClubId, true);
    const awaySquad = getSquadForTeam(awayClubId, false);

    const homeLogo = getTeamBadge(am.homeTeam.name, am.homeTeam.tla);
    const awayLogo = getTeamBadge(am.awayTeam.name, am.awayTeam.tla);

    const homeTeam: Team = {
      id: homeKnownClub?.id || matchedExisting?.homeTeam.id || `team-fd-${am.homeTeam.id}`,
      name: homeKnownClub?.name || am.homeTeam.name || am.homeTeam.shortName,
      shortName: homeKnownClub?.shortName || am.homeTeam.tla || am.homeTeam.shortName || am.homeTeam.name.slice(0, 3).toUpperCase(),
      logo: homeKnownClub?.logo || homeLogo,
      primaryColor: homeKnownClub?.primaryColor || matchedExisting?.homeTeam.primaryColor || '#047857',
      secondaryColor: homeKnownClub?.secondaryColor || matchedExisting?.homeTeam.secondaryColor || '#fbbf24',
      formation: homeKnownClub?.formation || matchedExisting?.homeTeam.formation || '4-2-3-1',
    };

    const awayTeam: Team = {
      id: awayKnownClub?.id || matchedExisting?.awayTeam.id || `team-fd-${am.awayTeam.id}`,
      name: awayKnownClub?.name || am.awayTeam.name || am.awayTeam.shortName,
      shortName: awayKnownClub?.shortName || am.awayTeam.tla || am.awayTeam.shortName || am.awayTeam.name.slice(0, 3).toUpperCase(),
      logo: awayKnownClub?.logo || awayLogo,
      primaryColor: awayKnownClub?.primaryColor || matchedExisting?.awayTeam.primaryColor || '#1e3a8a',
      secondaryColor: awayKnownClub?.secondaryColor || matchedExisting?.awayTeam.secondaryColor || '#f59e0b',
      formation: awayKnownClub?.formation || matchedExisting?.awayTeam.formation || '4-3-3',
    };

    const formattedDate = formatMatchKickoff(am.utcDate);

    const refereeName = am.referees?.[0]?.name || matchedExisting?.referee || 'Süper Lig Hakemi';

    const homePlayers =
      matchedExisting && matchedExisting.homePlayers && matchedExisting.homePlayers.length >= 11
        ? matchedExisting.homePlayers
        : [...homeSquad.starters, ...homeSquad.subs];

    const awayPlayers =
      matchedExisting && matchedExisting.awayPlayers && matchedExisting.awayPlayers.length >= 11
        ? matchedExisting.awayPlayers
        : [...awaySquad.starters, ...awaySquad.subs];

    return {
      id: matchedExisting?.id || `match-fd-${am.id}`,
      leagueId: 'superlig',
      leagueName: 'Trendyol Süper Lig',
      week: am.matchday || matchedExisting?.week || 3,
      date: formattedDate,
      kickoffAt: am.utcDate,
      stadium: matchedExisting?.stadium || `${homeTeam.name} Stadyumu`,
      referee: refereeName,
      status: mapMatchStatus(am.status, am.utcDate),
      homeTeam,
      awayTeam,
      homeScore: am.score?.fullTime?.home ?? matchedExisting?.homeScore ?? 0,
      awayScore: am.score?.fullTime?.away ?? matchedExisting?.awayScore ?? 0,
      homePlayers,
      awayPlayers,
      events: matchedExisting?.events || [],
      viewsCount: matchedExisting?.viewsCount || 1240,
    };
  });
}
