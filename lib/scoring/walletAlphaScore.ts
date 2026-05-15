/**
 * Wallet Alpha Score computation.
 * Deterministic, explainable scoring of wallet trading quality.
 */

import type {
  AlphaScore,
  AlphaScoreBreakdown,
  ConfidenceBreakdown,
  ConfidenceLevel,
  WalletArchetype,
  WalletScoringInput,
} from "@/lib/types/scoring";

/**
 * Compute Alpha Score from wallet data.
 * Returns 0–100 with breakdown and confidence.
 */
export function computeAlphaScore(input: WalletScoringInput): AlphaScore {
  const breakdown = computeBreakdown(input);
  const rawScore = aggregateBreakdown(breakdown);
  const score = Math.min(100, Math.max(0, rawScore));

  const confidenceBreakdown = computeConfidence(input, score);
  const archetype = determineArchetype(input, score, confidenceBreakdown.level);

  const flags: string[] = [];
  if (!input.pnlUsd) flags.push("No PNL data available");
  if (!input.roiPercent) flags.push("No ROI data available");
  if (!input.winRate) flags.push("No win rate data available");
  if (input.walletAgeDays !== null && input.walletAgeDays < 30)
    flags.push("Very new wallet — limited track record");
  if (
    input.daysSinceLastActivity !== null &&
    input.daysSinceLastActivity > 180
  )
    flags.push("Wallet inactive for 6+ months");

  return {
    score,
    confidence: confidenceBreakdown.level,
    confidenceBreakdown,
    breakdown,
    archetype,
    archetypeExplanation: getArchetypeExplanation(archetype),
    flags,
  };
}

/**
 * Compute individual component scores (0–100).
 */
function computeBreakdown(input: WalletScoringInput): AlphaScoreBreakdown {
  const pnlScore = computePnlScore(input.pnlUsd);
  const roiScore = computeRoiScore(input.roiPercent);
  const winRateScore = computeWinRateScore(input.winRate);
  const consistencyScore = computeConsistencyScore(input);
  const walletAgeScore = computeWalletAgeScore(input.walletAgeDays);
  const recencyScore = computeRecencyScore(input.daysSinceLastActivity);
  const riskPenalty = computeRiskPenalty(input);

  return {
    pnlScore,
    roiScore,
    winRateScore,
    consistencyScore,
    walletAgeScore,
    recencyScore,
    riskPenalty,
  };
}

/**
 * PNL Score: normalized profit signal.
 * More profit = higher score, but with diminishing returns.
 */
function computePnlScore(pnlUsd: number | null): number {
  if (pnlUsd === null || pnlUsd === undefined) return 0;

  // Negative PNL scores 0
  if (pnlUsd < 0) return 0;

  // Use logarithmic scale: $0 → 0, $1k → 20, $10k → 50, $100k → 80, $1M → 95
  return Math.min(100, 30 * Math.log10(Math.max(1, pnlUsd / 1000)));
}

/**
 * ROI Score: efficiency of capital.
 * Higher ROI = higher score, clamped at 100 for 100%+ ROI.
 */
function computeRoiScore(roiPercent: number | null): number {
  if (roiPercent === null || roiPercent === undefined) return 0;

  // Negative ROI scores 0
  if (roiPercent < 0) return 0;

  // Linear mapping: 0% → 0, 50% → 50, 100% → 100, 200% → 100 (clamped)
  return Math.min(100, roiPercent);
}

/**
 * Win Rate Score: consistency of trades.
 * Higher win rate = higher score.
 */
function computeWinRateScore(winRate: number | null): number {
  if (winRate === null || winRate === undefined) return 0;

  // Clamp to 0–1 range
  const clamped = Math.max(0, Math.min(1, winRate));

  // 0% → 0, 50% → 50, 100% → 100
  return clamped * 100;
}

/**
 * Consistency Score: spread of token performance.
 * If profit is concentrated in one token, score is lower.
 * If spread across many tokens, score is higher.
 */
