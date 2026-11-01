// ============================================================
// SIDEBAR - Shows request history on the left side
// ============================================================
// This component displays a list of previously sent requests.
// Users can click on a history item to re-use it.
// ============================================================

"use client";

import Link from "next/link";
import type { DbHealthResponse, HistoryItem, HttpMethod } from "../lib/types";

interface SidebarProps {
  history: HistoryItem[];
  onSelectRequest: (item: HistoryItem) => void;
  /** Remove a single history entry (also deletes it from the database). */
  onDeleteRequest?: (item: HistoryItem) => void;
  /** Wipe the whole history (also truncates the database table). */
  onClearHistory?: () => void;
  /** Latest /api/db/health probe; null while the first check is running. */
  dbStatus?: DbHealthResponse | null;
  /**
   * True when the visitor is NOT signed in: history lives in this
   * browser's localStorage only, so the "local only" warning label
   * is shown (it does not survive a page reset).
   */
  localOnly?: boolean;
}

// Color coding for method badges in history
const methodBadgeColors: Record<HttpMethod, string> = {
  GET: "bg-green-700 text-green-100",
  POST: "bg-blue-700 text-blue-100",
  PUT: "bg-yellow-700 text-yellow-100",
  DELETE: "bg-red-700 text-red-100",
  PATCH: "bg-purple-700 text-purple-100",
};

export default function Sidebar({
  history,
  onSelectRequest,
  onDeleteRequest,
  onClearHistory,
  dbStatus,
  localOnly,
}: SidebarProps) {
  // Format timestamp to readable time
  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col">
      {/* Sidebar Header */}
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between gap-2">
        <h2 className="text-slate-200 font-semibold text-sm uppercase tracking-wide">
          History
        </h2>
        {history.length > 0 && onClearHistory && (
          <button
            type="button"
            onClick={onClearHistory}
            title="Delete all history entries"
            className="text-xs text-slate-400 hover:text-red-400 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Warning for signed-out visitors: local storage only */}
      {localOnly && (
        <p
          role="status"
          className="px-4 py-2 border-b border-amber-900/60 bg-amber-950/40 text-amber-300 text-xs leading-relaxed"
        >
          ⚠ Not signed in - history is saved only in this browser and is
          lost when the page resets.{" "}
          <Link
            href="/login"
            className="underline font-medium hover:text-amber-200"
          >
            Sign in
          </Link>{" "}
          to keep it.
        </p>
      )}

      {/* History List */}
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          // Empty state
          <p className="px-4 py-6 text-slate-500 text-sm text-center">
            No requests yet
          </p>
        ) : (
          // History items
          <ul>
            {history.map((item) => (
              <li
                key={item.id}
                role="button"
                tabIndex={0}
                title="Click to load this request into the builder"
                onClick={() => onSelectRequest(item)}
                onKeyDown={(e) => {
                  // Make history items reachable without a mouse.
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectRequest(item);
                  }
                }}
                className="group relative px-4 py-3 border-b border-slate-800 hover:bg-slate-800 focus:bg-slate-800 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer transition-colors"
              >
                {/* Delete this entry (also removes it from the database) */}
                {onDeleteRequest && (
                  <button
                    type="button"
                    title="Delete this entry"
                    aria-label={`Delete ${item.method} ${item.url}`}
                    onClick={(e) => {
                      // Don't let the click bubble up and load the request.
                      e.stopPropagation();
                      onDeleteRequest(item);
                    }}
                    className="absolute top-2 right-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    x
                  </button>
                )}

                {/* Method badge + URL */}
                <div className="flex items-center gap-2 mb-1 pr-5">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      methodBadgeColors[item.method]
                    }`}
                  >
                    {item.method}
                  </span>
                  <span className="text-slate-300 text-sm truncate flex-1">
                    {item.url}
                  </span>
                </div>

                {/* Time and status */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{formatTime(item.timestamp)}</span>
                  {item.status && (
                    <span
                      className={
                        item.status >= 200 && item.status < 300
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {item.status}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    {/* Footer: what backs the history list right now */}
      {localOnly ? (
        <div
          className="px-4 py-2 border-t border-slate-700 text-xs flex items-center gap-2"
          title="You are not signed in - history is stored in this browser only (localStorage)"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-amber-400 truncate">Local storage - browser only</span>
        </div>
      ) : (
        <div
          className="px-4 py-2 border-t border-slate-700 text-xs flex items-center gap-2"
          title={dbStatus?.message ?? "Checking database connection"}
        >
          {!dbStatus ? (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
              <span className="text-slate-400">Checking database…</span>
            </>
          ) : dbStatus.connected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-green-400 truncate">
                DB: {dbStatus.database ?? "connected"}
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-amber-400 truncate">
                DB offline – history not saved
              </span>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
