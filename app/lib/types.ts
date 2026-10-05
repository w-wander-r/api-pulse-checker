/** HTTP methods we support in our API client */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/** A single header key-value pair */
export interface Header {
  id: string;        // Unique ID for React list rendering
  key: string;       // Header name (e.g., "Content-Type")
  value: string;     // Header value (e.g., "application/json")
  enabled: boolean;  // Toggle to include/exclude this header
}

/** A single URL query parameter edited in the Params tab */
export interface QueryParam {
  id: string;        // Unique ID for React list rendering
  key: string;       // Parameter name (e.g., "page")
  value: string;     // Parameter value (e.g., "2")
  enabled: boolean;  // Toggle to include/exclude this parameter
}

/** A key-value row in the form-data / x-www-form-urlencoded editors */
export interface FormField {
  id: string;        // Unique ID for React list rendering
  key: string;       // Field name (e.g., "username")
  value: string;     // Field value (e.g., "wander")
  enabled: boolean;  // Toggle to include/exclude this field
}

/** Which editor the Body tab shows / how the body is serialized (plan 1.4) */
export type RequestBodyType =
  | "none"
  | "json"
  | "form-data"
  | "x-www-form-urlencoded"
  | "raw"
  | "binary";

/** Authentication scheme selected in the Auth tab (plan 2.1) */
export type AuthType = "none" | "bearer" | "basic" | "api-key";

/**
 * Credentials edited in the Auth tab (plan 2.1).
 * Kept as one object so the tab can patch a single field without a setter
 * per field; `type` decides which fields apply.
 */
export interface AuthConfig {
  type: AuthType;
  token: string;       // Bearer token -> "Authorization: Bearer <token>"
  username: string;    // Basic auth   -> "Authorization: Basic base64(...)"
  password: string;    // Basic auth
  apiKeyName: string;  // API key header name (e.g. "X-API-Key")
  apiKeyValue: string; // API key header value
}

/** Represents an API request that the user is building */
export interface ApiRequest {
  method: HttpMethod;
  url: string;
  headers: Header[];
  body: string;      // Raw body text
}

/** Represents the response we get back from an API */
export interface ApiResponse {
  status: number;        // HTTP status code (200, 404, 500, etc.)
  statusText: string;    // Human-readable status ("OK", "Not Found")
  headers: Record<string, string>;  // Response headers
  body: string;          // Response body as text
  time: number;          // How long the request took (in milliseconds)
  size: number;          // Response size in bytes
}

/** A single header key-value pair as persisted in the database (JSONB) */
export interface StoredHeader {
  key: string;
  value: string;
}

/**
 * Row shape of the `request_history` table.
 * Note: PostgreSQL returns BIGSERIAL ids and TIMESTAMPTZ as strings.
 */
export interface RequestHistoryRow {
  id: string;                       // BIGSERIAL (returned as a string by pg)
  method: HttpMethod;
  url: string;
  headers: StoredHeader[] | null;   // Headers that were sent
  body: string | null;              // Raw request body (null for GET, etc.)
  status: number | null;            // Response status code (null if network error)
  duration_ms: number | null;       // How long the request took
  response_size: number | null;     // Response size in bytes
  created_at: string;               // ISO timestamp
}

/** Payload accepted by `POST /api/history` */
export interface CreateHistoryInput {
  method: HttpMethod;
  url: string;
  headers?: Header[];
  body?: string;
  status?: number | null;
  durationMs?: number | null;
  responseSize?: number | null;
}

/** Response body of `GET /api/history` */
export interface HistoryListResponse {
  items: RequestHistoryRow[];
}

/** Response body of `GET /api/db/health` */
export interface DbHealthResponse {
  connected: boolean;
  message: string;
  version?: string;
  database?: string;
  latencyMs?: number;
}

/** A saved request in history */
export interface HistoryItem {
  id: string;
  method: HttpMethod;
  url: string;
  timestamp: Date;
  status?: number;       // Status code from the response (if sent)
  /** Headers that were actually sent (from the DB JSONB column). */
  headers?: StoredHeader[];
  /** Raw request body that was sent (undefined for GET / empty bodies). */
  body?: string;
}