function computeConsistencyScore(input: WalletScoringInput): number {
  if (!input.tokenCount || input.tokenCount < 2) return 0;

  // Heuristic: more tokens traded = more consistency
  // 1 token → 0, 5 tokens → 50, 20+ tokens → 100
  const tokenScore = Math.min(100, (input.tokenCount / 20) * 100);

  // Trade count also helps
  const tradeScore =
    input.tradeCount !== null
      ? Math.min(100, (input.tradeCount / 50) * 100)
      : 0;

  // Average
  return (tokenScore + tradeScore) / 2;
}

/**
 * Wallet Age Score: older wallet = more credible.
 * Avoids luck-based rank for brand new wallets.
 */
function computeWalletAgeScore(walletAgeDays: number | null): number {
  if (walletAgeDays === null || walletAgeDays === undefined) return 0;

  // 0 days → 0, 30 days → 30, 365 days → 100
  return Math.min(100, (walletAgeDays / 365) * 100);
}

/**
 * Recency Score: active wallet = trustworthy.
 * Last activity long ago = score reduction.
 */
function computeRecencyScore(daysSinceLastActivity: number | null): number {
  if (daysSinceLastActivity === null || daysSinceLastActivity === undefined)
    return 50; // neutral if unknown

  // Recent activity (< 7 days) → 100
  if (daysSinceLastActivity < 7) return 100;

  // Stale activity (> 180 days) → 20
  if (daysSinceLastActivity > 180) return 20;

  // Linear decay: 7 days → 100, 180 days → 20
  return 100 - ((daysSinceLastActivity - 7) / (180 - 7)) * 80;
}

/**
 * Risk Penalty: apply penalties for data quality issues.
 */
function computeRiskPenalty(input: WalletScoringInput): number {
  let penalty = 0;

  // Missing critical data
  if (!input.pnlUsd) penalty += 2;
  if (!input.roiPercent) penalty += 2;
  if (!input.winRate) penalty += 1;

  return penalty; // 0–5 penalty
}

/**
 * Aggregate component scores with weights.
 */
function aggregateBreakdown(breakdown: AlphaScoreBreakdown): number {
  const weights = {
    pnlScore: 0.25,
    roiScore: 0.2,
    winRateScore: 0.15,
    consistencyScore: 0.15,
    walletAgeScore: 0.1,
    recencyScore: 0.1,
  };

  const weighted =
    breakdown.pnlScore * weights.pnlScore +
    breakdown.roiScore * weights.roiScore +
    breakdown.winRateScore * weights.winRateScore +
    breakdown.consistencyScore * weights.consistencyScore +
    breakdown.walletAgeScore * weights.walletAgeScore +
    breakdown.recencyScore * weights.recencyScore;

  // Apply penalty
  return weighted - breakdown.riskPenalty;
}

/**
 * Compute confidence level and explanation.
 */
function computeConfidence(
  input: WalletScoringInput,
  score: number
): ConfidenceBreakdown {
  const reasons: string[] = [];
  let confidenceScore = 0; // 0–100

  // Trade count: more trades = stronger evidence
  if (input.tradeCount !== null && input.tradeCount >= 20) {
    confidenceScore += 25;
    reasons.push("Significant trade history");
  } else if (input.tradeCount !== null && input.tradeCount >= 5) {
    confidenceScore += 15;
  } else if (input.tradeCount !== null) {
    reasons.push("Limited trade history");
  }

  // Token diversity: avoids one-hit wonder
  if (input.tokenCount !== null && input.tokenCount >= 10) {
    confidenceScore += 25;
    reasons.push("Diversified across many tokens");
  } else if (input.tokenCount !== null && input.tokenCount >= 3) {
    confidenceScore += 10;
  } else {
    reasons.push("Limited token diversity");
  }

  // Wallet age: older = more credible
  if (input.walletAgeDays !== null && input.walletAgeDays >= 365) {
    confidenceScore += 20;
    reasons.push("Long-standing wallet (1+ year)");
  } else if (input.walletAgeDays !== null && input.walletAgeDays >= 90) {
    confidenceScore += 10;
  } else if (input.walletAgeDays !== null && input.walletAgeDays < 30) {
    reasons.push("Brand new wallet");
  }

  // Data completeness
  const quality = input.dataQuality || {
    hasPnl: false,
    hasRoi: false,
    hasWinRate: false,
    hasNetWorth: false,
    hasHoldings: false,
  };

  const completeness =
    (Object.values(quality).filter(Boolean).length / 5) * 100;
  if (completeness >= 80) {
    confidenceScore += 15;
    reasons.push("Complete data available");
  } else if (completeness < 60) {
    reasons.push("Some data missing");
  }

  // Activity recency
  if (
    input.daysSinceLastActivity !== null &&
    input.daysSinceLastActivity < 7
  ) {
    confidenceScore += 15;
    reasons.push("Recently active");
  }

  const level: ConfidenceLevel =
    confidenceScore >= 70 ? "high" : confidenceScore >= 40 ? "medium" : "low";

  if (level === "low" && reasons.length === 0) {
    reasons.push("Insufficient evidence to rank with confidence");
  }

  return {
    level,
    reasons,
    tradeCount: input.tradeCount ?? null,
    tokenCount: input.tokenCount ?? null,
    walletAgeDays: input.walletAgeDays ?? null,
    dataCompleteness: completeness,
  };
}

