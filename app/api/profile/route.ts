import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { rows: [profile] } = await pool.query(
      "SELECT id, email, name, tier, credits, daily_reset_at, role, created_at, updated_at FROM profiles WHERE id = $1",
      [(session.user as any).id],
    );
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
