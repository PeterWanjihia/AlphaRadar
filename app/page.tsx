export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-14 text-zinc-900">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">AlphaTrace</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Solana wallet intelligence powered by Birdeye data
        </h1>
        <p className="max-w-3xl text-base text-zinc-600 sm:text-lg">
          AlphaTrace ranks profitable wallets, builds profile intelligence, and surfaces smart-money token activity.
        </p>
      </header>

      <section className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 sm:grid-cols-2">
        <article>
          <h2 className="text-lg font-semibold">Milestone Progress</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Foundation, Birdeye integration, and wallet profile backend are in place through ticket 2.6.
          </p>
        </article>
        <article>
          <h2 className="text-lg font-semibold">API Endpoints</h2>
          <ul className="mt-2 space-y-1 text-sm text-zinc-700">
            <li>GET /api/health</li>
            <li>GET /api/debug/wallet-pnl?wallet=&amp;window=7d</li>
            <li>GET /api/wallets/:address/profile?window=7d</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
