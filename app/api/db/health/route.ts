// ============================================================
// API ROUTE - GET /api/db/health
// ============================================================
// Lightweight connectivity probe for the PostgreSQL container.
// Returns 200 when the database answers, 503 when it does not.
// ============================================================

import { NextResponse } from "next/server";
import { checkDbConnection } from "../../../lib/db";

// Always run on the Node.js runtime (the `pg` driver needs Node, not Edge).
export const runtime = "nodejs";

// Never cache - the UI polls this to display the live connection state.
export const dynamic = "force-dynamic";

export async function GET() {
  const health = await checkDbConnection();

  return NextResponse.json(health, {
    status: health.connected ? 200 : 503,
  });
}