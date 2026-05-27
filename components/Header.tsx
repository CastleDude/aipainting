"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { LoginModal } from "./LoginModal";
import { useAuth } from "@/components/AuthProvider";
import { TIER_CONFIG } from "@/lib/credits";

interface HeaderProps {
  locale?: string;
  messages: {
    home: string;
    generate: string;
    pricing: string;
    image_tools: string;
    gallery: string;
    history: string;
    dashboard: string;
    upgrade: string;
    admin: string;
    login: string;
    signup: string;
    logout: string;
    free_remaining: string;
    credits_remaining: string;
  };
  loginModalMessages?: {
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

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active: boolean }) {
  return (
    <a
      href={href}
      className={cn(
        "group relative rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300",
        active
          ? "bg-accent/10"
          : "hover:bg-accent/10"
      )}
    >
      <span className={cn(
        active
          ? "bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent"
          : "group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-blue-500 group-hover:bg-clip-text group-hover:text-transparent"
      )}>
        {children}
      </span>
    </a>
  );
}

export function Header({ locale, messages, loginModalMessages }: HeaderProps) {
  const pathname = usePathname();
  const route = pathname.replace(/^\/(en|zh|zh-Hant|ja|ko)/, "") || "/";
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "signup">("login");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  useEffect(() => {
    function onOpen(e: Event) {
      const { mode } = (e as CustomEvent).detail || {};
      setModalMode(mode === "signup" ? "signup" : "login");
      setModalOpen(true);
    }
    window.addEventListener("open-login-modal", onOpen);
    return () => window.removeEventListener("open-login-modal", onOpen);
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut();
    setMenuOpen(false);
    router.push("/");
  }, [signOut, router]);

  const localePath = `/${locale || "en"}`;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/80 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a
            href={localePath}
            className="flex items-center gap-2 text-xl font-bold tracking-tight"
          >
            <img
              src="/images/aipaintinglogo.jpg"
              alt="AI Painting"
              className="h-8 w-8 rounded-full object-cover"
            />
            <span className="hidden sm:block bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">AI Painting</span>
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink href={localePath} active={route === "/"}>
              {messages.generate}
            </NavLink>
            <NavLink href={`${localePath}/image-tools`} active={route === "/image-tools"}>
              {messages.image_tools}
            </NavLink>
            <NavLink href={`${localePath}/gallery`} active={route === "/gallery"}>
              {messages.gallery}
            </NavLink>
            <NavLink href={`${localePath}/pricing`} active={route === "/pricing"}>
              {messages.pricing}
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            {locale && <LocaleSwitcher locale={locale} />}

            {user && profile && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-bg-card border border-border/50 px-2.5 py-1 text-xs text-text-secondary">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {profile.tier === "free"
                    ? messages.free_remaining.replace("[[COUNT]]", String(Math.max(0, TIER_CONFIG.free.dailyCredits - profile.daily_used)))
                    : messages.credits_remaining.replace("[[COUNT]]", String(profile.credits))
                  }
                </span>
              )}

            {loading ? (
              <div className="flex h-9 w-16 items-center justify-center rounded-lg bg-accent/10">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </div>
            ) : user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-text-primary hover:bg-bg-card-hover transition-colors cursor-pointer"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                    {(profile?.name || user.email || "U").charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {profile?.name || user.email?.split("@")[0]}
                  </span>
                  <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border/50 bg-bg-card shadow-xl py-1 z-50">
                    <div className="px-4 py-2 border-b border-border/50">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {profile?.name || user.email?.split("@")[0]}
                      </p>
                      <p className="text-xs text-text-muted truncate">{user.email}</p>
                    </div>

                    <a
                      href={`${localePath}/dashboard`}
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card-hover transition-colors"
                    >
                      {messages.dashboard}
                    </a>

                    {profile?.tier === "free" && (
                      <a
                        href={`${localePath}/pricing`}
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-accent hover:text-accent-hover hover:bg-bg-card-hover transition-colors"
                      >
                        {messages.upgrade}
                      </a>
                    )}

                    <a
                      href={`${localePath}/history`}
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card-hover transition-colors"
                    >
                      {messages.history}
                    </a>

                    {profile?.role === "admin" && (
                      <a
                        href={`${localePath}/admin`}
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-purple-400 hover:text-purple-300 hover:bg-bg-card-hover transition-colors"
                      >
                        {messages.admin}
                      </a>
                    )}

                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-text-muted hover:text-text-secondary hover:bg-bg-card-hover transition-colors cursor-pointer"
                    >
                      {messages.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => setModalOpen(true)}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-all hover:bg-accent-hover hover:glow-accent cursor-pointer"
                >
                  {messages.login}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {loginModalMessages && (
        <LoginModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          initialMode={modalMode}
          messages={loginModalMessages}
        />
      )}
    </>
  );
}
