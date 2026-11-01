// ============================================================
// HISTORY API CLIENT
// ============================================================
// Thin fetch wrappers around the /api/history and /api/db/health
// Route Handlers. Keeping them here means components never have to
// know about the REST shape of the backend.
//
// Every function is defensive: a database outage must never break
// the UI, so failures resolve to an empty/offline result instead of
// throwing at the caller.
// ============================================================

import type {
  CreateHistoryInput,
  DbHealthResponse,
  HistoryItem,
  HistoryListResponse,
  RequestHistoryRow,
} from "./types";

/** Convert a database row into the shape the UI uses. */
export function rowToHistoryItem(row: RequestHistoryRow): HistoryItem {
  return {
    id: String(row.id),
    method: row.method,
    url: row.url,
    timestamp: new Date(row.created_at),
    status: row.status ?? undefined,
    // Needed so a history entry can be reloaded into the request builder.
    headers: row.headers ?? undefined,
    body: row.body ?? undefined,
  };
}

/** GET /api/history - most recent entries first. */
export async function fetchHistory(limit = 50): Promise<HistoryItem[]> {
  try {
    const res = await fetch(`/api/history?limit=${limit}`, { cache: "no-store" });
    if (!res.ok) {
      console.error("[history] Failed to load history:", res.status, res.statusText);
      return [];
    }
    const data = (await res.json()) as HistoryListResponse;
    return data.items.map(rowToHistoryItem);
  } catch (error) {
    console.error("[history] Failed to load history:", error);
    return [];
  }
}

/** POST /api/history - persist a sent request. Returns null on failure. */
export async function saveHistoryEntry(
  input: CreateHistoryInput
): Promise<HistoryItem | null> {
  try {
    const res = await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      console.error("[history] Failed to save history entry:", res.status);
      return null;
    }
    const data = (await res.json()) as { item: RequestHistoryRow };
    return rowToHistoryItem(data.item);
  } catch (error) {
    console.error("[history] Failed to save history entry:", error);
    return null;
  }
}

/** DELETE /api/history/:id - remove a single entry. */
export async function deleteHistoryEntry(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/history/${id}`, { method: "DELETE" });
    return res.ok;
  } catch (error) {
    console.error("[history] Failed to delete history entry:", error);
    return false;
  }
}

/** DELETE /api/history - clear the whole history. Returns rows removed. */
export async function clearHistory(): Promise<number> {
  try {
    const res = await fetch("/api/history", { method: "DELETE" });
    if (!res.ok) return 0;
    const data = (await res.json()) as { deleted: number };
    return data.deleted;
  } catch (error) {
    console.error("[history] Failed to clear history:", error);
    return 0;
  }
}

/** GET /api/db/health - live database connectivity probe. */
export async function fetchDbHealth(): Promise<DbHealthResponse> {
  try {
    const res = await fetch("/api/db/health", { cache: "no-store" });
    // A 503 still carries a useful JSON body, so parse it either way.
    return (await res.json()) as DbHealthResponse;
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

// ============================================================
// LOCAL FALLBACK - history in localStorage (NOT signed in)
// ============================================================
// Signed-in users persist through the API functions above
// (PostgreSQL, scoped to their account). Visitors without a
// session get a best-effort copy in THIS browser instead, so the
// sidebar still works. It does NOT survive a page reset / clear
// browsing data - the Sidebar shows a warning label for it.
// Every function is defensive: storage disabled or quota hit
// must never break the UI.
// ============================================================

/** Bump the suffix if the stored shape ever changes. */
const LOCAL_HISTORY_KEY = "api-pulse-history-v1";

/** Cap stored entries so the ~5 MB localStorage quota can't blow up. */
const MAX_LOCAL_ENTRIES = 50;

/** Read local history; never throws (private mode / quota -> []). */
export function loadLocalHistory(): HistoryItem[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Revive timestamps - JSON stores Date as an ISO string.
    return (parsed as HistoryItem[]).map((item) => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }));
  } catch (error) {
    console.warn("[history] Failed to read local history:", error);
    return [];
  }
}

/** Write the list back; swallows quota/privacy errors. */
function writeLocalHistory(items: HistoryItem[]): void {
  try {
    window.localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn("[history] Failed to persist local history:", error);
  }
}

/** Append one entry (newest first, deduped by id, capped). */
export function appendLocalHistory(entry: HistoryItem): void {
  const items = loadLocalHistory().filter((item) => item.id !== entry.id);
  items.unshift(entry);
  writeLocalHistory(items.slice(0, MAX_LOCAL_ENTRIES));
}

/** Remove a single entry from local history. */
export function removeLocalHistory(id: string): void {
  writeLocalHistory(loadLocalHistory().filter((item) => item.id !== id));
}

/** Wipe local history. */
export function clearLocalHistory(): void {
  try {
    window.localStorage.removeItem(LOCAL_HISTORY_KEY);
  } catch (error) {
    console.warn("[history] Failed to clear local history:", error);
  }
}