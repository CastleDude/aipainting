import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-guard";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  const adminId = await verifyAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbStatus: Record<string, unknown> = {};
  const creemStatus: Record<string, unknown> = {};
  const authStatus: Record<string, unknown> = {};
  const devStatus: Record<string, unknown> = {};
  const appStatus: Record<string, unknown> = {};

  // Database connection (local PG)
  dbStatus.configured = Boolean(process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  try {
    const { rows } = await pool.query("SELECT COUNT(*) AS count FROM profiles");
    dbStatus.connected = true;
    dbStatus.userCount = parseInt(rows[0]?.count || "0", 10);
  } catch (e) {
    dbStatus.connected = false;
    dbStatus.error = String(e);
  }

  // Creem payment
  creemStatus.configured = Boolean(process.env.CREEM_API_KEY && process.env.CREEM_WEBHOOK_SECRET);

  // Auth
  authStatus.method = "Auth.js v5 (credentials)";
  authStatus.email = true;

  // Dev mode
  devStatus.mock_user = process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true";

  // App info
  appStatus.node_env = process.env.NODE_ENV || "development";
  appStatus.next_version = "16";

  return NextResponse.json({
    database: dbStatus,
    creem: creemStatus,
    auth: authStatus,
    dev: devStatus,
    app: appStatus,
  });
}
