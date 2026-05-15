import { insertIntoTable, selectFromTable } from "@/lib/db/supabase";
import type { TimeWindow } from "@/lib/birdeye/types";
import type { LeaderboardEntry, LeaderboardSnapshot } from "@/lib/types/leaderboard";

const SNAPSHOTS_TABLE = "leaderboard_snapshots";
const ENTRIES_TABLE = "leaderboard_entries";

type LeaderboardSnapshotRow = {
  id: string;
  time_window: string;
  generated_at: string;
  wallet_count: number | null;
};

type LeaderboardEntryRow = {
  snapshot_id: string;
  wallet_address: string;
  rank: number | null;
  pnl_usd: number | null;
  roi_percent: number | null;
  alpha_score: number | null;
  confidence: string | null;
  wallet_age_days: number | null;
  archetype: string | null;
  trade_count: number | null;
  token_count: number | null;
  last_activity_at: string | null;
};

function toLeaderboardEntry(row: LeaderboardEntryRow): LeaderboardEntry {
  return {
    rank: row.rank ?? 0,
    wallet: row.wallet_address,
    pnlUsd: row.pnl_usd ?? null,
    roiPercent: row.roi_percent ?? null,
    alphaScore: row.alpha_score ?? 0,
    confidence: (row.confidence as LeaderboardEntry["confidence"]) ?? "low",
    walletAgeDays: row.wallet_age_days ?? null,
    archetype: (row.archetype as LeaderboardEntry["archetype"]) ?? "Exit Liquidity",
    tradeCount: row.trade_count ?? null,
    tokenCount: row.token_count ?? null,
    lastActivityAt: row.last_activity_at ?? null,
  };
}

export async function getLatestLeaderboardSnapshot(window: TimeWindow): Promise<LeaderboardSnapshot | null> {
  const safeWindow = encodeURIComponent(window);
  const snapshots = await selectFromTable(
    SNAPSHOTS_TABLE,
    `time_window=eq.${safeWindow}&order=generated_at.desc&limit=1`,
  );

  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    return null;
  }

  const snapshot = snapshots[0] as LeaderboardSnapshotRow;
  const entries = await selectFromTable(
    ENTRIES_TABLE,
    `snapshot_id=eq.${encodeURIComponent(snapshot.id)}&order=rank.asc`,
  );

  return {
    window: snapshot.time_window as TimeWindow,
    generatedAt: snapshot.generated_at,
    walletCount: snapshot.wallet_count ?? 0,
    entries: Array.isArray(entries) ? (entries as LeaderboardEntryRow[]).map(toLeaderboardEntry) : [],
  };
}

export async function saveLeaderboardSnapshot(snapshot: LeaderboardSnapshot) {
  const insertedSnapshots = await insertIntoTable(SNAPSHOTS_TABLE, {
    time_window: snapshot.window,
    generated_at: snapshot.generatedAt,
    wallet_count: snapshot.walletCount,
  });

  if (!Array.isArray(insertedSnapshots) || insertedSnapshots.length === 0) {
    throw new Error("Failed to persist leaderboard snapshot.");
  }

  const insertedSnapshot = insertedSnapshots[0] as LeaderboardSnapshotRow;

  if (snapshot.entries.length > 0) {
    await insertIntoTable(
      ENTRIES_TABLE,
      snapshot.entries.map((entry) => ({
        snapshot_id: insertedSnapshot.id,
        wallet_address: entry.wallet,
        rank: entry.rank,
        pnl_usd: entry.pnlUsd,
        roi_percent: entry.roiPercent,
        alpha_score: entry.alphaScore,
        confidence: entry.confidence,
        wallet_age_days: entry.walletAgeDays,
        archetype: entry.archetype,
        trade_count: entry.tradeCount,
        token_count: entry.tokenCount,
        last_activity_at: entry.lastActivityAt,
      })),
    );
  }

  return insertedSnapshot.id;
}