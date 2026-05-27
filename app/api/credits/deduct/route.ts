import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const TOOLS_DAILY_LIMIT = 20;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tool } = body;

    if (!tool) {
      return NextResponse.json({ error: "Missing tool name" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      // Dev mock mode — return success for local testing without Supabase
      return NextResponse.json({ success: true, mock: true });
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
      .select("id, tier, credits, tools_daily_used, daily_reset_at")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const tier = profile.tier as string;
    const isPaid = tier !== "free";

    if (isPaid) {
      const newCredits = Math.max(0, profile.credits - 1);
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ credits: newCredits })
        .eq("id", user.id);

      if (updateErr) {
        return NextResponse.json({ error: "Failed to deduct credits" }, { status: 500 });
      }

      return NextResponse.json({ success: true, credits: newCredits, tier });
    }

    // Free tier: check and increment tools_daily_used
    let currentToolsDaily = profile.tools_daily_used ?? 0;

    // Reset if 24h passed
    if (profile.daily_reset_at) {
      const resetAt = new Date(profile.daily_reset_at as string);
      if (resetAt < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
        currentToolsDaily = 0;
      }
    }

    if (currentToolsDaily >= TOOLS_DAILY_LIMIT) {
      return NextResponse.json({ error: "Daily limit reached" }, { status: 402 });
    }

    const nextToolsDaily = currentToolsDaily + 1;
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        tools_daily_used: nextToolsDaily,
        daily_reset_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateErr) {
      return NextResponse.json({ error: "Failed to update usage" }, { status: 500 });
    }

    return NextResponse.json({ success: true, tools_daily_used: nextToolsDaily, tier });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
