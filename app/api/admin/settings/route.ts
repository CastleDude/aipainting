import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { verifyAdmin } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
  const adminId = await verifyAdmin(request);
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseStatus: Record<string, unknown> = {};
  const creemStatus: Record<string, unknown> = {};
  const authStatus: Record<string, unknown> = {};
  const devStatus: Record<string, unknown> = {};
  const appStatus: Record<string, unknown> = {};

  // Supabase connection
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  supabaseStatus.configured = Boolean(supabaseUrl && supabaseKey);
  supabaseStatus.url = supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : null;
  supabaseStatus.service_role = Boolean(serviceRoleKey);

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll() {}, // no-op: status check only, no cookie persistence needed
        },
      });
      const { count, error } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      supabaseStatus.connected = !error;
      supabaseStatus.userCount = count ?? 0;
      if (error) supabaseStatus.error = error.message;
    } catch (e) {
      supabaseStatus.connected = false;
      supabaseStatus.error = String(e);
    }
  } else {
    supabaseStatus.connected = false;
  }

  // Creem payment
  creemStatus.configured = Boolean(process.env.CREEM_API_KEY && process.env.CREEM_WEBHOOK_SECRET);

  // Auth providers
  authStatus.email = true;
  authStatus.google = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && serviceRoleKey,
  );

  // Dev mode
  devStatus.mock_user = process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true";

  // App info
  appStatus.node_env = process.env.NODE_ENV || "development";
  appStatus.next_version = "16";

  return NextResponse.json({
    supabase: supabaseStatus,
    creem: creemStatus,
    auth: authStatus,
    dev: devStatus,
    app: appStatus,
  });
}
