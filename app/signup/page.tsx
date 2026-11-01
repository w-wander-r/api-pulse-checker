// ============================================================
// SIGN UP PAGE - email + password, no verification (Better Auth)
// ============================================================
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "../lib/auth-client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // autoSignIn (default): the new account is signed in immediately.
    // No verification email - requireEmailVerification is off in lib/auth.ts.
    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError.message ?? "Sign up failed. Please try again.");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center mb-6">
          <h1 className="text-xl font-bold text-white tracking-tight">
            API Pulse Check
          </h1>
        </Link>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-1">Create account</h2>
          <p className="text-slate-400 text-sm mb-5">
            Save your request history to your account - no verification email.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="bg-red-950 border border-red-800 text-red-300 text-sm rounded px-3 py-2"
              >
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm text-slate-300 mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm text-slate-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm text-slate-300 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded px-3 py-2 transition-colors"
            >
              {isSubmitting ? "Creating account…" : "Sign up"}
            </button>
          </form>

          <p className="text-sm text-slate-400 mt-4 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}