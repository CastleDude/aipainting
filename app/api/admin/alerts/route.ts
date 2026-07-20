import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-guard";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  const adminId = await verifyAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [ordersR, subsR, creditsR] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM orders WHERE status = 'pending'"),
    pool.query("SELECT COUNT(*)::int AS count FROM subscriptions WHERE status = 'active' AND current_period_end BETWEEN NOW() AND NOW() + INTERVAL '7 days'"),
    pool.query("SELECT COUNT(*)::int AS count FROM profiles WHERE credits <= 0 AND tier != 'free'"),
  ]);

  return NextResponse.json({
    pendingOrders: ordersR.rows[0]?.count || 0,
    expiringSubs: subsR.rows[0]?.count || 0,
    zeroCreditUsers: creditsR.rows[0]?.count || 0,
    todayErrors: 0,
  });
}
