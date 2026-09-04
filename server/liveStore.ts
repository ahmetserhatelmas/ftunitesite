import { League, Match, PlayerReview } from '../src/types';
import { StandingTeam } from '../src/data/superLigStandings';
import {
  fetchCurrentRound,
  fetchFixturesDetailed,
  fetchSeasonFixtures,
  fetchStandings,
  getApiSportsKey,
  resolveSeason,
} from './apiSports';
import {
  isSupabaseConfigured,
  loadCachedSeason,
  loadReviews,
  saveMatches,
  saveReview,
  saveStandings,
} from './supabase';
import { buildLeague, transformFixture, transformStandings } from './transform';
import { parseRoundWeek } from './teamCatalog';

interface LiveSnapshot {
  matches: Match[];
  standings: StandingTeam[];
  reviews: PlayerReview[];
  league: League;
  season: number;
  lastSync: string;
  source: string;
}

const store: LiveSnapshot = {
  matches: [],
  standings: [],
  reviews: [],
  league: buildLeague(new Date().getFullYear(), 1),
  season: new Date().getFullYear(),
  lastSync: new Date().toISOString(),
  source: 'API-SPORTS Süper Lig',
};

function sortMatches(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    if (a.week !== b.week) return a.week - b.week;
    return a.date.localeCompare(b.date, 'tr');
  });
}

function mergeMatches(incoming: Match[]): void {
  const map = new Map(store.matches.map((match) => [match.id, match]));
  for (const match of incoming) {
    const previous = map.get(match.id);
    if (!previous) {
      map.set(match.id, match);
      continue;
    }
    const incomingDepth = match.homePlayers.length + match.awayPlayers.length + match.events.length;
    const previousDepth = previous.homePlayers.length + previous.awayPlayers.length + previous.events.length;
    map.set(match.id, incomingDepth >= previousDepth ? match : {
      ...previous,
      ...match,
      homePlayers: previous.homePlayers.length ? previous.homePlayers : match.homePlayers,
      awayPlayers: previous.awayPlayers.length ? previous.awayPlayers : match.awayPlayers,
      events: previous.events.length ? previous.events : match.events,
    });
  }
  store.matches = sortMatches([...map.values()]);
}

function fixtureApiId(matchId: string): number | null {
  const raw = matchId.startsWith('af-') ? matchId.slice(3) : matchId;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getSnapshot(): LiveSnapshot {
  return store;
}

export async function hydrateWeek(week: number): Promise<void> {
  const ids = store.matches
    .filter((match) => match.week === week)
    .map((match) => fixtureApiId(match.id))
    .filter((id): id is number => Boolean(id));
  if (ids.length === 0) return;

  const detailed = await fetchFixturesDetailed(ids);
  if (detailed.length === 0) return;
  mergeMatches(detailed.map(transformFixture));
  store.lastSync = new Date().toISOString();
  store.source = 'API-SPORTS Football v3 • Trendyol Süper Lig';
  await saveMatches(store.season, store.matches.filter((match) => match.week === week));
}

export async function syncSeason(force = false): Promise<LiveSnapshot> {
  if (!getApiSportsKey()) {
    store.source = 'API_SPORTS_KEY tanımlı değil';
    return store;
  }

  const season = await resolveSeason();
  store.season = season;

  if (!force && store.matches.length === 0) {
    const cached = await loadCachedSeason(season);
    if (cached?.matches.length) {
      store.matches = sortMatches(cached.matches);
      store.standings = cached.standings;
      store.reviews = cached.reviews;
    }
  }

  const [fixtures, currentRound, standingRows] = await Promise.all([
    fetchSeasonFixtures(season),
    fetchCurrentRound(season),
    fetchStandings(season),
  ]);

  const currentWeek = parseRoundWeek(currentRound) || Math.max(...store.matches.map((match) => match.week), 1);
  store.league = buildLeague(season, currentWeek);
  mergeMatches(fixtures.map(transformFixture));
  store.standings = transformStandings(standingRows);
  store.lastSync = new Date().toISOString();
  store.source = 'API-SPORTS Football v3 • Trendyol Süper Lig';

  const weeksToHydrate = [currentWeek, currentWeek - 1].filter((week) => week > 0);
  for (const week of weeksToHydrate) {
    await hydrateWeek(week);
  }

  await Promise.all([
    saveMatches(season, store.matches),
    saveStandings(season, currentWeek, store.standings),
  ]);

  return store;
}

export async function syncWeek(week: number): Promise<LiveSnapshot> {
  if (store.matches.length === 0) {
    await syncSeason();
  }
  await hydrateWeek(week);
  return store;
}

let bootstrapPromise: Promise<void> | null = null;

export function ensureBootstrapped(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapLiveData();
  }
  return bootstrapPromise;
}

export async function bootstrapLiveData(): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      store.reviews = await loadReviews();
    }
    await syncSeason();
    console.log(
      `Süper Lig senkron: ${store.matches.length} maç, ${store.standings.length} takım, hafta ${store.league.currentWeek}`,
    );
  } catch (error) {
    console.error('Canlı veri senkronu başarısız:', error);
  }
}

export async function addPersistedReview(review: PlayerReview): Promise<void> {
  store.reviews = [...store.reviews.filter((item) => item.id !== review.id), review];
  await saveReview(review);
}
