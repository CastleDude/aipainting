import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-guard";
import { getDailyStats, getRealtimeStats } from "@/lib/analytics";

export async function GET(req: NextRequest) {
  const adminId = await verifyAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const days = parseInt(url.searchParams.get("days") || "7");

  const [daily, realtime] = await Promise.all([
    getDailyStats(Math.min(days, 30)),
    getRealtimeStats(),
  ]);

  return NextResponse.json({ daily, realtime });
}
