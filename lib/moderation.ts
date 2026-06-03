// ── Creem Content Moderation ──────────────────────────────────
// https://docs.creem.io/features/moderation
//
// This is MANDATORY for compliance — all prompt-based generation
// endpoints MUST call checkContentModeration before processing.

const CREEM_MODERATION_URL = "https://api.creem.io/v1/moderation/check";

interface ModerationResult {
  flagged: boolean;
  reason?: string;
}

/**
 * Check content against Creem's moderation API.
 *
 * Behavior:
 * - CREEM_API_KEY not set → FAIL CLOSED in production (block all), warn in dev
 * - API call succeeds → respect the flagged/categories response
 * - API call fails (network error, 5xx) → FAIL CLOSED (block to be safe)
 * - API returns 4xx (bad request) → log and FAIL CLOSED
 */
export async function checkContentModeration(
  prompt: string,
  imageBase64?: string | null,
): Promise<ModerationResult> {
  const apiKey = process.env.CREEM_API_KEY;

  if (!apiKey) {
    // In production, missing API key is a compliance violation — BLOCK all content
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[moderation] FATAL: CREEM_API_KEY not configured in production. ALL generation requests blocked for safety compliance.",
      );
      return {
        flagged: true,
        reason: "Content moderation is not configured. Please contact support.",
      };
    }
    // Dev mode: warn but allow (so local development works without Creem key)
    console.warn(
      "[moderation] CREEM_API_KEY not set — skipping content moderation (dev only).",
    );
    return { flagged: false };
  }

  // Sanity check: refuse obviously empty/garbage prompts
  const trimmed = prompt?.trim() || "";
  if (!trimmed || trimmed.length < 2) {
    console.warn("[moderation] Refusing empty or too-short prompt");
    return { flagged: true, reason: "Prompt is too short or empty" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout

    const body: Record<string, unknown> = { prompt: trimmed };
    if (imageBase64) {
      body.image = imageBase64;
    }

    const res = await fetch(CREEM_MODERATION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // 4xx errors (bad request, auth failure) — log and fail closed
    if (res.status >= 400 && res.status < 500) {
      const errText = await res.text().catch(() => "");
      console.error(
        `[moderation] Creem API client error (${res.status}): ${errText.slice(0, 300)}`,
      );
      return {
        flagged: true,
        reason: "Content moderation service error. Please try again later.",
      };
    }

    // 5xx errors — fail closed
    if (res.status >= 500) {
      console.error(`[moderation] Creem API server error (${res.status})`);
      return {
        flagged: true,
        reason: "Content moderation is temporarily unavailable. Please try again later.",
      };
    }

    const data = await res.json();

    if (data.flagged) {
      const categories = Array.isArray(data.categories)
        ? data.categories.join(", ")
        : "";
      console.warn(
        `[moderation] Content FLAGGED — categories: ${categories || "unspecified"}`,
      );
      return {
        flagged: true,
        reason: categories || "Content policy violation",
      };
    }

    console.log("[moderation] Content passed moderation check");
    return { flagged: false };
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error(`[moderation] Request failed: ${errMsg}`);

    // Timeout → fail closed
    if (e instanceof DOMException && e.name === "AbortError") {
      return {
        flagged: true,
        reason: "Content moderation timed out. Please try again.",
      };
    }

    // Network errors → fail closed in production, fail open in dev
    if (process.env.NODE_ENV === "production") {
      return {
        flagged: true,
        reason: "Content moderation is temporarily unavailable. Please try again later.",
      };
    }

    // Dev: fail open on network errors to allow local development
    console.warn("[moderation] Network error in dev — allowing (fail-open for development)");
    return { flagged: false };
  }
}
