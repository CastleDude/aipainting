import { auth } from "@/lib/auth";
import pool from "@/lib/db";

export async function verifyAdmin(): Promise<string | null> {
  // Dev mock mode — skip auth and return a mock admin ID
  if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true") {
    return "dev-001";
  }

  try {
    const session = await auth();
    if (!session?.user) return null;

    const userId = (session.user as Record<string, unknown>).id as string | undefined;
    if (!userId) return null;

    const { rows: [profile] } = await pool.query(
      "SELECT role FROM profiles WHERE id = $1",
      [userId]
    );

    return profile?.role === "admin" ? userId : null;
  } catch {
    return null;
  }
}
