"use client";
import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { isValidSolanaWalletAddress } from "@/lib/validators/wallet";

export default function WalletSearchInput({ className = "" }: { className?: string }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function onSubmit(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    const v = value.trim();
    if (!v) return setError("Please enter a wallet address");
    if (!isValidSolanaWalletAddress(v)) return setError("Invalid Solana wallet address");
    setError(null);
    router.push(`/wallet/${v}`);
  }

  return (
    <form onSubmit={onSubmit} className={`flex ${className}`}>
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-500">↗</div>
        <input
          className="w-full rounded-full border border-white/10 bg-[#07111f] px-10 py-3 text-sm text-white placeholder:text-slate-500 shadow-inner shadow-black/20 outline-none transition focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-400/20"
          placeholder="Paste Solana wallet address"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
      >
        Analyze wallet
      </button>
      {error ? <div className="w-full text-xs text-rose-300 sm:mt-2">{error}</div> : null}
    </form>
  );
}
