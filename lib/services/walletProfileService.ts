import { BirdeyeClient, BirdeyeClientError } from "@/lib/birdeye/client";
import type { TimeWindow } from "@/lib/birdeye/types";
import type { WalletProfile, WalletProfileResult } from "@/lib/types/wallet";
import { computeAlphaScore, type InputModel } from "@/lib/scoring/walletAlphaScore";
import { getFreshSnapshot, getLatestSnapshot, saveSnapshot } from "@/lib/repositories/walletProfileRepository";
import type { FreshnessState } from "@/lib/types/api";

type LiveBuildResult = {
  profile: WalletProfile;
  warnings: string[];
  freshness: Record<string, FreshnessState>;
  hadAnyUpstreamSuccess: boolean;
};

export class WalletProfileService {
  constructor(private readonly birdeyeClient: BirdeyeClient = new BirdeyeClient()) {}

  async buildWalletProfile(wallet: string, window: TimeWindow): Promise<WalletProfileResult> {
    const warnings: string[] = [];

    try {
      const freshSnapshot = await getFreshSnapshot(wallet, window);
      if (freshSnapshot) {
        return {
          profile: freshSnapshot,
          warnings,
          freshness: this.toSnapshotFreshness(freshSnapshot, "cached"),
        };
      }
    } catch (error) {
      warnings.push(this.toWarning("Cache lookup failed", error));
    }

    let latestSnapshot: WalletProfile | null = null;
    try {
      latestSnapshot = await getLatestSnapshot(wallet, window);
    } catch (error) {
      warnings.push(this.toWarning("Stale snapshot lookup failed", error));
    }

    const liveBuild = await this.buildLiveProfile(wallet, window);
    const mergedWarnings = [...warnings, ...liveBuild.warnings];

    if (!liveBuild.hadAnyUpstreamSuccess && latestSnapshot) {
      return {
        profile: latestSnapshot,
        warnings: [...mergedWarnings, "Live refresh failed, returned stale cached snapshot."],
        freshness: this.toSnapshotFreshness(latestSnapshot, "stale"),
      };
    }

    try {
      await saveSnapshot(liveBuild.profile);
    } catch (error) {
      mergedWarnings.push(this.toWarning("Failed to persist wallet profile snapshot", error));
    }

    return {
      profile: liveBuild.profile,
      warnings: mergedWarnings,
      freshness: liveBuild.freshness,
    };
  }

