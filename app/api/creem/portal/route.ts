import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const locale = body.locale || "en";

    // Authenticate user
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Look up active subscription
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: sub } = await serviceClient
      .from("subscriptions")
      .select("creem_subscription_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!sub?.creem_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 },
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // Create Creem Customer Portal session
    const response = await fetch("https://api.creem.io/v1/customer-portal/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CREEM_API_KEY || "",
      },
      body: JSON.stringify({
        subscription_id: sub.creem_subscription_id,
        return_url: `${siteUrl}/${locale}/dashboard`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[creem] Portal error:", JSON.stringify(data).slice(0, 300));
      return NextResponse.json(
        { error: data.message || "Failed to create portal session" },
        { status: response.status },
      );
    }

    const portalUrl = data.portal_url || data.url;
    if (!portalUrl) {
      return NextResponse.json(
        { error: "No portal URL returned" },
        { status: 500 },
      );
    }

    return NextResponse.json({ portalUrl });
  } catch (error) {
    console.error("[creem] Portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 },
    );
  }
}
