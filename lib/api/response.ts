import { NextResponse } from "next/server";
import type { ApiErrorBody, ApiResponse, FreshnessState } from "@/lib/types/api";

type BuildOptions = {
  warnings?: string[];
  freshness?: Record<string, FreshnessState>;
  source?: "AlphaTrace-derived" | "Birdeye-derived";
};

const DEFAULT_FRESHNESS: Record<string, FreshnessState> = { default: "unknown" };

export function apiSuccess<T>(
  data: T,
  options: BuildOptions = {},
  status = 200,
) {
  const body: ApiResponse<T> = {
    ok: true,
    data,
    warnings: options.warnings ?? [],
    freshness: options.freshness ?? DEFAULT_FRESHNESS,
    generatedAt: new Date().toISOString(),
    source: options.source ?? "AlphaTrace-derived",
  };

  return NextResponse.json(body, { status });
}

export function apiError(
  error: ApiErrorBody,
  options: BuildOptions = {},
  status = 500,
) {
  const body: ApiResponse<null> = {
    ok: false,
    data: null,
    warnings: options.warnings ?? [],
    freshness: options.freshness ?? DEFAULT_FRESHNESS,
    generatedAt: new Date().toISOString(),
    source: options.source ?? "AlphaTrace-derived",
    error,
  };

  return NextResponse.json(body, { status });
}
