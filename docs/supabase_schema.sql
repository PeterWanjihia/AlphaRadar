-- Supabase / Postgres schema for AlphaTrace (minimal set)

-- wallets
CREATE TABLE IF NOT EXISTS wallets (
  address TEXT PRIMARY KEY,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  first_funded_at TIMESTAMP WITH TIME ZONE,
  source TEXT,
  last_refreshed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

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

CREATE INDEX IF NOT EXISTS idx_wallet_profile_wallet_generated_at ON wallet_profile_snapshots(wallet_address, generated_at DESC);

-- leaderboard snapshots (placeholder)
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_window TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  wallet_count INTEGER
);

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  snapshot_id UUID REFERENCES leaderboard_snapshots(id) ON DELETE CASCADE,
  wallet_address TEXT,
  rank INTEGER,
  pnl_usd NUMERIC,
  roi_percent NUMERIC,
  alpha_score INTEGER,
  confidence TEXT
);
