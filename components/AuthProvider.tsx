"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut, useSession } from "next-auth/react";

export type SubscriptionTier = "free" | "basic" | "premium" | "ultimate";

export interface Profile {
  id: string;
  email: string;
  name: string;
  tier: SubscriptionTier;
  credits: number;
  daily_reset_at: string;
  role: "user" | "admin";
  country?: string;
  last_login_at?: string;
  last_login_ip?: string;
  last_login_country?: string;
  created_at: string;
}

interface AuthContextValue {
  user: { id: string; email: string; name: string; tier: string; credits: number } | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  deductLocalCredits: (daily_used?: number, credits?: number) => void;
  syncProfileFromApi: (fields: { credits?: number }) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    const fallback = async () => ({ error: "AuthProvider not mounted" });
    return { user: null, profile: null, loading: false, signUp: fallback, signIn: fallback, signOut: async () => {}, resetPassword: fallback, updatePassword: fallback, signInWithGoogle: async () => {}, refreshProfile: async () => {}, deductLocalCredits: () => {}, syncProfileFromApi: () => {} } satisfies AuthContextValue;
  }
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isDevMock = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true";
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState<Profile | null>(isDevMock ? {
    id: "dev-001", email: "dev@test.local", name: "Dev Tester",
    tier: "free", credits: 10, daily_reset_at: new Date().toISOString(),
    role: "admin", created_at: new Date().toISOString(),
  } : null);

  const loading = !isDevMock && status === "loading";

  const user = isDevMock ? { id: "dev-001", email: "dev@test.local", name: "Dev Tester", tier: "free", credits: 10 } :
    session?.user ? { id: (session.user as any).id, email: session.user.email!, name: session.user.name || "", tier: (session.user as any).tier || "free", credits: (session.user as any).credits || 10 } : null;

  const fetchProfile = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch(`/api/profile?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch {}
  }, [session]);

  // Fetch profile when session loads
  useEffect(() => {
    if (session?.user && !isDevMock) fetchProfile();
  }, [session, isDevMock, fetchProfile]);

  // Inactivity timeout — 2 hours
  useEffect(() => {
    if (!user || isDevMock) return;
    const TIMEOUT_MS = 2 * 60 * 60 * 1000;
    let timer: ReturnType<typeof setTimeout>;
    const resetTimer = () => { clearTimeout(timer); timer = setTimeout(() => nextAuthSignOut(), TIMEOUT_MS); };
    ["mousedown", "keydown", "touchstart", "scroll"].forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => { clearTimeout(timer); ["mousedown", "keydown", "touchstart", "scroll"].forEach((e) => window.removeEventListener(e, resetTimer)); };
  }, [user, isDevMock]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "Registration failed" };
      // Auto-login after signup
      const result = await nextAuthSignIn("credentials", { email, password, redirect: false });
      if (result?.error) return { error: result.error };
      return { error: null };
    } catch {
      return { error: "Network error" };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const result = await nextAuthSignIn("credentials", { email, password, redirect: false });
      if (result?.error) return { error: "Invalid email or password" };
      window.location.href = "/";
      return { error: null };
    } catch {
      return { error: "Network error" };
    }
  }, []);

  const signOut = useCallback(async () => {
    await nextAuthSignOut({ redirect: false });
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) return { error: "Failed to send reset email" };
      return { error: null };
    } catch {
      return { error: "Network error" };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) return { error: "Failed to update password" };
      return { error: null };
    } catch {
      return { error: "Network error" };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await nextAuthSignIn("google");
  }, []);

  const refreshProfile = useCallback(async () => { await fetchProfile(); }, [fetchProfile]);

  const deductLocalCredits = useCallback((_daily?: number, credits_delta?: number) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return { ...prev, credits: Math.max(0, (prev.credits || 0) + (credits_delta || 0)) };
    });
  }, []);

  const syncProfileFromApi = useCallback((fields: { credits?: number }) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return { ...prev, ...fields };
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, resetPassword, updatePassword, signInWithGoogle, refreshProfile, deductLocalCredits, syncProfileFromApi }}>
      {children}
    </AuthContext.Provider>
  );
}
