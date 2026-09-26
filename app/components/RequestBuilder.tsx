// ============================================================
// REQUEST BUILDER - The main form for constructing API requests
// ============================================================
// This is the heart of the app - where users:
// 1. Select HTTP method (GET, POST, etc.)
// 2. Enter the URL
// 3. Add headers
// 4. Write request body
// 5. Send the request
// ============================================================

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ApiRequest, HttpMethod, Header, QueryParam } from "../lib/types";
import { buildUrlWithParams, parseQueryParams } from "../lib/utils";

// Define the available request tabs
type RequestTab = "headers" | "body" | "params";

interface RequestBuilderProps {
  onSendRequest: (data: {
    method: HttpMethod;
    url: string;
    headers: Header[];
    body: string;
  }) => void;
  /**
   * Request selected from the sidebar history. Every time a new value is
   * passed here the builder repopulates its method, URL, headers, and body.
   * Named `requestToLoad` rather than `onLoadRequest` because it carries
   * data into the component instead of being an event callback.
   */
  requestToLoad?: ApiRequest | null;
}

export default function RequestBuilder({
  onSendRequest,
  requestToLoad,
}: RequestBuilderProps) {
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState<Header[]>([
    { id: "1", key: "Content-Type", value: "application/json", enabled: true },
  ]);
  const [body, setBody] = useState("");
  const [params, setParams] = useState<QueryParam[]>([]);

  // Track which tab is active in the request section
  const [activeTab, setActiveTab] = useState<RequestTab>("headers");

  // Ref for auto-resizing textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as content changes
  const autoResizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 400)}px`;
    }
  }, []);

  // Run auto-resize when body content changes
  useEffect(() => {
    autoResizeTextarea();
  }, [body, autoResizeTextarea]);

  // ---- LOAD A REQUEST FROM HISTORY ----
  const [previousRequest, setPreviousRequest] = useState<ApiRequest | null>(
    null
  );

  if (requestToLoad && requestToLoad !== previousRequest) {
    setPreviousRequest(requestToLoad);
    setMethod(requestToLoad.method);
    setUrl(requestToLoad.url);
    setParams(parseQueryParams(requestToLoad.url));
    setHeaders(requestToLoad.headers);
    setBody(requestToLoad.body);
    // Jump back to Headers so the user sees what was reloaded.
    setActiveTab("headers");
  }

  const methods: HttpMethod[] = ["GET", "POST", "PUT", "DELETE", "PATCH"];

  const methodColors: Record<HttpMethod, string> = {
    GET: "bg-green-600 hover:bg-green-700",
    POST: "bg-blue-600 hover:bg-blue-700",
    PUT: "bg-yellow-600 hover:bg-yellow-700",
    DELETE: "bg-red-600 hover:bg-red-700",
    PATCH: "bg-purple-600 hover:bg-purple-700",
  };

  const addHeader = () => {
    setHeaders([
      ...headers,
      { id: "new-" + Date.now(), key: "", value: "", enabled: true },
    ]);
  };

  const updateHeader = (
    id: string,
    field: "key" | "value" | "enabled",
    newValue: string | boolean
  ) => {
    setHeaders(
      headers.map((h) => (h.id === id ? { ...h, [field]: newValue } : h))
    );
  };

  const removeHeader = (id: string) => {
    setHeaders(headers.filter((h) => h.id !== id));
  };

  // ---- PARAMS (URL QUERY STRING) ----
  // The Params tab and the URL bar are two views of the same data: every
  // edit on one side is written back to the other so they can't drift.
  const applyParams = (next: QueryParam[]) => {
    setParams(next);
    setUrl(buildUrlWithParams(url, next));
  };

  const addParam = () => {
    applyParams([
      ...params,
      { id: "new-" + Date.now(), key: "", value: "", enabled: true },
    ]);
  };

  const updateParam = (
    id: string,
    field: "key" | "value" | "enabled",
    newValue: string | boolean
  ) => {
    applyParams(
      params.map((p) => (p.id === id ? { ...p, [field]: newValue } : p))
    );
  };

  const removeParam = (id: string) => {
    applyParams(params.filter((p) => p.id !== id));
  };

  // Typing/pasting a query string into the URL bar fills the Params tab live.
  const handleUrlChange = (value: string) => {
    setUrl(value);
    setParams(parseQueryParams(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activeHeaders = headers.filter(
      (h) => h.enabled && h.key.trim() !== ""
    );
    // Compose the final URL: base + enabled params (?key=value&key2=value2)
    const finalUrl = buildUrlWithParams(url, params);
    // Keep the URL bar showing exactly what is being sent.
    setUrl(finalUrl);
    onSendRequest({ method, url: finalUrl, headers: activeHeaders, body });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* URL Bar */}
      <div className="flex gap-2">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as HttpMethod)}
          className={`px-4 py-2 rounded-l-lg text-white font-semibold cursor-pointer ${methodColors[method]}`}
        >
          {methods.map((m) => (
            <option key={m} value={m} className="bg-slate-800">
              {m}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://api.example.com/users?page=1"
          className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-r-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
        >
          Send
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-700">
        {/* Headers Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("headers")}
          className={`pb-2 px-1 font-medium transition-colors ${
            activeTab === "headers"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-slate-400 hover:text-slate-200 border-b-2 border-transparent"
          }`}
        >
          Headers
        </button>

        {/* Body Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("body")}
          className={`pb-2 px-1 font-medium transition-colors ${
            activeTab === "body"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-slate-400 hover:text-slate-200 border-b-2 border-transparent"
          }`}
        >
          Body
        </button>

        {/* Params Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("params")}
          className={`pb-2 px-1 font-medium transition-colors ${
            activeTab === "params"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-slate-400 hover:text-slate-200 border-b-2 border-transparent"
          }`}
        >
          Params
        </button>
      </div>

      {/* Tab Content - Only shows the active tab's content */}
      <div className="min-h-[120px]">
        {/* Headers Content */}
        {activeTab === "headers" && (
          <div className="flex flex-col gap-2">
            {headers.map((header) => (
              <div key={header.id} className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  checked={header.enabled}
                  onChange={(e) => updateHeader(header.id, "enabled", e.target.checked)}
                  className="w-4 h-4 accent-blue-500"
                />
                <input
                  type="text"
                  value={header.key}
                  onChange={(e) => updateHeader(header.id, "key", e.target.value)}
                  placeholder="Header name"
                  className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => updateHeader(header.id, "value", e.target.value)}
                  placeholder="Header value"
                  className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeHeader(header.id)}
                  className="text-red-400 hover:text-red-300 px-2"
                >
                  x
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addHeader}
              className="text-blue-400 hover:text-blue-300 text-sm text-left"
            >
              + Add Header
            </button>
          </div>
        )}

        {/* Body Content */}
        {activeTab === "body" && (
          <div className="flex flex-col gap-2">
            <label className="text-slate-400 text-sm">Request Body (JSON)</label>
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{"key": "value"}'
              rows={4}
              className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        )}

        {/* Params Content - query string editor, mirrors the URL bar */}
        {activeTab === "params" && (
          <div className="flex flex-col gap-2">
            {params.length === 0 && (
              <p className="text-slate-500 text-sm">
                No query parameters yet - add pairs below, or type a{" "}
                <code className="text-slate-400">?key=value</code> query
                directly into the URL.
              </p>
            )}
            {params.map((param) => (
              <div key={param.id} className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  checked={param.enabled}
                  onChange={(e) =>
                    updateParam(param.id, "enabled", e.target.checked)
                  }
                  className="w-4 h-4 accent-blue-500"
                />
                <input
                  type="text"
                  value={param.key}
                  onChange={(e) => updateParam(param.id, "key", e.target.value)}
                  placeholder="Parameter name"
                  className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  value={param.value}
                  onChange={(e) =>
                    updateParam(param.id, "value", e.target.value)
                  }
                  placeholder="Value"
                  className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeParam(param.id)}
                  className="text-red-400 hover:text-red-300 px-2"
                >
                  x
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addParam}
              className="text-blue-400 hover:text-blue-300 text-sm text-left"
            >
              + Add Param
            </button>
            <p className="text-slate-600 text-xs">
              Enabled parameters are appended to the URL when the request is
              sent.
            </p>
          </div>
        )}
      </div>
    </form>
  );
}
