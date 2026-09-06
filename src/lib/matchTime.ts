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
