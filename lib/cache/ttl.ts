const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

export const CACHE_TTL_MS = {
  walletProfile: 20 * MINUTE_MS,
  holdings: 3 * MINUTE_MS,
  netWorth: 45 * MINUTE_MS,
  tokenMetadata: 24 * HOUR_MS,
  firstFunded: 365 * 24 * HOUR_MS,
} as const;

export function ageMsFromIso(isoTimestamp: string, nowMs = Date.now()): number {
  const ts = new Date(isoTimestamp).getTime();
  if (Number.isNaN(ts)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, nowMs - ts);
}

export function isCacheFresh(isoTimestamp: string, ttlMs: number, nowMs = Date.now()): boolean {
  return ageMsFromIso(isoTimestamp, nowMs) <= ttlMs;
}