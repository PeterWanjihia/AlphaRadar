"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import TokenLogo from "@/components/shared/TokenLogo";

const demoWalletPath = "/wallet/7sN4kQp9Vx3mB6rT8yH2cJ5fL9aD3eG7mU1nP4qS6vXZ";

type Signal = {
  tokenAddress: string;
  symbol: string;
  name: string;
  logo?: string;
  signalScore: number;
  label: string;
  smartWalletCount: number;
  averageAlphaScore: number;
  combinedWalletPnl: number;
  securityStatus: "passed" | "warning" | "unknown";
  liquidityUsd: number;
  explanation: string;
  participants: Array<{ wallet: string; alphaScore: number; pnlUsd: number }>;
};

const signalSets: Record<string, Signal[]> = {
  "24h": [
    {
      tokenAddress: "9Kf6zXb2T1mW7sNQ5dV3pR8yL6uH4jC1aW0eF2rT9zQ",
      symbol: "TIDE",
      name: "Tide",
      signalScore: 86,
      label: "Strong Smart Money Signal",
      smartWalletCount: 5,
      averageAlphaScore: 79,
      combinedWalletPnl: 430000,
      securityStatus: "passed",
      liquidityUsd: 1840000,
      explanation: "Five high-alpha wallets are currently exposed to this token. Their combined historical PNL is strong and liquidity is still healthy.",
      participants: [
        { wallet: "2aY6f...m2Qn", alphaScore: 97, pnlUsd: 1148000 },
        { wallet: "7xQ9r...p4xT", alphaScore: 95, pnlUsd: 811000 },
        { wallet: "3Wm5k...z8nR", alphaScore: 90, pnlUsd: 620000 },
      ],
    },
    {
      tokenAddress: "Gm7kQ2yT8pL1aZ4vN9fR6xC3sW0uH5bD2mE7nA1pQ8r",
      symbol: "LIFT",
      name: "Lift",
      signalScore: 74,
      label: "Emerging Smart Money Signal",
      smartWalletCount: 4,
      averageAlphaScore: 75,
      combinedWalletPnl: 208000,
      securityStatus: "warning",
      liquidityUsd: 840000,
      explanation: "Several quality wallets have started building positions, but the token still needs more confirmation before it becomes a strong signal.",
      participants: [
        { wallet: "9uB2x...K1Lm", alphaScore: 84, pnlUsd: 303000 },
        { wallet: "1kV8d...T7zP", alphaScore: 78, pnlUsd: 101000 },
      ],
    },
  ],
  "7d": [
    {
      tokenAddress: "4Jf3xYp8vW1nQ9sL2uC6mD7rT0zA5hK3bF8eP1gV6c",
      symbol: "ARC",
      name: "Arc",
      signalScore: 91,
      label: "Strong Smart Money Signal",
      smartWalletCount: 7,
      averageAlphaScore: 82,
      combinedWalletPnl: 860000,
      securityStatus: "passed",
      liquidityUsd: 2910000,
      explanation: "Seven smart wallets have converged on this token, with strong wallets contributing the majority of the exposure.",
      participants: [
        { wallet: "2aY6f...m2Qn", alphaScore: 97, pnlUsd: 1148000 },
        { wallet: "7xQ9r...p4xT", alphaScore: 95, pnlUsd: 811000 },
        { wallet: "3Wm5k...z8nR", alphaScore: 90, pnlUsd: 620000 },
      ],
    },
    {
      tokenAddress: "B7nL2kV4mX1cQ9pR5zT8aD3fH6sW0uJ2eG7yN1bP4r",
      symbol: "NOVA",
      name: "Nova",
      signalScore: 68,
      label: "Emerging Smart Money Signal",
      smartWalletCount: 3,
      averageAlphaScore: 74,
      combinedWalletPnl: 191000,
      securityStatus: "unknown",
      liquidityUsd: 520000,
      explanation: "A smaller set of quality wallets has accumulated the token recently, but the signal is still developing and needs more breadth.",
      participants: [
        { wallet: "4Lp8c...D6wS", alphaScore: 74, pnlUsd: 165000 },
        { wallet: "1kV8d...T7zP", alphaScore: 78, pnlUsd: 101000 },
      ],
    },
  ],
  "30d": [
    {
      tokenAddress: "7Tq6mX1vY4pC9sL2rD8nA3fH5bW0uJ7gK1eP6zV4c",
      symbol: "PULSE",
      name: "Pulse",
      signalScore: 88,
      label: "Strong Smart Money Signal",
      smartWalletCount: 8,
      averageAlphaScore: 84,
      combinedWalletPnl: 1420000,
      securityStatus: "passed",
      liquidityUsd: 4320000,
      explanation: "A broader set of profitable wallets has held or accumulated this token over the last 30 days with consistent conviction.",
      participants: [
        { wallet: "2aY6f...m2Qn", alphaScore: 97, pnlUsd: 1148000 },
        { wallet: "7xQ9r...p4xT", alphaScore: 95, pnlUsd: 811000 },
        { wallet: "3Wm5k...z8nR", alphaScore: 90, pnlUsd: 620000 },
      ],
    },
    {
      tokenAddress: "F1pR8wC3mX6aQ9nV2tD7kL4sH5uJ0bY1eG8zN3rT6c",
      symbol: "NODE",
      name: "Node",
      signalScore: 63,
      label: "Emerging Smart Money Signal",
      smartWalletCount: 4,
      averageAlphaScore: 73,
      combinedWalletPnl: 254000,
      securityStatus: "warning",
      liquidityUsd: 970000,
      explanation: "Profitably ranked wallets are active here, but the feed keeps it below the top tier because security and breadth are still mixed.",
      participants: [
        { wallet: "9uB2x...K1Lm", alphaScore: 84, pnlUsd: 303000 },
        { wallet: "4Lp8c...D6wS", alphaScore: 74, pnlUsd: 165000 },
      ],
    },
  ],
};

