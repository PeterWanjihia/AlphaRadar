import { apiError, apiSuccess } from "@/lib/api/response";
import { getLatestLeaderboardSnapshot, saveLeaderboardSnapshot } from "@/lib/repositories/leaderboardRepository";
import { buildLeaderboardSnapshot } from "@/lib/services/leaderboardService";
import { parseTimeWindow } from "@/lib/validators/window";

function parseLimit(input: string | null): number {
  if (!input) {
    return 50;
  }

  const parsed = Number.parseInt(input, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error("Invalid limit. Use a whole number between 1 and 100.");
  }

  return Math.max(1, Math.min(100, parsed));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const window = parseTimeWindow(url.searchParams.get("window"), "7d");
    const limit = parseLimit(url.searchParams.get("limit"));

    const cached = await getLatestLeaderboardSnapshot(window).catch(() => null);
    if (cached) {
      return apiSuccess(
        {
          window,
          limit,
          generatedAt: cached.generatedAt,
          walletCount: cached.walletCount,
          entries: cached.entries.slice(0, limit),
        },
        {
          source: "AlphaTrace-derived",
          freshness: { leaderboard: "cached" },
        },
      );
    }

    const buildResult = await buildLeaderboardSnapshot(window, limit);
    const { snapshot, warnings, freshness, candidateCount, analyzedCount, hadCandidateSourceSuccess } = buildResult;

    if (hadCandidateSourceSuccess && (analyzedCount > 0 || candidateCount === 0)) {
      await saveLeaderboardSnapshot(snapshot).catch((error) => {
        warnings.push(error instanceof Error ? `Failed to persist leaderboard snapshot: ${error.message}` : "Failed to persist leaderboard snapshot.");
      });
    }

    return apiSuccess(
      {
        window,
        limit,
        generatedAt: snapshot.generatedAt,
        walletCount: snapshot.walletCount,
        candidateCount,
        entries: snapshot.entries.slice(0, limit),
      },
      {
        warnings,
        freshness,
        source: "AlphaTrace-derived",
      },
    );
  } catch (error) {
    return apiError(
      {
        code: "LEADERBOARD_REQUEST_FAILED",
        message: error instanceof Error ? error.message : "Failed to build leaderboard",
      },
      {
        freshness: { leaderboard: "unknown" },
        source: "AlphaTrace-derived",
      },
      400,
    );
  }
}