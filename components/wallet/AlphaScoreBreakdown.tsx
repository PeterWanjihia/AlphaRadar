"use client";

import type { AlphaScoreBreakdown } from "@/lib/types/scoring";

interface AlphaScoreBreakdownProps {
  breakdown: AlphaScoreBreakdown;
}

const components = [
  { key: "pnlScore", label: "PNL Signal", weight: 25 },
  { key: "roiScore", label: "ROI Efficiency", weight: 20 },
  { key: "winRateScore", label: "Win Rate", weight: 15 },
  { key: "consistencyScore", label: "Consistency", weight: 15 },
  { key: "walletAgeScore", label: "Wallet Age", weight: 10 },
  { key: "recencyScore", label: "Recency", weight: 10 },
];

function ScoreBar({
  label,
  score,
  weight,
}: {
  label: string;
  score: number;
  weight: number;
}) {
  const percentage = score;
  const hue = (score / 100) * 120; // green (120deg) to red (0deg)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <div className="flex gap-2">
          <span className="font-mono font-semibold text-slate-100">
            {Math.round(score)}/100
          </span>
          <span className="text-slate-500">({weight}%)</span>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: `hsl(${hue}, 80%, 50%)`,
          }}
        />
      </div>
    </div>
  );
}

export default function AlphaScoreBreakdownComponent({
  breakdown,
}: AlphaScoreBreakdownProps) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-5 shadow-[0_18px_60px_rgba(2,8,23,0.35)] backdrop-blur-xl">
      <div className="mb-4 text-xs uppercase tracking-[0.22em] text-slate-400">
        Score Breakdown
      </div>
      <div className="space-y-4">
        {components.map((comp) => (
          <ScoreBar
            key={comp.key}
            label={comp.label}
            score={breakdown[comp.key as keyof AlphaScoreBreakdown] as number}
            weight={comp.weight}
          />
        ))}
      </div>
      {breakdown.riskPenalty > 0 && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-rose-300">Risk Penalty</span>
            <span className="font-mono font-semibold text-rose-300">
              -{Math.round(breakdown.riskPenalty)} pts
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
