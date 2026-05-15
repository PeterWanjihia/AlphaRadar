"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import WalletSearchInput from "@/components/shared/WalletSearchInput";
import TokenLogo from "@/components/shared/TokenLogo";

const demoWalletPath = "/wallet/7sN4kQp9Vx3mB6rT8yH2cJ5fL9aD3eG7mU1nP4qS6vXZ";

type Row = {
  wallet: string;
  pnlUsd: number;
  roiPercent: number;
  winRate: number;
  alphaScore: number;
  confidence: "high" | "medium" | "low";
  walletAgeDays: number;
  archetype: string;
  window: string;
};

type LeaderboardApiEntry = {
  wallet: string;
  pnlUsd: number | null;
  roiPercent: number | null;
  alphaScore: number | null;
  confidence: "high" | "medium" | "low" | string | null;
  walletAgeDays: number | null;
  archetype: string | null;
};

type LeaderboardApiSnapshot = {
  generatedAt?: string;
  walletCount?: number;
  entries?: LeaderboardApiEntry[];
};

const rowsByWindow: Record<string, Row[]> = {
  "24h": [
    { wallet: "7xQ9r...p4xT", pnlUsd: 182000, roiPercent: 418, winRate: 0.81, alphaScore: 94, confidence: "high", walletAgeDays: 612, archetype: "Alpha Hunter", window: "24h" },
    { wallet: "3Wm5k...z8nR", pnlUsd: 94000, roiPercent: 287, winRate: 0.76, alphaScore: 88, confidence: "high", walletAgeDays: 431, archetype: "Consistent Compounder", window: "24h" },
    { wallet: "9uB2x...K1Lm", pnlUsd: 74200, roiPercent: 211, winRate: 0.69, alphaScore: 83, confidence: "medium", walletAgeDays: 229, archetype: "Rotator", window: "24h" },
  ],
  "7d": [
    { wallet: "2aY6f...m2Qn", pnlUsd: 512000, roiPercent: 761, winRate: 0.84, alphaScore: 97, confidence: "high", walletAgeDays: 1042, archetype: "Elite Alpha", window: "7d" },
    { wallet: "7xQ9r...p4xT", pnlUsd: 398000, roiPercent: 518, winRate: 0.79, alphaScore: 92, confidence: "high", walletAgeDays: 612, archetype: "Alpha Hunter", window: "7d" },
    { wallet: "3Wm5k...z8nR", pnlUsd: 241000, roiPercent: 303, winRate: 0.77, alphaScore: 89, confidence: "high", walletAgeDays: 431, archetype: "Consistent Compounder", window: "7d" },
    { wallet: "1kV8d...T7zP", pnlUsd: 101000, roiPercent: 184, winRate: 0.64, alphaScore: 78, confidence: "medium", walletAgeDays: 165, archetype: "Rotator", window: "7d" },
  ],
  "30d": [
    { wallet: "2aY6f...m2Qn", pnlUsd: 1148000, roiPercent: 1248, winRate: 0.86, alphaScore: 99, confidence: "high", walletAgeDays: 1042, archetype: "Elite Alpha", window: "30d" },
    { wallet: "7xQ9r...p4xT", pnlUsd: 811000, roiPercent: 802, winRate: 0.8, alphaScore: 95, confidence: "high", walletAgeDays: 612, archetype: "Alpha Hunter", window: "30d" },
    { wallet: "3Wm5k...z8nR", pnlUsd: 620000, roiPercent: 487, winRate: 0.79, alphaScore: 90, confidence: "high", walletAgeDays: 431, archetype: "Consistent Compounder", window: "30d" },
    { wallet: "9uB2x...K1Lm", pnlUsd: 303000, roiPercent: 243, winRate: 0.7, alphaScore: 84, confidence: "medium", walletAgeDays: 229, archetype: "Rotator", window: "30d" },
    { wallet: "4Lp8c...D6wS", pnlUsd: 165000, roiPercent: 176, winRate: 0.63, alphaScore: 74, confidence: "medium", walletAgeDays: 98, archetype: "Inactive Winner", window: "30d" },
  ],
};

const windows = ["24h", "7d", "30d"];

