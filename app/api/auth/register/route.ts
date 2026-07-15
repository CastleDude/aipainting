import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const existing = await pool.query("SELECT id FROM profiles WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Detect country from Cloudflare header (free, zero-latency)
    const country = req.headers.get("cf-ipcountry") || null;

    const passwordHash = await hash(password, 12);
    const { rows: [user] } = await pool.query(
      "INSERT INTO profiles (id, email, name, password_hash, tier, credits, country) VALUES (gen_random_uuid(), $1, $2, $3, 'free', 10, $4) RETURNING id, email, name, tier, credits, country",
      [email.toLowerCase(), name || email.split("@")[0], passwordHash, country],
    );

    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, tier: user.tier, credits: user.credits, country: user.country } });
  } catch (e) {
    console.error("[register]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