/**
 * Determine wallet archetype based on scores and data.
 */
function determineArchetype(
  input: WalletScoringInput,
  score: number,
  confidence: ConfidenceLevel
): WalletArchetype {
  // Elite Alpha: score 90+, high confidence, diversified
  if (
    score >= 90 &&
    confidence === "high" &&
    (input.tokenCount ?? 0) >= 10
  ) {
    return "Elite Alpha";
  }

  // Strong Trader: score 75+, high confidence
  if (score >= 75 && confidence === "high") {
    return "Strong Trader";
  }

  // Alpha Hunter: high ROI, aggressive
  if (
    (input.roiPercent ?? 0) >= 100 &&
    (input.winRate ?? 0) >= 0.6
  ) {
    return "Alpha Hunter";
  }

  // Consistent Compounder: steady ROI, high win rate
  if (
    (input.roiPercent ?? 0) >= 30 &&
    (input.winRate ?? 0) >= 0.65 &&
    (input.tokenCount ?? 0) >= 5
  ) {
    return "Consistent Compounder";
  }

  // One-Hit Wonder: high PNL but concentrated
  if (
    score >= 50 &&
    (input.tokenCount ?? 0) <= 2 &&
    (input.pnlUsd ?? 0) > 0
  ) {
    return "One-Hit Wonder";
  }

  // Rotator: many trades, moderate returns
  if (
    (input.tradeCount ?? 0) >= 30 &&
    (input.tokenCount ?? 0) >= 15
  ) {
    return "Rotator";
  }

  // Inactive Winner: good history but stale
  if (
    score >= 60 &&
    (input.daysSinceLastActivity ?? 0) > 180
  ) {
    return "Inactive Winner";
  }

  // Exit Liquidity: negative PNL or very low score
  if (score < 20) {
    return "Exit Liquidity";
  }

  // Default: Strong Trader if score is decent
  return score >= 50 ? "Strong Trader" : "Exit Liquidity";
}

/**
 * Get human-readable explanation for an archetype.
 */
function getArchetypeExplanation(archetype: WalletArchetype): string {
  const explanations: Record<WalletArchetype, string> = {
    "Elite Alpha":
      "Top-tier trader with exceptional performance, high confidence, and diversified strategy.",
    "Strong Trader":
      "Consistent profitable trader with solid risk management and verified track record.",
    "Alpha Hunter":
      "Aggressive trader with high ROI targeting emerging opportunities; high risk/high reward.",
    "Consistent Compounder":
      "Steady performer with high win rate and reliable returns across multiple positions.",
    "One-Hit Wonder":
      "Significant profit concentration in one or two tokens; less proven consistency.",
    Rotator:
      "Active trader with many token rotations; trading frequency over concentration.",
    "Inactive Winner":
      "Profitable history but no recent activity; past performance may not be repeatable.",
    "Exit Liquidity":
      "Poor track record or insufficient data; not recommended for following.",
  };

  return explanations[archetype];
}
