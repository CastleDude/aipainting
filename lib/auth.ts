import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import pool from "@/lib/db";
import type { Provider } from "next-auth/providers";

const providers: Provider[] = [
  Google({
    clientId: process.env.AUTH_GOOGLE_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET,
  }),
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const { email, password } = credentials as { email: string; password: string };
      if (!email || !password) { console.error("[auth] missing email or password"); return null; }

      try {
        const { rows } = await pool.query(
          "SELECT id, name, email, password_hash, tier, credits FROM profiles WHERE email = $1",
          [email.toLowerCase()],
        );
        const user = rows[0];
        if (!user) { console.error("[auth] user not found:", email.toLowerCase()); return null; }
        if (!user.password_hash) { console.error("[auth] user has no password_hash:", user.id); return null; }

        const valid = await compare(password, user.password_hash);
        if (!valid) { console.error("[auth] password mismatch for:", email.toLowerCase()); return null; }

        console.log("[auth] login success for:", email.toLowerCase());
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          tier: user.tier || "free",
          credits: user.credits || 10,
        };
      } catch (err) {
        console.error("[auth] authorize error:", err instanceof Error ? err.message : err);
        return null;
      }
    },
  }),
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  useSecureCookies: false,
  callbacks: {
    async signIn({ user, account }) {
      // Auto-create profile for OAuth users on first login
      if (account?.provider === "google" && user.email) {
        try {
          const existing = await pool.query("SELECT id FROM profiles WHERE email = $1", [user.email.toLowerCase()]);
          if (existing.rows.length === 0) {
            await pool.query(
              "INSERT INTO profiles (id, email, name, tier, credits) VALUES (gen_random_uuid(), $1, $2, 'free', 10) RETURNING id",
              [user.email.toLowerCase(), user.name || user.email.split("@")[0]],
            );
          }
        } catch (e) {
          console.error("[auth] OAuth profile creation error:", e instanceof Error ? e.message : e);
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.tier = (user as any).tier || "free";
        token.credits = (user as any).credits || 10;
      }
      // For OAuth login, fetch tier/credits from DB (user object may not have them)
      if (account?.provider === "google" && token.email) {
        const { rows } = await pool.query(
          "SELECT id, tier, credits FROM profiles WHERE email = $1",
          [token.email.toLowerCase()],
        );
        if (rows[0]) {
          token.id = rows[0].id;
          token.tier = rows[0].tier || "free";
          token.credits = rows[0].credits || 10;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).tier = token.tier;
        (session.user as any).credits = token.credits;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
});
