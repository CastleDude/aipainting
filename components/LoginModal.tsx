"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { createBrowserClient } from "@supabase/ssr";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
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
    close: string;
  };
}

export function LoginModal({ open, onClose, initialMode, messages }: LoginModalProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot_password">(initialMode || "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifySent, setVerifySent] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const { signIn, signUp, resetPassword, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (open) {
      setMode(initialMode || "login");
      setName("");
      setEmail("");
      setPassword("");
      setError(null);
      setSubmitting(false);
      setSuccess(false);
      setVerifyEmail("");
      setVerifySent(false);
      setResetSent(false);
    }
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // Focus name field when switching to signup, email for forgot_password
  useEffect(() => {
    if (open && mode === "signup" && nameRef.current) {
      nameRef.current.focus();
    }
    if (open && mode === "forgot_password" && emailRef.current) {
      emailRef.current.focus();
    }
  }, [open, mode]);

  const onBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const resendVerification = useCallback(async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    setSubmitting(true);
    await supabase.auth.resend({ type: "signup", email: verifyEmail });
    setVerifySent(true);
    setSubmitting(false);
  }, [verifyEmail]);

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
          setSubmitting(false);
        } else {
          setResetSent(true);
          setSubmitting(false);
        }
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
          setSubmitting(false);
        } else {
          setSuccess(true);
          setTimeout(() => onClose(), 2000);
        }
      } else {
        const result = await signIn(email, password);
        if (result.error) {
          setError(result.error);
          setSubmitting(false);
        } else {
          onClose();
        }
      }
    },
    [email, password, name, mode, signIn, signUp, resetPassword, messages, onClose],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onBackdrop}
    >
      <div className="w-full max-w-md animate-in zoom-in-95 fade-in duration-200">
        <div className="relative rounded-2xl border border-border/50 bg-bg-card p-8 shadow-2xl">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-text-muted hover:text-text-primary hover:bg-bg-card-hover transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="mb-6 text-center">
            <img
              src="/images/aipaintinglogo.jpg"
              alt="AI Painting"
              className="mx-auto h-10 w-10 rounded-full object-cover"
            />
            <h2 className="mt-3 text-xl font-bold text-white">
              {mode === "forgot_password"
                ? messages.forgot_password_title
                : mode === "login"
                  ? messages.welcome_back
                  : messages.create_account}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {mode === "forgot_password"
                ? messages.forgot_password_desc
                : mode === "login"
                  ? messages.login_desc
                  : messages.signup_desc}
            </p>
          </div>

          {/* Mode tabs — hidden in forgot_password mode */}
          {mode !== "forgot_password" && (
            <div className="mb-6 flex rounded-xl border border-border bg-bg-secondary p-1">
              <button
                onClick={() => { setMode("login"); setError(null); }}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                  mode === "login"
                    ? "bg-accent text-white"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                {messages.login}
              </button>
              <button
                onClick={() => { setMode("signup"); setError(null); }}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                  mode === "signup"
                    ? "bg-accent text-white"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                {messages.signup}
              </button>
            </div>
          )}

          {/* Forgot password: reset sent confirmation */}
          {resetSent && mode === "forgot_password" ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-white font-semibold mb-1">{messages.reset_sent}</p>
              <p className="text-sm text-text-secondary">{messages.reset_sent_desc}</p>
              <button
                onClick={() => { setMode("login"); setResetSent(false); }}
                className="mt-4 text-sm text-accent hover:text-accent-hover transition-colors"
              >
                {messages.back_to_login}
              </button>
            </div>
          ) : /* Email verification notice after signup */
          verifyEmail ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-white font-semibold mb-1">{messages.verify_email_title}</p>
              <p className="text-sm text-text-secondary mb-1">
                {messages.verify_email_desc.replace("{email}", verifyEmail)}
              </p>
              {verifySent && (
                <p className="text-xs text-accent mt-2">{messages.verify_email_resent}</p>
              )}
              <button
                type="button"
                onClick={resendVerification}
                disabled={submitting}
                className="mt-4 w-full rounded-xl border border-accent/50 py-2.5 text-sm font-medium text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
              >
                {submitting ? "..." : messages.resend_verification}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 w-full text-center text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                {messages.close}
              </button>
            </div>
          ) : /* Success message after signup */
          success && mode === "signup" ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-semibold mb-1">{messages.success_signup}</p>
              <p className="text-sm text-text-secondary">{messages.signup_success_hint || "You can upgrade anytime from your account menu."}</p>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field — signup only */}
              {mode === "signup" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-secondary">{messages.name}</label>
                  <input
                    ref={nameRef}
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
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={messages.email_placeholder}
                  className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                />
              </div>

              {/* Password field — shown in login and signup modes */}
              {mode !== "forgot_password" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-secondary">{messages.password}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={messages.password_placeholder}
                    className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              )}

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
                {submitting
                  ? "…"
                  : mode === "forgot_password"
                  ? messages.send_reset_link
                  : mode === "login"
                    ? messages.login_btn
                    : messages.signup_btn}
              </button>

              {/* Google OAuth — login & signup modes */}
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

              {/* Forgot password link — login mode only */}
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => { setMode("forgot_password"); setError(null); }}
                  className="w-full text-center text-sm text-text-muted hover:text-accent transition-colors"
                >
                  {messages.forgot_password}
                </button>
              )}

              {/* Back to login — forgot_password mode */}
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

          <p className="mt-5 text-center text-xs text-text-muted">
            {messages.demo_notice}
          </p>
        </div>
      </div>
    </div>
  );
}
