"use client";

import type { ConfidenceBreakdown } from "@/lib/types/scoring";
import ConfidenceBadge from "./ConfidenceBadge";

interface ConfidenceDetailsProps {
  breakdown: ConfidenceBreakdown;
}

export default function ConfidenceDetails({
  breakdown,
}: ConfidenceDetailsProps) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-5 shadow-[0_18px_60px_rgba(2,8,23,0.35)] backdrop-blur-xl space-y-4">
      <div>
        <div className="text-xs uppercase tracking-[0.22em] text-slate-400 mb-3">
          Confidence Analysis
        </div>
        <ConfidenceBadge level={breakdown.level} />
      </div>

      <div className="space-y-3 pt-2">
        <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
          Contributing Factors
        </div>
        <ul className="space-y-2">
          {breakdown.reasons.map((reason, idx) => (
            <li key={idx} className="flex gap-2 text-sm text-slate-300">
              <span className="text-cyan-400">✓</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-xs">
        <div>
          <div className="text-slate-500">Trades</div>
          <div className="mt-1 text-lg font-semibold text-slate-100">
            {breakdown.tradeCount ?? "—"}
          </div>
        </div>
        <div>
          <div className="text-slate-500">Tokens</div>
          <div className="mt-1 text-lg font-semibold text-slate-100">
            {breakdown.tokenCount ?? "—"}
          </div>
        </div>
        <div>
          <div className="text-slate-500">Wallet Age</div>
          <div className="mt-1 text-lg font-semibold text-slate-100">
            {breakdown.walletAgeDays
              ? `${breakdown.walletAgeDays}d`
              : "—"}
          </div>
        </div>
        <div>
          <div className="text-slate-500">Data Complete</div>
          <div className="mt-1 text-lg font-semibold text-slate-100">
            {Math.round(breakdown.dataCompleteness)}%
          </div>
        </div>
      </div>
    </div>
  );
}
