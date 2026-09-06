import { envString, envNumber } from './env';

const BASE_URL = envString('API_SPORTS_BASE_URL', 'https://v3.football.api-sports.io');
const DEFAULT_LEAGUE_ID = envNumber('SUPER_LIG_LEAGUE_ID', 203);

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

  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      'x-apisports-key': apiKey,
    },
  });
  const raw = await res.json();
  const errors = raw?.errors;
  const hasErrors = Array.isArray(errors) ? errors.length > 0 : Boolean(errors && Object.keys(errors).length);
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

export async function fetchFixturesByRound(season: number, round: string): Promise<any[]> {
  const result = await apiSportsGet<any[]>(
    `/fixtures?league=${getLeagueId()}&season=${season}&round=${encodeURIComponent(round)}`,
  );
  return Array.isArray(result.response) ? result.response : [];
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
