"use client";
import React from "react";
import TokenLogo from "@/components/shared/TokenLogo";

export default function TokenPnlTable({ rows }: { rows: any[] }) {
  const items = rows.slice(0, 50);

  return (
    <div className="overflow-x-auto rounded-[1.75rem] border border-white/10 bg-[#08111f] shadow-[0_18px_60px_rgba(2,8,23,0.35)]">
      <table className="w-full table-auto min-w-[760px]">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.2em] text-slate-400">
            <th className="px-5 py-4">Token</th>
            <th className="px-5 py-4">Realized PNL</th>
            <th className="px-5 py-4">ROI</th>
            <th className="px-5 py-4">Buys / Sells</th>
            <th className="px-5 py-4">Last activity</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.tokenAddress} className="border-b border-white/5 text-sm transition hover:bg-white/[0.03]">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <TokenLogo logo={r.tokenLogo ?? null} symbol={r.tokenSymbol} address={r.tokenAddress} size={36} />
                  <div>
                    <div className="font-medium text-white">{r.tokenSymbol ?? r.tokenName ?? r.tokenAddress.slice(0, 8)}</div>
                    <div className="text-xs text-slate-400">{(r.tokenAddress ?? "").slice(0, 8)}...</div>
                  </div>
                </div>
              </td>
              <td className={`px-5 py-4 ${r.realizedPnlUsd >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                {r.realizedPnlUsd != null ? `$${Math.round(r.realizedPnlUsd).toLocaleString()}` : "—"}
              </td>
              <td className="px-5 py-4 text-slate-200">{r.roiPercent != null ? `${Math.round(r.roiPercent)}%` : "—"}</td>
              <td className="px-5 py-4 text-slate-200">{(r.buyCount ?? 0) + " / " + (r.sellCount ?? 0)}</td>
              <td className="px-5 py-4 text-xs text-slate-400">{r.lastActivityAt ? new Date(r.lastActivityAt).toLocaleDateString() : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
