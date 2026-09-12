export const ISTANBUL_TZ = 'Europe/Istanbul';

const TR_MONTHS: Record<string, number> = {
  ocak: 0,
  şubat: 1,
  subat: 1,
  mart: 2,
  nisan: 3,
  mayıs: 4,
  mayis: 4,
  haziran: 5,
  temmuz: 6,
  ağustos: 7,
  agustos: 7,
  eylül: 8,
  eylul: 8,
  ekim: 9,
  kasım: 10,
  kasim: 10,
  aralık: 11,
  aralik: 11,
};

export function normalizePersonName(name?: string | null): string {
  return (name || '').trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ');
}

/** Parses ISO or Turkish display dates like "4 Eylül 2026, 20:00". */
export function parseReviewTimestamp(createdAt?: string, id?: string): number {
  if (createdAt) {
    const native = Date.parse(createdAt);
    if (!Number.isNaN(native)) return native;

    const cleaned = createdAt.replace(/[•·,]/g, ' ').replace(/\s+/g, ' ').trim();
    const parts = cleaned.match(
      /(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)\s+(\d{4})(?:\s+(\d{1,2})[:.](\d{2}))?/,
    );
    if (parts) {
      const month = TR_MONTHS[parts[2].toLocaleLowerCase('tr-TR')];
      if (month != null) {
        const hour = parts[4] != null ? Number(parts[4]) : 12;
        const minute = parts[5] != null ? Number(parts[5]) : 0;
        const iso = `${parts[3]}-${String(month + 1).padStart(2, '0')}-${String(Number(parts[1])).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+03:00`;
        const parsed = Date.parse(iso);
        if (!Number.isNaN(parsed)) return parsed;
      }
    }
  }

  const fromId = id?.match(/(\d{10,13})$/);
  if (fromId) return Number(fromId[1]);
  return 0;
}

export function compareNewest(
  a: { createdAt?: string; id?: string },
  b: { createdAt?: string; id?: string },
): number {
  return parseReviewTimestamp(b.createdAt, b.id) - parseReviewTimestamp(a.createdAt, a.id);
}

export function hasKickoffStarted(iso?: string | null, graceMs = 0): boolean {
  if (!iso) return false;
  let t = new Date(iso).getTime();
  if (Number.isNaN(t)) t = parseReviewTimestamp(iso);
  if (!t || Number.isNaN(t)) return false;
  return Date.now() >= t + graceMs;
}

export function matchHasStarted(match?: { status?: string; kickoffAt?: string | null; date?: string } | null): boolean {
  if (!match) return false;
  if (match.status === 'FT' || match.status === 'LIVE') return true;
  return hasKickoffStarted(match.kickoffAt) || hasKickoffStarted(match.date);
}

export function isMatchLive(match?: { status?: string; kickoffAt?: string | null; date?: string } | null): boolean {
  if (!match) return false;
  if (match.status === 'LIVE') return true;
  if (match.status === 'FT') return false;
  return hasKickoffStarted(match.kickoffAt) || hasKickoffStarted(match.date);
}

export function publishedLineupSides(match?: {
  lineupConfirmed?: boolean;
  lineupSource?: 'official' | 'predicted';
  homePlayers?: Array<{ isStarting?: boolean }>;
  awayPlayers?: Array<{ isStarting?: boolean }>;
} | null): { home: boolean; away: boolean; any: boolean; both: boolean } {
  if (!match) return { home: false, away: false, any: false, both: false };
  if (match.lineupSource === 'predicted' && !match.lineupConfirmed) {
    return { home: false, away: false, any: false, both: false };
  }
  const home = (match.homePlayers || []).filter((player) => player.isStarting).length >= 11;
  const away = (match.awayPlayers || []).filter((player) => player.isStarting).length >= 11;
  const both = Boolean(match.lineupConfirmed) || (home && away);
  return { home, away, any: home || away, both };
}

