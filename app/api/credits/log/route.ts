import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    const { rows: [profile] } = await pool.query(
      "SELECT tier, credits FROM profiles WHERE id = $1",
      [userId],
    );
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [data, count] = await Promise.all([
      pool.query(
        "SELECT id, category, amount, reason, balance_after, created_at FROM credit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
        [userId, limit, offset],
      ),
      pool.query("SELECT COUNT(*)::int AS total FROM credit_logs WHERE user_id = $1", [userId]),
    ]);

    return NextResponse.json({
      items: data.rows,
      total: count.rows[0]?.total || 0,
      page, limit,
      tier: profile.tier,
      credits: profile.credits,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
