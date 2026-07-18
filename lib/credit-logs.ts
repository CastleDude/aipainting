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
      "INSERT INTO credit_logs (user_id, amount, category, reason, balance_after) VALUES ($1, $2, $3, $4, $5)",
      [userId, amount, category, reason, balanceAfter],
    );
  } catch { /* non-critical */ }
}
