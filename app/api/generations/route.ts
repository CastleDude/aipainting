import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  // Dev mock mode
  if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true") {
    const cookieVal = req.cookies.get("mock_generations")?.value;
    const items = cookieVal ? JSON.parse(decodeURIComponent(cookieVal)) : [];
    return NextResponse.json({ generations: items });
  }

  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ generations: [] });
    const user = { id: (session.user as any).id };

    // Query local PostgreSQL
    const { rows } = await pool.query(
      `SELECT id, prompt, model, image_url, thumb_url, is_public, created_at
       FROM generations WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 20`,
      [user.id],
    );
    return NextResponse.json({ generations: rows || [] });
  } catch (e) {
    console.error("[generations]", e instanceof Error ? e.message : e);
    return NextResponse.json({ generations: [] });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user ? { id: (session.user as any).id } : null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const ids = searchParams.get("ids");

    if (id) {
      await pool.query("DELETE FROM generations WHERE id = $1 AND user_id = $2", [id, user.id]);
    } else if (ids) {
      for (const gid of ids.split(",")) {
        await pool.query("DELETE FROM generations WHERE id = $1 AND user_id = $2", [gid, user.id]);
      }
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = { id: (session.user as any).id };

  const body = await req.json();
  const { id, is_public } = body;
  if (!id || typeof is_public !== "boolean") {
    return NextResponse.json({ error: "Missing id or is_public" }, { status: 400 });
  }

  // Verify ownership
  const { rows: [gen] } = await pool.query(
    "SELECT id FROM generations WHERE id = $1 AND user_id = $2",
    [id, user.id],
  );
  if (!gen) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Share limit check
  if (is_public) {
    const { rows: [profile] } = await pool.query(
      "SELECT tier FROM profiles WHERE id = $1", [user.id],
    );
    if ((profile?.tier || "free") === "free") {
      const { rows: shares } = await pool.query(
        "SELECT COUNT(*)::int as count FROM generations WHERE user_id = $1 AND is_public = true AND created_at >= CURRENT_DATE",
        [user.id],
      );
      if (shares[0].count >= 5) {
        return NextResponse.json({ ok: false, code: "share_limit" }, { status: 200 });
      }
    }
  }

  await pool.query(
    "UPDATE generations SET is_public = $1 WHERE id = $2 AND user_id = $3",
    [is_public, id, user.id],
  );

  // Gallery limit: max 50 public
  if (is_public) {
    const { rows: pubIds } = await pool.query(
      "SELECT id FROM generations WHERE is_public = true ORDER BY created_at ASC",
    );
    if (pubIds.length > 50) {
      const toRemove = pubIds.slice(0, pubIds.length - 50).map((r: { id: string }) => r.id);
      await pool.query(
        "UPDATE generations SET is_public = false WHERE id = ANY($1::uuid[])",
        [toRemove],
      );
    }
  }

  return NextResponse.json({ ok: true, is_public });
}
