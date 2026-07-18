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
    const device = url.searchParams.get("device")?.trim() || "";
    const dateFrom = url.searchParams.get("dateFrom")?.trim() || "";
    const dateTo = url.searchParams.get("dateTo")?.trim() || "";

    let where = "WHERE v.ip IS NOT NULL";
    const params: (string | number)[] = [];
    let paramIdx = 1;

    if (search) {
      where += ` AND v.ip ILIKE $${paramIdx++}`;
      params.push(`%${search}%`);
    }
    if (country) {
      where += ` AND v.country ILIKE $${paramIdx++}`;
      params.push(`%${country}%`);
    }
    if (device) {
      if (device === "mobile") {
        where += ` AND v.user_agent ~* 'iphone|android.*mobile|blackberry|webos'`;
      } else if (device === "tablet") {
        where += ` AND v.user_agent ~* 'ipad|android(?!.*mobile)|tablet'`;
      } else if (device === "desktop") {
        where += ` AND (v.user_agent !~* 'iphone|android|ipad|tablet|mobile' OR v.user_agent IS NULL)`;
      }
    }
    if (dateFrom) {
      where += ` AND v.created_at >= $${paramIdx++}`;
      params.push(dateFrom);
    }
    if (dateTo) {
      where += ` AND v.created_at <= $${paramIdx++}::timestamp + interval '1 day'`;
      params.push(dateTo);
    }

    const countQuery = `SELECT COUNT(DISTINCT v.ip || '_' || DATE(v.created_at))::int AS count FROM visitor_logs v ${where}`;
    const dataQuery = `SELECT
        v.ip,
        MAX(v.country) AS country,
        MAX(v.user_agent) AS user_agent,
        MAX(v.created_at) AS last_visit,
        MIN(v.created_at) AS first_visit,
        COUNT(*)::int AS page_count,
        COALESCE(SUM(v.credits_used), 0)::int AS credits_used,
        (SELECT COUNT(*)::int FROM visitor_logs WHERE ip = v.ip) AS total_visits
      FROM visitor_logs v
      ${where}
      GROUP BY v.ip, DATE(v.created_at)
      ORDER BY MAX(v.created_at) DESC
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
  } catch (e) {
    console.error("[visitors]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
