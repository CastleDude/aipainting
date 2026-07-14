import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-guard";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [usersResult, ordersResult, totalResult] = await Promise.all([
      pool.query("SELECT id, tier FROM profiles"),
      pool.query(
        "SELECT o.id, o.user_id, o.tier, o.amount, o.currency, o.created_at, p.email FROM orders o LEFT JOIN profiles p ON p.id = o.user_id WHERE o.status = 'completed' ORDER BY o.created_at DESC LIMIT 10"
      ),
      pool.query("SELECT COUNT(*) AS count FROM orders WHERE status = 'completed'"),
    ]);

    const allUsers = usersResult.rows;
    const payingUsers = allUsers.filter((u: { tier: string }) => u.tier !== "free").length;

    const recentOrders = ordersResult.rows.map((o: Record<string, unknown>) => ({
      id: o.id,
      user_email: (o.email as string) || o.user_id,
      tier: o.tier,
      amount: o.amount,
      currency: o.currency,
      created_at: o.created_at,
    }));

    return NextResponse.json({
      totalUsers: allUsers.length,
      payingUsers,
      totalOrders: parseInt(totalResult.rows[0]?.count || "0", 10),
      recentOrders,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
