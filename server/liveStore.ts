import fs from 'fs';
import path from 'path';
import { League, Match, Player, PlayerReview } from '../src/types';
import { StandingTeam } from '../src/data/superLigStandings';
import { envNumber } from './env';
import {
  fetchCurrentRound,
  fetchFixtureInjuries,
  fetchFixtureLineups,
  fetchLeagueInjuries,
  fetchFixturesDetailed,
  fetchLiveLeagueFixtures,
  fetchSeasonFixtures,
  fetchStandings,
  getApiSportsKey,
  isApiSportsQuotaBlocked,
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
import {
  deriveActiveWeek,
  hasKickoffStarted,
  applyLiveClock,
  isHalfTime,
  isMatchLive,
  matchNeedsAvailabilityRefresh,
  matchNeedsLineupRefresh,
  matchNeedsScoreRefresh,
  publishedLineupSides,
} from '../src/lib/matchTime';
import { predictSide } from '../src/lib/predictedLineup';
import { ensurePitchPositions } from '../src/lib/lineupLayout';
import { resolveUnavailable } from './availability';

interface LiveSnapshot {
  matches: Match[];
  standings: StandingTeam[];
  reviews: PlayerReview[];
  league: League;
  season: number;
  lastSync: string;
  source: string;
}

const SNAPSHOT_FILE = path.join(process.cwd(), 'data', 'live-snapshot.json');
const BOOTSTRAP_FILE = path.join(process.cwd(), 'data', 'season-bootstrap.json');
const INJURY_REFRESH_MS = 8 * 60 * 60 * 1000;
let lastInjuryRefreshAt = 0;

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

function pickOfficialPlayers(
  incoming: Match['homePlayers'],
  previous: Match['homePlayers'],
  incomingHasXi: boolean,
  previousHasXi: boolean,
): Match['homePlayers'] {
  if (incomingHasXi) return incoming;
  if (previousHasXi) return previous;
  return incoming.length >= previous.length ? incoming : previous;
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
    const incomingThin = incomingDepth === 0;
    const incomingBlankScore = (match.homeScore ?? 0) === 0 && (match.awayScore ?? 0) === 0;
    const keepPreviousScore =
      incomingThin &&
      incomingBlankScore &&
      (previous.status === 'LIVE' || previous.status === 'FT');
    const incomingXi = publishedLineupSides(match);
    const previousXi = publishedLineupSides(previous);
    const scoreChanged = match.homeScore !== previous.homeScore || match.awayScore !== previous.awayScore;
    const useIncomingEvents = match.events.length > 0 || incomingXi.any || scoreChanged;
    const body = incomingDepth >= previousDepth ? match : {
      ...previous,
      ...match,
      events: useIncomingEvents ? match.events : (previous.events.length ? previous.events : match.events),
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
      homePlayers: pickOfficialPlayers(match.homePlayers, previous.homePlayers, incomingXi.home, previousXi.home),
      awayPlayers: pickOfficialPlayers(match.awayPlayers, previous.awayPlayers, incomingXi.away, previousXi.away),
      lineupConfirmed: Boolean(match.lineupConfirmed) || incomingXi.both || Boolean(previous.lineupConfirmed),
      lineupSource:
        match.lineupConfirmed || incomingXi.any
          ? 'official'
          : match.lineupSource || previous.lineupSource,
      unavailablePlayers:
        match.lineupConfirmed || incomingXi.any
          ? undefined
          : (match.unavailablePlayers || previous.unavailablePlayers),
      homeScore: keepPreviousScore
        ? previous.homeScore
        : (typeof match.homeScore === 'number' ? match.homeScore : previous.homeScore ?? 0),
      awayScore: keepPreviousScore
        ? previous.awayScore
        : (typeof match.awayScore === 'number' ? match.awayScore : previous.awayScore ?? 0),
      elapsed: match.elapsed ?? previous.elapsed,
      minute: match.elapsed ?? previous.elapsed ?? match.minute ?? previous.minute,
      minuteSyncedAt: (() => {
        if (match.elapsed == null) return previous.minuteSyncedAt;
        if (match.elapsed === previous.elapsed && previous.minuteSyncedAt) return previous.minuteSyncedAt;
        return match.minuteSyncedAt || new Date().toISOString();
      })(),
      liveSeconds: match.liveSeconds ?? previous.liveSeconds,
      period: (() => {
        const next = match.period || previous.period;
        const kickoff = match.kickoffAt || previous.kickoffAt;
        if (next === 'HT' && !isHalfTime({ period: 'HT', kickoffAt: kickoff, date: match.date || previous.date, minute: match.minute ?? previous.minute })) {
          return '2H';
        }
        return next;
      })(),
    });
  }
  store.matches = sortMatches([...map.values()]);
}

