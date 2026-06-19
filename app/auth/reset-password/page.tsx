"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "success" | "error">("loading");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("error"); setError("Missing reset token."); return; }
    setStatus("ready");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/auth/reset-password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    if (res.ok) {
      setStatus("success");
      setTimeout(() => router.push("/"), 2000);
    } else {
      const data = await res.json().catch(() => ({ error: "Failed" }));
      setError(data.error || "Failed to reset password");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/50 bg-bg-card p-8 shadow-2xl text-center">
        {status === "loading" && <div className="py-8"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>}

        {status === "error" && (
          <div className="py-8">
            <h2 className="text-lg font-bold text-white mb-1">Link Expired</h2>
            <p className="text-sm text-text-secondary mb-4">{error}</p>
            <button onClick={() => router.push("/")} className="rounded-xl bg-accent px-6 py-2 text-sm font-semibold text-white">Back to Home</button>
          </div>
        )}

        {status === "success" && (
          <div className="py-8">
            <h2 className="text-lg font-bold text-white mb-1">Password Updated</h2>
            <p className="text-sm text-text-secondary">Redirecting to home page...</p>
          </div>
        )}

        {status === "ready" && (
          <>
            <h2 className="text-lg font-bold text-white mb-1">Set New Password</h2>
            <p className="mb-6 text-sm text-text-secondary">Enter your new password below.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (min 6 characters)"
                className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm text-text-primary outline-none focus:border-accent/50"
                autoFocus />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button type="submit" disabled={submitting}
                className="w-full rounded-xl bg-accent py-3 font-semibold text-white disabled:opacity-50">
                {submitting ? "..." : "Set New Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
