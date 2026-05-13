import type { WalletProfile } from "@/lib/types/wallet";
import { insertIntoTable, selectFromTable } from "@/lib/db/supabase";

const TABLE = "wallet_profile_snapshots";

export async function saveWalletProfileSnapshot(profile: WalletProfile) {
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

export async function getLatestWalletProfileSnapshot(wallet: string, window: string) {
  const query = `wallet_address=eq.${wallet}&time_window=eq.${window}&order=generated_at.desc&limit=1`;
  const rows = await selectFromTable(TABLE, query);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}
