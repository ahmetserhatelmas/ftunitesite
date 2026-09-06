const ISTANBUL_TZ = 'Europe/Istanbul';

export function istanbulYmd(ms: number): string {
  return new Date(ms).toLocaleDateString('en-CA', { timeZone: ISTANBUL_TZ });
}

export function parseBanLength(text?: string | null): number | null {
  const raw = (text || '').trim();
  if (!raw) return null;
  const numbered = raw.match(/(\d+)\s*(maç|mac|match)/i);
  if (numbered) {
    const n = Number(numbered[1]);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

export function isAbsenceActiveOn(end?: string | null, kickoffMs?: number): boolean {
  if (!kickoffMs || Number.isNaN(kickoffMs)) return true;
  const endRaw = (end || '').trim();
  if (!endRaw || /unknown|null|ongoing|devam/i.test(endRaw)) return true;
  const parsed = Date.parse(endRaw.includes('T') ? endRaw : `${endRaw}T23:59:59+03:00`);
  if (Number.isNaN(parsed)) return true;
  return istanbulYmd(parsed) >= istanbulYmd(kickoffMs);
}

export function remainingBanMatches(banLength: number, matchesPlayedSince: number): number {
  return Math.max(0, banLength - Math.max(0, matchesPlayedSince));
}

export function isSuspensionText(type?: string, reason?: string): boolean {
  const blob = `${type || ''} ${reason || ''}`.toLowerCase();
  return (
    blob.includes('suspend') ||
    blob.includes('ban') ||
    blob.includes('red card') ||
    blob.includes('yellow card') ||
    blob.includes('ceza') ||
    blob.includes('kart')
  );
}