export function hasPublishedLineup(match?: {
  lineupConfirmed?: boolean;
  lineupSource?: 'official' | 'predicted';
  homePlayers?: Array<{ isStarting?: boolean }>;
  awayPlayers?: Array<{ isStarting?: boolean }>;
} | null): boolean {
  return publishedLineupSides(match).any;
}

export function hasPredictedLineup(match?: {
  lineupSource?: 'official' | 'predicted';
  lineupConfirmed?: boolean;
  homePlayers?: Array<{ isStarting?: boolean }>;
  awayPlayers?: Array<{ isStarting?: boolean }>;
} | null): boolean {
  if (!match || match.lineupConfirmed || match.lineupSource !== 'predicted') return false;
  const home = (match.homePlayers || []).filter((player) => player.isStarting).length;
  const away = (match.awayPlayers || []).filter((player) => player.isStarting).length;
  return home >= 8 || away >= 8;
}

/** Resmi ilk 11 gelmiş olsa bile maç başlayana kadar tekrar çek — son dakika değişir. */
export function matchNeedsLineupRefresh(
  match?: {
    status?: string;
    kickoffAt?: string | null;
    date?: string;
    lineupConfirmed?: boolean;
    lineupSource?: 'official' | 'predicted';
    homePlayers?: Array<{ isStarting?: boolean }>;
    awayPlayers?: Array<{ isStarting?: boolean }>;
  } | null,
  aheadMs = 3 * 60 * 60 * 1000,
): boolean {
  if (!match || match.status === 'FT') return false;

  const sides = publishedLineupSides(match);
  const kickoff = match.kickoffAt
    ? new Date(match.kickoffAt).getTime()
    : parseReviewTimestamp(match.date);
  if (!kickoff || Number.isNaN(kickoff)) {
    return match.status === 'LIVE' && !sides.both;
  }

  const untilKickoff = kickoff - Date.now();
  if (untilKickoff <= aheadMs && untilKickoff >= -20 * 60 * 1000) return true;
  return match.status === 'LIVE' && !sides.both;
}

/** Resmi 11 yokken tahmini kadro için sakatlık/ceza penceresi (günde 2-3 çekim). */
export function matchNeedsAvailabilityRefresh(
  match?: {
    status?: string;
    kickoffAt?: string | null;
    date?: string;
    lineupConfirmed?: boolean;
  } | null,
  aheadMs = 7 * 24 * 60 * 60 * 1000,
): boolean {
  if (!match || match.status !== 'UPCOMING' || match.lineupConfirmed) return false;
  const kickoff = match.kickoffAt
    ? new Date(match.kickoffAt).getTime()
    : parseReviewTimestamp(match.date);
  if (!kickoff || Number.isNaN(kickoff)) return false;
  const untilKickoff = kickoff - Date.now();
  return untilKickoff > 0 && untilKickoff <= aheadMs;
}

function minutesSinceKickoff(
  match?: { kickoffAt?: string | null; date?: string } | null,
  now = Date.now(),
): number {
  const kickoff = match?.kickoffAt
    ? new Date(match.kickoffAt).getTime()
    : parseReviewTimestamp(match?.date);
  if (!kickoff || Number.isNaN(kickoff)) return 0;
  return Math.max(0, Math.floor((now - kickoff) / 60_000));
}

/** Devre arası (~15 dk) düşülmüş kickoff saati tahmini. */
export function estimatedMinuteFromKickoff(fromKick: number): number {
  if (fromKick <= 0) return 1;
  if (fromKick <= 48) return Math.min(fromKick, 48);
  if (fromKick < 63) return 45;
  return Math.min(fromKick - 15, 130);
}

export function isLikelyHalfTime(
  match?: { kickoffAt?: string | null; date?: string } | null,
  now = Date.now(),
): boolean {
  const fromKick = minutesSinceKickoff(match, now);
  return fromKick > 48 && fromKick < 63;
}

