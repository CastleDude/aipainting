"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token");
  const [showPass, setShowPass] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "success" | "error">("loading");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const token = urlToken || manualToken;

  useEffect(() => {
    if (urlToken) { setStatus("ready"); return; }
    // No token in URL — show manual input form
    setStatus("error");
  }, [urlToken]);

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.length < 10) { setError("Please paste a valid reset token from your email."); return; }
    setError("");
    setStatus("ready");
  };

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
            <h2 className="text-lg font-bold text-white mb-1">Reset Password</h2>
            <p className="text-sm text-text-secondary mb-4">Paste the reset token from your email:</p>
            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <textarea
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value.trim())}
                placeholder="Paste the full token from the email link here..."
                rows={3}
                className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50 resize-none"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button type="submit" className="w-full rounded-xl bg-accent py-3 font-semibold text-white">
                Continue
              </button>
            </form>
            <p className="mt-3 text-[11px] text-text-muted">
              Token is the long code after <code className="text-text-secondary bg-bg-secondary px-1 rounded">?token=</code> in the reset link from your email.
            </p>
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
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (min 6 characters)"
                  className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 pr-10 text-sm text-text-primary outline-none focus:border-accent/50"
                  autoFocus />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary cursor-pointer" tabIndex={-1}>
                  {showPass ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
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
