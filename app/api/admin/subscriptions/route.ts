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
    const statusFilter = url.searchParams.get("status");

    const params: unknown[] = [];
    let where = "";
    if (statusFilter) {
      params.push(statusFilter);
      where = " WHERE s.status = $1";
    }

    const dataQuery = `SELECT s.id, s.user_id, s.tier, s.status, s.creem_subscription_id,
      s.current_period_start, s.current_period_end, s.created_at, s.updated_at,
      p.email AS user_email
      FROM subscriptions s LEFT JOIN profiles p ON p.id = s.user_id
      ${where}
      ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const countQuery = `SELECT COUNT(*) AS count FROM subscriptions s${where}`;

    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, [...params, limit, offset]),
      pool.query(countQuery, params),
    ]);

    return NextResponse.json({
      subscriptions: dataResult.rows,
      total: parseInt(countResult.rows[0]?.count || "0", 10),
      page,
      limit,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { subscriptionId, status } = body;

    if (!subscriptionId || !status) {
      return NextResponse.json({ error: "Missing subscriptionId or status" }, { status: 400 });
    }

    if (!["active", "canceled", "expired", "past_due"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // If canceling, downgrade user to free tier
    if (status === "canceled") {
      const sub = await pool.query("SELECT user_id FROM subscriptions WHERE id = $1", [subscriptionId]);
      if (sub.rows.length > 0) {
        await pool.query("UPDATE profiles SET tier = 'free', credits = 0 WHERE id = $1", [sub.rows[0].user_id]);
      }
    }

    await pool.query(
      "UPDATE subscriptions SET status = $1, updated_at = now() WHERE id = $2",
      [status, subscriptionId]
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
