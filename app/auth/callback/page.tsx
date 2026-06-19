"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "success">("loading");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Check if session already established
      const { data } = await supabase.auth.getSession();
      if (data.session && !cancelled) {
        setStatus("ready");
        return;
      }

      // Wait for auth state change
      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        if (cancelled) return;
        if (session) {
          setStatus("ready");
        } else if (event === "SIGNED_OUT") {
          setStatus("error");
          setError("Invalid or expired reset link.");
        }
      });

      const timeout = setTimeout(() => {
        if (!cancelled && status === "loading") {
          router.replace("/");
        }
      }, 5000);

      return () => {
        sub.subscription.unsubscribe();
        clearTimeout(timeout);
      };
    }

    init();
    return () => { cancelled = true; };
  }, [router, supabase]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }

      setSubmitting(true);
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        setSubmitting(false);
      } else {
        setStatus("success");
        setTimeout(() => router.replace("/"), 2000);
      }
    },
    [password, router, supabase],
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/50 bg-bg-card p-8 shadow-2xl text-center">
        {status === "loading" && (
          <div className="py-8">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="mt-4 text-sm text-text-secondary">Verifying your identity...</p>
          </div>
        )}

        {status === "error" && (
          <div className="py-8">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
              <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Link Expired</h2>
            <p className="text-sm text-text-secondary">{error}</p>
            <button
              onClick={() => router.replace("/")}
              className="mt-4 rounded-xl bg-accent px-6 py-2 text-sm font-semibold text-white hover:bg-accent-hover transition-colors"
            >
              Back to Home
            </button>
          </div>
        )}

        {status === "success" && (
          <div className="py-8">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
              <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Password Updated</h2>
            <p className="text-sm text-text-secondary">Redirecting to home page...</p>
          </div>
        )}

        {status === "ready" && (
          <>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
              <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Set New Password</h2>
            <p className="mb-6 text-sm text-text-secondary">Enter your new password below.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                  autoFocus
                />
              </div>

              {error && (
                <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-accent py-3 font-semibold text-white transition-all hover:bg-accent-hover hover:glow-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "..." : "Set New Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
