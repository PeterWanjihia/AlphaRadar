"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import WalletSearchInput from "@/components/shared/WalletSearchInput";
import SummaryCards from "@/components/wallet/SummaryCards";
import TokenPnlTable from "@/components/wallet/TokenPnlTable";
import NetWorthChart from "@/components/wallet/NetWorthChart";
import HoldingsTable from "@/components/wallet/HoldingsTable";

export default function WalletProfilePage({ params }: { params: { address: string } }) {
  const address = params.address;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`/api/wallets/${address}/profile?window=7d`)
      .then((r) => r.json())
      .then((j) => {
        if (!mounted) return;
        if (!j.ok) {
          setError(j.error?.message ?? "Failed to load profile");
          setProfile(null);
        } else {
          setProfile(j.data);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [address]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_30px_120px_rgba(2,8,23,0.45)] backdrop-blur-xl lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/8 px-4 py-2 text-xs font-medium tracking-[0.18em] text-cyan-100 uppercase">
              Wallet profile
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Trader profile and Alpha Score breakdown</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Inspect profitability, current holdings, and historical performance for a single wallet. The profile is read-only and designed to explain why a wallet is ranked where it is.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">Address</span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 font-mono text-slate-300">{address}</span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">Window: 7d</span>
            </div>
          </div>

          <div className="w-full max-w-xl space-y-3 lg:w-[32rem]">
            <WalletSearchInput className="flex-col items-stretch gap-3 sm:flex-row" />
            <div className="flex flex-wrap gap-3 text-sm text-slate-400">
              <Link href="/leaderboard" className="rounded-full border border-white/10 px-4 py-2 transition hover:border-cyan-300/30 hover:text-white">
                Back to leaderboard
              </Link>
              <Link href="/smart-money" className="rounded-full border border-white/10 px-4 py-2 transition hover:border-cyan-300/30 hover:text-white">
                Explore signals
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="rounded-[1.75rem] border border-white/10 bg-[#08111f] p-8 text-center text-slate-300">Loading wallet profile...</div>
          ) : error ? (
            <div className="rounded-[1.75rem] border border-rose-400/20 bg-rose-400/10 p-8 text-center text-rose-100">{error}</div>
          ) : profile ? (
            <div className="grid gap-6">
              <SummaryCards summary={profile.summary} alphaScore={profile.alphaScore} />

              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[1.75rem] border border-white/10 bg-[#08111f] p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Net worth</div>
                      <h2 className="mt-1 text-lg font-semibold text-white">Wallet curve</h2>
                    </div>
                    <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">Historical</div>
                  </div>
                  <NetWorthChart series={profile.netWorthSeries ?? []} />
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-[#08111f] p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Current holdings</div>
                      <h2 className="mt-1 text-lg font-semibold text-white">Portfolio exposure</h2>
                    </div>
                    <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">Snapshot</div>
                  </div>
                  <HoldingsTable holdings={profile.currentHoldings ?? []} />
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-[#08111f] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Token PNL</div>
                    <h2 className="mt-1 text-lg font-semibold text-white">Winning and losing tokens</h2>
                  </div>
                  <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">Sorted by profit</div>
                </div>
                <TokenPnlTable rows={profile.pnlDetails ?? []} />
              </div>

              {profile.warnings && profile.warnings.length > 0 ? (
                <div className="rounded-[1.5rem] border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-50">
                  <div className="font-medium text-amber-100">Warnings</div>
                  <div className="mt-1 text-amber-50/80">{profile.warnings.join(", ")}</div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
