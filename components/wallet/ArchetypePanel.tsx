"use client";

import type { WalletArchetype } from "@/lib/types/scoring";

interface ArchetypePanelProps {
  archetype: WalletArchetype;
  explanation: string;
}

const archetypeIcons: Record<WalletArchetype, string> = {
  "Elite Alpha": "👑",
  "Strong Trader": "💎",
  "Alpha Hunter": "🎯",
  "Consistent Compounder": "📈",
  "One-Hit Wonder": "⚡",
  Rotator: "🔄",
  "Inactive Winner": "😴",
  "Exit Liquidity": "⚠️",
};

const archetypeColors: Record<
  WalletArchetype,
  { border: string; bg: string; text: string }
> = {
  "Elite Alpha": { border: "border-cyan-400/40", bg: "bg-cyan-400/5", text: "text-cyan-100" },
  "Strong Trader": { border: "border-sky-400/30", bg: "bg-sky-400/5", text: "text-sky-100" },
  "Alpha Hunter": { border: "border-indigo-400/30", bg: "bg-indigo-400/5", text: "text-indigo-100" },
  "Consistent Compounder": {
    border: "border-emerald-400/30",
    bg: "bg-emerald-400/5",
    text: "text-emerald-100",
  },
  "One-Hit Wonder": { border: "border-amber-400/30", bg: "bg-amber-400/5", text: "text-amber-100" },
  Rotator: { border: "border-purple-400/30", bg: "bg-purple-400/5", text: "text-purple-100" },
  "Inactive Winner": {
    border: "border-slate-400/20",
    bg: "bg-slate-400/5",
    text: "text-slate-100",
  },
  "Exit Liquidity": { border: "border-rose-400/20", bg: "bg-rose-400/5", text: "text-rose-100" },
};

export default function ArchetypePanel({
  archetype,
  explanation,
}: ArchetypePanelProps) {
  const icon = archetypeIcons[archetype];
  const colors = archetypeColors[archetype];

  return (
    <div
      className={`rounded-[1.75rem] border ${colors.border} ${colors.bg} p-5 shadow-[0_18px_60px_rgba(2,8,23,0.35)] backdrop-blur-xl`}
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1">
          <div className={`text-xs uppercase tracking-[0.22em] ${colors.text} opacity-70`}>
            Wallet Archetype
          </div>
          <div className={`mt-2 text-xl font-bold ${colors.text}`}>{archetype}</div>
          <div className={`mt-2 text-sm leading-relaxed ${colors.text} opacity-80`}>
            {explanation}
          </div>
        </div>
      </div>
    </div>
  );
}
