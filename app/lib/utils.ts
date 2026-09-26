// ============================================================
// URL HELPERS - query string parsing / serialization
// ============================================================
// Used by the RequestBuilder Params tab (FRONTEND_PLAN.md 1.2).
//
// Both helpers work on the raw URL string instead of `new URL()` so a
// relative or half-typed URL can never throw, and serialization goes
// through the standard URLSearchParams API for correct encoding
// (spaces -> +, &, = escaped, etc.).
// ============================================================

import type { QueryParam } from "./types";

/** Split a URL into base (no query, no hash), query string, and hash. */
function splitUrl(rawUrl: string): {
  base: string;
  query: string;
  hash: string;
} {
  const hashStart = rawUrl.indexOf("#");
  const hash = hashStart === -1 ? "" : rawUrl.slice(hashStart);
  const withoutHash = hashStart === -1 ? rawUrl : rawUrl.slice(0, hashStart);

  const queryStart = withoutHash.indexOf("?");
  if (queryStart === -1) {
    return { base: withoutHash, query: "", hash };
  }
  return {
    base: withoutHash.slice(0, queryStart),
    query: withoutHash.slice(queryStart + 1),
    hash,
  };
}

/**
 * Parse the query string of a URL into Params-tab rows.
 * Returns [] when the URL has no query (or an empty one).
 */
export function parseQueryParams(rawUrl: string): QueryParam[] {
  const { query } = splitUrl(rawUrl);
  if (query === "") return [];

  return Array.from(new URLSearchParams(query).entries()).map(
    ([key, value], index) => ({
      // Deterministic ids: while the user types in the URL bar the rows
      // are re-parsed on every keystroke, and stable keys let React reuse
      // the same DOM nodes (a remount mid-click would swallow the click).
      id: `qp-${index}-${key}`,
      key,
      value,
      enabled: true,
    })
  );
}

/**
 * Return `rawUrl` with its query string replaced by the enabled,
 * non-empty params: the plan's `?key=value&key2=value2` append.
 *
 * Replacing (rather than blindly appending) is what keeps the history
 * round-trip safe: a sent URL already contains its query string, so
 * reloading it and re-sending must not produce `?a=1?a=1`.
 * Duplicate keys between rows are preserved (URLSearchParams.append).
 */
export function buildUrlWithParams(rawUrl: string, params: QueryParam[]): string {
  const { base, hash } = splitUrl(rawUrl);

  const search = new URLSearchParams();
  for (const param of params) {
    if (param.enabled && param.key.trim() !== "") {
      search.append(param.key, param.value);
    }
  }

  const query = search.toString();
  return query ? `${base}?${query}${hash}` : `${base}${hash}`;
}