// ============================================================
// API ROUTE - /api/history
// ============================================================
// GET    /api/history        -> recent request history (newest first)
// POST   /api/history        -> store a sent request
// DELETE /api/history        -> clear the whole history
//
// Backed by the `request_history` table (see db/schema.sql).
//
// AUTH: every method requires a signed-in user (401 otherwise).
// Sessions are validated here in the handler (not in middleware)
// and rows are scoped per user via `user_id`.
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromHeaders } from "../../lib/auth";
import { query } from "../../lib/db";
import type {
  CreateHistoryInput,
  Header,
  HttpMethod,
  RequestHistoryRow,
  StoredHeader,
} from "../../lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Columns returned to the client (keeps the API and the table in sync). */
const HISTORY_COLUMNS = `
  id, method, url, headers, body, status, duration_ms, response_size, created_at
`;

const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "DELETE", "PATCH"];

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/** Build a JSON error response with a consistent shape. */
function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Type guard for the HTTP methods we support. */
function isHttpMethod(value: unknown): value is HttpMethod {
  return typeof value === "string" && HTTP_METHODS.includes(value as HttpMethod);
}

/** Keep only enabled headers that actually have a name. */
function toStoredHeaders(headers: Header[] | undefined): StoredHeader[] {
  if (!Array.isArray(headers)) return [];
  return headers
    .filter((h) => h && typeof h.key === "string" && h.key.trim() !== "")
    .map((h) => ({ key: h.key, value: h.value ?? "" }));
}

/** Status codes outside the HTTP range become null (e.g. network errors). */
function toStatusCode(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 100 && value <= 599
    ? value
    : null;
}

/** Nullable, non-negative integer (used for timings and sizes). */
function toNullableInt(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : null;
}

// ---- GET: list history ----
export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : DEFAULT_LIMIT;
  const limit = Number.isNaN(parsedLimit)
    ? DEFAULT_LIMIT
    : Math.min(Math.max(parsedLimit, 1), MAX_LIMIT);

  try {
    // Validate the session cookie before touching the database.
    const session = await getSessionFromHeaders(request.headers);
    if (!session) {
      return errorResponse("Sign in to view your history", 401);
    }

    const result = await query<RequestHistoryRow>(
      `SELECT ${HISTORY_COLUMNS}
         FROM request_history
        WHERE user_id = $1
        ORDER BY created_at DESC, id DESC
        LIMIT $2`,
      [session.user.id, limit]
    );
    return NextResponse.json({ items: result.rows });
  } catch (error) {
    console.error("[api/history] GET failed:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to load history",
      500
    );
  }
}

// ---- POST: store a sent request ----
export async function POST(request: NextRequest) {
  let payload: CreateHistoryInput;

  try {
    payload = (await request.json()) as CreateHistoryInput;
  } catch {
    return errorResponse("Request body must be valid JSON", 400);
  }

  if (!isHttpMethod(payload?.method)) {
    return errorResponse(
      `"method" must be one of: ${HTTP_METHODS.join(", ")}`,
      400
    );
  }
  if (typeof payload.url !== "string" || payload.url.trim() === "") {
    return errorResponse('"url" is required', 400);
  }

  try {
    // Only signed-in users may persist history; rows belong to them.
    const session = await getSessionFromHeaders(request.headers);
    if (!session) {
      return errorResponse("Sign in to save history", 401);
    }

    const result = await query<RequestHistoryRow>(
      `INSERT INTO request_history
         (user_id, method, url, headers, body, status, duration_ms, response_size)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8)
       RETURNING ${HISTORY_COLUMNS}`,
      [
        session.user.id,
        payload.method,
        payload.url,
        JSON.stringify(toStoredHeaders(payload.headers)),
        payload.body ? payload.body : null,
        toStatusCode(payload.status),
        toNullableInt(payload.durationMs),
        toNullableInt(payload.responseSize),
      ]
    );

    return NextResponse.json({ item: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[api/history] POST failed:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to save history entry",
      500
    );
  }
}

// ---- DELETE: clear history (only the signed-in user's rows) ----
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromHeaders(request.headers);
    if (!session) {
      return errorResponse("Sign in to clear history", 401);
    }

    const result = await query("DELETE FROM request_history WHERE user_id = $1", [
      session.user.id,
    ]);
    return NextResponse.json({ deleted: result.rowCount ?? 0 });
  } catch (error) {
    console.error("[api/history] DELETE failed:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to clear history",
      500
    );
  }
}