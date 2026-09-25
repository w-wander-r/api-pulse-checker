// ============================================================
// DATABASE CLIENT - PostgreSQL connection pool
// ============================================================
// The app talks to a PostgreSQL instance (by default the one
// running in Docker on localhost:5432). Import `query` to run
// SQL from Route Handlers / Server Components.
//
// Connection settings live in .env.local (never commit secrets):
//   DATABASE_URL=postgresql://user:password@localhost:5432/dbname
// ============================================================

import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

// Read connection string from the environment. Next.js automatically
// loads .env.local, so the value is available in Route Handlers.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Warn once at import time instead of crashing the whole app.
  // `checkDbConnection()` and the API routes surface this as a
  // friendly "database not configured" state in the UI.
  console.warn(
    "[db] DATABASE_URL is not set. Copy .env.example to .env.local and adjust the values."
  );
}

// Next.js dev mode hot-reloads modules, which would create a new pool on
// every reload and eventually exhaust PostgreSQL connections. Cache the
// pool on globalThis so reloads reuse the same instance.
const globalForDb = globalThis as unknown as { __apiPulsePool?: Pool };

export const pool: Pool =
  globalForDb.__apiPulsePool ??
  new Pool({
    connectionString,
    // Small pool - this app only runs a handful of short queries.
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__apiPulsePool = pool;
}

/**
 * Run a parameterised SQL query against the pool.
 *
 * Always pass user input through `params` (never string-concatenate)
 * so PostgreSQL can protect against SQL injection.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  return pool.query<T>(text, params);
}

/** Run several statements inside a single transaction. */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/** Result of a database connectivity probe. */
export interface DbHealth {
  connected: boolean;
  /** Human-readable status message (also used as the error text). */
  message: string;
  /** Server version reported by PostgreSQL (only when connected). */
  version?: string;
  /** Database name currently connected to. */
  database?: string;
  /** Round-trip time of the probe query in milliseconds. */
  latencyMs?: number;
}

/**
 * Ping the database. Never throws - callers get a structured result so
 * the UI can show "connected" / "offline" instead of an error page.
 */
export async function checkDbConnection(): Promise<DbHealth> {
  if (!connectionString) {
    return {
      connected: false,
      message: "DATABASE_URL is not set. Add it to .env.local to persist data.",
    };
  }

  const startedAt = Date.now();
  try {
    const result = await query<{ version: string; database: string }>(
      "SELECT version() AS version, current_database() AS database"
    );
    return {
      connected: true,
      message: "Connected to PostgreSQL",
      version: result.rows[0]?.version,
      database: result.rows[0]?.database,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      connected: false,
      message:
        error instanceof Error
          ? `Database unreachable: ${error.message}`
          : "Database unreachable",
    };
  }
}

/** Close the pool (used by scripts and tests to exit cleanly). */
export async function closePool(): Promise<void> {
  await pool.end();
}