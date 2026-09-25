-- ============================================================
-- API PULSE CHECK - DATABASE SCHEMA
-- ============================================================
-- Applied with: npm run db:migrate
-- All statements are idempotent, so the script can be re-run safely.
-- ============================================================

-- ------------------------------------------------------------
-- request_history - every request sent through the app
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS request_history (
  id            BIGSERIAL PRIMARY KEY,
  method        TEXT        NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
  url           TEXT        NOT NULL,
  headers       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  body          TEXT,
  status        INTEGER,
  duration_ms   INTEGER,
  response_size INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- History is always queried newest-first, so index that access path.
CREATE INDEX IF NOT EXISTS request_history_created_at_idx
  ON request_history (created_at DESC);