import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const CREEM_API = "https://api.creem.io/v1";

interface CheckoutRequest {
  tier: string;
  locale?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutRequest = await req.json();
    const { tier, locale = "en" } = body;

    if (!tier || !["basic", "premium", "ultimate"].includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkRateLimit(clientIp, RATE_LIMITS.checkout);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: rl.retryAfter },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
      );
    }

    // Get product ID from env
    const productIds: Record<string, string | undefined> = {
      basic: process.env.CREEM_BASIC_PRODUCT_ID,
      premium: process.env.CREEM_PREMIUM_PRODUCT_ID,
      ultimate: process.env.CREEM_ULTIMATE_PRODUCT_ID,
    };
    const productId = productIds[tier];

    if (!productId) {
      return NextResponse.json(
        { error: "Payment not configured" },
        { status: 500 }
      );
    }

    // Get authenticated user
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;

    const payload: Record<string, unknown> = {
      product_id: productId,
      success_url: `${siteUrl}/${locale}/dashboard?checkout=success`,
      cancel_url: `${siteUrl}/${locale}/pricing?checkout=cancelled`,
      customer: {
        email: user.email,
      },
      metadata: {
        user_id: user.id,
        tier,
      },
    };

    const response = await fetch(`${CREEM_API}/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CREEM_API_KEY || "",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to create checkout" },
        { status: response.status }
      );
    }

    return NextResponse.json({ checkoutUrl: data.checkout_url });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
