import type { WalletProfile } from "@/lib/types/wallet";
import { insertIntoTable, selectFromTable } from "@/lib/db/supabase";
import type { TimeWindow } from "@/lib/birdeye/types";
import { CACHE_TTL_MS, isCacheFresh } from "@/lib/cache/ttl";

const TABLE = "wallet_profile_snapshots";

type WalletProfileSnapshotRow = {
  wallet_address: string;
  time_window: string;
  summary_json: WalletProfile["summary"];
  pnl_details_json: WalletProfile["pnlDetails"];
  holdings_json: WalletProfile["currentHoldings"];
  net_worth_json: WalletProfile["netWorthSeries"];
  first_funded_json: WalletProfile["firstFunded"];
  token_metadata_json: WalletProfile["tokenMetadata"];
  generated_at: string;
};

function toWalletProfile(row: WalletProfileSnapshotRow): WalletProfile {
  return {
    wallet: row.wallet_address,
    window: row.time_window as TimeWindow,
    summary: row.summary_json,
    pnlDetails: row.pnl_details_json ?? [],
    currentHoldings: row.holdings_json ?? [],
    netWorthSeries: row.net_worth_json ?? [],
    firstFunded: row.first_funded_json,
    tokenMetadata: row.token_metadata_json ?? [],
    generatedAt: row.generated_at,
  };
}

export async function saveSnapshot(profile: WalletProfile) {
  const row = {
    wallet_address: profile.wallet,
    time_window: profile.window,
    summary_json: profile.summary,
    pnl_details_json: profile.pnlDetails,
    holdings_json: profile.currentHoldings,
    net_worth_json: profile.netWorthSeries,
    first_funded_json: profile.firstFunded,
    token_metadata_json: profile.tokenMetadata,
    generated_at: profile.generatedAt,
  };

  return insertIntoTable(TABLE, row);
}

export async function getLatestSnapshot(wallet: string, window: TimeWindow): Promise<WalletProfile | null> {
  const safeWallet = encodeURIComponent(wallet);
  const safeWindow = encodeURIComponent(window);
  const query = `wallet_address=eq.${safeWallet}&time_window=eq.${safeWindow}&order=generated_at.desc&limit=1`;
  const rows = await selectFromTable(TABLE, query);

  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  return toWalletProfile(rows[0] as WalletProfileSnapshotRow);
}

export async function getFreshSnapshot(
  wallet: string,
  window: TimeWindow,
  ttlMs = CACHE_TTL_MS.walletProfile,
): Promise<WalletProfile | null> {
  const latest = await getLatestSnapshot(wallet, window);
  if (!latest) {
    return null;
  }

  return isCacheFresh(latest.generatedAt, ttlMs) ? latest : null;
}

// Backward-compatible aliases.
export const saveWalletProfileSnapshot = saveSnapshot;
export const getLatestWalletProfileSnapshot = getLatestSnapshot;
