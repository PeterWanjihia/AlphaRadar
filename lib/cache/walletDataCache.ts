/**
 * In-memory cache for wallet API responses.
 * Reduces duplicate requests to Birdeye API and improves performance.
 */

import { TTL_SECONDS } from "./ttl";

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

type CacheKey = {
  endpoint: string;
  wallet?: string;
  window?: string;
  params?: string;
};

export class WalletDataCache {
  private static instance: WalletDataCache;

  private cache = new Map<string, CacheEntry<unknown>>();

  private readonly ttlMs: number;

  private constructor(ttlSeconds: number = TTL_SECONDS.WALLET_DATA) {
    this.ttlMs = ttlSeconds * 1000;
    this.startCleanupInterval();
  }

  static getInstance(ttlSeconds?: number): WalletDataCache {
    if (!WalletDataCache.instance) {
      WalletDataCache.instance = new WalletDataCache(ttlSeconds);
    }
    return WalletDataCache.instance;
  }

  private generateKey(cacheKey: CacheKey): string {
    const parts = [
      cacheKey.endpoint,
      cacheKey.wallet || "global",
      cacheKey.window || "none",
      cacheKey.params || "default",
    ];
    return parts.join(":");
  }

  /**
   * Get cached value if it exists and hasn't expired
   */
  get<T>(cacheKey: CacheKey): T | null {
    const key = this.generateKey(cacheKey);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cache value with TTL
   */
  set<T>(cacheKey: CacheKey, data: T): void {
    const key = this.generateKey(cacheKey);
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  /**
   * Get or compute cached value
   */
  async getOrCompute<T>(
    cacheKey: CacheKey,
    compute: () => Promise<T>,
  ): Promise<T> {
    const cached = this.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const result = await compute();
    this.set(cacheKey, result);
    return result;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for specific wallet
   */
  clearWallet(wallet: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.includes(wallet)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Get cache stats for monitoring
   */
  getStats() {
    let expiredCount = 0;
    const now = Date.now();

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredCount++;
      }
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries: expiredCount,
      activeEntries: this.cache.size - expiredCount,
    };
  }

  /**
   * Start automatic cleanup interval (5 minutes)
   */
  private startCleanupInterval(): void {
    // Only start cleanup in Node.js environment
    if (typeof global !== "undefined" && typeof setInterval !== "undefined") {
      const cleanupIntervalMs = 5 * 60 * 1000; // 5 minutes
      setInterval(() => {
        this.cleanup();
      }, cleanupIntervalMs);
    }
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.debug(`[WalletDataCache] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }
}

export function getWalletDataCache(ttlSeconds?: number): WalletDataCache {
  return WalletDataCache.getInstance(ttlSeconds);
}
