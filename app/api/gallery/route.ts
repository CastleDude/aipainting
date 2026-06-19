import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Dev mock mode
    if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true") {
      const cookieVal = req.cookies.get("mock_generations")?.value;
      const allItems: Array<{ id: string; prompt: string; model: string; image_url: string; is_public: boolean; created_at: string }> = cookieVal ? JSON.parse(decodeURIComponent(cookieVal)) : [];
      const publicItems = allItems.filter((g) => g.is_public);
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "24"), 48);
      const offset = (page - 1) * limit;
      const items = publicItems.slice(offset, offset + limit).map((g) => ({ ...g, user_name: "You (demo)" }));
      return NextResponse.json({ items, total: publicItems.length, page, limit });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "24"), 48);
    const offset = (page - 1) * limit;

    // Local PG query with join for user names
    const { rows: items } = await pool.query(
      `SELECT g.id, g.user_id, g.prompt, g.model, g.image_url, g.thumb_url, g.created_at, COALESCE(p.name, 'Anonymous') as user_name
       FROM generations g LEFT JOIN profiles p ON g.user_id = p.id
       WHERE g.is_public = true
       ORDER BY g.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    const { rows: [count] } = await pool.query(
      "SELECT COUNT(*)::int as total FROM generations WHERE is_public = true",
    );

    return NextResponse.json({ items, total: count?.total || 0, page, limit });
  } catch (e) {
    console.error("[gallery] Error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
