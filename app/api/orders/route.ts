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
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT o.id, o.tier, o.amount, o.currency, o.status, o.created_at,
                p.email AS user_email, p.name AS user_name, p.country
         FROM orders o
         LEFT JOIN profiles p ON p.id = o.user_id
         WHERE o.user_id = $1
         ORDER BY o.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset],
      ),
      pool.query("SELECT COUNT(*) AS count FROM orders WHERE user_id = $1", [userId]),
    ]);

    return NextResponse.json({
      orders: dataResult.rows,
      total: parseInt(countResult.rows[0]?.count || "0", 10),
      page,
      limit,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
