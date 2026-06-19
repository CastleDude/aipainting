import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const i18nMiddleware = createMiddleware(routing);

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/admin"];

// Routes that require admin role
const ADMIN_ROUTES = ["/admin"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dev mock mode — skip all auth checks (development only)
  if (process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true") {
    if (process.env.NODE_ENV === "production") {
      // Safety: never allow mock user in production
      const response = i18nMiddleware(request);
      response.headers.set("X-Auth-Error", "mock_user_not_allowed_in_production");
      return response;
    }
    return i18nMiddleware(request);
  }

  // Normalize path by removing locale prefix
  const normalizedPath = pathname.replace(/^\/(en|zh|zh-Hant|ja|ko)/, "") || "/";

  const needsAuth = PROTECTED_ROUTES.some(
    (route) => normalizedPath === route || normalizedPath.startsWith(route + "/"),
  );
  const needsAdmin = ADMIN_ROUTES.some(
    (route) => normalizedPath === route || normalizedPath.startsWith(route + "/"),
  );

  if (needsAuth) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Skip auth if Supabase is not configured (dev without DB)
    if (!supabaseUrl || !supabaseKey) {
      return i18nMiddleware(request);
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value),
            );
          },
        },
      },
    );

    // Timeout after 3s to avoid hanging on slow auth API
    let user: { id: string } | null = null;
    let authChecked = false;
    try {
      const result = await Promise.race([
        supabase.auth.getUser(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("auth_timeout")), 3000)
        ),
      ]);
      user = result.data.user ?? null;
      authChecked = true;
    } catch {
      // Auth API slow or unreachable — redirect to home for safety
      const locale = pathname.match(/^\/(en|zh|zh-Hant|ja|ko)/)?.[1] || "en";
      const url = new URL(`/${locale}`, request.url);
      return NextResponse.redirect(url);
    }

    if (authChecked && !user) {
      const locale = pathname.match(/^\/(en|zh|zh-Hant|ja|ko)/)?.[1] || "en";
      const url = new URL(`/${locale}`, request.url);
      return NextResponse.redirect(url);
    }

    if (needsAdmin && user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        const locale = pathname.match(/^\/(en|zh|zh-Hant|ja|ko)/)?.[1] || "en";
        const url = new URL(`/${locale}`, request.url);
        return NextResponse.redirect(url);
      }
    }
  }

  return i18nMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
