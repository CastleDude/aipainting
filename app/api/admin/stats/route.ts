import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdmin } from "@/lib/admin-guard";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  try {
    if (!(await verifyAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getServiceClient();

    const [usersResult, ordersResult, totalOrdersResult] = await Promise.all([
      supabase.from("profiles").select("id, tier", { count: "exact", head: false }),
      supabase
        .from("orders")
        .select("id, user_id, tier, amount, currency, created_at, status")
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed"),
    ]);

    const allUsers = usersResult.data || [];
    const payingUsers = allUsers.filter((u) => u.tier !== "free").length;

    // Get emails for recent orders
    const orders = ordersResult.data || [];
    const userIds = [...new Set(orders.map((o) => o.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", userIds);

    const emailMap = new Map((profiles || []).map((p) => [p.id, p.email]));

    const recentOrders = orders.map((o) => ({
      id: o.id,
      user_email: emailMap.get(o.user_id) || o.user_id,
      tier: o.tier,
      amount: o.amount,
      currency: o.currency,
      created_at: o.created_at,
    }));

    return NextResponse.json({
      totalUsers: allUsers.length,
      payingUsers,
      totalOrders: totalOrdersResult.count || 0,
      recentOrders,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
