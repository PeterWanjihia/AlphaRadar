"use client";
import React from "react";

export default function SummaryCards({ summary, alphaScore }: any) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-5 shadow-[0_18px_60px_rgba(2,8,23,0.35)] backdrop-blur-xl">
        <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Total PNL</div>
        <div className={`mt-3 text-2xl font-semibold ${summary?.pnlUsd >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
          {summary?.pnlUsd != null ? `$${Math.round(summary.pnlUsd).toLocaleString()}` : "Unavailable"}
        </div>
        <div className="mt-2 text-xs text-slate-500">Window: {summary?.window ?? "7d"}</div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-5 shadow-[0_18px_60px_rgba(2,8,23,0.35)] backdrop-blur-xl">
        <div className="text-xs uppercase tracking-[0.22em] text-slate-400">ROI</div>
        <div className="mt-3 text-2xl font-semibold text-white">{summary?.roiPercent != null ? `${Math.round(summary.roiPercent)}%` : "Unavailable"}</div>
        <div className="mt-2 text-xs text-slate-500">Win rate: {summary?.winRate != null ? `${Math.round(summary.winRate * 100)}%` : "N/A"}</div>
      </div>

      <div className="rounded-[1.75rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 via-sky-500/15 to-indigo-500/20 p-5 text-white shadow-[0_24px_70px_rgba(34,211,238,0.16)] backdrop-blur-xl">
        <div className="text-xs uppercase tracking-[0.22em] text-cyan-100/70">Alpha Score</div>
        <div className="mt-2 flex items-baseline gap-3">
          <div className="text-4xl font-bold text-white">{alphaScore?.score ?? "—"}</div>
          <div className="text-sm text-cyan-50/90">{alphaScore?.archetype ?? "—"}</div>
        </div>
        <div className="mt-2 text-xs text-cyan-50/80">Confidence: {alphaScore?.confidence ?? "unknown"}</div>
      </div>
    </div>
  );
}
