// ============================================================
// AUTH CLIENT - Better Auth (browser side)
// ============================================================
// Talks to the catch-all mounted at /api/auth/[...all] on the same
// origin, so no baseURL is needed. The client store is reactive
// (nano-store): signIn/signUp/signOut update `useSession()` for
// every subscribed component automatically.
// ============================================================

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();