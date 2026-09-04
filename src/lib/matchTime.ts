export const ISTANBUL_TZ = 'Europe/Istanbul';

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
