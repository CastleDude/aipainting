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
    const search = url.searchParams.get("search")?.trim() || "";
    const country = url.searchParams.get("country")?.trim() || "";
    const dateFrom = url.searchParams.get("dateFrom")?.trim() || "";
    const dateTo = url.searchParams.get("dateTo")?.trim() || "";

    let where = "WHERE ip IS NOT NULL";
    const params: (string | number)[] = [];
    let paramIdx = 1;

    if (search) {
      where += ` AND ip ILIKE $${paramIdx++}`;
      params.push(`%${search}%`);
    }
    if (country) {
      where += ` AND country ILIKE $${paramIdx++}`;
      params.push(`%${country}%`);
    }
    if (dateFrom) {
      where += ` AND created_at >= $${paramIdx++}`;
      params.push(dateFrom);
    }
    if (dateTo) {
      where += ` AND created_at <= $${paramIdx++}::timestamp + interval '1 day'`;
      params.push(dateTo);
    }

    const countQuery = `SELECT COUNT(DISTINCT ip || '_' || DATE(created_at))::int AS count FROM visitor_logs ${where}`;
    const dataQuery = `SELECT
        ip,
        MAX(country) AS country,
        MAX(user_agent) AS user_agent,
        MAX(created_at) AS last_visit,
        MIN(created_at) AS first_visit,
        COUNT(*)::int AS page_count,
        COALESCE(SUM(credits_used), 0)::int AS credits_used
      FROM visitor_logs
      ${where}
      GROUP BY ip, DATE(created_at)
      ORDER BY MAX(created_at) DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;

    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, [...params, limit, offset]),
      pool.query(countQuery, params),
    ]);

    return NextResponse.json({
      visitors: dataResult.rows,
      total: countResult.rows[0]?.count || 0,
      page,
      limit,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
