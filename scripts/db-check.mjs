// ============================================================
// DATABASE CONNECTION CHECK
// ============================================================
// Verifies that the app can reach the PostgreSQL container and
// reports the tables that exist. Useful for a quick smoke test
// without starting the Next.js dev server.
//
// Usage:
//   npm run db:check
// ============================================================

import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "[db:check] DATABASE_URL is not set. Copy .env.example to .env.local first."
  );
  process.exit(1);
}

// Hide the password when printing the target so logs stay safe.
const safeUrl = connectionString.replace(/:\/\/([^:]+):[^@]*@/, "://$1:****@");
const pool = new Pool({ connectionString, connectionTimeoutMillis: 5_000 });

try {
  const startedAt = Date.now();
  const { rows } = await pool.query(
    "SELECT version() AS version, current_database() AS database, current_user AS \"user\""
  );
  const latency = Date.now() - startedAt;

  console.log(`[db:check] OK - connected to ${safeUrl} in ${latency}ms`);
  console.log(`[db:check] Database: ${rows[0].database} (user: ${rows[0].user})`);
  console.log(`[db:check] ${rows[0].version}`);

  const { rows: tables } = await pool.query(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name`
  );

  if (tables.length === 0) {
    console.log("[db:check] No tables found - run `npm run db:migrate`.");
  } else {
    console.log(`[db:check] Tables: ${tables.map((t) => t.table_name).join(", ")}`);
  }
} catch (error) {
  console.error(`[db:check] FAILED - could not reach ${safeUrl}`);
  console.error(`[db:check] ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}