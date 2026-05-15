type Breakdown = Record<string, number>;

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

function scoreByRange(value: number | null, ranges: [number, number, number][], defaultScore = 50) {
  // ranges: array of [threshold, scoreIfAbove, maxScore]
  if (value === null || value === undefined || Number.isNaN(value)) return defaultScore;
  for (const [threshold, score] of ranges) {
    if (value >= threshold) return clamp(score);
  }
  return defaultScore;
}

export type AlphaScoreResult = {
  score: number; // 0-100
  breakdown: Breakdown;
  confidence: "high" | "medium" | "low";
  archetype: string;
  flags: string[];
};

type InputModel = {
  realizedPnlUsd?: number | null;
  roiPercent?: number | null;
  winRate?: number | null; // 0-1
  tradeCount?: number | null;
  walletAgeDays?: number | null;
  recentActivityDaysAgo?: number | null;
  tokenCount?: number | null;
  combinedVolumeUsd?: number | null;
};

export function computeAlphaScore(input: InputModel): AlphaScoreResult {
  const realized = input.realizedPnlUsd ?? 0;
  const roi = input.roiPercent ?? 0;
  const winRate = input.winRate ?? 0;
  const trades = input.tradeCount ?? 0;
  const age = input.walletAgeDays ?? 0;
  const recentDays = input.recentActivityDaysAgo ?? 365;
  const tokenCount = input.tokenCount ?? 1;
  const volume = input.combinedVolumeUsd ?? 0;

  // Subscores 0-100
  const realizedPnlScore = clamp(Math.log10(Math.max(1, Math.abs(realized))) * 12 + (realized > 0 ? 40 : 0));
  const roiScore = clamp((roi / 100) * 100); // approximate
  const winRateScore = clamp(winRate * 100);
  const consistencyScore = clamp(Math.min(100, (trades > 0 ? Math.log10(trades + 1) * 20 : 5) + winRateScore * 0.3));
  const walletAgeScore = clamp(Math.min(100, Math.log10(Math.max(1, age + 1)) * 20 + 20));
  const recencyScore = clamp(Math.max(0, 100 - recentDays));

  // Risk/data penalty
  let riskPenalty = 0;
  if (trades < 3) riskPenalty += 10;
  if (tokenCount <= 1 && realized > 0) riskPenalty += 8; // one-hit wonder
  if (volume < 1000) riskPenalty += 5; // tiny wallet

  const breakdown: Breakdown = {
    realizedPnlScore: Math.round(realizedPnlScore),
    roiScore: Math.round(roiScore),
    winRateScore: Math.round(winRateScore),
    consistencyScore: Math.round(consistencyScore),
    walletAgeScore: Math.round(walletAgeScore),
    recencyScore: Math.round(recencyScore),
    riskPenalty: Math.round(riskPenalty),
  };

  const scoreRaw =
    (breakdown.realizedPnlScore * 0.25 + breakdown.roiScore * 0.2 + breakdown.winRateScore * 0.15 + breakdown.consistencyScore * 0.15 + breakdown.walletAgeScore * 0.1 + breakdown.recencyScore * 0.1) - breakdown.riskPenalty * 0.05;

  const finalScore = Math.round(clamp(scoreRaw));

  // Confidence
  let confidence: AlphaScoreResult["confidence"] = "medium";
  if (trades >= 50 && age >= 180 && volume > 10000) confidence = "high";
  else if (trades < 5 || age < 30 || volume < 1000) confidence = "low";

  // Archetype rules (simple)
  let archetype = "Unknown";
  const isElite = finalScore >= 85 && confidence === "high";
  if (isElite) archetype = "Elite Alpha";
  else if (breakdown.roiScore >= 80 && breakdown.realizedPnlScore >= 50) archetype = "Alpha Hunter";
  else if (breakdown.winRateScore >= 70 && breakdown.consistencyScore >= 60) archetype = "Consistent Compounder";
  else if (breakdown.realizedPnlScore >= 70 && trades <= 5) archetype = "One-Hit Wonder";
  else if (finalScore >= 60) archetype = "Strong Trader";
  else if (finalScore < 40) archetype = "Exit Liquidity";

  const flags: string[] = [];
  if (trades < 3) flags.push("low_trade_count");
  if (tokenCount <= 1) flags.push("single_token_exposure");
  if (volume < 1000) flags.push("low_volume");

  return {
    score: finalScore,
    breakdown,
    confidence,
    archetype,
    flags,
  };
}

export type { InputModel };
