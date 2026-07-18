import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-guard";
import pool from "@/lib/db";
import { logCreditChange } from "@/lib/credit-logs";

async function guard(req: NextRequest) {
  const adminId = await verifyAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const denied = await guard(req);
    if (denied) return denied;

    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim() || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    let countQuery = "SELECT COUNT(*) AS count FROM profiles";
    let dataQuery = "SELECT id, email, name, tier, credits, role, country, created_at FROM profiles";
    const params: string[] = [];

    if (search) {
      const clause = " WHERE email ILIKE $1 OR name ILIKE $2";
      countQuery += clause;
      dataQuery += clause;
      params.push(`%${search}%`, `%${search}%`);
    }

    dataQuery += " ORDER BY created_at DESC LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2);

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, params),
      pool.query(dataQuery, [...params, limit, offset]),
    ]);

    return NextResponse.json({
      users: dataResult.rows,
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
    const denied = await guard(req);
    if (denied) return denied;

    const body = await req.json();
    const { userId, updates } = body;

    if (!userId || !updates || typeof updates !== "object") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const allowed = ["tier", "credits", "role", "name", "country"] as const;
    const sets: string[] = [];
    const vals: unknown[] = [];
    let i = 1;
    for (const key of allowed) {
      if (key in updates) {
        sets.push(`${key} = $${i++}`);
        vals.push(updates[key]);
      }
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    vals.push(userId);
    await pool.query(`UPDATE profiles SET ${sets.join(", ")} WHERE id = $${i}`, vals);

    // Log manual credit adjustment
    if ("credits" in updates) {
      logCreditChange(userId, 0, "adjust", `管理员手动调整积分至 ${updates.credits}`);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 50) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (ids.includes(adminId)) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    const placeholders = ids.map((_, idx) => `$${idx + 1}`).join(", ");
    await pool.query(`DELETE FROM profiles WHERE id IN (${placeholders})`, ids);

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