function readSnapshotFile(file: string): boolean {
  try {
    if (!fs.existsSync(file)) return false;
    const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<LiveSnapshot>;
    if (!Array.isArray(raw.matches) || raw.matches.length === 0) return false;
    store.matches = sortMatches(raw.matches);
    if (Array.isArray(raw.standings) && raw.standings.length) store.standings = raw.standings;
    if (raw.league) store.league = raw.league;
    if (raw.season) store.season = raw.season;
    if (raw.lastSync) store.lastSync = raw.lastSync;
    const injuryAt = Number((raw as { lastInjuryRefreshAt?: number }).lastInjuryRefreshAt);
    if (Number.isFinite(injuryAt) && injuryAt > 0) lastInjuryRefreshAt = injuryAt;
    return true;
  } catch {
    return false;
  }
}

function loadLocalSnapshot(): boolean {
  return readSnapshotFile(SNAPSHOT_FILE) || readSnapshotFile(BOOTSTRAP_FILE);
}

function saveLocalSnapshot(): void {
  if (!store.matches.length) return;
  try {
    fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify({
      matches: store.matches,
      standings: store.standings,
      league: store.league,
      season: store.season,
      lastSync: store.lastSync,
      lastInjuryRefreshAt,
    }));
  } catch (error) {
    console.warn('Yerel maç kaydı yazılamadı:', error);
  }
}

async function hydrateFromCache(): Promise<void> {
  if (store.matches.length) return;
  if (loadLocalSnapshot()) return;
  const guessed = envNumber('SUPER_LIG_SEASON', 0) || new Date().getFullYear();
  for (const year of [guessed, guessed - 1]) {
    const cached = await loadCachedSeason(year);
    if (!cached?.matches.length) continue;
    store.matches = sortMatches(cached.matches);
    if (cached.standings.length) store.standings = cached.standings;
    if (cached.reviews.length) store.reviews = cached.reviews;
    store.season = year;
    return;
  }
}

