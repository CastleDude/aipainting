import { auth } from "@/lib/auth";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextRequest, NextResponse } from "next/server";
import { logVisit } from "@/lib/analytics";

const i18nMiddleware = createMiddleware(routing);

const PROTECTED_ROUTES = ["/dashboard", "/admin", "/history"];
const ADMIN_ROUTES = ["/admin"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dev mock mode — skip all auth checks
  if (process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true") {
    if (process.env.NODE_ENV === "production") {
      const response = i18nMiddleware(request);
      response.headers.set("X-Auth-Error", "mock_user_not_allowed_in_production");
      return response;
    }
    return i18nMiddleware(request);
  }

  const normalizedPath = pathname.replace(/^\/(en|zh|zh-Hant|ja|ko)/, "") || "/";
  const needsAuth = PROTECTED_ROUTES.some((r) => normalizedPath === r || normalizedPath.startsWith(r + "/"));
  const needsAdmin = ADMIN_ROUTES.some((r) => normalizedPath === r || normalizedPath.startsWith(r + "/"));

  if (needsAuth) {
    const session = await auth();
    if (!session?.user) {
      const locale = pathname.match(/^\/(en|zh|zh-Hant|ja|ko)/)?.[1] || "en";
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }

    if (needsAdmin) {
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const { rows: [profile] } = await pool.query("SELECT role FROM profiles WHERE id = $1", [(session.user as any).id]);
      await pool.end();
      if (profile?.role !== "admin") {
        const locale = pathname.match(/^\/(en|zh|zh-Hant|ja|ko)/)?.[1] || "en";
        return NextResponse.redirect(new URL(`/${locale}`, request.url));
      }
    }
  }

  // Log visitor analytics (fire-and-forget, non-blocking)
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "127.0.0.1";
  logVisit({
    ip: clientIp,
    page: request.nextUrl.pathname,
    referrer: request.headers.get("referer") || undefined,
    userAgent: request.headers.get("user-agent") || undefined,
  });

  return i18nMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
