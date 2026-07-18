import pool from "@/lib/db";

export async function logCreditChange(
  userId: string,
  amount: number,
  category: string,
  reason: string,
) {
  try {
    const balance = await pool.query("SELECT credits FROM profiles WHERE id = $1", [userId]);
    const balanceAfter = balance.rows[0]?.credits ?? null;
    await pool.query(
      "INSERT INTO credit_logs (id, user_id, amount, category, reason, balance_after) VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)",
      [userId, amount, category, reason, balanceAfter],
    );
  } catch (e) { console.error("[credit-log]", e instanceof Error ? e.message : e); }
}

export async function logCreditChangeExact(
  userId: string,
  amount: number,
  balanceAfter: number,
  category: string,
  reason: string,
) {
  try {
    await pool.query(
      "INSERT INTO credit_logs (id, user_id, amount, category, reason, balance_after) VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)",
      [userId, amount, category, reason, balanceAfter],
    );
  } catch (e) { console.error("[credit-log]", e instanceof Error ? e.message : e); }
}
