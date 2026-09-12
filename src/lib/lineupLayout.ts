/** API-SPORTS `player.grid` is `"row:col"`. Row 1 is the goalkeeper; columns run left → right. */

export type LineupGridSlot = {
  grid?: string | null;
  pos?: string | null;
};

export type LineupPlacement = {
  x: number;
  y: number;
  position: string;
};

function parseGrid(grid?: string | null): { row: number; col: number } | null {
  if (!grid) return null;
  const [row, col] = String(grid).split(':').map(Number);
  if (!Number.isFinite(row) || !Number.isFinite(col) || row < 1 || col < 1) return null;
  return { row, col };
}

function laneY(index: number, count: number): number {
  if (count <= 1) return 50;
  // 2 players sit as a compact pair; wider lines use more of the pitch.
  const span = count === 2 ? 34 : count === 3 ? 54 : 64;
  const top = 50 - span / 2;
  const bottom = 50 + span / 2;
  return Math.round(top + (index / (count - 1)) * (bottom - top));
}

function rowX(row: number, maxRow: number, isHome: boolean): number {
  if (maxRow <= 1) return isHome ? 10 : 90;
  const progress = (row - 1) / (maxRow - 1);
  const x = isHome ? 10 + progress * 76 : 90 - progress * 76;
  return Math.round(Math.min(94, Math.max(6, x)));
}

function roleForSlot(
  pos: string | undefined,
  index: number,
  count: number,
  row: number,
  maxRow: number,
): string {
  if (pos === 'G') return 'GK';

  if (pos === 'D') {
    if (count <= 2) return 'CB';
    if (index === 0) return count >= 5 ? 'LWB' : 'LB';
    if (index === count - 1) return count >= 5 ? 'RWB' : 'RB';
    return 'CB';
  }

  if (pos === 'M') {
    if (count === 1) return row < maxRow ? 'CDM' : 'CAM';
    if (count === 2) return row < maxRow - 1 ? 'CDM' : 'CM';
    if (index === 0) return 'LM';
    if (index === count - 1) return 'RM';
    if (count === 3 && row === maxRow - 1 && maxRow >= 5) return 'CAM';
    return 'CM';
  }

  if (count === 1) return 'ST';
  if (count === 2) return 'ST';
  if (index === 0) return 'LW';
  if (index === count - 1) return 'RW';
  return 'ST';
}

function fallbackRole(pos?: string | null): string {
  if (pos === 'G') return 'GK';
  if (pos === 'D') return 'CB';
  if (pos === 'M') return 'CM';
  return 'ST';
}

/**
 * Place a starting XI on a horizontal pitch.
 * Home attacks left → right (own goal on the left). Away is mirrored.
 * Column 1 is the team's left: top of the screen for home, bottom for away.
 */
export function placeStartingXi(starters: LineupGridSlot[], isHome: boolean): Array<LineupPlacement | null> {
  const parsed = starters.map((slot) => parseGrid(slot.grid));
  const maxRow = Math.max(1, ...parsed.filter(Boolean).map((g) => g!.row));

  const colsByRow = new Map<number, number[]>();
  for (const grid of parsed) {
    if (!grid) continue;
    const cols = colsByRow.get(grid.row) || [];
    if (!cols.includes(grid.col)) cols.push(grid.col);
    colsByRow.set(grid.row, cols);
  }
  for (const cols of colsByRow.values()) {
    cols.sort((a, b) => a - b);
  }

  return starters.map((slot, i) => {
    const grid = parsed[i];
    if (!grid) return null;

    const cols = colsByRow.get(grid.row) || [grid.col];
    const index = Math.max(0, cols.indexOf(grid.col));
    const count = cols.length;
    const yIndex = isHome ? index : count - 1 - index;

    return {
      x: rowX(grid.row, maxRow, isHome),
      y: laneY(yIndex, count),
      position: roleForSlot(slot.pos || undefined, index, count, grid.row, maxRow),
    };
  });
}

export function fallbackPositionLabel(pos?: string | null): string {
  return fallbackRole(pos);
}

const CATEGORY_ORDER = ['GK', 'DEF', 'MID', 'FWD'] as const;

type PlaceablePlayer = {
  id?: string;
  isStarting?: boolean;
  category?: string;
  position?: string;
  pitchPosition?: { x: number; y: number };
};

function categoryOf(player: PlaceablePlayer): (typeof CATEGORY_ORDER)[number] {
  if (player.category === 'GK' || player.position === 'GK') return 'GK';
  if (player.category === 'DEF') return 'DEF';
  if (player.category === 'MID') return 'MID';
  return 'FWD';
}

/** Dizilişi ev/deplasman yönüne göre yeniden yerleştir — son maçın koordinatı ters kalmasın. */
export function layoutStartingXi<T extends PlaceablePlayer>(players: T[], isHome: boolean): T[] {
  const starters = players.filter((player) => player.isStarting);
  if (!starters.length) return players;

  const groups = new Map<(typeof CATEGORY_ORDER)[number], T[]>();
  for (const key of CATEGORY_ORDER) groups.set(key, []);
  for (const player of starters) {
    groups.get(categoryOf(player))!.push(player);
  }

  const rows = CATEGORY_ORDER.map((key) => groups.get(key)!).filter((row) => row.length);
  const placed = new Map<T, { x: number; y: number }>();
  rows.forEach((row, rowIndex) => {
    row.forEach((player, index) => {
      const yIndex = isHome ? index : row.length - 1 - index;
      placed.set(player, {
        x: rowX(rowIndex + 1, rows.length, isHome),
        y: laneY(yIndex, row.length),
      });
    });
  });

  return players.map((player) => {
    const spot = placed.get(player);
    return spot ? { ...player, pitchPosition: spot } : player;
  });
}

function keeperIsOnWrongHalf(players: PlaceablePlayer[], isHome: boolean): boolean {
  const keeper = players.find((player) => player.isStarting && categoryOf(player) === 'GK');
  const x = keeper?.pitchPosition?.x;
  if (typeof x !== 'number') return false;
  return isHome ? x > 50 : x < 50;
}

export function ensurePitchPositions<T extends PlaceablePlayer>(players: T[], isHome: boolean): T[] {
  const starters = players.filter((player) => player.isStarting);
  if (!starters.length) return players;
  const missing = starters.some((player) => player.pitchPosition?.x == null);
  if (!missing && !keeperIsOnWrongHalf(starters, isHome)) return players;
  return layoutStartingXi(players, isHome);
}
