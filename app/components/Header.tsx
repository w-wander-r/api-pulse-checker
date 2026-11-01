// ============================================================
// HEADER COMPONENT - The top navigation bar
// ============================================================
"use client";

import Link from "next/link";
import { authClient } from "../lib/auth-client";

export default function Header() {
  // Reactive session (Better Auth): signIn/signOut update this
  // automatically for every component using the hook.
  const { data: session, isPending } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  return (
    // The header bar at the top of the application
    <header className="bg-slate-900 border-b border-slate-700 px-6 py-3 flex items-center justify-between">
      {/* App Logo/Title */}
      <div className="flex items-center gap-3">
        {/* TODO: create img */}
        {/* <span className="text-2xl"></span> */}
        <Link href="/">
          <h1 className="text-xl font-bold text-white tracking-tight">
            API Pulse Check
          </h1>
        </Link>
      </div>

      {/* Nav + account state */}
      <nav className="flex items-center gap-4">
        <span className="text-slate-400 text-sm hidden sm:inline">
          Your API testing companion
        </span>

        {isPending ? (
          // Session check in flight - keep the layout stable.
          <span className="w-24 h-7 rounded bg-slate-800 animate-pulse" />
        ) : session ? (
          <div className="flex items-center gap-3">
            <span
              className="text-slate-300 text-sm truncate max-w-[14rem]"
              title={session.user.email}
            >
              {session.user.name || session.user.email}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded px-3 py-1 transition-colors"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm text-slate-300 hover:text-white transition-colors px-2 py-1"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-blue-600 hover:bg-blue-500 text-white rounded px-3 py-1 transition-colors"
            >
              Sign up
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
