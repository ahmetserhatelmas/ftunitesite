import { League, Manager, Match, MatchEvent, Player, PlayerStats, PositionCategory, Team } from '../src/types';
import { StandingTeam } from '../src/data/superLigStandings';
import { fallbackPositionLabel, placeStartingXi } from '../src/lib/lineupLayout';
import { parseRoundWeek, resolveClubStyle } from './teamCatalog';
import { formatMatchKickoff } from '../src/lib/matchTime';

const EMPTY_STATS: PlayerStats = {
  minutesPlayed: 0,
  goals: 0,
  assists: 0,
  shots: 0,
  shotsOnTarget: 0,
  passAccuracy: 0,
  tackles: 0,
  interceptions: 0,
  foulsCommitted: 0,
  foulsDrawn: 0,
  yellowCard: false,
  redCard: false,
};

function mapStatus(short?: string): Match['status'] {
  const code = (short || '').toUpperCase();
  if (['FT', 'AET', 'PEN'].includes(code)) return 'FT';
  if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'].includes(code)) return 'LIVE';
  return 'UPCOMING';
}

function formatMatchDate(iso?: string): string {
  return formatMatchKickoff(iso);
}

function shortNameFrom(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] || fullName;
}

function categoryFromPos(pos?: string): PositionCategory {
  if (pos === 'G') return 'GK';
  if (pos === 'D') return 'DEF';
  if (pos === 'M') return 'MID';
  return 'FWD';
}


function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapPlayerStats(raw?: any): PlayerStats {
  if (!raw) return { ...EMPTY_STATS };
  const games = raw.games || {};
  const shots = raw.shots || {};
  const goals = raw.goals || {};
  const passes = raw.passes || {};
  const tackles = raw.tackles || {};
  const fouls = raw.fouls || {};
  const cards = raw.cards || {};
  const passTotal = toNumber(passes.total);
  const passAcc = toNumber(passes.accuracy);
  const passAccuracy = passTotal > 0 && passAcc <= passTotal ? Math.round((passAcc / passTotal) * 100) : passAcc;

  return {
    minutesPlayed: toNumber(games.minutes),
    goals: toNumber(goals.total),
    assists: toNumber(goals.assists),
    shots: toNumber(shots.total),
    shotsOnTarget: toNumber(shots.on),
    passAccuracy,
    tackles: toNumber(tackles.total),
    interceptions: toNumber(tackles.interceptions),
    saves: goals.saves == null ? undefined : toNumber(goals.saves),
    foulsCommitted: toNumber(fouls.committed),
    foulsDrawn: toNumber(fouls.drawn),
    yellowCard: toNumber(cards.yellow) > 0,
    redCard: toNumber(cards.red) > 0,
  };
}

function buildManager(coach: any, teamId: string, formation?: string): Manager | undefined {
  if (!coach?.id && !coach?.name) return undefined;
  const name = coach.name || 'Teknik Direktör';
  return {
    id: coach.id ? `mgr-${coach.id}` : `mgr-${teamId}`,
    name,
    shortName: shortNameFrom(name),
    teamId,
    avatar: coach.photo || '',
    role: 'Teknik Direktör',
    formation,
    baseRating: 7,
  };
}

function buildTeam(rawTeam: any, lineup?: any): Team {
  const style = resolveClubStyle(rawTeam?.id, rawTeam?.name || '');
  const formation = lineup?.formation || '4-2-3-1';
  return {
    id: style.id,
    name: rawTeam?.name || style.shortName,
    shortName: rawTeam?.code || style.shortName,
    logo: rawTeam?.logo || '',
    primaryColor: style.primaryColor,
    secondaryColor: style.secondaryColor,
    formation,
    manager: buildManager(lineup?.coach, style.id, formation),
  };
}

