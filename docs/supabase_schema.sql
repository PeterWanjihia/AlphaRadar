-- Supabase / Postgres schema for AlphaTrace (minimal set)

-- wallets
CREATE TABLE IF NOT EXISTS wallets (
  address TEXT PRIMARY KEY,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  first_funded_at TIMESTAMP WITH TIME ZONE,
  source TEXT,
  last_refreshed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for wallets"
  ON wallets
  FOR SELECT
  USING (true);

-- wallet profile snapshots
CREATE TABLE IF NOT EXISTS wallet_profile_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT REFERENCES wallets(address) ON DELETE CASCADE,
  time_window TEXT,
  summary_json JSONB,
  pnl_details_json JSONB,
  holdings_json JSONB,
  net_worth_json JSONB,
  first_funded_json JSONB,
  token_metadata_json JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE wallet_profile_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for wallet profile snapshots"
  ON wallet_profile_snapshots
  FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_wallet_profile_wallet_generated_at ON wallet_profile_snapshots(wallet_address, generated_at DESC);

-- leaderboard snapshots (placeholder)
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_window TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  wallet_count INTEGER NOT NULL
);

ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for leaderboard snapshots"
  ON leaderboard_snapshots
  FOR SELECT
  USING (true);

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  snapshot_id UUID REFERENCES leaderboard_snapshots(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  rank INTEGER NOT NULL,
  pnl_usd NUMERIC,
  roi_percent NUMERIC,
  alpha_score INTEGER NOT NULL,
  confidence TEXT NOT NULL,
  wallet_age_days INTEGER,
  archetype TEXT NOT NULL,
  trade_count INTEGER,
  token_count INTEGER,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (snapshot_id, wallet_address)
);

ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for leaderboard entries"
  ON leaderboard_entries
  FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_window_generated_at ON leaderboard_snapshots(time_window, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_snapshot_rank ON leaderboard_entries(snapshot_id, rank ASC);
