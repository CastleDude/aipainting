import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import pool from "@/lib/db";

// Service role client for admin DB writes
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const computed = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(signature)
    );
  } catch {
    return computed === signature;
  }
}

interface WebhookPayload {
  id: string;
  type: string;
  created_at: string;
  data: {
    id: string;
    object: string;
    customer: { id: string; email: string; name?: string };
    product: { id: string; name?: string };
    metadata?: { user_id?: string; tier?: string };
    subscription?: {
      id: string;
      status: string;
      current_period_start?: string;
      current_period_end?: string;
    };
    amount?: number;
    currency?: string;
    status?: string;
  };
}

async function handleCheckoutCompleted(_supabase: ReturnType<typeof getServiceClient>, payload: WebhookPayload) {
  const { data } = payload;
  const userId = data.metadata?.user_id;
  const tier = data.metadata?.tier || "premium";
  const subscription = data.subscription;
  if (!userId) { console.error("[creem] No user_id in checkout metadata"); return; }

  await pool.query(
    "INSERT INTO orders (id, user_id, amount, currency, tier, status, creem_checkout_id) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO UPDATE SET status = 'completed'",
    [data.id, userId, data.amount || 0, data.currency || "USD", tier, "completed", data.id],
  );
  await pool.query("UPDATE profiles SET tier = $1 WHERE id = $2", [tier, userId]);
  if (subscription) {
    await pool.query(
      "INSERT INTO subscriptions (id, user_id, tier, status, creem_subscription_id, current_period_start, current_period_end) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO UPDATE SET status = $4",
      [subscription.id, userId, tier, subscription.status, subscription.id, subscription.current_period_start, subscription.current_period_end],
    );
  }
}

async function handleSubscriptionPaid(supabase: ReturnType<typeof getServiceClient>, payload: WebhookPayload) {
  const subscription = payload.data.subscription;
  if (!subscription) return;

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id, tier")
    .eq("creem_subscription_id", subscription.id)
    .single();

  if (!sub) return;

  const TIER_CREDITS: Record<string, number> = {
    free: 10, basic: 500, premium: 2000, ultimate: 5000,
  };
  const monthlyCredits = TIER_CREDITS[sub.tier] || 0;

  await pool.query("UPDATE profiles SET credits = $1 WHERE id = $2", [monthlyCredits, sub.user_id]);
  await pool.query("INSERT INTO credit_logs (id, user_id, amount, reason) VALUES ($1, $2, $3, $4)", [`sub_paid_${payload.id}`, sub.user_id, monthlyCredits, `Monthly credit reset for ${sub.tier} subscription`]);
  await pool.query("UPDATE subscriptions SET status = 'active', current_period_start = $1, current_period_end = $2 WHERE creem_subscription_id = $3", [subscription.current_period_start, subscription.current_period_end, subscription.id]);
}

async function handleSubscriptionCanceled(supabase: ReturnType<typeof getServiceClient>, payload: WebhookPayload) {
  const subscription = payload.data.subscription;
  if (!subscription) return;

  await supabase
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("creem_subscription_id", subscription.id);
}

async function handleSubscriptionExpired(supabase: ReturnType<typeof getServiceClient>, payload: WebhookPayload) {
  const subscription = payload.data.subscription;
  if (!subscription) return;

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("creem_subscription_id", subscription.id)
    .single();

  if (sub) {
    // Downgrade to free
    await supabase
      .from("profiles")
      .update({ tier: "free", credits: 0 })
      .eq("id", sub.user_id);

    await pool.query("INSERT INTO credit_logs (id, user_id, amount, reason) VALUES ($1, $2, 0, $3)", [`sub_expired_${payload.id}`, sub.user_id, "Subscription expired — downgraded to free"]);
  }

  await supabase
    .from("subscriptions")
    .update({ status: "expired" })
    .eq("creem_subscription_id", subscription.id);
}

async function handleRefundCreated(supabase: ReturnType<typeof getServiceClient>, payload: WebhookPayload) {
  const userId = payload.data.metadata?.user_id;
  if (!userId) return;

  // Mark order as refunded
  await supabase
    .from("orders")
    .update({ status: "refunded" })
    .eq("creem_checkout_id", payload.data.id);

  // Downgrade to free if it was from a checkout
  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .single();

  if (profile && profile.tier !== "free") {
    await supabase
      .from("profiles")
      .update({ tier: "free", credits: 0 })
      .eq("id", userId);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("creem-signature") || "";

    // Verify webhook signature (skip in dev for local testing)
    if (process.env.NODE_ENV === "production" && !verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload: WebhookPayload = JSON.parse(rawBody);
    const supabase = getServiceClient();

    switch (payload.type) {
      case "checkout.completed":
        await handleCheckoutCompleted(supabase, payload);
        break;
      case "subscription.paid":
        await handleSubscriptionPaid(supabase, payload);
        break;
      case "subscription.canceled":
        await handleSubscriptionCanceled(supabase, payload);
        break;
      case "subscription.expired":
        await handleSubscriptionExpired(supabase, payload);
        break;
      case "refund.created":
        await handleRefundCreated(supabase, payload);
        break;
      default:
        // Ignore unknown events
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[creem] Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
