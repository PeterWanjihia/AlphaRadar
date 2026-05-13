export type FreshnessState = "fresh" | "cached" | "stale" | "unknown";

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiResponse<T> = {
  ok: boolean;
  data: T | null;
  warnings: string[];
  freshness: Record<string, FreshnessState>;
  generatedAt: string;
  source: "AlphaTrace-derived" | "Birdeye-derived";
  error?: ApiErrorBody;
};