function buildPlayers(
  lineup: any,
  teamId: string,
  isHome: boolean,
  statsById: Map<number, { photo?: string; name?: string; stats: PlayerStats; rating: number }>,
): Player[] {
  const starters = lineup?.startXI || [];
  const subs = lineup?.substitutes || [];
  const starterPlacements = placeStartingXi(
    starters.map((row: any) => ({ grid: row?.player?.grid, pos: row?.player?.pos })),
    isHome,
  );

  const mapRow = (row: any, isStarting: boolean, placement?: { x: number; y: number; position: string } | null): Player => {
    const player = row.player || {};
    const extra = player.id ? statsById.get(Number(player.id)) : undefined;
    const fullName = extra?.name || player.name || 'Oyuncu';
    return {
      id: player.id ? `p-${player.id}` : `p-${teamId}-${player.number || fullName}`,
      name: fullName,
      shortName: shortNameFrom(fullName),
      number: toNumber(player.number),
      position: placement?.position || fallbackPositionLabel(player.pos),
      category: categoryFromPos(player.pos),
      avatar: extra?.photo || '',
      teamId,
      isStarting,
      pitchPosition: placement ? { x: placement.x, y: placement.y } : undefined,
      stats: extra?.stats || { ...EMPTY_STATS },
      baseRating: extra?.rating || 6.5,
      motmVotes: 0,
    };
  };

  return [
    ...starters.map((row: any, index: number) => mapRow(row, true, starterPlacements[index])),
    ...subs.map((row: any) => mapRow(row, false)),
  ];
}

function mapEventType(type?: string, detail?: string): MatchEvent['type'] | null {
  const t = (type || '').toLowerCase();
  const d = (detail || '').toLowerCase();
  if (t === 'goal' && d.includes('own')) return 'own-goal';
  if (t === 'goal' && d.includes('penalty')) return 'penalty';
  if (t === 'goal') return 'goal';
  if (t === 'card' && d.includes('red')) return 'red-card';
  if (t === 'card') return 'yellow-card';
  if (t === 'subst') return 'sub-out';
  return null;
}

function buildEvents(rawEvents: any[], homeTeamId: string, awayTeamId: string, homeApiId: number, awayApiId: number): MatchEvent[] {
  const events: MatchEvent[] = [];
  for (const item of rawEvents || []) {
    const teamId = item.team?.id === homeApiId ? homeTeamId : item.team?.id === awayApiId ? awayTeamId : homeTeamId;
    const type = mapEventType(item.type, item.detail);
    if (!type) continue;
    const playerName = item.player?.name || 'Oyuncu';
    events.push({
      minute: toNumber(item.time?.elapsed),
      type,
      playerId: item.player?.id ? `p-${item.player.id}` : `p-${teamId}-${playerName}`,
      playerName,
      teamId,
      detail: [item.detail, item.assist?.name ? `${item.assist.name} asisti` : '', item.comments].filter(Boolean).join(' • '),
    });
    if ((item.type || '').toLowerCase() === 'subst' && item.assist?.name) {
      events.push({
        minute: toNumber(item.time?.elapsed),
        type: 'sub-in',
        playerId: item.assist?.id ? `p-${item.assist.id}` : `p-${teamId}-${item.assist.name}`,
        playerName: item.assist.name,
        teamId,
        detail: `${playerName} yerine`,
      });
    }
    if ((item.type || '').toLowerCase() === 'goal' && item.assist?.name && !String(item.detail || '').toLowerCase().includes('own')) {
      events.push({
        minute: toNumber(item.time?.elapsed),
        type: 'assist',
        playerId: item.assist?.id ? `p-${item.assist.id}` : `p-${teamId}-${item.assist.name}`,
        playerName: item.assist.name,
        teamId,
        detail: `${playerName} golü`,
      });
    }
  }
  return events;
}

function collectStats(rawPlayers: any[]): Map<number, { photo?: string; name?: string; stats: PlayerStats; rating: number }> {
  const map = new Map<number, { photo?: string; name?: string; stats: PlayerStats; rating: number }>();
  for (const side of rawPlayers || []) {
    for (const row of side.players || []) {
      const id = Number(row.player?.id);
      if (!id) continue;
      const stats = mapPlayerStats(row.statistics?.[0]);
      map.set(id, {
        photo: row.player?.photo,
        name: row.player?.name,
        stats,
        rating: toNumber(row.statistics?.[0]?.games?.rating) || 6.5,
      });
    }
  }
  return map;
}

