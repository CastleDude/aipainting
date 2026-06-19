import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { TOOL_CREDIT_COST, shouldResetCredits } from "@/lib/credits";
import type { SubscriptionTier } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tool } = body;

    if (!tool) {
      return NextResponse.json({ error: "Missing tool name" }, { status: 400 });
    }

    const cost = TOOL_CREDIT_COST[tool] ?? 1;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      // Dev mock mode — return success for local testing without Supabase
      return NextResponse.json({ success: true, mock: true, cost });
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, tier, credits, daily_reset_at")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let currentCredits = profile.credits;

    // Monthly credit reset
    const resetCredits = shouldResetCredits(profile.daily_reset_at, profile.tier as SubscriptionTier);
    if (resetCredits !== null) {
      currentCredits = resetCredits;
    }

    if (currentCredits <= 0) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    const newCredits = Math.max(0, currentCredits - cost);
    const updates: Record<string, unknown> = { credits: newCredits };
    if (!profile.daily_reset_at) updates.daily_reset_at = new Date().toISOString();
    if (resetCredits !== null) updates.daily_reset_at = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (updateErr) {
      return NextResponse.json({ error: "Failed to deduct credits" }, { status: 500 });
    }

    return NextResponse.json({ success: true, credits: newCredits, cost, tier: profile.tier });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
