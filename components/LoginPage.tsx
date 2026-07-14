"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

interface LoginPageProps {
  locale: string;
  messages: {
    login: string;
    signup: string;
    welcome_back: string;
    create_account: string;
    login_desc: string;
    signup_desc: string;
    name: string;
    name_placeholder: string;
    email: string;
    email_placeholder: string;
    password: string;
    password_placeholder: string;
    login_btn: string;
    signup_btn: string;
    demo_notice: string;
    error_generic: string;
    error_invalid_email: string;
    error_weak_password: string;
    error_network: string;
    success_signup: string;
    signup_success_hint: string;
    google_login: string;
    forgot_password: string;
    forgot_password_title: string;
    forgot_password_desc: string;
    send_reset_link: string;
    reset_sent: string;
    reset_sent_desc: string;
    back_to_login: string;
    verify_email_title: string;
    verify_email_desc: string;
    verify_email_resent: string;
    resend_verification: string;
  };
}

export function LoginPage({ locale, messages }: LoginPageProps) {
  const router = useRouter();
  const { user, signIn, signUp, resetPassword, signInWithGoogle } = useAuth();

  const [showPass, setShowPass] = useState(false);
  const [mode, setMode] = useState<"login" | "signup" | "forgot_password">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifySent, setVerifySent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Redirect if already logged in
  if (user) {
    router.replace(`/${locale}`);
    return null;
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSubmitting(true);

      if (mode === "forgot_password") {
        if (!email) {
          setError(messages.error_generic);
          setSubmitting(false);
          return;
        }
        const result = await resetPassword(email);
        if (result.error) {
          setError(result.error);
        } else {
          setResetSent(true);
        }
        setSubmitting(false);
        return;
      }

      if (!email || !password) {
        setError(messages.error_generic);
        setSubmitting(false);
        return;
      }

      if (mode === "signup") {
        if (password.length < 6) {
          setError(messages.error_weak_password);
          setSubmitting(false);
          return;
        }
        const result = await signUp(email, password, name || email.split("@")[0]);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess(true);
          setTimeout(() => router.push(`/${locale}`), 1500);
        }
        setSubmitting(false);
      } else {
        const result = await signIn(email, password);
        if (result.error) {
          setError(result.error);
        } else {
          router.push(`/${locale}`);
        }
        setSubmitting(false);
      }
    },
    [email, password, name, mode, signIn, signUp, resetPassword, messages, router, locale],
  );

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border/50 bg-bg-card p-8 shadow-lg">
          {/* Header */}
          <div className="mb-6 text-center">
            <img
              src="/images/aipaintinglogo.jpg"
              alt="AI Painting"
              className="mx-auto h-12 w-12 rounded-full object-cover"
            />
            <h1 className="mt-3 text-xl font-bold text-text-primary">
              {mode === "forgot_password"
                ? messages.forgot_password_title
                : mode === "login"
                  ? messages.welcome_back
                  : messages.create_account}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              {mode === "forgot_password"
                ? messages.forgot_password_desc
                : mode === "login"
                  ? messages.login_desc
                  : messages.signup_desc}
            </p>
          </div>

          {/* Mode tabs */}
          {mode !== "forgot_password" && (
            <div className="mb-6 flex rounded-xl border border-border bg-bg-secondary p-1">
              <button
                onClick={() => { setMode("login"); setError(null); }}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                  mode === "login" ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary",
                )}
              >
                {messages.login}
              </button>
              <button
                onClick={() => { setMode("signup"); setError(null); }}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                  mode === "signup" ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary",
                )}
              >
                {messages.signup}
              </button>
            </div>
          )}

          {/* Reset sent confirmation */}
          {resetSent && mode === "forgot_password" ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-text-primary font-semibold mb-1">{messages.reset_sent}</p>
              <p className="text-sm text-text-secondary">{messages.reset_sent_desc}</p>
              <button
                onClick={() => { setMode("login"); setResetSent(false); }}
                className="mt-4 text-sm text-accent hover:text-accent-hover transition-colors"
              >
                {messages.back_to_login}
              </button>
            </div>
          ) : verifyEmail ? (
            /* Email verification notice */
            <div className="text-center py-4">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-text-primary font-semibold mb-1">{messages.verify_email_title}</p>
              <p className="text-sm text-text-secondary mb-1">
                {messages.verify_email_desc.replace("{email}", verifyEmail)}
              </p>
              {verifySent && (
                <p className="text-xs text-accent mt-2">{messages.verify_email_resent}</p>
              )}
              <button
                type="button"
                onClick={async () => {
                  setSubmitting(true);
                  const { createBrowserClient } = await import("@supabase/ssr");
                  const supabase = createBrowserClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                  );
                  await supabase.auth.resend({ type: "signup", email: verifyEmail });
                  setVerifySent(true);
                  setSubmitting(false);
                }}
                disabled={submitting}
                className="mt-4 w-full rounded-xl border border-accent/50 py-2.5 text-sm font-medium text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
              >
                {submitting ? "..." : messages.resend_verification}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/${locale}`)}
                className="mt-2 w-full text-center text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                {messages.back_to_login}
              </button>
            </div>
          ) : success && mode === "signup" ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-text-primary font-semibold mb-1">{messages.success_signup}</p>
              <p className="text-sm text-text-secondary">{messages.signup_success_hint}</p>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-secondary">{messages.name}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={messages.name_placeholder}
                    className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">{messages.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={messages.email_placeholder}
                  className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                />
              </div>

              {mode !== "forgot_password" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-secondary">{messages.password}</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={messages.password_placeholder}
                      className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 pr-10 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary cursor-pointer" tabIndex={-1}>
                      {showPass ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-accent py-3 font-semibold text-white transition-all hover:bg-accent-hover disabled:opacity-50"
              >
                {submitting
                  ? "..."
                  : mode === "forgot_password"
                    ? messages.send_reset_link
                    : mode === "login"
                      ? messages.login_btn
                      : messages.signup_btn}
              </button>

              {/* Google OAuth */}
              {mode !== "forgot_password" && (
                <>
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-border/50" />
                    <span className="text-xs text-text-muted">or</span>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>
                  <button
                    type="button"
                    onClick={() => signInWithGoogle()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-bg-secondary py-2.5 text-sm font-medium text-text-primary hover:bg-bg-card-hover transition-colors"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {messages.google_login}
                  </button>
                </>
              )}

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => { setMode("forgot_password"); setError(null); }}
                  className="w-full text-center text-sm text-text-muted hover:text-accent transition-colors"
                >
                  {messages.forgot_password}
                </button>
              )}

              {mode === "forgot_password" && (
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(null); }}
                  className="w-full text-center text-sm text-accent hover:text-accent-hover transition-colors"
                >
                  {messages.back_to_login}
                </button>
              )}
            </form>
          )}

          <p className="mt-5 text-center text-xs text-text-muted">{messages.demo_notice}</p>
        </div>
      </div>
    </div>
  );
}
