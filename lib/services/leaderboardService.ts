import { BirdeyeClient, BirdeyeClientError } from "@/lib/birdeye/client";
import type { TimeWindow } from "@/lib/birdeye/types";
import { computeAlphaScore } from "@/lib/scoring/walletAlphaScore";
import type { WalletScoringInput } from "@/lib/types/scoring";
import type { LeaderboardBuildResult, LeaderboardCandidate, LeaderboardEntry } from "@/lib/types/leaderboard";
import { isValidSolanaWalletAddress } from "@/lib/validators/wallet";

type CandidateAnalysis = {
  entry: Omit<LeaderboardEntry, "rank">;
  score: number;
  sortPnlUsd: number;
};

export class LeaderboardService {
  constructor(private readonly birdeyeClient: BirdeyeClient = new BirdeyeClient()) {}

  async buildLeaderboard(window: TimeWindow, limit: number): Promise<LeaderboardBuildResult> {
    const warnings: string[] = [];
    const candidateFetchLimit = Math.min(10, Math.max(limit, 1));

    const candidates: LeaderboardCandidate[] = [];
    try {
      const batch = await this.birdeyeClient.getTraderGainersLosers(window, candidateFetchLimit, 0);
      candidates.push(...batch);
    } catch (error) {
      warnings.push(this.toWarning("Trader candidate source unavailable", error));
      return {
        snapshot: {
          window,
          generatedAt: new Date().toISOString(),
          walletCount: 0,
          entries: [],
        },
        warnings,
        freshness: { leaderboard: "unknown" },
        candidateCount: 0,
        analyzedCount: 0,
        hadCandidateSourceSuccess: false,
      };
    }

    const dedupedCandidates = this.dedupeCandidates(candidates);
    
    // Serialize wallet analysis to avoid rate limiting. Process candidates one at a time.
    const successfulAnalyses: CandidateAnalysis[] = [];
    for (const candidate of dedupedCandidates) {
      const analysis = await this.analyzeCandidate(candidate, window, warnings);
      if (analysis !== null) {
        successfulAnalyses.push(analysis);
      }
    }

    // Sort by alpha score (descending), then by PNL (descending)
    successfulAnalyses.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return b.sortPnlUsd - a.sortPnlUsd;
    });

    const entries = successfulAnalyses.slice(0, limit).map((analysis, index) => ({
      rank: index + 1,
      ...analysis.entry,
    }));
    const analyzedCount = successfulAnalyses.length;

    return {
      snapshot: {
        window,
        generatedAt: new Date().toISOString(),
        walletCount: analyzedCount,
        entries,
      },
      warnings,
      freshness: { leaderboard: "fresh" },
      candidateCount: dedupedCandidates.length,
      analyzedCount,
      hadCandidateSourceSuccess: true,
    };
  }

  private dedupeCandidates(candidates: LeaderboardCandidate[]): LeaderboardCandidate[] {
    const seen = new Set<string>();
    const deduped: LeaderboardCandidate[] = [];

    for (const candidate of candidates) {
      const wallet = candidate.wallet.trim();
      if (!wallet || seen.has(wallet)) {
        continue;
      }

      seen.add(wallet);
      deduped.push({
        ...candidate,
        wallet,
      });
    }

    return deduped;
  }

  private async analyzeCandidate(candidate: LeaderboardCandidate, window: TimeWindow, warnings: string[]): Promise<CandidateAnalysis | null> {
    const wallet = candidate.wallet.trim();

    if (!wallet) {
      warnings.push("Skipped candidate with empty wallet address.");
      return null;
    }

    if (!isValidSolanaWalletAddress(wallet)) {
      warnings.push(`Skipped invalid wallet candidate: ${wallet}`);
      return null;
    }

    const [summaryResult, firstFundedResult] = await Promise.allSettled([
      this.birdeyeClient.getWalletPnlSummary(wallet, window),
      this.birdeyeClient.getWalletFirstFunded(wallet),
    ]);

    const summary = summaryResult.status === "fulfilled" ? summaryResult.value : null;
    const firstFunded = firstFundedResult.status === "fulfilled" ? firstFundedResult.value : null;

    if (summaryResult.status === "rejected") {
      warnings.push(this.toWarning(`PNL summary unavailable for ${wallet}`, summaryResult.reason));
    }
    if (firstFundedResult.status === "rejected") {
      warnings.push(this.toWarning(`First-funded lookup unavailable for ${wallet}`, firstFundedResult.reason));
    }

    const scoreInput: WalletScoringInput = {
      pnlUsd: summary?.pnlUsd ?? candidate.pnlUsd ?? null,
      roiPercent: summary?.roiPercent ?? candidate.roiPercent ?? null,
      winRate: summary?.winRate ?? candidate.winRate ?? null,
      tradeCount: summary?.tradeCount ?? candidate.tradeCount ?? null,
      tokenCount: candidate.tokenCount ?? null,
      volumes: candidate.volumeUsd !== null ? [candidate.volumeUsd] : undefined,
      walletAgeDays: firstFunded?.walletAgeDays ?? null,
      daysSinceLastActivity: this.getDaysSinceLastActivity(candidate.lastActivityAt),
      dataQuality: {
        hasPnl: summary?.pnlUsd != null || candidate.pnlUsd != null,
        hasRoi: summary?.roiPercent != null || candidate.roiPercent != null,
        hasWinRate: summary?.winRate != null || candidate.winRate != null,
        hasNetWorth: false,
        hasHoldings: false,
      },
    };

    const alphaScore = computeAlphaScore(scoreInput);
    const pnlUsd = summary?.pnlUsd ?? candidate.pnlUsd ?? null;

    return {
      score: alphaScore.score,
      sortPnlUsd: pnlUsd ?? Number.NEGATIVE_INFINITY,
      entry: {
        wallet,
        pnlUsd,
        roiPercent: summary?.roiPercent ?? candidate.roiPercent ?? null,
        alphaScore: alphaScore.score,
        confidence: alphaScore.confidence,
        walletAgeDays: firstFunded?.walletAgeDays ?? null,
        archetype: alphaScore.archetype,
        tradeCount: summary?.tradeCount ?? candidate.tradeCount ?? null,
        tokenCount: candidate.tokenCount ?? null,
        lastActivityAt: candidate.lastActivityAt ?? null,
        alphaScoreDetails: alphaScore,
      },
    };
  }

  private getDaysSinceLastActivity(lastActivityAt: string | null): number | null {
    if (!lastActivityAt) {
      return null;
    }

    const timestamp = new Date(lastActivityAt).getTime();
    if (Number.isNaN(timestamp)) {
      return null;
    }

    return Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
  }

  private toWarning(message: string, error: unknown): string {
    if (error instanceof BirdeyeClientError) {
      return `${message}: ${error.message} (${error.code})`;
    }

    if (error instanceof Error) {
      return `${message}: ${error.message}`;
    }

    return message;
  }
}

export async function buildLeaderboardSnapshot(window: TimeWindow, limit: number) {
  const service = new LeaderboardService();
  return service.buildLeaderboard(window, limit);
}