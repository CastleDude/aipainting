import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdmin } from "@/lib/admin-guard";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function guard(req: NextRequest) {
  const adminId = await verifyAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const denied = await guard(req);
    if (denied) return denied;

    const supabase = getServiceClient();
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    let query = supabase
      .from("profiles")
      .select("id, email, name, tier, credits, daily_used, role, created_at", {
        count: "exact",
      });

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      users: data,
      total: count || 0,
      page,
      limit,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const denied = await guard(req);
    if (denied) return denied;

    const supabase = getServiceClient();
    const body = await req.json();
    const { userId, updates } = body;

    if (!userId || !updates || typeof updates !== "object") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Only allow updating certain fields
    const allowed = ["tier", "credits", "daily_used", "tools_daily_used", "role", "name"] as const;
    const safe: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in updates) safe[key] = updates[key];
    }

    if (Object.keys(safe).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .update(safe)
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminId = await verifyAdmin(req);
    if (!adminId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getServiceClient();
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 50) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Prevent self-deletion
    if (ids.includes(adminId)) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    // Delete users one by one — try auth first, fall back to profiles-only
    let deleted = 0;
    const errors: string[] = [];
    for (const id of ids) {
      const { error } = await supabase.auth.admin.deleteUser(id);
      if (!error) {
        deleted++;
        continue;
      }
      // Fallback: user only exists in profiles, or auth record is corrupted
      if (error.message?.includes("user_not_found") || error.code === "user_not_found" ||
          error.message?.includes("Database error") || error.code === "unexpected_failure") {
        console.warn(`[users/delete] Auth delete failed for ${id}, falling back to profiles delete: ${error.message}`);
        const { error: profileError } = await supabase.from("profiles").delete().eq("id", id);
        if (profileError) {
          errors.push(`${id}: ${profileError.message}`);
        } else {
          deleted++;
        }
      } else {
        errors.push(`${id}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join("; "), deleted }, { status: errors.length === ids.length ? 500 : 207 });
    }

    return NextResponse.json({ success: true, deleted });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
