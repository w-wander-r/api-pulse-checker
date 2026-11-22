// ============================================================
// API ROUTE - POST /api/proxy
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { lookup } from "node:dns";
import { promisify } from "node:util";
import type { ProxyRequest, ProxyResponse } from "../../lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dnsLookup = promisify(lookup);

// Only http(s) targets are allowed.
const ALLOWED_PROTOCOLS = ["http:", "https:"];

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** True when an IPv4 address is private/loopback/link-local/reserved. */
function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return false;
  const [a, b] = parts as [number, number];
  return (
    a === 0 || // "this network"
    a === 10 || // RFC 1918
    a === 127 || // loopback
    (a === 169 && b === 254) || // link-local
    (a === 172 && b >= 16 && b <= 31) || // RFC 1918
    (a === 192 && b === 168) // RFC 1918
  );
}

/** True when an IPv6 address is loopback/link-local/unique-local. */
function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  return (
    lower === "::1" ||
    lower.startsWith("fe80:") || // link-local
    lower.startsWith("fc00:") || // unique-local (RFC 4193)
    lower.startsWith("fd00:")
  );
}

function isPrivateIp(ip: string): boolean {
  if (ip.startsWith("[") && ip.endsWith("]")) {
    return isPrivateIpv6(ip.slice(1, -1));
  }
  return isPrivateIpv4(ip) || isPrivateIpv6(ip);
}

/**
 * SSRF guard: reject targets that point at private/loopback/link-local
 * addresses. Resolves the hostname and checks every returned address so
 * a single public IP can't be used to DNS-rebind to an internal host.
 */
async function isUrlAllowed(urlString: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return { allowed: false, reason: "Invalid URL" };
  }

  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    return {
      allowed: false,
      reason: `Protocol "${url.protocol}" is not allowed`,
    };
  }

  if (isPrivateIp(url.hostname)) {
    return {
      allowed: false,
      reason: "Private or local addresses are not allowed",
    };
  }

  try {
    const resolved = await dnsLookup(url.hostname, { all: true });
    const addresses = Array.isArray(resolved) ? resolved : [resolved];
    for (const { address } of addresses) {
      if (isPrivateIp(address)) {
        return {
          allowed: false,
          reason: "Hostname resolves to a private or local address",
        };
      }
    }
  } catch {
    // DNS resolution failure - let the upstream fetch surface its own error.
  }

  return { allowed: true };
}

// ---- POST: forward the request to the target URL server-side ----
export async function POST(request: NextRequest) {
  let payload: ProxyRequest;
  try {
    payload = (await request.json()) as ProxyRequest;
  } catch {
    return errorResponse("Request body must be valid JSON", 400);
  }

  const { method, url, headers, body, bodyBase64, isBase64 } = payload;

  if (!url || typeof url !== "string" || url.trim() === "") {
    return errorResponse('"url" is required', 400);
  }

  const allowed = await isUrlAllowed(url);
  if (!allowed.allowed) {
    return errorResponse(allowed.reason ?? "URL not allowed", 403);
  }

  // Reconstruct the body. Binary File/Blob bodies arrive base64-encoded.
  let outgoingBody: BodyInit | undefined;
  if (isBase64 && typeof bodyBase64 === "string") {
    outgoingBody = Buffer.from(bodyBase64, "base64");
  } else if (typeof body === "string") {
    outgoingBody = body;
  }

  // GET/HEAD must not carry a body.
  if (method === "GET" || method === "HEAD") {
    outgoingBody = undefined;
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: outgoingBody,
      // Redirects are followed by default; the final response is returned.
    });

    const responseBody = await res.text();
    const responseHeaders: Record<string, string> = Object.fromEntries(
      res.headers
    );

    const proxyResponse: ProxyResponse = {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
      body: responseBody,
    };

    return NextResponse.json(proxyResponse);
  } catch (error) {
    console.error("[api/proxy] fetch failed:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch URL",
      502
    );
  }
}