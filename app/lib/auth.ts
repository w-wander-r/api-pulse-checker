// ============================================================
// BETTER AUTH - server instance
// ============================================================
// Email + password authentication (no email verification for now),
// backed by the SAME PostgreSQL pool the rest of the app uses
// (kysely drives `pool` under the hood - see Better Auth's
// PostgreSQL adapter docs).
//
// Tables created by Better Auth: "user", "session", "account",
// "verification" (see db/schema.sql).
//
// Requires in .env.local (never commit secrets):
//   BETTER_AUTH_SECRET=<openssl rand -base64 32>
//   BETTER_AUTH_URL=http://localhost:3000
//
// Session checks happen INSIDE route handlers via
// `getSessionFromHeaders(request.headers)` - never rely on
// middleware/proxy alone for authorization (CVE-2025-29927).
// ============================================================

import { betterAuth } from "better-auth";
import { pool } from "./db";

export const auth = betterAuth({
  // Reuse the app's existing pg pool (small, cached on globalThis).
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  // Required for cookie-based sessions & CSRF protection.
  // Set to your deployed URL (Vercel, Netlify, etc.).
  origin: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    // Accounts activate immediately - no verification email for now.
    // Flip to true later once an email provider is wired up.
    requireEmailVerification: false,
    // Better Auth default is 8; passwords are hashed (scrypt) by the
    // framework, never stored or logged by this app.
    minPasswordLength: 8,
  },
});

/** The session shape returned by Better Auth (user + session rows). */
export type AuthSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

/**
 * Resolve the current session from incoming request headers.
 *
 * Safe for route handlers: returns `null` when the session cookie is
 * missing/invalid (or the lookup fails), so callers can answer 401
 * instead of letting an internal error leak as a 500.
 */
export async function getSessionFromHeaders(
  headers: Headers
): Promise<AuthSession | null> {
  try {
    return await auth.api.getSession({ headers });
  } catch {
    return null;
  }
}