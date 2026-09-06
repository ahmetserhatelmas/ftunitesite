import { envString, envNumber } from './env';

const BASE_URL = envString('API_SPORTS_BASE_URL', 'https://v3.football.api-sports.io');
const DEFAULT_LEAGUE_ID = envNumber('SUPER_LIG_LEAGUE_ID', 203);
const FETCH_TIMEOUT_MS = 12_000;

let quotaBlockedUntil = 0;

function quotaMessage(errors: unknown): string {
  return typeof errors === 'string' ? errors : JSON.stringify(errors || '');
}

function noteQuota(errors: unknown): void {
  if (!/request limit|rate limit|too many requests/i.test(quotaMessage(errors))) return;
  quotaBlockedUntil = Date.now() + 30 * 60 * 1000;
  console.warn('API-SPORTS günlük istek limiti doldu; 30 dk yeni istek yok.');
}

export function isApiSportsQuotaBlocked(): boolean {
  return Date.now() < quotaBlockedUntil;
}

export function getApiSportsKey(): string {
  return envString('API_SPORTS_KEY') || envString('APISPORTS_KEY');
}

export function getLeagueId(): number {
  return envNumber('SUPER_LIG_LEAGUE_ID', DEFAULT_LEAGUE_ID);
}

export async function apiSportsGet<T = any>(path: string): Promise<{
  ok: boolean;
  status: number;
  errors: unknown;
  results: number;
  response: T;
  raw: any;
}> {
  const apiKey = getApiSportsKey();
  if (!apiKey) {
    return { ok: false, status: 0, errors: 'API_SPORTS_KEY eksik', results: 0, response: [] as T, raw: null };
  }

  if (isApiSportsQuotaBlocked()) {
    return { ok: false, status: 429, errors: 'API-SPORTS kota', results: 0, response: [] as T, raw: null };
  }

  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      'x-apisports-key': apiKey,
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const raw = await res.json();
  const errors = raw?.errors;
  const hasErrors = Array.isArray(errors) ? errors.length > 0 : Boolean(errors && Object.keys(errors).length);
  if (hasErrors) noteQuota(errors);
  return {
    ok: res.ok && !hasErrors,
    status: res.status,
    errors,
    results: raw?.results ?? 0,
    response: (raw?.response ?? []) as T,
    raw,
  };
}

export async function resolveSeason(): Promise<number> {
  const forced = envNumber('SUPER_LIG_SEASON', 0);
  if (forced) return forced;

  const result = await apiSportsGet<any[]>(`/leagues?id=${getLeagueId()}&current=true`);
  const current = result.response?.[0]?.seasons?.find((season: any) => season.current);
  if (current?.year) return Number(current.year);

  const all = await apiSportsGet<any[]>(`/leagues?id=${getLeagueId()}`);
  const seasons = all.response?.[0]?.seasons || [];
  const latest = [...seasons].sort((a: any, b: any) => Number(b.year) - Number(a.year))[0];
  return Number(latest?.year) || new Date().getFullYear();
}

export async function fetchCurrentRound(season: number): Promise<string> {
  const result = await apiSportsGet<string[]>(`/fixtures/rounds?league=${getLeagueId()}&season=${season}&current=true`);
  return result.response?.[0] || '';
}

export async function fetchSeasonFixtures(season: number): Promise<any[]> {
  const result = await apiSportsGet<any[]>(`/fixtures?league=${getLeagueId()}&season=${season}`);
  return Array.isArray(result.response) ? result.response : [];
}

export async function fetchLiveLeagueFixtures(season: number): Promise<any[]> {
  const withSeason = await apiSportsGet<any[]>(
    `/fixtures?league=${getLeagueId()}&season=${season}&live=all`,
  );
  if (Array.isArray(withSeason.response) && withSeason.response.length) return withSeason.response;
  if (isApiSportsQuotaBlocked()) return [];
  const live = await apiSportsGet<any[]>(`/fixtures?league=${getLeagueId()}&live=all`);
  return Array.isArray(live.response) ? live.response : [];
}

export async function fetchFixturesByRound(season: number, round: string): Promise<any[]> {
  const result = await apiSportsGet<any[]>(
    `/fixtures?league=${getLeagueId()}&season=${season}&round=${encodeURIComponent(round)}`,
  );
  return Array.isArray(result.response) ? result.response : [];
}

