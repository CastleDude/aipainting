"use client";

import { createBrowserClient } from "@supabase/ssr";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { User } from "@supabase/supabase-js";

export type SubscriptionTier = "free" | "basic" | "premium" | "ultimate";

export interface Profile {
  id: string;
  email: string;
  name: string;
  tier: SubscriptionTier;
  credits: number;
  daily_reset_at: string;
  role: "user" | "admin";
  created_at: string;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  deductLocalCredits: (daily_used?: number, credits?: number) => void;
  syncProfileFromApi: (fields: { daily_used?: number; credits?: number; tools_daily_used?: number }) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      profile: null,
      loading: false,
      signUp: async () => ({ error: "AuthProvider not mounted", needsConfirmation: false }),
      signIn: async () => ({ error: "AuthProvider not mounted" }),
      signOut: async () => {},
      resetPassword: async () => ({ error: "AuthProvider not mounted" }),
      updatePassword: async () => ({ error: "AuthProvider not mounted" }),
      signInWithGoogle: async () => {},
      refreshProfile: async () => {},
      deductLocalCredits: () => {},
      syncProfileFromApi: () => {},
    } satisfies AuthContextValue;
  }
  return ctx;
}

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Dev mock mode — skips Supabase auth for testing UI (development only)
  const isDevMock =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true";

  function readMockCookie(name: string): number {
    if (typeof document === "undefined") return 0;
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return parseInt(match?.[1] || "0", 10) || 0;
  }

  function buildMockProfile(): Profile {
    return {
      id: "dev-001", email: "dev@test.local", name: "Dev Tester",
      tier: "free", credits: readMockCookie("mock_credits") || 10,
      daily_reset_at: new Date().toISOString(),
      role: "admin", created_at: new Date().toISOString(),
    };
  }

  const MOCK_USER = { id: "dev-001", email: "dev@test.local" } as User;

  const [user, setUser] = useState<User | null>(isDevMock ? MOCK_USER : null);
  const [profile, setProfile] = useState<Profile | null>(isDevMock ? buildMockProfile() : null);
  const [loading, setLoading] = useState(!isDevMock);

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data as Profile);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    if (isDevMock) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Initial session with timeout (auth API may be slow)
    const timeoutId = setTimeout(() => setLoading(false), 5000);
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeoutId);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      }
      setLoading(false);
    }).catch(() => {
      clearTimeout(timeoutId);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${location.origin}/api/auth`,
        },
      });

      if (error) return { error: error.message, needsConfirmation: false };

      const needsConfirmation = !data.session; // no session = email confirmation required

      if (data.user) {
        setUser(data.user);
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: data.user.email!,
          name,
          tier: "free",
          credits: 10,
          role: "user",
        });
        if (!needsConfirmation) {
          await fetchProfile(data.user.id);
        }
      }

      return { error: null, needsConfirmation };
    },
    [fetchProfile],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      return { error: null };
    },
    [],
  );

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback`,
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/api/auth`,
      },
    });
  }, []);

  const deductLocalCredits = useCallback(
    (daily_used_inc?: number, credits_delta?: number) => {
      setProfile((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        if (credits_delta !== undefined) {
          next.credits = Math.max(0, (prev.credits || 0) + credits_delta);
        }
        return next;
      });
    },
    [],
  );

  const syncProfileFromApi = useCallback(
    (fields: { credits?: number }) => {
      setProfile((prev) => {
        if (!prev) return prev;
        return { ...prev, ...fields };
      });
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        signInWithGoogle,
        refreshProfile,
        deductLocalCredits,
        syncProfileFromApi,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
