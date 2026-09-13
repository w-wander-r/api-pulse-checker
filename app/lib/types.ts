/** HTTP methods we support in our API client */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/** A single header key-value pair */
export interface Header {
  id: string;        // Unique ID for React list rendering
  key: string;       // Header name (e.g., "Content-Type")
  value: string;     // Header value (e.g., "application/json")
  enabled: boolean;  // Toggle to include/exclude this header
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

/** A saved request in history */
export interface HistoryItem {
  id: string;
  method: HttpMethod;
  url: string;
  timestamp: Date;
  status?: number;       // Status code from the response (if sent)
}
