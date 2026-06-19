import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { TOOL_CREDIT_COST, shouldResetCredits } from "@/lib/credits";
import type { SubscriptionTier } from "@/lib/supabase";
import pool, { ensureProfile } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tool } = body;
    if (!tool) return NextResponse.json({ error: "Missing tool name" }, { status: 400 });

    const cost = TOOL_CREDIT_COST[tool] ?? 1;

    // Auth via Supabase
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // Get profile from local PG
    const localProfile = await ensureProfile(user.id, user.email);
    let currentCredits = localProfile.credits;

    const resetCredits = shouldResetCredits(localProfile.daily_reset_at, localProfile.tier as SubscriptionTier);
    if (resetCredits !== null) currentCredits = resetCredits;

    if (currentCredits <= 0) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    const newCredits = Math.max(0, currentCredits - cost);
    await pool.query(
      "UPDATE profiles SET credits = $1, daily_reset_at = COALESCE(daily_reset_at, now()) WHERE id = $2",
      [newCredits, user.id],
    );

    return NextResponse.json({ success: true, credits: newCredits, cost, tier: localProfile.tier });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
