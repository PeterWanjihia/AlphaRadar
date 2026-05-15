"use client";

import type { ConfidenceLevel } from "@/lib/types/scoring";

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  compact?: boolean;
}

export default function ConfidenceBadge({
  level,
  compact = false,
}: ConfidenceBadgeProps) {
  const colors: Record<ConfidenceLevel, { bg: string; text: string; icon: string }> = {
    high: { bg: "bg-emerald-500/20", text: "text-emerald-200", icon: "🟢" },
    medium: { bg: "bg-amber-500/20", text: "text-amber-200", icon: "🟡" },
    low: { bg: "bg-rose-500/20", text: "text-rose-200", icon: "🔴" },
  };

  const config = colors[level];

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${config.bg} ${config.text}`}>
        <span>{config.icon}</span>
        <span className="capitalize">{level}</span>
      </span>
    );
  }

  return (
    <div className={`rounded-lg border ${config.bg} border-white/10 p-4`}>
      <div className={`flex items-center gap-2 ${config.text}`}>
        <span className="text-xl">{config.icon}</span>
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-400">
            Confidence Level
          </div>
          <div className="text-lg font-semibold capitalize">{level}</div>
        </div>
      </div>
    </div>
  );
}
