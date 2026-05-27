import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  // Collect outgoing cookies — cannot use request.cookies.set() because
  // NextResponse.redirect() creates a fresh response that ignores them.
  let responseCookies: { name: string; value: string; options?: Record<string, unknown> }[] = [];

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        responseCookies = cookiesToSet;
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth] exchangeCodeForSession failed:", error.message);
  }

  const response = NextResponse.redirect(new URL(next, requestUrl.origin));

  // Apply the auth cookies to the redirect response
  for (const { name, value, options } of responseCookies) {
    response.cookies.set(name, value, options ?? {});
  }

  return response;
}
