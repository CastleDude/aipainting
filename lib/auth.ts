import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import pool from "@/lib/db";
import type { Provider } from "next-auth/providers";

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const { email, password } = credentials as { email: string; password: string };
      if (!email || !password) return null;

      const { rows } = await pool.query(
        "SELECT id, name, email, password_hash, tier, credits FROM profiles WHERE email = $1",
        [email.toLowerCase()],
      );
      const user = rows[0];
      if (!user || !user.password_hash) return null;

      const valid = await compare(password, user.password_hash);
      if (!valid) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        tier: user.tier || "free",
        credits: user.credits || 10,
      };
    },
  }),
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tier = (user as any).tier || "free";
        token.credits = (user as any).credits || 10;
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
