/**
 * Scoring types and models for wallet Alpha Score calculation.
 */

/**
 * Raw input data used for scoring. May contain nulls for missing data.
 */
export interface WalletScoringInput {
  // PNL data
  pnlUsd: number | null;
  roiPercent: number | null;
  winRate: number | null; // 0–1
  tradeCount: number | null;
  tokenCount: number | null; // unique tokens traded

  // Consistency signal
  volumes?: number[]; // per-token volume for spread analysis

  // Wallet age
  walletAgeDays: number | null;

  // Recency: days since last trade
  daysSinceLastActivity: number | null;

  // Data completeness
  dataQuality?: {
    hasPnl: boolean;
    hasRoi: boolean;
    hasWinRate: boolean;
    hasNetWorth: boolean;
    hasHoldings: boolean;
  };
}

/**
 * Alpha Score breakdown showing component contributions.
 */
export interface AlphaScoreBreakdown {
  pnlScore: number; // 0–100, 25% weight
  roiScore: number; // 0–100, 20% weight
  winRateScore: number; // 0–100, 15% weight
  consistencyScore: number; // 0–100, 15% weight
  walletAgeScore: number; // 0–100, 10% weight
  recencyScore: number; // 0–100, 10% weight
  riskPenalty: number; // 0–100, -5% weight
}

/**
 * Confidence level for the score.
 */
export type ConfidenceLevel = "high" | "medium" | "low";

/**
 * Confidence breakdown showing why confidence is high/medium/low.
 */
export interface ConfidenceBreakdown {
  level: ConfidenceLevel;
  reasons: string[]; // explanations for the confidence level
  tradeCount: number | null;
  tokenCount: number | null;
  walletAgeDays: number | null;
  dataCompleteness: number; // 0–100 percent
}

/**
 * Wallet behavioral archetype.
 */
export type WalletArchetype =
  | "Elite Alpha"
  | "Strong Trader"
  | "Alpha Hunter"
  | "Consistent Compounder"
  | "One-Hit Wonder"
  | "Rotator"
  | "Inactive Winner"
  | "Exit Liquidity";

/**
 * Final Alpha Score result.
 */
export interface AlphaScore {
  score: number; // 0–100
  confidence: ConfidenceLevel;
  confidenceBreakdown: ConfidenceBreakdown;
  breakdown: AlphaScoreBreakdown;
  archetype: WalletArchetype;
  archetypeExplanation: string;
  flags: string[]; // warnings/notes
}
