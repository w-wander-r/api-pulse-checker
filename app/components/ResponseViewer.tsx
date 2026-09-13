// ============================================================
// RESPONSE VIEWER - Displays the API response
// ============================================================
// After sending a request, this component shows:
// - Status code
// - Response time
// - Response headers
// - Response body (formatted JSON when possible)
// ============================================================

"use client";

import type { ApiResponse } from "../lib/types";

interface ResponseViewerProps {
  response: ApiResponse | null;       // The response data (null if no request sent yet)
  isLoading: boolean;                  // Are we waiting for response?
}

export default function ResponseViewer({ response, isLoading }: ResponseViewerProps) {
  // ---- COLOR CODING FOR STATUS CODES ----
  const getStatusColor = (status: number): string => {
    if (status >= 200 && status < 300) return "text-green-400";
    if (status >= 300 && status < 400) return "text-yellow-400";
    if (status >= 400 && status < 600) return "text-red-400";
    return "text-slate-300";
  };

  // ---- FORMAT JSON NICELY ----
  // Tries to parse and pretty-print JSON, falls back to raw text
  const formatBody = (body: string): string => {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body; // Not valid JSON, show as-is
    }
  };

  // ---- RENDER STATES ----

  // Loading state - waiting for response
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <div className="animate-spin text-3xl mb-4">{">"}</div>
        <p>Sending request...</p>
      </div>
    );
  }

  // No response yet - initial state
  if (!response) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <p className="text-lg">Enter a URL and click Send</p>
        <p className="text-sm mt-2">The response will appear here</p>
      </div>
    );
  }

  // ---- RESPONSE DISPLAY ----
  return (
    <div className="flex flex-col gap-4">
      {/* Status Bar - shows status code, time, and size */}
      <div className="flex items-center gap-4 pb-3 border-b border-slate-700">
        <span className={`font-bold text-lg ${getStatusColor(response.status)}`}>
          {response.status} {response.statusText}
        </span>
        <span className="text-slate-400 text-sm">
          Time: {response.time}ms
        </span>
        <span className="text-slate-400 text-sm">
          Size: {response.size} bytes
        </span>
      </div>

      {/* Response Tabs */}
      {/* TODO: fix tabs */}
      <div className="flex gap-4">
        <h4 className="text-slate-300 text-sm font-medium pb-1 border-b-2 border-blue-500">
          Body
        </h4>
        <h4 className="text-slate-400 text-sm pb-1 border-b-2 border-transparent hover:text-white cursor-pointer">
          Headers
        </h4>
      </div>

      {/* Response Body */}
      <pre className="bg-slate-900 p-4 rounded-lg overflow-auto max-h-96 text-sm">
        <code className="text-slate-200">
          {formatBody(response.body)}
        </code>
      </pre>
    </div>
  );
}
