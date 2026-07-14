import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-guard";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT o.id, o.user_id, o.tier, o.amount, o.currency, o.status, o.created_at, p.email AS user_email
         FROM orders o LEFT JOIN profiles p ON p.id = o.user_id
         ORDER BY o.created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      pool.query("SELECT COUNT(*) AS count FROM orders"),
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
