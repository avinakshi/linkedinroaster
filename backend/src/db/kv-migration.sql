-- Key-value store (replaces Upstash Redis for cache, sessions, OTP, rate-limiting)
CREATE TABLE IF NOT EXISTS kv_store (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_kv_store_expires ON kv_store (expires_at) WHERE expires_at IS NOT NULL;