export type FixtureAbsence = {
  playerId: number;
  name: string;
  type?: string;
  reason?: string;
  teamApiId?: number;
};

export async function fetchLeagueInjuries(season: number): Promise<Array<FixtureAbsence & { fixtureId?: number; fixtureDate?: string }>> {
  const cached = leagueInjuryCache.get(season);
  if (cached && Date.now() - cached.at < ABSENCE_TTL_MS) return cached.rows;
  const result = await apiSportsGet<any[]>(`/injuries?league=${getLeagueId()}&season=${season}`);
  const rows = (Array.isArray(result.response) ? result.response : [])
    .map((row: any) => ({
      playerId: Number(row.player?.id),
      name: String(row.player?.name || ''),
      type: row.player?.type || row.type,
      reason: row.player?.reason || row.reason,
      teamApiId: Number(row.team?.id) || undefined,
      fixtureId: Number(row.fixture?.id) || undefined,
      fixtureDate: row.fixture?.date || undefined,
    }))
    .filter((row) => row.playerId);
  leagueInjuryCache.set(season, { at: Date.now(), rows });
  return rows;
}

export type SidelinedRow = {
  type?: string;
  start?: string;
  end?: string;
};

const ABSENCE_TTL_MS = 8 * 60 * 60 * 1000;
const sidelinedCache = new Map<number, { at: number; rows: SidelinedRow[] }>();
const leagueInjuryCache = new Map<number, { at: number; rows: Array<FixtureAbsence & { fixtureId?: number; fixtureDate?: string }> }>();
const fixtureInjuryCache = new Map<number, { at: number; rows: FixtureAbsence[] }>();

export async function fetchPlayerSidelined(playerId: number): Promise<SidelinedRow[]> {
  const cached = sidelinedCache.get(playerId);
  if (cached && Date.now() - cached.at < ABSENCE_TTL_MS) return cached.rows;
  const result = await apiSportsGet<any[]>(`/sidelined?player=${playerId}`);
  const rows = (Array.isArray(result.response) ? result.response : []).map((row: any) => ({
    type: String(row.type || ''),
    start: row.start || undefined,
    end: row.end || undefined,
  }));
  sidelinedCache.set(playerId, { at: Date.now(), rows });
  return rows;
}

export async function fetchFixtureInjuries(fixtureId: number): Promise<FixtureAbsence[]> {
  const cached = fixtureInjuryCache.get(fixtureId);
  if (cached && Date.now() - cached.at < ABSENCE_TTL_MS) return cached.rows;
  const result = await apiSportsGet<any[]>(`/injuries?fixture=${fixtureId}`);
  const rows = (Array.isArray(result.response) ? result.response : [])
    .map((row: any) => ({
      playerId: Number(row.player?.id),
      name: String(row.player?.name || ''),
      type: row.player?.type || row.type,
      reason: row.player?.reason || row.reason,
      teamApiId: Number(row.team?.id) || undefined,
    }))
    .filter((row) => row.playerId);
  fixtureInjuryCache.set(fixtureId, { at: Date.now(), rows });
  return rows;
}

export async function fetchFixtureLineups(fixtureId: number): Promise<any[]> {
  const result = await apiSportsGet<any[]>(`/fixtures/lineups?fixture=${fixtureId}`);
  return Array.isArray(result.response) ? result.response : [];
}

export async function fetchFixturesDetailed(ids: number[]): Promise<any[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  const chunks: number[][] = [];
  for (let i = 0; i < unique.length; i += 20) {
    chunks.push(unique.slice(i, i + 20));
  }

  const batches = await Promise.all(
    chunks.map((chunk) => apiSportsGet<any[]>(`/fixtures?ids=${chunk.join('-')}`)),
  );
  return batches.flatMap((batch) => (Array.isArray(batch.response) ? batch.response : []));
}

export async function fetchStandings(season: number): Promise<any[]> {
  const result = await apiSportsGet<any[]>(`/standings?league=${getLeagueId()}&season=${season}`);
  return result.response?.[0]?.league?.standings?.[0] || [];
}