export function isHalfTime(
  match?: { period?: '1H' | 'HT' | '2H' | 'ET'; kickoffAt?: string | null; date?: string } | null,
  now = Date.now(),
): boolean {
  if (match?.period === 'HT') return true;
  if (match?.period === '1H' || match?.period === '2H' || match?.period === 'ET') return false;
  return isLikelyHalfTime(match, now);
}

export function formatLiveClock(
  match?: {
    status?: string;
    period?: '1H' | 'HT' | '2H' | 'ET';
    minute?: number | string;
    liveSeconds?: number;
    kickoffAt?: string | null;
    date?: string;
  } | null,
): string {
  if (isHalfTime(match)) return 'İLK YARI';
  const liveMin = inferredLiveMinute(match);
  const liveSec = typeof match?.liveSeconds === 'number' ? match.liveSeconds : 0;
  return `${liveMin}:${String(liveSec).padStart(2, '0')}`;
}

/** API dakikası yoksa, 1'de takılıysa veya senkron gecikmişse kickoff'tan canlı dakika. */
export function inferredLiveMinute(match?: {
  status?: string;
  period?: '1H' | 'HT' | '2H' | 'ET';
  minute?: number | string;
  kickoffAt?: string | null;
  date?: string;
} | null, now = Date.now()): number {
  if (match?.period === 'HT') return 45;
  const fromKick = minutesSinceKickoff(match, now);
  const secondHalf = match?.period === '2H' || match?.period === 'ET';
  const estimated = fromKick > 0
    ? (secondHalf ? Math.min(Math.max(fromKick - 15, 46), 130) : estimatedMinuteFromKickoff(fromKick))
    : 0;
  const raw = match?.minute;
  const apiMin = typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10);
  const hasApi = Number.isFinite(apiMin) && apiMin > 0;
  if (hasApi && apiMin > 1 && apiMin + 3 >= estimated) {
    return Math.min(secondHalf ? Math.max(apiMin, 46) : apiMin, 130);
  }
  if (estimated > 0) return estimated;
  return hasApi ? Math.min(apiMin, 130) : 1;
}

/** Canlı + bitiş sonrası VAR/skor düzeltmesi için birkaç saat daha senkron. */
export function matchNeedsScoreRefresh(
  match?: { status?: string; kickoffAt?: string | null; date?: string } | null,
  windowMs = 4 * 60 * 60 * 1000,
): boolean {
  if (!match) return false;
  if (match.status === 'LIVE') return true;
  const kickoff = match.kickoffAt
    ? new Date(match.kickoffAt).getTime()
    : parseReviewTimestamp(match.date);
  if (!kickoff || Number.isNaN(kickoff)) {
    return hasKickoffStarted(match.kickoffAt, -60_000) || hasKickoffStarted(match.date, -60_000);
  }
  const elapsed = Date.now() - kickoff;
  return elapsed >= -60_000 && elapsed <= windowMs;
}

/** Haftanın tüm maçları bittiyse bir sonraki oynanacak / canlı haftayı döner. */
export function deriveActiveWeek(
  matches: Array<{ week: number; status?: string; kickoffAt?: string | null; date?: string }>,
  fallback = 1,
): number {
  if (!matches.length) return Math.max(1, fallback);

  const weeks = [...new Set(matches.map((match) => match.week).filter((week) => week > 0))].sort((a, b) => a - b);
  if (!weeks.length) return Math.max(1, fallback);

  const liveWeeks = matches.filter((match) => isMatchLive(match)).map((match) => match.week);
  if (liveWeeks.length) return Math.max(...liveWeeks);

  for (const week of weeks) {
    const weekMatches = matches.filter((match) => match.week === week);
    const allFinished = weekMatches.length > 0 && weekMatches.every((match) => match.status === 'FT');
    if (!allFinished) return week;
  }

  return Math.max(weeks[weeks.length - 1], fallback, 1);
}

export function formatMatchKickoff(iso?: string | null, fallback = ''): string {
  if (!iso) return fallback;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleString('tr-TR', {
    timeZone: ISTANBUL_TZ,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}
