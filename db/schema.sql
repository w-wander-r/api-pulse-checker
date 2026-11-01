-- ============================================================
-- API PULSE CHECK - DATABASE SCHEMA
-- ============================================================
-- Applied with: npm run db:migrate
-- All statements are idempotent, so the script can be re-run safely.
--
-- Contains two parts:
--   1. Better Auth tables (accounts + sessions) - generated with
--        npx auth@latest generate --config app/lib/auth.ts
--      for better-auth 1.7.7, then made idempotent. Re-run that
--      command if app/lib/auth.ts gains plugins/tables later.
--   2. request_history - every request sent through the app,
--      owned by the user who sent it (`user_id`).
-- ============================================================

-- ------------------------------------------------------------
-- 1. BETTER AUTH: "user" / "session" / "account" / "verification"
--    (quoted names because "user" is a reserved word; camelCase
--    columns are required by Better Auth - do not rename them.)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "user" (
  "id"            TEXT        NOT NULL PRIMARY KEY,
  "name"          TEXT        NOT NULL,
  "email"         TEXT        NOT NULL UNIQUE,
  "emailVerified" BOOLEAN     NOT NULL,
  "image"         TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "session" (
  "id"          TEXT        NOT NULL PRIMARY KEY,
  "expiresAt"   TIMESTAMPTZ NOT NULL,
  "token"       TEXT        NOT NULL UNIQUE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMPTZ NOT NULL,
  "ipAddress"   TEXT,
  "userAgent"   TEXT,
  "userId"      TEXT        NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
  "id"                    TEXT        NOT NULL PRIMARY KEY,
  "accountId"             TEXT        NOT NULL,
  "providerId"            TEXT        NOT NULL,
  "userId"                TEXT        NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "accessToken"           TEXT,
  "refreshToken"          TEXT,
  "idToken"               TEXT,
  "accessTokenExpiresAt"  TIMESTAMPTZ,
  "refreshTokenExpiresAt" TIMESTAMPTZ,
  "scope"                 TEXT,
  "password"              TEXT,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id"          TEXT        NOT NULL PRIMARY KEY,
  "identifier"  TEXT        NOT NULL,
  "value"       TEXT        NOT NULL,
  "expiresAt"   TIMESTAMPTZ NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" ("userId");
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("userId");
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");

-- ------------------------------------------------------------
-- request_history - every request sent through the app
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS request_history (
  id            BIGSERIAL PRIMARY KEY,
  -- Owner: the signed-in account. Route handlers validate the
  -- session and filter by this column on every query. Nullable
  -- only so pre-auth databases can upgrade in place - rows with
  -- NULL are never returned (the API only reads user-owned rows).
  user_id       TEXT        REFERENCES "user" (id) ON DELETE CASCADE,
  method        TEXT        NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
  url           TEXT        NOT NULL,
  headers       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  body          TEXT,
  status        INTEGER,
  duration_ms   INTEGER,
  response_size INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upgrade path for databases created before user_id existed.
ALTER TABLE request_history
  ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES "user" (id) ON DELETE CASCADE;

-- History is always queried per user, newest-first - index that path.
CREATE INDEX IF NOT EXISTS request_history_user_id_created_at_idx
  ON request_history (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS request_history_created_at_idx
  ON request_history (created_at DESC);