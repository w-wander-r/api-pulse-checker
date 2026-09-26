// ============================================================
// DATABASE MIGRATION RUNNER
// ============================================================
// Applies db/schema.sql to the database pointed at by DATABASE_URL.
//
// Usage:
//   npm run db:migrate                    # local dev (.env.local is read)
//   DATABASE_URL="<neon url>" npm run db:migrate:prod   # production (no env file)
// ============================================================

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, "..", "db", "schema.sql");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "[db:migrate] DATABASE_URL is not set.\n" +
      "             Local dev (Docker container):\n" +
      "               cp .env.example .env.local   # then: npm run db:migrate\n" +
      "             Production (Neon) - pass the URL explicitly, no env file is read:\n" +
      "               DATABASE_URL=\"<neon pooled url>\" npm run db:migrate:prod"
  );
  process.exit(1);
}

const sql = readFileSync(schemaPath, "utf8");
const pool = new Pool({ connectionString });

try {
  const { rows } = await pool.query(
    "SELECT version() AS version, current_database() AS database, current_user AS \"user\""
  );
  const { version, database, user } = rows[0];
  console.log(`[db:migrate] Connected to "${database}" as "${user}"`);
  console.log(`[db:migrate] ${version}`);

  await pool.query(sql);
  console.log("[db:migrate] Applied db/schema.sql successfully.");

  const { rows: tables } = await pool.query(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name`
  );
  console.log(
    `[db:migrate] Tables in public schema: ${
      tables.map((t) => t.table_name).join(", ") || "(none)"
    }`
  );
} catch (error) {
  console.error(`[db:migrate] Failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}