function formatPnl(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

export default function LeaderboardPage() {
  const [window, setWindow] = useState("7d");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<LeaderboardApiSnapshot | null>(null);

  const rows = useMemo(() => {
    if (snapshot && Array.isArray(snapshot.entries) && snapshot.entries.length > 0) {
        return snapshot.entries.map((e) => ({
        wallet: e.wallet,
        pnlUsd: e.pnlUsd ?? 0,
        roiPercent: e.roiPercent ?? 0,
        alphaScore: e.alphaScore ?? 0,
        confidence: e.confidence ?? "low",
        walletAgeDays: e.walletAgeDays ?? 0,
        archetype: e.archetype ?? "Unknown",
        window,
      }));
    }

    return rowsByWindow[window] ?? rowsByWindow["7d"];
  }, [snapshot, window]);

  useEffect(() => {
    let mounted = true;

    const loadLeaderboard = async () => {
      setLoading(true);
      setError(null);
      setSnapshot(null);

      try {
         const isFresh = typeof globalThis !== "undefined" && globalThis.location?.search.includes("fresh=true");
         const freshParam = isFresh ? "&fresh=true" : "";
        const res = await fetch(`/api/leaderboard?window=${encodeURIComponent(window)}&limit=50${freshParam}`);
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean; data?: LeaderboardApiSnapshot; error?: { message?: string }; message?: string }
          | null;

        if (!res.ok) {
          const msg = body?.error?.message ?? body?.message ?? `Request failed: ${res.status}`;
          throw new Error(msg);
        }

        if (!body || !body.ok || !body.data) {
          const msg = body?.error?.message ?? body?.message ?? "Invalid API response";
          throw new Error(msg);
        }

        if (mounted) {
          setSnapshot(body.data);
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadLeaderboard();

    return () => {
      mounted = false;
    };
  }, [window]);

  const stats = [
    { label: "Tracked wallets", value: (snapshot?.walletCount ?? rows.length).toString() },
    {
      label: "Median Alpha Score",
      value: Math.round((snapshot?.entries?.reduce((sum, r) => sum + (r.alphaScore ?? 0), 0) ?? rows.reduce((sum, row) => sum + row.alphaScore, 0)) / (snapshot?.entries?.length ?? rows.length)).toString(),
    },
    { label: "Best wallet PNL", value: formatPnl(Math.max(...(snapshot?.entries?.map((r) => r.pnlUsd ?? 0) ?? rows.map((r) => r.pnlUsd)))) },
    { label: "Freshness", value: snapshot?.generatedAt ? `Generated ${new Date(snapshot.generatedAt).toLocaleString()}` : loading ? "Loading..." : error ? "Error" : "Cached snapshot" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_30px_120px_rgba(2,8,23,0.45)] backdrop-blur-xl lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/8 px-4 py-2 text-xs font-medium tracking-[0.18em] text-cyan-100 uppercase">
              Wallet leaderboard
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Ranked Solana wallets, scored for profitability and quality.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              This surface shows the wallets AlphaTrace trusts most. Scores are explainable, confidence-aware, and designed to keep noisy one-hit traders out of the top of the table.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:flex lg:flex-row">
            {windows.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setWindow(item)}
                className={`rounded-full px-4 py-2 text-sm transition ${window === item ? "bg-white text-slate-950 shadow-lg shadow-cyan-950/20" : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <WalletSearchInput className="flex-col items-stretch gap-3 md:flex-row" />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{stat.label}</div>
              <div className="mt-2 text-2xl font-semibold text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#08111f]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Leaderboard snapshot</div>
              <div className="mt-1 text-lg font-semibold text-white">Top wallets for {window}</div>
            </div>
            <Link href="/smart-money" className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300/30 hover:text-white">
              View smart money
            </Link>
          </div>

          <div className="overflow-x-auto">
            {loading && (
              <div className="px-6 py-8 text-center text-sm text-slate-300">Loading leaderboard snapshot…</div>
            )}

            {error && (
              <div className="m-6 rounded-lg border border-rose-500/20 bg-rose-500/6 p-4 text-sm text-rose-200">
                <div className="font-medium">Failed to load leaderboard</div>
                <div className="mt-1 text-xs">{error}</div>
              </div>
            )}

            {snapshot && Array.isArray(snapshot.entries) && snapshot.entries.length === 0 && (
              <div className="p-6 text-center text-sm text-slate-300">No leaderboard available for the selected window.</div>
            )}

            <table className="w-full min-w-[880px] table-auto">
              <thead className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr className="border-b border-white/10">
                  <th className="px-5 py-4">Rank</th>
                  <th className="px-5 py-4">Wallet</th>
                  <th className="px-5 py-4">PNL</th>
                  <th className="px-5 py-4">ROI</th>
                  <th className="px-5 py-4">Alpha Score</th>
                  <th className="px-5 py-4">Confidence</th>
                  <th className="px-5 py-4">Wallet Age</th>
                  <th className="px-5 py-4">Archetype</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.wallet}-${row.window}`} className="border-b border-white/5 text-sm transition hover:bg-white/[0.03]">
                    <td className="px-5 py-4 font-semibold text-cyan-100">#{index + 1}</td>
                    <td className="px-5 py-4">
                      <Link href={demoWalletPath} className="flex items-center gap-3 text-white transition hover:text-cyan-100">
                        <TokenLogo address={row.wallet} symbol="WA" size={36} />
                        <div>
                          <div className="font-medium">{row.wallet}</div>
                          <div className="text-xs text-slate-400">Tracked set</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-emerald-300">{formatPnl(row.pnlUsd)}</td>
                    <td className="px-5 py-4 text-slate-200">{Math.round(row.roiPercent)}%</td>
                    <td className="px-5 py-4 text-slate-100">{row.alphaScore}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${row.confidence === "high" ? "bg-emerald-400/15 text-emerald-200" : row.confidence === "medium" ? "bg-amber-400/15 text-amber-100" : "bg-rose-400/15 text-rose-100"}`}>
                        {row.confidence}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{row.walletAgeDays} days</td>
                    <td className="px-5 py-4 text-slate-200">{row.archetype}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}