  private async buildLiveProfile(wallet: string, window: TimeWindow): Promise<LiveBuildResult> {
    const warnings: string[] = [];

    const [summaryResult, detailsResult, netWorthResult, holdingsResult, firstFundedResult] =
      await Promise.allSettled([
        this.birdeyeClient.getWalletPnlSummary(wallet, window),
        this.birdeyeClient.getWalletPnlDetails(wallet, window),
        this.birdeyeClient.getWalletNetWorth(wallet, window),
        this.birdeyeClient.getWalletTokenList(wallet),
        this.birdeyeClient.getWalletFirstFunded(wallet),
      ]);

    const summary = summaryResult.status === "fulfilled" ? summaryResult.value : null;
    const pnlDetails = detailsResult.status === "fulfilled" ? detailsResult.value : [];
    const netWorthSeries = netWorthResult.status === "fulfilled" ? netWorthResult.value : [];
    const currentHoldings = holdingsResult.status === "fulfilled" ? holdingsResult.value : [];
    const firstFunded = firstFundedResult.status === "fulfilled" ? firstFundedResult.value : null;
    const hadAnyUpstreamSuccess =
      summaryResult.status === "fulfilled" ||
      detailsResult.status === "fulfilled" ||
      netWorthResult.status === "fulfilled" ||
      holdingsResult.status === "fulfilled" ||
      firstFundedResult.status === "fulfilled";

    if (summaryResult.status === "rejected") {
      warnings.push(this.toWarning("Wallet PNL summary unavailable", summaryResult.reason));
    }
    if (detailsResult.status === "rejected") {
      warnings.push(this.toWarning("Wallet PNL details unavailable", detailsResult.reason));
    }
    if (netWorthResult.status === "rejected") {
      warnings.push(this.toWarning("Wallet net worth history unavailable", netWorthResult.reason));
    }
    if (holdingsResult.status === "rejected") {
      warnings.push(this.toWarning("Wallet token holdings unavailable", holdingsResult.reason));
    }
    if (firstFundedResult.status === "rejected") {
      warnings.push(this.toWarning("Wallet first-funded date unavailable", firstFundedResult.reason));
    }

    const tokenAddresses = Array.from(
      new Set(
        [
          ...pnlDetails.map((row) => row.tokenAddress),
          ...currentHoldings.map((row) => row.tokenAddress),
        ].filter((address) => address && address !== "unknown"),
      ),
    );

    let tokenMetadata: Awaited<ReturnType<BirdeyeClient["getTokenMetadata"]>> = [];
    let metadataFreshness: FreshnessState = "unknown";

    if (tokenAddresses.length > 0) {
      try {
        tokenMetadata = await this.birdeyeClient.getTokenMetadata(tokenAddresses);
        metadataFreshness = "fresh";
      } catch (error) {
        warnings.push(this.toWarning("Token metadata unavailable", error));
      }
    }

    // compute simple inputs for scoring
    const realizedPnlUsd = summary?.pnlUsd ?? null;
    const roiPercent = summary?.roiPercent ?? null;
    const winRate = summary?.winRate ?? null;
    const tradeCount = summary?.tradeCount ?? null;
    const walletAgeDays = firstFunded?.walletAgeDays ?? null;

    // recent activity: derive days ago from latest netWorth or pnlDetails
    let recentActivityDaysAgo: number | null = null;
    try {
      const lastTimestamps: string[] = [];
      if (netWorthSeries.length > 0) lastTimestamps.push(netWorthSeries[netWorthSeries.length - 1].timestamp);
      if (pnlDetails.length > 0) lastTimestamps.push(...pnlDetails.map((r) => r.lastActivityAt ?? ""));
      const validDates = lastTimestamps.map((s) => (s ? new Date(s) : null)).filter((d) => d instanceof Date && !isNaN(d!.getTime())) as Date[];
      if (validDates.length > 0) {
        const last = validDates.reduce((a, b) => (a > b ? a : b));
        recentActivityDaysAgo = Math.floor((Date.now() - last.getTime()) / 86_400_000);
      }
    } catch (e) {
      recentActivityDaysAgo = null;
    }

    const tokenCount = Math.max(1, new Set([...pnlDetails.map((r) => r.tokenAddress), ...currentHoldings.map((h) => h.tokenAddress)]).size);
    const combinedVolumeUsd = summary?.volumeUsd ?? pnlDetails.reduce((s, r) => s + (r.volumeUsd ?? 0), 0) ?? null;

    const scoreInput = {
      realizedPnlUsd,
      roiPercent,
      winRate,
      tradeCount,
      walletAgeDays,
      recentActivityDaysAgo,
      tokenCount,
      combinedVolumeUsd,
    };

    let alphaScore = null;
    try {
      alphaScore = computeAlphaScore(scoreInput as InputModel);
    } catch (error) {
      warnings.push(this.toWarning("Alpha score computation failed", error));
      alphaScore = null;
    }

    const profile: WalletProfile = {
      wallet,
      window,
      summary,
      pnlDetails,
      netWorthSeries,
      currentHoldings,
      firstFunded,
      tokenMetadata,
      generatedAt: new Date().toISOString(),
      alphaScore,
    };

    return {
      profile,
      warnings,
      freshness: {
        summary: summaryResult.status === "fulfilled" ? "fresh" : "unknown",
        pnlDetails: detailsResult.status === "fulfilled" ? "fresh" : "unknown",
        netWorth: netWorthResult.status === "fulfilled" ? "fresh" : "unknown",
        holdings: holdingsResult.status === "fulfilled" ? "fresh" : "unknown",
        firstFunded: firstFundedResult.status === "fulfilled" ? "fresh" : "unknown",
        metadata: metadataFreshness,
      },
      hadAnyUpstreamSuccess,
    };
  }

  private toSnapshotFreshness(profile: WalletProfile, state: "cached" | "stale") {
    return {
      summary: state,
      pnlDetails: state,
      netWorth: state,
      holdings: state,
      firstFunded: state,
      metadata: profile.tokenMetadata.length > 0 ? state : "unknown",
    } as Record<string, FreshnessState>;
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
