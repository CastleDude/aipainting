import { NextRequest, NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import crypto from "crypto";
import pool from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendResetEmail } from "@/lib/email";

// POST: Request password reset (forgot password)
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const { rows: [user] } = await pool.query("SELECT id FROM profiles WHERE email = $1", [email.toLowerCase()]);
    if (!user) return NextResponse.json({ ok: true }); // Don't reveal user existence

    // Generate token (valid 1 hour)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000).toISOString();

    await pool.query("INSERT INTO password_reset_tokens (user_id, token, expires) VALUES ($1, $2, $3)", [user.id, token, expires]);

    // Send email
    console.log("[reset-password] SMTP config:", process.env.SMTP_USER ? `user=${process.env.SMTP_USER} host=${process.env.SMTP_HOST}` : "NOT CONFIGURED");
    try { await sendResetEmail(email.toLowerCase(), token); console.log("[reset-password] Email sent to", email); } catch (e) { console.error("[reset-password] Email failed:", e); }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[reset-password]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PUT: Set new password (authenticated - user already logged in)
// PATCH: Set new password via token (no auth required, token-based)
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { password, token } = body;

    // Token-based reset (from email link, no auth required)
    if (token) {
      if (!password || password.length < 6) return NextResponse.json({ error: "Password too short" }, { status: 400 });
      const { rows: [reset] } = await pool.query(
        "SELECT user_id FROM password_reset_tokens WHERE token = $1 AND expires > now() AND used = false",
        [token],
      );
      if (!reset) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });

      const passwordHash = await hash(password, 12);
      await pool.query("UPDATE profiles SET password_hash = $1 WHERE id = $2", [passwordHash, reset.user_id]);
      await pool.query("UPDATE password_reset_tokens SET used = true WHERE token = $1", [token]);
      return NextResponse.json({ ok: true });
    }

    // Authenticated user updating own password
    if (session?.user) {
      if (!password || password.length < 6) return NextResponse.json({ error: "Password too short" }, { status: 400 });
      const passwordHash = await hash(password, 12);
      await pool.query("UPDATE profiles SET password_hash = $1 WHERE id = $2", [passwordHash, (session.user as any).id]);
      return NextResponse.json({ ok: true });
    }

    const { rows: [reset] } = await pool.query(
      "SELECT user_id FROM password_reset_tokens WHERE token = $1 AND expires > now() AND used = false",
      [token],
    );
    if (!reset) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });

    const passwordHash = await hash(password, 12);
    await pool.query("UPDATE profiles SET password_hash = $1 WHERE id = $2", [passwordHash, reset.user_id]);
    await pool.query("UPDATE password_reset_tokens SET used = true WHERE token = $1", [token]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
