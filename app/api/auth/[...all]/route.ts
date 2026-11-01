// ============================================================
// API ROUTE - /api/auth/[...all] (Better Auth catch-all)
// ============================================================
// Mounts every Better Auth endpoint under /api/auth/* :
//   POST /api/auth/sign-up/email
//   POST /api/auth/sign-in/email
//   POST /api/auth/sign-out
//   GET  /api/auth/get-session
//   ...
// Config lives in app/lib/auth.ts.
// ============================================================

import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "../../../lib/auth";

export const runtime = "nodejs";

export const { GET, POST } = toNextJsHandler(auth);