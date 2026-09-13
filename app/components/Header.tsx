// ============================================================
// HEADER COMPONENT - The top navigation bar
// ============================================================
"use client";

import Link from "next/link";

export default function Header() {
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

      {/* Future navigation items will go here */}
      <nav className="flex items-center gap-4">
        <span className="text-slate-400 text-sm">
          Your API testing companion
        </span>
      </nav>
    </header>
  );
}