export function transformFixture(raw: any): Match {
  const homeLineup = (raw.lineups || []).find((lineup: any) => lineup.team?.id === raw.teams?.home?.id);
  const awayLineup = (raw.lineups || []).find((lineup: any) => lineup.team?.id === raw.teams?.away?.id);
  const homeTeam = buildTeam(raw.teams?.home, homeLineup);
  const awayTeam = buildTeam(raw.teams?.away, awayLineup);
  const stats = collectStats(raw.players || []);
  const status = mapStatus(raw.fixture?.status?.short);
  const venue = [raw.fixture?.venue?.name, raw.fixture?.venue?.city].filter(Boolean).join(', ');

  return {
    id: `af-${raw.fixture?.id}`,
    leagueId: 'super-lig',
    leagueName: raw.league?.name || 'Trendyol Süper Lig',
    week: parseRoundWeek(raw.league?.round),
    date: formatMatchDate(raw.fixture?.date),
    kickoffAt: raw.fixture?.date || undefined,
    stadium: venue || 'Süper Lig',
    referee: raw.fixture?.referee || 'Belirlenmedi',
    status,
    minute: status === 'LIVE' ? raw.fixture?.status?.elapsed || 1 : undefined,
    liveSeconds: status === 'LIVE' ? 0 : 0,
    homeTeam,
    awayTeam,
    homeScore: raw.goals?.home ?? 0,
    awayScore: raw.goals?.away ?? 0,
    homePlayers: buildPlayers(homeLineup, homeTeam.id, true, stats),
    awayPlayers: buildPlayers(awayLineup, awayTeam.id, false, stats),
    events: buildEvents(raw.events || [], homeTeam.id, awayTeam.id, raw.teams?.home?.id, raw.teams?.away?.id),
    viewsCount: 0,
  };
}

export function transformStandings(rows: any[]): StandingTeam[] {
  return (rows || []).map((row) => {
    const style = resolveClubStyle(row.team?.id, row.team?.name || '');
    const all = row.all || {};
    const home = row.home || {};
    const away = row.away || {};
    const form = String(row.form || '')
      .split('')
      .filter((letter) => letter === 'W' || letter === 'D' || letter === 'L') as StandingTeam['form'];
    const rank = toNumber(row.rank);
    let zone: StandingTeam['zone'];
    if (rank === 1) zone = 'ucl';
    else if (rank === 2) zone = 'ucl-qual';
    else if (rank === 3) zone = 'uel';
    else if (rank === 4) zone = 'uecl';
    else if (rank >= 16) zone = 'relegation';

    return {
      rank,
      id: style.id,
      name: row.team?.name || style.shortName,
      shortName: style.shortName,
      logo: row.team?.logo || '',
      primaryColor: style.primaryColor,
      secondaryColor: style.secondaryColor,
      played: toNumber(all.played),
      won: toNumber(all.win),
      drawn: toNumber(all.draw),
      lost: toNumber(all.lose),
      goalsFor: toNumber(all.goals?.for),
      goalsAgainst: toNumber(all.goals?.against),
      goalDifference: toNumber(row.goalsDiff),
      points: toNumber(row.points),
      form,
      home: {
        played: toNumber(home.played),
        won: toNumber(home.win),
        drawn: toNumber(home.draw),
        lost: toNumber(home.lose),
        goalsFor: toNumber(home.goals?.for),
        goalsAgainst: toNumber(home.goals?.against),
        points: toNumber(home.win) * 3 + toNumber(home.draw),
      },
      away: {
        played: toNumber(away.played),
        won: toNumber(away.win),
        drawn: toNumber(away.draw),
        lost: toNumber(away.lose),
        goalsFor: toNumber(away.goals?.for),
        goalsAgainst: toNumber(away.goals?.against),
        points: toNumber(away.win) * 3 + toNumber(away.draw),
      },
      zone,
    };
  });
}

export function buildLeague(season: number, currentWeek: number): League {
  return {
    id: 'super-lig',
    name: `Trendyol Süper Lig (${season}/${String(season + 1).slice(-2)})`,
    country: 'Türkiye',
    logo: '🇹🇷',
    currentWeek,
    totalWeeks: 34,
  };
}
