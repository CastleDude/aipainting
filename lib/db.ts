import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

export default pool;

export interface LocalProfile {
  id: string;
  email: string | null;
  name: string | null;
  tier: string;
  credits: number;
  daily_reset_at: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

/** Ensure a profile exists locally for this user, returns current state */
export async function ensureProfile(
  userId: string,
  email?: string | null,
  name?: string | null,
): Promise<LocalProfile> {
  const existing = await pool.query("SELECT * FROM profiles WHERE id = $1", [userId]);
  if (existing.rows.length > 0) return existing.rows[0];

  const result = await pool.query(
    `INSERT INTO profiles (id, email, name, tier, credits, daily_reset_at, role)
     VALUES ($1, $2, $3, 'free', 10, now(), 'user')
     ON CONFLICT (id) DO UPDATE SET email = COALESCE(profiles.email, $2), name = COALESCE(profiles.name, $3)
     RETURNING *`,
    [userId, email || null, name || null],
  );
  return result.rows[0];
}
