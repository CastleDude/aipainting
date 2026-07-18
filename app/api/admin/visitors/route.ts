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
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 500);
    const offset = (page - 1) * limit;
    const search = url.searchParams.get("search")?.trim() || "";
    const country = url.searchParams.get("country")?.trim() || "";
    const device = url.searchParams.get("device")?.trim() || "";
    const source = url.searchParams.get("source")?.trim() || "";
    const dateFrom = url.searchParams.get("dateFrom")?.trim() || "";
    const dateTo = url.searchParams.get("dateTo")?.trim() || "";
    const sortBy = url.searchParams.get("sortBy") || "last_visit";
    const allowedSorts = ["ip", "country", "page_count", "credits_used", "total_visits", "first_visit", "last_visit", "referrer"];
    const safeSortBy = allowedSorts.includes(sortBy) ? sortBy : "last_visit";
    const sortOrder = url.searchParams.get("sortOrder") === "asc" ? "ASC" : "DESC";

    const params: (string | number)[] = [];
    let paramIdx = 1;

    // Exclude admin IPs from visitor stats
    const adminIPs = await pool.query("SELECT last_login_ip FROM profiles WHERE role = 'admin' AND last_login_ip IS NOT NULL");
    const excludeIPs = adminIPs.rows.map((r: any) => r.last_login_ip).filter(Boolean);
    let where = "WHERE v.ip IS NOT NULL";
    if (excludeIPs.length > 0) {
      where += ` AND v.ip NOT IN (${excludeIPs.map((_: string, i: number) => `$${paramIdx + i}`).join(",")})`;
      params.push(...excludeIPs);
      paramIdx += excludeIPs.length;
    }

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
    if (source) {
      if (source === "直接访问") {
        where += ` AND (SELECT vl2.referrer FROM visitor_logs vl2 WHERE vl2.ip = v.ip AND vl2.referrer IS NOT NULL ORDER BY vl2.created_at LIMIT 1) IS NULL`;
      } else {
        where += ` AND (SELECT vl2.referrer FROM visitor_logs vl2 WHERE vl2.ip = v.ip ORDER BY vl2.created_at LIMIT 1) ILIKE $${paramIdx++}`;
        params.push(`%${source}%`);
      }
    }
    if (dateFrom) {
      where += ` AND DATE(v.created_at AT TIME ZONE 'Asia/Shanghai') >= $${paramIdx++}`;
      params.push(dateFrom);
    }
    if (dateTo) {
      where += ` AND DATE(v.created_at AT TIME ZONE 'Asia/Shanghai') <= $${paramIdx++}`;
      params.push(dateTo);
    }

    const countQuery = `SELECT COUNT(DISTINCT v.ip || '_' || DATE(v.created_at))::int AS count FROM visitor_logs v ${where}`;
    const dataQuery = `SELECT
        v.ip,
        MAX(v.country) AS country,
        MAX(v.user_agent) AS user_agent,
        COALESCE(
        (SELECT vl2.referrer FROM visitor_logs vl2 WHERE vl2.ip = v.ip AND vl2.referrer IS NOT NULL AND vl2.referrer != '' AND vl2.referrer NOT LIKE '%aipainting.top%' ORDER BY vl2.created_at LIMIT 1),
        (SELECT vl2.referrer FROM visitor_logs vl2 WHERE vl2.ip = v.ip AND vl2.referrer IS NOT NULL AND vl2.referrer != '' ORDER BY vl2.created_at LIMIT 1)
      ) AS referrer,
        CASE WHEN COUNT(v.user_id) > 0 THEN '会员' WHEN (SELECT COUNT(DISTINCT DATE(created_at)) FROM visitor_logs WHERE ip = v.ip) > 1 THEN '回头客' ELSE '新访客' END AS visit_type,
        MAX(v.created_at) AS last_visit,
        MIN(v.created_at) AS first_visit,
        COUNT(*)::int AS page_count,
        COALESCE(SUM(v.credits_used), 0)::int AS credits_used,
        (SELECT COUNT(*)::int FROM visitor_logs WHERE ip = v.ip) AS total_visits
      FROM visitor_logs v
      ${where}
      GROUP BY v.ip, DATE(v.created_at)
      ORDER BY ${safeSortBy === "ip" ? "v.ip" : safeSortBy === "country" ? "MAX(v.country)" : safeSortBy === "page_count" ? "COUNT(*)" : safeSortBy === "credits_used" ? "COALESCE(SUM(v.credits_used),0)" : safeSortBy === "total_visits" ? "(SELECT COUNT(*)::int FROM visitor_logs WHERE ip = v.ip)" : safeSortBy === "first_visit" ? "EXTRACT(epoch FROM MAX(v.created_at) - MIN(v.created_at))" : safeSortBy === "referrer" ? "(SELECT vl2.referrer FROM visitor_logs vl2 WHERE vl2.ip = v.ip ORDER BY vl2.created_at LIMIT 1)" : "MAX(v.created_at)"} ${sortOrder}
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
