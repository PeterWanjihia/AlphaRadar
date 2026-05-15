import type { BirdeyeTraderGainersLoserRow, TimeWindow } from "@/lib/birdeye/types";
import type { FreshnessState } from "@/lib/types/api";
import type { AlphaScore, ConfidenceLevel, WalletArchetype } from "@/lib/types/scoring";

export type LeaderboardCandidate = BirdeyeTraderGainersLoserRow;

export type LeaderboardEntry = {
  rank: number;
  wallet: string;
  pnlUsd: number | null;
  roiPercent: number | null;
  alphaScore: number;
  confidence: ConfidenceLevel;
  walletAgeDays: number | null;
  archetype: WalletArchetype;
  tradeCount: number | null;
  tokenCount: number | null;
  lastActivityAt: string | null;
  alphaScoreDetails?: AlphaScore;
};

export type LeaderboardSnapshot = {
  window: TimeWindow;
  generatedAt: string;
  walletCount: number;
  entries: LeaderboardEntry[];
};

export type LeaderboardBuildResult = {
  snapshot: LeaderboardSnapshot;
  warnings: string[];
  freshness: Record<string, FreshnessState>;
  candidateCount: number;
  analyzedCount: number;
  hadCandidateSourceSuccess: boolean;
};