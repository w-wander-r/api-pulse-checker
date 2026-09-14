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

import { useState } from "react";
import type { ApiResponse } from "../lib/types";

// Define the available response tabs
type ResponseTab = "body" | "headers" | "cookies";

interface ResponseViewerProps {
  response: ApiResponse | null;       // The response data (null if no request sent yet)
  isLoading: boolean;                  // Are we waiting for response?
}

export default function ResponseViewer({ response, isLoading }: ResponseViewerProps) {
  // Track which response tab is active
  const [activeTab, setActiveTab] = useState<ResponseTab>("body");

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
      <div className="flex gap-4 border-b border-slate-700">
        {/* Body Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("body")}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            activeTab === "body"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-slate-400 hover:text-slate-200 border-b-2 border-transparent"
          }`}
        >
          Body
        </button>

        {/* Headers Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("headers")}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            activeTab === "headers"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-slate-400 hover:text-slate-200 border-b-2 border-transparent"
          }`}
        >
          Headers
        </button>

        {/* Cookies Tab (for future use) */}
        <button
          type="button"
          onClick={() => setActiveTab("cookies")}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            activeTab === "cookies"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-slate-400 hover:text-slate-200 border-b-2 border-transparent"
          }`}
        >
          Cookies
        </button>
      </div>

      {/* Tab Content - Only shows the active tab's content */}
      <div className="min-h-[200px]">
        {/* Body Content */}
        {activeTab === "body" && (
          <pre className="bg-slate-900 p-4 rounded-lg overflow-auto max-h-96 text-sm">
            <code className="text-slate-200">
              {formatBody(response.body)}
            </code>
          </pre>
        )}

        {/* Headers Content */}
        {activeTab === "headers" && (
          <div className="bg-slate-900 p-4 rounded-lg overflow-auto max-h-96">
            {Object.entries(response.headers).length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="text-left py-2 pr-4">Header</th>
                    <th className="text-left py-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(response.headers).map(([key, value]) => (
                    <tr key={key} className="border-b border-slate-800">
                      <td className="py-2 pr-4 text-slate-300 font-mono">{key}</td>
                      <td className="py-2 text-slate-400 font-mono break-all">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-slate-500 text-sm">
                No response headers available
              </p>
            )}
          </div>
        )}

        {/* Cookies Content (placeholder) */}
        {activeTab === "cookies" && (
          <div className="bg-slate-900 p-4 rounded-lg">
            <p className="text-slate-500 text-sm">
              Cookie information will appear here
            </p>
            <p className="text-slate-600 text-xs mt-1">
              Coming soon - view cookies returned by the server
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
