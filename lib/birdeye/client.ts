import { getEnv } from "@/lib/config/env";
import { BIRDEYE_ENDPOINTS } from "@/lib/birdeye/endpoints";
import type {
  BirdeyeTokenMetadata,
  BirdeyeTraderGainersLoserRow,
  BirdeyeWalletFirstFunded,
  BirdeyeWalletHolding,
  BirdeyeWalletNetWorthPoint,
  BirdeyeWalletPnlDetailRow,
  BirdeyeWalletPnlSummary,
  TimeWindow,
} from "@/lib/birdeye/types";

type RequestOptions = {
  searchParams?: Record<string, string | number | boolean | undefined | null>;
  method?: "GET" | "POST";
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
};

type BirdeyeEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

export class BirdeyeClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
    public readonly endpoint?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "BirdeyeClientError";
  }
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function toIsoStringOrNull(value: unknown): string | null {
  if (typeof value === "number") {
    const date = new Date(value > 10_000_000_000 ? value : value * 1000);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  return null;
}

function asArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function extractRows(raw: Record<string, unknown>): unknown[] {
  return asArray((raw.items as unknown[]) ?? (raw.tokens as unknown[]) ?? (raw.list as unknown[]) ?? (raw.rows as unknown[]) ?? (raw.data as unknown[]));
}

function inferWalletPnlSummary(raw: Record<string, unknown>, wallet: string, window: TimeWindow): BirdeyeWalletPnlSummary {
  return {
    wallet,
    window,
    pnlUsd: toNumber(raw.pnl_usd ?? raw.pnl ?? raw.realized_pnl_usd),
    roiPercent: toNumber(raw.roi ?? raw.roi_percent),
    winRate: toNumber(raw.win_rate ?? raw.winRate),
    tradeCount: toNumber(raw.total_trades ?? raw.trade_count ?? raw.tradeCount),
    volumeUsd: toNumber(raw.volume_usd ?? raw.total_volume_usd ?? raw.volume),
  };
}

function inferTraderGainersLoserRow(row: unknown): BirdeyeTraderGainersLoserRow {
  const record = (row ?? {}) as Record<string, unknown>;

  return {
    wallet: toStringOrNull(record.wallet ?? record.address ?? record.wallet_address) ?? "unknown",
    rank: toNumber(record.rank ?? record.position),
    pnlUsd: toNumber(record.pnl_usd ?? record.profit_usd ?? record.pnl ?? record.profit),
    roiPercent: toNumber(record.roi ?? record.roi_percent),
    winRate: toNumber(record.win_rate ?? record.winRate),
    tradeCount: toNumber(record.trade_count ?? record.total_trades ?? record.trades),
    tokenCount: toNumber(record.token_count ?? record.tokens_traded ?? record.unique_tokens),
    volumeUsd: toNumber(record.volume_usd ?? record.total_volume_usd ?? record.volume),
    lastActivityAt: toIsoStringOrNull(record.last_trade_at ?? record.last_activity_at ?? record.updated_at ?? record.timestamp),
  };
}

function inferWalletPnlDetails(rawRows: unknown[]): BirdeyeWalletPnlDetailRow[] {
  return rawRows
    .map((row) => {
      const record = (row ?? {}) as Record<string, unknown>;

      return {
        tokenAddress: toStringOrNull(record.address ?? record.token_address ?? record.mint) ?? "unknown",
        tokenSymbol: toStringOrNull(record.symbol ?? record.token_symbol),
        tokenName: toStringOrNull(record.name ?? record.token_name),
        realizedPnlUsd: toNumber(record.realized_pnl_usd ?? record.realized_pnl),
        unrealizedPnlUsd: toNumber(record.unrealized_pnl_usd ?? record.unrealized_pnl),
        roiPercent: toNumber(record.roi ?? record.roi_percent),
        buyCount: toNumber(record.buy_count ?? record.buys),
        sellCount: toNumber(record.sell_count ?? record.sells),
        volumeUsd: toNumber(record.volume_usd ?? record.total_volume_usd),
        lastActivityAt: toIsoStringOrNull(record.last_trade_at ?? record.last_activity_at ?? record.updated_at),
      };
    })
    .sort((a, b) => (b.realizedPnlUsd ?? 0) - (a.realizedPnlUsd ?? 0));
}

export class BirdeyeClient {
  private readonly baseUrl: string;

  private readonly apiKey: string;

  private readonly defaultChain: string;

  private readonly defaultTimeoutMs = 15_000;

  constructor() {
    const env = getEnv();
    this.baseUrl = env.BIRDEYE_BASE_URL.replace(/\/+$/, "");
    this.apiKey = env.BIRDEYE_API_KEY;
    this.defaultChain = env.DEFAULT_CHAIN;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const method = options.method ?? "GET";
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const retries = options.retries ?? 1;

    const url = new URL(`${this.baseUrl}${endpoint}`);
    const mergedParams = {
      ...(options.searchParams ?? {}),
    };

    for (const [key, value] of Object.entries(mergedParams)) {
      if (value !== null && value !== undefined && `${value}`.trim().length > 0) {
        url.searchParams.set(key, String(value));
      }
    }

    let attempt = 0;
    let lastError: unknown = null;

    while (attempt <= retries) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const started = Date.now();

      try {
        const response = await fetch(url, {
          method,
          headers: {
            "X-API-KEY": this.apiKey,
            accept: "application/json",
            "x-chain": this.defaultChain,
            ...(method === "POST" || options.body ? { "content-type": "application/json" } : {}),
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
          cache: "no-store",
        });

        const durationMs = Date.now() - started;
        const payload = (await response.json().catch(() => ({}))) as BirdeyeEnvelope<T>;

        console.info("[Birdeye] request", {
          endpoint,
          status: response.status,
          durationMs,
          attempt,
          creditsUsed: response.headers.get("x-credits-used") ?? null,
          creditsRemaining: response.headers.get("x-credits-remaining") ?? null,
        });

        if (!response.ok) {
          throw new BirdeyeClientError(
            payload.message || `Birdeye request failed with status ${response.status}`,
            response.status === 429 ? "RATE_LIMITED" : "HTTP_ERROR",
            response.status,
            endpoint,
            payload,
          );
        }

        if (payload.success === false) {
          throw new BirdeyeClientError(
            payload.message || "Birdeye returned unsuccessful response",
            "UNSUCCESSFUL_RESPONSE",
            response.status,
            endpoint,
            payload,
          );
        }

        return (payload.data ?? (payload as unknown as T)) as T;
      } catch (error) {
        lastError = error;
        if (attempt >= retries) {
          if (error instanceof BirdeyeClientError) {
            throw error;
          }

          const isAbort = error instanceof Error && error.name === "AbortError";
          throw new BirdeyeClientError(
            isAbort ? "Birdeye request timed out" : "Birdeye request failed",
            isAbort ? "TIMEOUT" : "REQUEST_FAILED",
            undefined,
            endpoint,
            error,
          );
        }
      } finally {
        clearTimeout(timeout);
      }

      attempt += 1;
    }

    throw new BirdeyeClientError("Unknown Birdeye client error", "UNKNOWN", undefined, endpoint, lastError);
  }

  async getWalletPnlSummary(wallet: string, window: TimeWindow): Promise<BirdeyeWalletPnlSummary> {
    const data = await this.request<Record<string, unknown>>(BIRDEYE_ENDPOINTS.walletPnlSummary, {
      searchParams: { wallet, type: window },
    });

    return inferWalletPnlSummary(data ?? {}, wallet, window);
  }

  async getWalletPnlDetails(wallet: string, window: TimeWindow): Promise<BirdeyeWalletPnlDetailRow[]> {
    const data = await this.request<Record<string, unknown>>(BIRDEYE_ENDPOINTS.walletPnlDetails, {
      searchParams: { wallet, type: window },
    });

    const rows = asArray((data.items as unknown[]) ?? (data.tokens as unknown[]) ?? (data.list as unknown[]));
    return inferWalletPnlDetails(rows);
  }

  async getWalletNetWorth(wallet: string, window: TimeWindow): Promise<BirdeyeWalletNetWorthPoint[]> {
    const data = await this.request<Record<string, unknown>>(BIRDEYE_ENDPOINTS.walletNetWorth, {
      searchParams: { wallet, type: window },
    });

    const rows = asArray((data.items as unknown[]) ?? (data.list as unknown[]) ?? (data.history as unknown[]));

    return rows
      .map((row) => {
        const record = (row ?? {}) as Record<string, unknown>;
        const timestamp = toIsoStringOrNull(record.timestamp ?? record.time ?? record.unix_time);
        const valueUsd = toNumber(record.value_usd ?? record.net_worth ?? record.usd_value ?? record.value);

        if (!timestamp || valueUsd === null) {
          return null;
        }

        return { timestamp, valueUsd };
      })
      .filter((item): item is BirdeyeWalletNetWorthPoint => item !== null)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async getWalletTokenList(wallet: string): Promise<BirdeyeWalletHolding[]> {
    const data = await this.request<Record<string, unknown>>(BIRDEYE_ENDPOINTS.walletTokenList, {
      searchParams: { wallet },
    });

    const rows = asArray((data.items as unknown[]) ?? (data.tokens as unknown[]) ?? (data.list as unknown[]));

    return rows.map((row) => {
      const record = (row ?? {}) as Record<string, unknown>;
      return {
        tokenAddress: toStringOrNull(record.address ?? record.token_address ?? record.mint) ?? "unknown",
        symbol: toStringOrNull(record.symbol),
        name: toStringOrNull(record.name),
        balance: toNumber(record.balance ?? record.ui_amount ?? record.amount),
        valueUsd: toNumber(record.value_usd ?? record.usd_value ?? record.value),
      };
    });
  }

  async getWalletFirstFunded(wallet: string): Promise<BirdeyeWalletFirstFunded> {
    const data = await this.request<Record<string, unknown>>(BIRDEYE_ENDPOINTS.walletFirstFunded, {
      searchParams: { wallet },
    });

    const firstFundedAt = toIsoStringOrNull(
      data.first_funded_at ?? data.firstFundedAt ?? data.timestamp ?? data.time,
    );

    const walletAgeDays = firstFundedAt
      ? Math.max(0, Math.floor((Date.now() - new Date(firstFundedAt).getTime()) / 86_400_000))
      : null;

    return { firstFundedAt, walletAgeDays };
  }

  async getTokenMetadata(tokens: string[]): Promise<BirdeyeTokenMetadata[]> {
    if (tokens.length === 0) {
      return [];
    }

    const data = await this.request<Record<string, unknown>>(BIRDEYE_ENDPOINTS.tokenMetadataMultiple, {
      method: "POST",
      body: { addresses: tokens },
      searchParams: { addresses: tokens.join(",") },
      retries: 0,
    });

    const rows = asArray((data.items as unknown[]) ?? (data.tokens as unknown[]) ?? (data.list as unknown[]));

    return rows.map((row) => {
      const record = (row ?? {}) as Record<string, unknown>;
      return {
        address: toStringOrNull(record.address ?? record.token_address ?? record.mint) ?? "unknown",
        symbol: toStringOrNull(record.symbol),
        name: toStringOrNull(record.name),
        logoUri: toStringOrNull(record.logo_uri ?? record.logoURI ?? record.logo),
        decimals: toNumber(record.decimals),
      };
    });
  }

  async getTraderGainersLosers(window: TimeWindow, limit = 10, offset = 0): Promise<BirdeyeTraderGainersLoserRow[]> {
    void window;

    const data = await this.request<Record<string, unknown>>(BIRDEYE_ENDPOINTS.traderGainersLosers, {
      searchParams: { type: "today", sort_by: "PnL", sort_type: "desc", offset, limit },
      retries: 0,
    });

    const rows = extractRows(data ?? {});

    return rows
      .map(inferTraderGainersLoserRow)
      .filter((row) => row.wallet !== "unknown")
      .sort((a, b) => (b.pnlUsd ?? Number.NEGATIVE_INFINITY) - (a.pnlUsd ?? Number.NEGATIVE_INFINITY));
  }
}
