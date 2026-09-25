#!/usr/bin/env node
// ============================================================
// DEV RUNNER - PostgreSQL (Docker) + Next.js in one command
// ============================================================
// `npm run dev`:
//   1. Reuses a PostgreSQL already listening on localhost:5432, or starts
//      one with `docker compose up -d` (skipped when Docker is missing).
//   2. Applies db/schema.sql (idempotent) so request history works.
//   3. Starts `next dev`.
//   4. When the dev server stops (Ctrl+C / crash), removes the container
//      it started with `docker compose down` - data is KEPT in the `pgdata`
//      named volume and is re-attached on the next run.
//
// No Docker or no database? The app still boots and falls back to
// in-memory history (see README).
//
// Usage: npm run dev          (plain Next.js only: npm run dev:next)
// ============================================================

import { spawn, spawnSync } from "node:child_process";
import net from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DB_HOST = "127.0.0.1";
const DB_PORT = 5432;
const DB_READY_TIMEOUT_MS = 60_000;
const DB_POLL_INTERVAL_MS = 500;

/** True when `command args...` exits 0 (cheap capability check). */
function canRun(command, args) {
  try {
    return spawnSync(command, args, { stdio: "ignore" }).status === 0;
  } catch {
    return false;
  }
}

/** Resolves true when a TCP connection to the database port succeeds. */
function probeDb(timeoutMs = 1_000) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (up) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(up);
    };
    const socket = net.connect({ host: DB_HOST, port: DB_PORT });
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.setTimeout(timeoutMs, () => finish(false));
  });
}

/** Polls probeDb() until it succeeds or the timeout elapses. */
async function waitForDb() {
  const deadline = Date.now() + DB_READY_TIMEOUT_MS;
  do {
    if (await probeDb()) return true;
    await new Promise((resolve) => setTimeout(resolve, DB_POLL_INTERVAL_MS));
  } while (Date.now() < deadline);
  return false;
}

/**
 * Applies db/schema.sql with the same env file the npm scripts use.
 * db-migrate.mjs prints its own errors; failures here are non-fatal
 * because the app degrades gracefully without the schema.
 */
function migrate() {
  console.log("[dev] Applying db/schema.sql ...");
  spawnSync(
    process.execPath,
    ["--env-file-if-exists=.env.local", join(ROOT, "scripts", "db-migrate.mjs")],
    { cwd: ROOT, stdio: "inherit" }
  );
}

async function main() {
  let startedByUs = false;

  if (await probeDb()) {
    console.log(`[dev] PostgreSQL already running on ${DB_HOST}:${DB_PORT} - reusing it.`);
  } else if (canRun("docker", ["compose", "version"])) {
    console.log("[dev] Starting PostgreSQL (docker compose up -d) ...");
    const up = spawnSync("docker", ["compose", "up", "-d"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    if (up.status === 0 && (await waitForDb())) {
      startedByUs = true;
      console.log("[dev] PostgreSQL is ready.");
    } else {
      console.warn("[dev] Could not start PostgreSQL - continuing without it.");
      console.warn("     (history stays in-memory; check Docker and docker-compose.yml)");
    }
  } else {
    console.warn("[dev] Docker not available - continuing without a database.");
    console.warn("     (history stays in-memory; install Docker or run PostgreSQL yourself)");
  }

  if (await probeDb()) migrate();

  const nextBin =
    process.platform === "win32"
      ? "next.cmd"
      : join(ROOT, "node_modules", ".bin", "next");
  const child = spawn(nextBin, ["dev"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  let shuttingDown = false;
  const shutdown = (code) => {
    if (shuttingDown) return;
    shuttingDown = true;
    if (startedByUs) {
      console.log(
        "\n[dev] Removing PostgreSQL container (data is kept in the 'pgdata' volume)."
      );
      spawnSync("docker", ["compose", "down"], { cwd: ROOT, stdio: "inherit" });
    }
    process.exit(code);
  };

  child.on("error", (error) => {
    console.error(`[dev] Failed to start Next.js: ${error.message}`);
    if (error.code === "ENOENT") {
      console.error("[dev] node_modules not found - run `npm install` first.");
    }
    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    // Ctrl+C / SIGTERM are normal shutdowns - exit 0 so npm doesn't print
    // a scary ELIFECYCLE error after an intentional Ctrl+C.
    const interrupted = signal === "SIGINT" || signal === "SIGTERM" || signal === "SIGHUP";
    shutdown(interrupted ? 0 : signal ? 1 : (code ?? 0));
  });

  // Ctrl+C normally reaches this process and the dev server (same foreground
  // group); forwarding covers shells where only we get the signal. The
  // container is removed only after the dev server has actually exited.
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    process.on(signal, () => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill(signal);
      } else {
        shutdown(0);
      }
    });
  }
}

await main();
