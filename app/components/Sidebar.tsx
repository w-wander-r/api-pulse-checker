// ============================================================
// SIDEBAR - Shows request history on the left side
// ============================================================
// This component displays a list of previously sent requests.
// Users can click on a history item to re-use it.
// ============================================================

"use client";

import type { HistoryItem, HttpMethod } from "../lib/types";

interface SidebarProps {
  history: HistoryItem[];
  onSelectRequest: (item: HistoryItem) => void;
}

// Color coding for method badges in history
const methodBadgeColors: Record<HttpMethod, string> = {
  GET: "bg-green-700 text-green-100",
  POST: "bg-blue-700 text-blue-100",
  PUT: "bg-yellow-700 text-yellow-100",
  DELETE: "bg-red-700 text-red-100",
  PATCH: "bg-purple-700 text-purple-100",
};

export default function Sidebar({ history, onSelectRequest }: SidebarProps) {
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
      <div className="px-4 py-3 border-b border-slate-700">
        <h2 className="text-slate-200 font-semibold text-sm uppercase tracking-wide">
          History
        </h2>
      </div>

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
                onClick={() => onSelectRequest(item)}
                className="px-4 py-3 border-b border-slate-800 hover:bg-slate-800 cursor-pointer transition-colors"
              >
                {/* Method badge + URL */}
                <div className="flex items-center gap-2 mb-1">
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
    </aside>
  );
}
