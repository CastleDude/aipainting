import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;

// Prevent Cloudflare / CDN from caching auth endpoints
export const dynamic = "force-dynamic";
