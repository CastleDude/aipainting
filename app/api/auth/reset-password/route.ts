import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import pool from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const { rows: [user] } = await pool.query("SELECT id FROM profiles WHERE email = $1", [email.toLowerCase()]);
    if (!user) return NextResponse.json({ ok: true }); // Don't reveal if user exists

    // For now, just return success. SMTP integration can be added later.
    return NextResponse.json({ ok: true, message: "If the email exists, a reset link has been sent." });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { password } = await req.json();
    if (!password || password.length < 6) return NextResponse.json({ error: "Password too short" }, { status: 400 });

    const passwordHash = await hash(password, 12);
    await pool.query("UPDATE profiles SET password_hash = $1 WHERE id = $2", [passwordHash, (session.user as any).id]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
