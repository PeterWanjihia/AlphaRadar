import Link from "next/link";
import WalletSearchInput from "@/components/shared/WalletSearchInput";

const demoWalletPath = "/wallet/7sN4kQp9Vx3mB6rT8yH2cJ5fL9aD3eG7mU1nP4qS6vXZ";

const surfaces = [
	{
		title: "Wallet Intelligence",
		label: "Profitable wallets only",
		description: "Rank Solana wallets by realized PNL, ROI, confidence, and behavioral archetype.",
		href: "/leaderboard",
	},
	{
		title: "Wallet Profiles",
		label: "Explain the trader",
		description: "Open a wallet and inspect holdings, historical performance, and Alpha Score breakdowns.",
		href: demoWalletPath,
	},
	{
		title: "Smart Money Signals",
		label: "Wallets -> tokens",
		description: "See which tokens high-quality wallets are touching right now, with participants and rationale.",
		href: "/smart-money",
	},
];

const proofPoints = [
	{ value: "3", label: "core intelligence surfaces" },
	{ value: "1", label: "read-heavy product boundary" },
	{ value: "100%", label: "deterministic scoring" },
	{ value: "0", label: "wallet signing or custody" },
];

const architecture = [
	"Birdeye raw data",
	"Wallet normalization",
	"Wallet scoring",
	"Wallet ranking",
	"Wallet profiling",
	"Token signal aggregation",
	"UI + API presentation",
];

export default function HomePage() {
	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
			<section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
				<div className="space-y-8">
					<div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/8 px-4 py-2 text-xs font-medium tracking-[0.18em] text-cyan-100 uppercase shadow-[0_0_0_1px_rgba(34,211,238,0.04)]">
						Solana trader PNL leaderboard + smart-money intelligence
					</div>

					<div className="space-y-5">
						<h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
							Find the wallets that actually win, then see what they are buying now.
						</h1>
						<p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
							AlphaTrace turns Birdeye data into a clean intelligence layer: ranked wallets, explainable trader profiles, and token signals built from credible wallets instead of noisy token scans.
						</p>
					</div>

					<div className="flex flex-col gap-4 sm:flex-row">
						<Link
							href="/leaderboard"
							className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_70px_rgba(34,211,238,0.22)] transition hover:-translate-y-0.5"
						>
							Open leaderboard
						</Link>
						<Link
							href="/smart-money"
							className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30 hover:bg-white/10"
						>
							Explore smart money
						</Link>
					</div>

					<div className="max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-cyan-950/10 backdrop-blur-xl sm:p-5">
						<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
							<div>
								<div className="text-sm font-medium text-white">Search any Solana wallet</div>
								<div className="text-xs text-slate-400">Paste a wallet address to inspect its Alpha Score and profile.</div>
							</div>
							<div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
								Ticket 5 complete
							</div>
						</div>
						<WalletSearchInput className="flex-col items-stretch gap-3 sm:flex-row" />
					</div>
				</div>

				<div className="relative">
					<div className="absolute -left-8 top-8 h-44 w-44 rounded-full bg-cyan-500/20 blur-3xl" />
					<div className="absolute -right-8 bottom-2 h-44 w-44 rounded-full bg-indigo-500/20 blur-3xl" />
					<div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#08111f]/90 p-6 shadow-[0_30px_120px_rgba(2,8,23,0.6)] backdrop-blur-xl">
						<div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
							<div>
								<div className="text-xs uppercase tracking-[0.26em] text-cyan-200/70">Live intelligence snapshot</div>
								<div className="mt-1 text-lg font-semibold text-white">What the system is built to answer</div>
							</div>
							<div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">Read-only</div>
						</div>

						<div className="mt-5 space-y-4">
							{surfaces.map((surface, index) => (
								<Link
									key={surface.title}
									href={surface.href}
									className="group block rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.06]"
								>
									<div className="flex items-start justify-between gap-4">
										<div>
											<div className="text-xs uppercase tracking-[0.24em] text-cyan-200/60">0{index + 1}</div>
											<div className="mt-2 text-base font-semibold text-white">{surface.title}</div>
										</div>
										<div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition group-hover:border-cyan-300/25 group-hover:text-cyan-100">
											{surface.label}
										</div>
									</div>
									<p className="mt-3 max-w-md text-sm leading-6 text-slate-400">{surface.description}</p>
								</Link>
							))}
						</div>

						<div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
							{proofPoints.map((point) => (
								<div key={point.label} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4 text-center">
									<div className="text-2xl font-semibold text-white">{point.value}</div>
									<div className="mt-1 text-xs leading-5 text-slate-400">{point.label}</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			<section className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
				<div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
					<div className="flex items-center justify-between gap-3">
						<div>
							<div className="text-xs uppercase tracking-[0.24em] text-cyan-200/60">Architecture</div>
							<h2 className="mt-2 text-2xl font-semibold text-white">Two intelligence layers. One clean boundary.</h2>
						</div>
						<Link href={demoWalletPath} className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300/30 hover:text-white">
							See a wallet
						</Link>
					</div>
					<div className="mt-5 flex flex-wrap gap-3">
						{architecture.map((step, index) => (
							<div
								key={step}
								className="flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-200"
							>
								<span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-semibold text-cyan-100">{index + 1}</span>
								{step}
							</div>
						))}
					</div>
				</div>

				<div className="rounded-[2rem] border border-amber-400/15 bg-amber-400/8 p-6 backdrop-blur-xl">
					<div className="text-xs uppercase tracking-[0.24em] text-amber-100/70">Product discipline</div>
					<h2 className="mt-2 text-2xl font-semibold text-white">Read-only intelligence, not trading automation.</h2>
					<p className="mt-3 text-sm leading-7 text-amber-50/80">
						AlphaTrace does not execute trades, custody funds, or claim to predict price. It surfaces profitable wallets, explains why they rank, and converts their behavior into auditable token signals.
					</p>
				</div>
			</section>
		</div>
	);
}
