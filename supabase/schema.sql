-- ============================================
-- Wallet Watcher — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Wallets table — stores each watched wallet
CREATE TABLE wallets (
  id           BIGINT PRIMARY KEY,
  address      TEXT NOT NULL,
  label        TEXT NOT NULL DEFAULT 'Untitled Wallet',
  chain        TEXT NOT NULL DEFAULT 'Ethereum',
  total_usd    NUMERIC(18,2) NOT NULL DEFAULT 0,
  eth_balance  NUMERIC(24,8) NOT NULL DEFAULT 0,
  eth_value    NUMERIC(18,2) NOT NULL DEFAULT 0,
  change_24h   NUMERIC(8,2) NOT NULL DEFAULT 0,
  txn_count    INTEGER NOT NULL DEFAULT 0,
  last_updated TEXT DEFAULT 'Never',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT wallets_address_unique UNIQUE (address)
);

-- 2. Tokens table — token holdings per wallet
CREATE TABLE tokens (
  id         BIGSERIAL PRIMARY KEY,
  wallet_id  BIGINT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  symbol     TEXT NOT NULL,
  name       TEXT NOT NULL,
  qty        NUMERIC(24,8) NOT NULL DEFAULT 0,
  price      NUMERIC(18,4) NOT NULL DEFAULT 0,
  value      NUMERIC(18,2) NOT NULL DEFAULT 0,
  change     NUMERIC(8,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT tokens_wallet_symbol_unique UNIQUE (wallet_id, symbol)
);

-- 3. Snapshots table — portfolio value over time (for dashboard)
CREATE TABLE snapshots (
  id              BIGSERIAL PRIMARY KEY,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT now(),
  portfolio_total NUMERIC(18,2) NOT NULL DEFAULT 0
);

-- 4. Wallet snapshots — per-wallet value at each snapshot
CREATE TABLE wallet_snapshots (
  id           BIGSERIAL PRIMARY KEY,
  snapshot_id  BIGINT NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
  wallet_id    BIGINT NOT NULL,
  label        TEXT NOT NULL,
  address      TEXT NOT NULL,
  total_usd    NUMERIC(18,2) NOT NULL DEFAULT 0,
  eth_balance  NUMERIC(24,8) NOT NULL DEFAULT 0,
  eth_value    NUMERIC(18,2) NOT NULL DEFAULT 0,
  change_24h   NUMERIC(8,2) NOT NULL DEFAULT 0
);

-- 5. Token snapshots — per-token value at each snapshot
CREATE TABLE token_snapshots (
  id                  BIGSERIAL PRIMARY KEY,
  wallet_snapshot_id  BIGINT NOT NULL REFERENCES wallet_snapshots(id) ON DELETE CASCADE,
  symbol              TEXT NOT NULL,
  price               NUMERIC(18,4) NOT NULL DEFAULT 0,
  value               NUMERIC(18,2) NOT NULL DEFAULT 0
);

-- 6. Indexes for fast queries
CREATE INDEX idx_tokens_wallet_id ON tokens(wallet_id);
CREATE INDEX idx_snapshots_timestamp ON snapshots(timestamp DESC);
CREATE INDEX idx_wallet_snapshots_snapshot_id ON wallet_snapshots(snapshot_id);
CREATE INDEX idx_token_snapshots_wallet_snapshot_id ON token_snapshots(wallet_snapshot_id);

-- 7. Enable Row Level Security (open access for now — tighten later with auth)
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow public read/write via anon key (for prototype — add auth policies later)
CREATE POLICY "Allow all on wallets" ON wallets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tokens" ON tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on snapshots" ON snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on wallet_snapshots" ON wallet_snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on token_snapshots" ON token_snapshots FOR ALL USING (true) WITH CHECK (true);

-- 8. Auto-update updated_at on wallets
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tokens_updated_at
  BEFORE UPDATE ON tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
