import { Match } from '../src/types';
import {
  isAbsenceActiveOn,
  isSuspensionText,
  parseBanLength,
  remainingBanMatches,
} from '../src/lib/availability';
import { formatAbsenceReason } from '../src/lib/predictedLineup';
import { fetchPlayerSidelined, FixtureAbsence, SidelinedRow } from './apiSports';

export type AbsenceNote = { id: string; name: string; reason: string; teamId: string };

function kickoffMs(match?: Match | null): number {
  if (!match?.kickoffAt) return 0;
  const parsed = new Date(match.kickoffAt).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function playerApiId(playerId?: string): number | null {
  const raw = (playerId || '').startsWith('p-') ? playerId.slice(2) : playerId;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function finishedForTeam(matches: Match[], teamId: string): Match[] {
  return matches
    .filter((match) => {
      if (match.status !== 'FT') return false;
      return match.homeTeam.id === teamId || match.awayTeam.id === teamId;
    })
    .sort((a, b) => kickoffMs(b) - kickoffMs(a));
}

function matchesPlayedSince(matches: Match[], teamId: string, sinceMs: number): number {
  if (!sinceMs) return 0;
  return finishedForTeam(matches, teamId).filter((match) => kickoffMs(match) > sinceMs).length;
}

function recentReds(matches: Match[], teamId: string, lookback = 10): Array<{
  playerId: string;
  name: string;
  at: number;
}> {
  const reds: Array<{ playerId: string; name: string; at: number }> = [];
  for (const match of finishedForTeam(matches, teamId).slice(0, lookback)) {
    const at = kickoffMs(match);
    for (const event of match.events || []) {
      if (event.type !== 'red-card' || event.teamId !== teamId || !event.playerId) continue;
      reds.push({ playerId: event.playerId, name: event.playerName, at });
    }
  }
  return reds;
}

function activeSuspension(rows: SidelinedRow[], kickoff: number): SidelinedRow | undefined {
  return rows.find((row) => {
    if (!isSuspensionText(row.type, '')) return false;
    const start = row.start ? Date.parse(row.start) : 0;
    if (start && start > kickoff) return false;
    return isAbsenceActiveOn(row.end, kickoff);
  });
}

export async function resolveUnavailable(options: {
  matches: Match[];
  match: Match;
  fixtureAbsences: FixtureAbsence[];
  kickoffMs: number;
}): Promise<{ ids: Set<string>; notes: AbsenceNote[] }> {
  const { matches, match, fixtureAbsences, kickoffMs: kickoff } = options;
  const ids = new Set<string>();
  const notes: AbsenceNote[] = [];

  const add = (id: string, name: string, reason: string, teamId: string) => {
    if (!id || ids.has(id)) return;
    ids.add(id);
    notes.push({ id, name, reason, teamId });
  };

  for (const row of fixtureAbsences) {
    add(`p-${row.playerId}`, row.name, formatAbsenceReason(row.type, row.reason), '');
  }

  const candidates = new Map<string, { name: string; teamId: string; at: number }>();
  for (const teamId of [match.homeTeam.id, match.awayTeam.id]) {
    for (const red of recentReds(matches, teamId)) {
      if (!candidates.has(red.playerId) || red.at > (candidates.get(red.playerId)?.at || 0)) {
        candidates.set(red.playerId, { name: red.name, teamId, at: red.at });
      }
    }
  }

  await Promise.all(
    [...candidates.entries()].map(async ([playerId, info]) => {
      const apiId = playerApiId(playerId);
      const served = matchesPlayedSince(matches, info.teamId, info.at);
      const sidelined = apiId ? await fetchPlayerSidelined(apiId) : [];
      const openBan = activeSuspension(sidelined, kickoff);

      if (openBan) {
        add(
          playerId,
          info.name,
          formatAbsenceReason(openBan.type, openBan.end ? `bitiş ${openBan.end}` : 'devam ediyor'),
          info.teamId,
        );
        return;
      }

      const anyBan = sidelined.find((row) => isSuspensionText(row.type, ''));
      if (anyBan && !isAbsenceActiveOn(anyBan.end, kickoff)) {
        return;
      }

      const length = parseBanLength(anyBan?.type) || (served === 0 ? 1 : null);
      if (length && remainingBanMatches(length, served) > 0) {
        add(
          playerId,
          info.name,
          `Ceza: ${remainingBanMatches(length, served)} maç kaldı`,
          info.teamId,
        );
      }
    }),
  );

  return { ids, notes };
}
