// ============================================================
// MAIN PAGE
// ============================================================

"use client";

import { useCallback, useEffect, useState } from "react";
import AppHeader from "./components/Header";
import Sidebar from "./components/Sidebar";
import RequestBuilder from "./components/RequestBuilder";
import ResponseViewer from "./components/ResponseViewer";
import type {
  ApiRequest,
  ApiResponse,
  DbHealthResponse,
  Header,
  HistoryItem,
} from "./lib/types";
import {
  clearHistory,
  deleteHistoryEntry,
  fetchDbHealth,
  fetchHistory,
  saveHistoryEntry,
} from "./lib/history";

export default function Home() {

  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [requestToLoad, setRequestToLoad] = useState<ApiRequest | null>(null);
  const [dbStatus, setDbStatus] = useState<DbHealthResponse | null>(null);

  // ---- LOAD PERSISTED HISTORY ON MOUNT ----
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [health, items] = await Promise.all([fetchDbHealth(), fetchHistory()]);
      if (cancelled) return;
      setDbStatus(health);
      setHistory(items);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

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

    // History entry shown immediately; the database returns the final one.
    const localId = `local-${Date.now()}`;

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

      // Convert the fetch Headers object to a plain object (plan 1.3) so
      // the ResponseViewer Headers tab can render it. `Headers` is iterable
      // of [key, value] pairs; the browser lowercases keys and combines
      // duplicates, and hides Set-Cookie (forbidden response header).
      // Note: no conversion needed on the error path below - a network
      // failure has no response headers at all.
      const responseHeaders: Record<string, string> = Object.fromEntries(
        res.headers
      );

      // Build ApiResponse object
      const apiResponse: ApiResponse = {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: responseBody,
        time: endTime - startTime,
        size: new Blob([responseBody]).size,
      };

      setResponse(apiResponse);

      // Show the entry in the sidebar right away...
      // (headers/body included so it can be reloaded even before the
      //  database confirms the save)
      setHistory((prev) => [
        {
          id: localId,
          method: data.method,
          url: data.url,
          timestamp: new Date(),
          status: res.status,
          headers: data.headers.map(({ key, value }) => ({ key, value })),
          body: data.method !== "GET" ? data.body : undefined,
        },
        ...prev,
      ]);

      // ...then store it in PostgreSQL and swap in the persisted entry.
      const saved = await saveHistoryEntry({
        method: data.method,
        url: data.url,
        headers: data.headers,
        body: data.method !== "GET" ? data.body : undefined,
        status: res.status,
        durationMs: apiResponse.time,
        responseSize: apiResponse.size,
      });

      if (saved) {
        setHistory((prev) =>
          prev.map((item) => (item.id === localId ? saved : item))
        );
        // A successful write means the database is reachable again.
        setDbStatus((prev) =>
          prev?.connected
            ? prev
            : { connected: true, message: "Connected to PostgreSQL" }
        );
      }
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

      // Still record the attempt so the history reflects what was tried.
      setHistory((prev) => [
        {
          id: localId,
          method: data.method,
          url: data.url,
          timestamp: new Date(),
          status: undefined,
          headers: data.headers.map(({ key, value }) => ({ key, value })),
          body: data.method !== "GET" ? data.body : undefined,
        },
        ...prev,
      ]);

      await saveHistoryEntry({
        method: data.method,
        url: data.url,
        headers: data.headers,
        body: data.method !== "GET" ? data.body : undefined,
        status: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---- HANDLE SELECTING FROM HISTORY ----
  // Convert the history entry back into an ApiRequest so the builder can
  // repopulate its method, URL, headers, and body.
  const handleSelectHistory = (item: HistoryItem) => {
    const headers: Header[] = (item.headers ?? []).map((header, index) => ({
      id: `${item.id}-header-${index}`,
      key: header.key,
      value: header.value,
      enabled: true,
    }));

    setRequestToLoad({
      method: item.method,
      url: item.url,
      headers,
      body: item.body ?? "",
    });
  };

  // ---- HANDLE REMOVING ONE HISTORY ENTRY ----
  const handleDeleteHistory = useCallback(async (item: HistoryItem) => {
    // Update the UI first so the list feels instant.
    setHistory((prev) => prev.filter((h) => h.id !== item.id));
    if (item.id.startsWith("local-")) return; // never persisted, nothing to delete
    await deleteHistoryEntry(item.id);
  }, []);

  // ---- HANDLE CLEARING THE WHOLE HISTORY ----
  const handleClearHistory = useCallback(async () => {
    setHistory([]);
    await clearHistory();
  }, []);

  // ---- RENDER ----
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white">
      {/* Fixed header at top */}
      <AppHeader />

      {/* Main content area - fills remaining height */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar with history (persisted in PostgreSQL) */}
        <Sidebar
          history={history}
          onSelectRequest={handleSelectHistory}
          onDeleteRequest={handleDeleteHistory}
          onClearHistory={handleClearHistory}
          dbStatus={dbStatus}
        />

        {/* Main content - request builder + response */}
        <main className="flex-1 flex flex-col p-6 overflow-y-auto">
          {/* Request Builder - takes about 1/3 of space */}
          <div className="mb-6">
            <RequestBuilder
              onSendRequest={handleSendRequest}
              requestToLoad={requestToLoad}
            />
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