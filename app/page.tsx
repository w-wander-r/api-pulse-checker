// ============================================================
// MAIN PAGE
// ============================================================

"use client";

import { useState } from "react";
import AppHeader from "./components/Header";
import Sidebar from "./components/Sidebar";
import RequestBuilder from "./components/RequestBuilder";
import ResponseViewer from "./components/ResponseViewer";
import type {
  ApiRequest,
  ApiResponse,
  Header,
  HistoryItem,
} from "./lib/types";

export default function Home() {

  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // ---- HANDLE SENDING REQUEST ----
  // This function is called when the user clicks "Send"
  const handleSendRequest = async (data: {
    method: ApiRequest["method"];
    url: string;
    headers: Header[];
    body: string;
  }) => {
    setIsLoading(true);
    setResponse(null);

    // Record the start time for measuring request duration
    const startTime = Date.now();

    try {
      // Convert Header[] to a plain object for fetch()
      const headerObject: Record<string, string> = {};
      data.headers.forEach((h) => {
        headerObject[h.key] = h.value;
      });

      // Actually send the HTTP request using the browser's fetch API
      const res = await fetch(data.url, {
        method: data.method,
        headers: headerObject,
        body: data.method !== "GET" ? data.body : undefined,
      });

      // Read the response body as text
      const responseBody = await res.text();
      const endTime = Date.now();

      // Build ApiResponse object
      const apiResponse: ApiResponse = {
        status: res.status,
        statusText: res.statusText,
        headers: {}, // TODO
        body: responseBody,
        time: endTime - startTime,
        size: new Blob([responseBody]).size,
      };

      setResponse(apiResponse);

      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        method: data.method,
        url: data.url,
        timestamp: new Date(),
        status: res.status,
      };
      setHistory((prev) => [historyItem, ...prev]);
    } catch (error) {
      // Handle network errors (DNS failure, CORS, timeout, etc.)
      setResponse({
        status: 0,
        statusText: "Network Error",
        headers: {},
        body:
          error instanceof Error
            ? `Error: ${error.message}`
            : "An unknown error occurred",
        time: 0,
        size: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---- HANDLE SELECTING FROM HISTORY ----
  const handleSelectHistory = (item: HistoryItem) => {
    console.log("Selected from history:", item);
    // TODO: populate the request builder with this data
  };

  // ---- RENDER ----
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white">
      {/* Fixed header at top */}
      <AppHeader />

      {/* Main content area - fills remaining height */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar with history */}
        <Sidebar history={history} onSelectRequest={handleSelectHistory} />

        {/* Main content - request builder + response */}
        <main className="flex-1 flex flex-col p-6 overflow-y-auto">
          {/* Request Builder - takes about 1/3 of space */}
          <div className="mb-6">
            <RequestBuilder onSendRequest={handleSendRequest} />
          </div>

          {/* Divider */}
          <hr className="border-slate-700 mb-6" />

          {/* Response Viewer - takes remaining space */}
          <div>
            <h2 className="text-lg font-semibold text-slate-200 mb-4">
              Response
            </h2>
            <ResponseViewer response={response} isLoading={isLoading} />
          </div>
        </main>
      </div>
    </div>
  );
}