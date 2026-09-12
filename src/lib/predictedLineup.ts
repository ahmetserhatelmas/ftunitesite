import { Player, PlayerStats } from '../types';
import { layoutStartingXi } from './lineupLayout';

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

function cloneForPreview(player: Player, isStarting: boolean, pitchPosition = player.pitchPosition): Player {
  return {
    ...player,
    isStarting,
    pitchPosition: isStarting ? pitchPosition : undefined,
    stats: { ...EMPTY_STATS },
    baseRating: 6.5,
    motmVotes: 0,
  };
}

/** Son resmi 11 − sakat/cezalı; boş koltukları aynı mevkiden yedekle doldur. */
export function predictSide(lastPlayers: Player[], unavailableIds: Set<string>, isHome: boolean): Player[] {
  if (!lastPlayers.length) return [];

  const isOut = (player: Player) => unavailableIds.has(player.id);
  const lastStarters = lastPlayers.filter((player) => player.isStarting);
  const kept = lastStarters.filter((player) => !isOut(player));
  const missing = lastStarters.filter(isOut);
  const bench = lastPlayers.filter((player) => !player.isStarting && !isOut(player));
  const used = new Set<string>();
  const promoted: Player[] = [];

  for (const gone of missing) {
    const same = bench.find((player) => !used.has(player.id) && player.category === gone.category);
    const any = bench.find((player) => !used.has(player.id));
    const pick = same || any;
    if (!pick) continue;
    used.add(pick.id);
    promoted.push(cloneForPreview(pick, true));
  }

  return layoutStartingXi([
    ...kept.map((player) => cloneForPreview(player, true)),
    ...promoted,
    ...bench.filter((player) => !used.has(player.id)).map((player) => cloneForPreview(player, false)),
  ], isHome);
}

export function formatAbsenceReason(type?: string, reason?: string): string {
  const blob = `${type || ''} ${reason || ''}`.toLowerCase();
  const detail = (reason || type || 'Uygun değil').trim();
  if (blob.includes('suspend') || blob.includes('red card') || blob.includes('yellow') || blob.includes('ceza')) {
    return `Ceza: ${detail}`;
  }
  return `Sakatlık: ${detail}`;
}
