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
import { deriveActiveWeek, hasKickoffStarted, isMatchLive } from '../src/lib/matchTime';

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

function statusRank(status: Match['status']): number {
  if (status === 'FT') return 2;
  if (status === 'LIVE') return 1;
  return 0;
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
    const body = incomingDepth >= previousDepth ? match : {
      ...previous,
      ...match,
      homePlayers: previous.homePlayers.length ? previous.homePlayers : match.homePlayers,
      awayPlayers: previous.awayPlayers.length ? previous.awayPlayers : match.awayPlayers,
      events: previous.events.length ? previous.events : match.events,
    };
    const kickoffAt = match.kickoffAt || previous.kickoffAt;
    const richerStatus = statusRank(previous.status) >= statusRank(match.status) ? previous.status : match.status;
    const status =
      richerStatus === 'FT'
        ? 'FT'
        : hasKickoffStarted(kickoffAt) || hasKickoffStarted(body.date)
          ? 'LIVE'
          : richerStatus;
    map.set(match.id, {
      ...body,
      kickoffAt,
      status,
      homeScore: Math.max(previous.homeScore ?? 0, match.homeScore ?? 0),
      awayScore: Math.max(previous.awayScore ?? 0, match.awayScore ?? 0),
      minute: status === 'LIVE' ? (match.minute ?? previous.minute ?? 1) : (match.minute ?? previous.minute),
      liveSeconds: match.liveSeconds ?? previous.liveSeconds,
    });
  }
  store.matches = sortMatches([...map.values()]);
}

function fixtureApiId(matchId: string): number | null {
  const raw = matchId.startsWith('af-') ? matchId.slice(3) : matchId;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function withStartedStatuses(matches: Match[]): Match[] {
  return matches.map((match) => {
    if (match.status === 'UPCOMING' && isMatchLive(match)) {
      return { ...match, status: 'LIVE' as const, minute: match.minute || 1 };
    }
    return match;
  });
}

export function getSnapshot(): LiveSnapshot {
  store.matches = withStartedStatuses(store.matches);
  store.league = {
    ...store.league,
    currentWeek: deriveActiveWeek(store.matches, store.league.currentWeek),
  };
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
    return getSnapshot();
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

  const apiWeek = parseRoundWeek(currentRound) || Math.max(...store.matches.map((match) => match.week), 1);
  const currentWeek = deriveActiveWeek(store.matches, apiWeek);
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

  return getSnapshot();
}

export async function syncWeek(week: number): Promise<LiveSnapshot> {
  if (store.matches.length === 0) {
    await syncSeason();
  }
  await hydrateWeek(week);
  return getSnapshot();
}

let bootstrapPromise: Promise<void> | null = null;

export function ensureBootstrapped(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapLiveData();
  }
  return bootstrapPromise;
}

function needsLiveRefresh(): boolean {
  return store.matches.some((match) => {
    if (match.status === 'LIVE') return true;
    if (match.status === 'FT') return false;
    return hasKickoffStarted(match.kickoffAt, -60_000) || hasKickoffStarted(match.date, -60_000);
  });
}

let livePollerStarted = false;

function startLivePoller(): void {
  if (livePollerStarted) return;
  livePollerStarted = true;
  setInterval(() => {
    if (!needsLiveRefresh()) return;
    const week = store.league.currentWeek;
    void syncWeek(week).catch((error) => {
      console.warn('Canlı hafta senkronu başarısız:', error);
    });
  }, 45_000);
}

export async function bootstrapLiveData(): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      store.reviews = await loadReviews();
    }
    await syncSeason();
    startLivePoller();
    console.log(
      `Süper Lig senkron: ${store.matches.length} maç, ${store.standings.length} takım, hafta ${store.league.currentWeek}`,
    );
  } catch (error) {
    console.error('Canlı veri senkronu başarısız:', error);
    startLivePoller();
  }
}

export async function addPersistedReview(review: PlayerReview): Promise<void> {
  store.reviews = [...store.reviews.filter((item) => item.id !== review.id), review];
  await saveReview(review);
}