const windows = ["24h", "7d", "30d"];

function formatUsd(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

export default function SmartMoneyPage() {
  const [window, setWindow] = useState("7d");
  const signals = useMemo(() => signalSets[window] ?? signalSets["7d"], [window]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_30px_120px_rgba(2,8,23,0.45)] backdrop-blur-xl lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center rounded-full border border-fuchsia-400/20 bg-fuchsia-400/8 px-4 py-2 text-xs font-medium tracking-[0.18em] text-fuchsia-100 uppercase">
              Smart money feed
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Token signals derived from profitable wallets, not a blind token scanner.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              AlphaTrace groups wallet behavior by token, scores the signal, and keeps every card explainable with wallet participants, security status, and quality context.
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

        <div className="mt-6 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-[#08111f] p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-fuchsia-200/60">Feed principles</div>
            <div className="mt-3 space-y-3 text-sm leading-7 text-slate-300">
              <p>Only wallets that already cleared the leaderboard are allowed into the feed.</p>
              <p>Every token signal includes participants so the user can audit why it is here.</p>
              <p>No price predictions, no pseudo-telepathy, no black-box ranking.</p>
            </div>
            <Link href="/leaderboard" className="mt-5 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300/30 hover:text-white">
              Back to leaderboard
            </Link>
          </div>

          <div className="grid gap-4">
            {signals.map((signal) => (
              <article key={signal.tokenAddress} className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#08111f]">
                <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <TokenLogo address={signal.tokenAddress} symbol={signal.symbol} logo={signal.logo} size={44} />
                    <div>
                      <div className="text-lg font-semibold text-white">{signal.symbol} <span className="text-sm font-normal text-slate-400">{signal.name}</span></div>
                      <div className="mt-1 text-xs text-slate-400">{signal.tokenAddress}</div>
                      <div className="mt-3 inline-flex rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{signal.label}</div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Signal score</div>
                    <div className="mt-1 text-3xl font-semibold text-white">{signal.signalScore}</div>
                  </div>
                </div>

                <div className="grid gap-4 p-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Metric label="Smart wallets" value={signal.smartWalletCount.toString()} />
                    <Metric label="Average Alpha Score" value={signal.averageAlphaScore.toString()} />
                    <Metric label="Combined wallet PNL" value={formatUsd(signal.combinedWalletPnl)} valueClassName="text-emerald-300" />
                    <Metric label="Liquidity" value={formatUsd(signal.liquidityUsd)} />
                    <Metric label="Security" value={signal.securityStatus} valueClassName={signal.securityStatus === "passed" ? "text-emerald-300" : signal.securityStatus === "warning" ? "text-amber-200" : "text-slate-200"} />
                    <Metric label="Window" value={window} />
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-fuchsia-200/60">Why it appears</div>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{signal.explanation}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {signal.participants.map((participant) => (
                        <Link
                          key={participant.wallet}
                          href={demoWalletPath}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-300/25 hover:text-white"
                        >
                          {participant.wallet} · {participant.alphaScore} alpha
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, valueClassName = "text-white" }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className={`mt-2 text-lg font-semibold ${valueClassName}`}>{value}</div>
    </div>
  );
}