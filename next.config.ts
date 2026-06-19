import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Build-time validation for critical environment variables
const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];
const missingVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  console.warn(
    `[build] WARNING: Missing environment variables: ${missingVars.join(", ")}. ` +
    "Auth and database features will not work. See .env.example for setup.",
  );
}

if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true") {
  throw new Error(
    "NEXT_PUBLIC_DEV_MOCK_USER=true is not allowed in production. " +
    "This bypasses all authentication. Unset this variable and rebuild.",
  );
}

const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "connect-src 'self' https://*.supabase.co https://*.runware.ai https://*.novita.ai https://*.openrouter.ai https://api.creem.io https://static.cloudflareinsights.com",
  "media-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // No standalone — use `next start` directly
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.runware.ai" },
      { protocol: "https", hostname: "*.openrouter.ai" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: cspHeader },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