function fixtureApiId(matchId: string): number | null {
  const raw = matchId.startsWith('af-') ? matchId.slice(3) : matchId;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function withStartedStatuses(matches: Match[]): Match[] {
  return matches.map((match) => {
    const homePlayers = ensurePitchPositions(match.homePlayers, true);
    const awayPlayers = ensurePitchPositions(match.awayPlayers, false);
    const placed = homePlayers === match.homePlayers && awayPlayers === match.awayPlayers
      ? match
      : { ...match, homePlayers, awayPlayers };
    if (placed.status === 'FT') return placed;
    if (!isMatchLive(placed) && placed.status !== 'LIVE') return placed;
    return applyLiveClock(placed);
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
  if (isApiSportsQuotaBlocked()) return;

  const ids = store.matches
    .filter((match) => match.week === week)
    .map((match) => fixtureApiId(match.id))
    .filter((id): id is number => Boolean(id));
  if (ids.length === 0) return;

  const detailed = await fetchFixturesDetailed(ids);
  if (detailed.length === 0) return;

  const withLineups = await Promise.all(
    detailed.map(async (raw) => {
      const mapped = transformFixture(raw);
      const previous = store.matches.find((item) => item.id === mapped.id);
      if (!matchNeedsLineupRefresh(previous || mapped)) return raw;
      const lineups = await fetchFixtureLineups(raw.fixture?.id);
      if (!lineups.length) return raw;
      return { ...raw, lineups };
    }),
  );

  mergeMatches(withLineups.map(transformFixture));
  store.lastSync = new Date().toISOString();
  store.source = 'API-SPORTS Football v3 • Trendyol Süper Lig';
  await saveMatches(store.season, store.matches.filter((match) => match.week === week));
  saveLocalSnapshot();
}

function mergeFixtureRaws(base: any[], extra: any[]): any[] {
  const byId = new Map<number, any>();
  for (const row of base) {
    const id = Number(row?.fixture?.id);
    if (id) byId.set(id, row);
  }
  for (const row of extra) {
    const id = Number(row?.fixture?.id);
    if (id) byId.set(id, row);
  }
  return [...byId.values()];
}

async function refreshLiveScores(): Promise<void> {
  if (isApiSportsQuotaBlocked()) return;
  const due = store.matches.filter((match) => matchNeedsScoreRefresh(match));
  if (!due.length) return;

  const liveIds = due
    .filter((match) => match.status === 'LIVE' || isMatchLive(match))
    .map((match) => fixtureApiId(match.id))
    .filter((id): id is number => Boolean(id));

  let raws = await fetchLiveLeagueFixtures(store.season);
  if (liveIds.length && !isApiSportsQuotaBlocked()) {
    const detailed = await fetchFixturesDetailed(liveIds);
    if (detailed.length) raws = mergeFixtureRaws(raws, detailed);
  } else if (!raws.length && !isApiSportsQuotaBlocked()) {
    const ids = due
      .map((match) => fixtureApiId(match.id))
      .filter((id): id is number => Boolean(id));
    if (ids.length) raws = await fetchFixturesDetailed(ids);
  }
  if (!raws.length) return;

  mergeMatches(raws.map(transformFixture));
  store.lastSync = new Date().toISOString();
  store.source = 'API-SPORTS Football v3 • Trendyol Süper Lig';
  saveLocalSnapshot();
}

function lastFinishedForTeam(teamId: string): Match | undefined {
  return store.matches
    .filter((match) => {
      if (match.status !== 'FT') return false;
      if (match.homeTeam.id !== teamId && match.awayTeam.id !== teamId) return false;
      return true;
    })
    .sort((a, b) => {
      const aTime = a.kickoffAt ? new Date(a.kickoffAt).getTime() : 0;
      const bTime = b.kickoffAt ? new Date(b.kickoffAt).getTime() : 0;
      return bTime - aTime;
    })[0];
}

function lastSquadForTeam(teamId: string): Player[] {
  const last = lastFinishedForTeam(teamId);
  if (!last) return [];
  const players = last.homeTeam.id === teamId ? last.homePlayers : last.awayPlayers;
  return players.filter((player) => player.isStarting).length >= 8 ? players : [];
}

const hydratingWeeks = new Set<number>();

async function ensureLastLineupsForPredictions(week: number): Promise<void> {
  const needed = new Set<number>();
  for (const match of store.matches.filter((item) => item.week === week && item.status === 'UPCOMING' && !item.lineupConfirmed)) {
    for (const teamId of [match.homeTeam.id, match.awayTeam.id]) {
      if (lastSquadForTeam(teamId).length) continue;
      const last = lastFinishedForTeam(teamId);
      if (last?.week && last.week !== week) needed.add(last.week);
    }
  }
  for (const pastWeek of needed) {
    if (hydratingWeeks.has(pastWeek)) continue;
    hydratingWeeks.add(pastWeek);
    try {
      const ids = store.matches
        .filter((match) => match.week === pastWeek)
        .map((match) => fixtureApiId(match.id))
        .filter((id): id is number => Boolean(id));
      if (!ids.length) continue;
      const detailed = await fetchFixturesDetailed(ids);
      if (detailed.length) mergeMatches(detailed.map(transformFixture));
    } finally {
      hydratingWeeks.delete(pastWeek);
    }
  }
}

async function refreshInjuriesIfDue(): Promise<void> {
  if (isApiSportsQuotaBlocked()) return;
  if (Date.now() - lastInjuryRefreshAt < INJURY_REFRESH_MS) return;
  const weeks = [...new Set(
    store.matches
      .filter((match) => matchNeedsAvailabilityRefresh(match))
      .map((match) => match.week)
      .filter((week) => week > 0),
  )];
  lastInjuryRefreshAt = Date.now();
  if (!weeks.length) return;
  for (const week of weeks) {
    await ensureLastLineupsForPredictions(week);
    await applyPredictedLineups(week);
  }
  saveLocalSnapshot();
}

async function applyPredictedLineups(week: number): Promise<void> {
  const upcoming = store.matches.filter(
    (match) => match.week === week && match.status === 'UPCOMING' && !match.lineupConfirmed,
  );
  if (!upcoming.length) return;

  const leagueAbsences = await fetchLeagueInjuries(store.season).catch(() => []);
  const updated: Match[] = [];
  for (const match of upcoming) {
    const apiId = fixtureApiId(match.id);
    const fixtureAbsences = apiId ? await fetchFixtureInjuries(apiId) : [];
    const fromLeague = apiId
      ? leagueAbsences.filter((row) => row.fixtureId === apiId)
      : [];
    const mergedAbsences = [...fixtureAbsences];
    for (const row of fromLeague) {
      if (!mergedAbsences.some((item) => item.playerId === row.playerId)) mergedAbsences.push(row);
    }

    const { ids: unavailable, notes } = await resolveUnavailable({
      matches: store.matches,
      match,
      fixtureAbsences: mergedAbsences,
      kickoffMs: match.kickoffAt ? new Date(match.kickoffAt).getTime() : Date.now(),
    });

    const buildSide = (teamId: string, current: Player[], isHome: boolean) => {
      const squad = lastSquadForTeam(teamId);
      if (!squad.length) return current;
      return predictSide(squad, unavailable, isHome);
    };

    const officialSides = publishedLineupSides(match);
    if (officialSides.both) continue;

    const homePlayers = officialSides.home
      ? ensurePitchPositions(match.homePlayers, true)
      : buildSide(match.homeTeam.id, match.homePlayers, true);
    const awayPlayers = officialSides.away
      ? ensurePitchPositions(match.awayPlayers, false)
      : buildSide(match.awayTeam.id, match.awayPlayers, false);

    const homeStarters = homePlayers.filter((player) => player.isStarting).length;
    const awayStarters = awayPlayers.filter((player) => player.isStarting).length;
    if (homeStarters < 8 && awayStarters < 8) continue;

    const lastHome = lastFinishedForTeam(match.homeTeam.id);
    const lastAway = lastFinishedForTeam(match.awayTeam.id);
    const keepOfficial = officialSides.any;
    updated.push({
      ...match,
      homeTeam: {
        ...match.homeTeam,
        formation:
          (lastHome?.homeTeam.id === match.homeTeam.id
            ? lastHome?.homeTeam.formation
            : lastHome?.awayTeam.formation) || match.homeTeam.formation,
      },
      awayTeam: {
        ...match.awayTeam,
        formation:
          (lastAway?.awayTeam.id === match.awayTeam.id
            ? lastAway?.awayTeam.formation
            : lastAway?.homeTeam.formation) || match.awayTeam.formation,
      },
      homePlayers,
      awayPlayers,
      lineupConfirmed: officialSides.both,
      lineupSource: keepOfficial ? 'official' : 'predicted',
      unavailablePlayers: keepOfficial
        ? undefined
        : notes
        .filter((note) => {
          const inLast =
            lastSquadForTeam(match.homeTeam.id).some((player) => player.id === note.id)
            || lastSquadForTeam(match.awayTeam.id).some((player) => player.id === note.id);
          return inLast || note.reason.startsWith('Ceza');
        })
        .map((note) => ({
          ...note,
          teamId:
            note.teamId
            || (homePlayers.some((player) => player.id === note.id) ? match.homeTeam.id : match.awayTeam.id),
        })),
    });
  }

  if (!updated.length) return;
  const map = new Map(store.matches.map((match) => [match.id, match]));
  for (const match of updated) {
    const previous = map.get(match.id);
    if (previous?.lineupConfirmed) continue;
    map.set(match.id, match);
  }
  store.matches = sortMatches([...map.values()]);
}

export async function syncSeason(force = false): Promise<LiveSnapshot> {
  if (!force) await hydrateFromCache();

  if (!getApiSportsKey()) {
    store.source = 'API_SPORTS_KEY tanımlı değil';
    return getSnapshot();
  }

  if (isApiSportsQuotaBlocked()) {
    store.source = 'API-SPORTS kota • son kayıtlı veri';
    return getSnapshot();
  }

  const season = await resolveSeason();
  store.season = season;

  if (!force && store.matches.length === 0) {
    await hydrateFromCache();
  }

  if (isApiSportsQuotaBlocked()) {
    store.source = 'API-SPORTS kota • son kayıtlı veri';
    return getSnapshot();
  }

  const [fixtures, currentRound, standingRows] = await Promise.all([
    fetchSeasonFixtures(season),
    fetchCurrentRound(season),
    fetchStandings(season),
  ]);

  if (fixtures.length) mergeMatches(fixtures.map(transformFixture));
  const nextStandings = transformStandings(standingRows);
  if (nextStandings.length) store.standings = nextStandings;

  const apiWeek = parseRoundWeek(currentRound) || Math.max(...store.matches.map((match) => match.week), 1);
  const currentWeek = deriveActiveWeek(store.matches, apiWeek);
  store.league = buildLeague(season, currentWeek);
  if (fixtures.length || nextStandings.length) {
    store.lastSync = new Date().toISOString();
    store.source = 'API-SPORTS Football v3 • Trendyol Süper Lig';
  }

  if (!isApiSportsQuotaBlocked()) {
    const weeksToHydrate = [currentWeek, currentWeek - 1].filter((week) => week > 0);
    for (const week of weeksToHydrate) {
      await hydrateWeek(week);
    }
    await refreshInjuriesIfDue();
  } else if (store.matches.length) {
    store.source = 'API-SPORTS kota • son kayıtlı veri';
  }

  await Promise.all([
    saveMatches(season, store.matches),
    saveStandings(season, currentWeek, store.standings),
  ]);
  saveLocalSnapshot();
  await refreshStoreReviews();

  return getSnapshot();
}

async function refreshStoreReviews(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const rows = await loadReviews();
  if (!rows.length) return;
  const map = new Map(store.reviews.map((review) => [review.id, review]));
  for (const row of rows) map.set(row.id, row);
  store.reviews = [...map.values()];
}

export async function syncWeek(week: number): Promise<LiveSnapshot> {
  if (store.matches.length === 0) {
    await syncSeason();
  }
  await hydrateWeek(week);
  await refreshStoreReviews();
  return getSnapshot();
}

let bootstrapPromise: Promise<void> | null = null;

export function ensureBootstrapped(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapLiveData();
  }
  return bootstrapPromise;
}

function weeksNeedingLineupRefresh(): number[] {
  return [...new Set(
    store.matches
      .filter((match) => matchNeedsLineupRefresh(match))
      .map((match) => match.week)
      .filter((week) => week > 0),
  )];
}

let livePollerStarted = false;

function startLivePoller(): void {
  if (livePollerStarted) return;
  livePollerStarted = true;
  let lastLineupAt = 0;
  let inFlight = false;
  const tick = async () => {
    if (inFlight || isApiSportsQuotaBlocked()) return;
    inFlight = true;
    try {
      await refreshLiveScores();
      await refreshInjuriesIfDue();
      const now = Date.now();
      if (now - lastLineupAt < 3 * 60 * 1000) return;
      lastLineupAt = now;
      for (const week of weeksNeedingLineupRefresh()) {
        await hydrateWeek(week).catch((error) => {
          console.warn('Canlı hafta senkronu başarısız:', error);
        });
      }
    } finally {
      inFlight = false;
    }
  };
  void tick();
  setInterval(() => void tick(), 20_000);
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

export async function removePersistedReview(reviewId: string): Promise<void> {
  store.reviews = store.reviews.filter((item) => item.id !== reviewId);
}
