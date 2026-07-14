import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pool from "@/lib/db";

// POST: submit feedback (members only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Login required" }, { status: 401 });
    const userId = (session.user as any).id;

    const { message } = await req.json();
    if (!message?.trim() || message.length > 200) {
      return NextResponse.json({ error: "Message required (max 200 chars)" }, { status: 400 });
    }

    await pool.query("INSERT INTO feedback (user_id, message) VALUES ($1, $2)", [userId, message.trim()]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// GET: admin list (with pagination)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check admin
    const userId = (session.user as any).id;
    const { rows: [profile] } = await pool.query("SELECT role FROM profiles WHERE id = $1", [userId]);
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    const [data, count] = await Promise.all([
      pool.query(
        `SELECT f.id, f.message, f.created_at, p.email, p.name
         FROM feedback f JOIN profiles p ON f.user_id = p.id
         ORDER BY f.created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      pool.query("SELECT COUNT(*)::int AS total FROM feedback"),
    ]);

    return NextResponse.json({
      items: data.rows,
      total: count.rows[0]?.total || 0,
      page, limit,
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE: admin delete
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const { rows: [profile] } = await pool.query("SELECT role FROM profiles WHERE id = $1", [userId]);
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await pool.query("DELETE FROM feedback WHERE id = $1", [id]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
