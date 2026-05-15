"use client";
import React from "react";
import TokenLogo from "@/components/shared/TokenLogo";

export default function HoldingsTable({ holdings }: { holdings: any[] }) {
  const items = holdings.slice(0, 50);

  return (
    <div className="overflow-x-auto rounded-[1.75rem] border border-white/10 bg-[#08111f] shadow-[0_18px_60px_rgba(2,8,23,0.35)]">
      <table className="w-full min-w-[560px] table-auto">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.2em] text-slate-400">
            <th className="px-5 py-4">Token</th>
            <th className="px-5 py-4">Balance</th>
            <th className="px-5 py-4">Value (USD)</th>
            <th className="px-5 py-4">Portfolio %</th>
          </tr>
        </thead>
        <tbody>
          {items.map((h) => (
            <tr key={h.tokenAddress} className="border-b border-white/5 text-sm transition hover:bg-white/[0.03]">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <TokenLogo logo={h.logo ?? h.tokenLogo ?? null} symbol={h.symbol ?? h.name} address={h.tokenAddress} size={36} />
                  <div>
                    <div className="font-medium text-white">{h.symbol ?? h.name ?? (h.tokenAddress ?? "").slice(0, 8)}</div>
                    <div className="text-xs text-slate-400">{(h.tokenAddress ?? "").slice(0, 8)}...</div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 text-slate-200">{h.balance ?? "—"}</td>
              <td className="px-5 py-4 text-slate-200">{h.valueUsd != null ? `$${Math.round(h.valueUsd).toLocaleString()}` : "—"}</td>
              <td className="px-5 py-4 text-slate-200">{h.portfolio_weight != null ? `${Math.round(h.portfolio_weight * 100)}%` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
