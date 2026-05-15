import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const demoWalletPath = "/wallet/7sN4kQp9Vx3mB6rT8yH2cJ5fL9aD3eG7mU1nP4qS6vXZ";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AlphaTrace",
  description: "Solana trader PNL leaderboard and smart-money intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#050816] text-slate-100">
        <div className="relative min-h-screen overflow-x-hidden">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050816]/80 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <Link href="/" className="group flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 text-sm font-black text-white shadow-[0_0_30px_rgba(34,211,238,0.25)] transition-transform duration-300 group-hover:-translate-y-0.5">
                  AT
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-[0.24em] text-cyan-200/80 uppercase">AlphaTrace</div>
                  <div className="text-xs text-slate-400">Solana wallet intelligence</div>
                </div>
              </Link>

              <nav className="hidden items-center gap-2 md:flex">
                <Link href="/leaderboard" className="rounded-full px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
                  Leaderboard
                </Link>
                <Link href={demoWalletPath} className="rounded-full px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
                  Wallet Profile
                </Link>
                <Link href="/smart-money" className="rounded-full px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
                  Smart Money
                </Link>
              </nav>

              <Link
                href="/leaderboard"
                className="inline-flex items-center rounded-full border border-cyan-400/30 bg-white/5 px-4 py-2 text-sm font-medium text-cyan-100 shadow-lg shadow-cyan-950/20 transition hover:border-cyan-300/50 hover:bg-white/10"
              >
                Open app
              </Link>
            </div>
          </header>

          <main className="relative z-10 flex-1">{children}</main>

          <footer className="border-t border-white/10 bg-black/20">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <p>Built for ranked wallets, trader profiles, and smart-money signal discovery.</p>
              <div className="flex flex-wrap gap-4 text-slate-300">
                <Link href="/leaderboard" className="transition hover:text-white">Leaderboard</Link>
                <Link href={demoWalletPath} className="transition hover:text-white">Wallet profile</Link>
                <Link href="/smart-money" className="transition hover:text-white">Smart money</Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
