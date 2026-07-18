import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pool from "@/lib/db";
import { shouldResetCredits } from "@/lib/credits";
import { logCreditChange, logCreditChangeExact } from "@/lib/credit-logs";
import type { SubscriptionTier } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Base profile query (columns guaranteed to exist)
    const { rows: [profile] } = await pool.query(
      "SELECT id, email, name, tier, credits, daily_reset_at, role, country, created_at, updated_at FROM profiles WHERE id = $1",
      [(session.user as any).id],
    );
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    // Try to fetch optional login tracking fields (may not exist yet)
    try {
      const { rows: [loginInfo] } = await pool.query(
        "SELECT last_login_at, last_login_ip, last_login_country FROM profiles WHERE id = $1",
        [(session.user as any).id],
      );
      if (loginInfo) Object.assign(profile, loginInfo);
    } catch { /* column doesn't exist yet — skip */ }

    // Check and apply credit reset on profile load (so users see refreshed credits immediately)
    const resetCredits = shouldResetCredits(profile.daily_reset_at, profile.tier as SubscriptionTier);
    if (resetCredits !== null) {
      const oldCredits = profile.credits;
      profile.credits = resetCredits;
      const tier = profile.tier || "free";
      if (oldCredits > 0) logCreditChangeExact(profile.id, -oldCredits, oldCredits, "expire", tier === "free" ? "每日积分到期清零" : "月度积分到期清零");
      await pool.query(
        "UPDATE profiles SET credits = $1, daily_reset_at = now() WHERE id = $2",
        [resetCredits, profile.id],
      );
      logCreditChange(profile.id, resetCredits, "daily", tier === "free" ? "每日免费积分" : "月度积分发放");
    }

    // Record last login info (throttled: update at most once per hour)
    const lastLogin = profile.last_login_at ? new Date(profile.last_login_at).getTime() : 0;
    if (Date.now() - lastLogin > 60 * 60 * 1000) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
      const country = req.headers.get("cf-ipcountry") || null;
      try {
        await pool.query(
          "UPDATE profiles SET last_login_at = now(), last_login_ip = $1, last_login_country = $2 WHERE id = $3",
          [ip, country, profile.id],
        );
        profile.last_login_at = new Date().toISOString();
        // Tag visitor_logs with user_id for this IP
        if (ip) {
          await pool.query(
            "UPDATE visitor_logs SET user_id = $1 WHERE ip = $2 AND user_id IS NULL",
            [profile.id, ip],
          );
        }
      } catch { /* columns may not exist yet — skip */ }
      profile.last_login_ip = ip;
      profile.last_login_country = country;
    }

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
