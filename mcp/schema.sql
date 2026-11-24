-- Quiet Coaching MCP database (Cloudflare D1).
-- Only account credentials, saved insight results and small usage counters are stored.
-- Submitted excerpts are never written to the database.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  daily_limit INTEGER NOT NULL DEFAULT 10,
  reviewer INTEGER NOT NULL DEFAULT 0 CHECK (reviewer IN (0, 1)),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS insights (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  result TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS insights_by_user ON insights(user_id, created_at);
CREATE INDEX IF NOT EXISTS insights_by_expiry ON insights(expires_at);

-- Daily counters for fair use of the free analysis allowance. Removed after the day ends.
CREATE TABLE IF NOT EXISTS usage_daily (
  scope TEXT NOT NULL,
  day INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (scope, day)
);
