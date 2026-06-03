// ── Creem Content Moderation ──────────────────────────────────
// https://docs.creem.io/features/moderation
// https://docs.creem.io/api-reference/endpoint/screen-prompt
//
// MANDATORY for compliance — all prompt-based generation endpoints
// MUST call checkContentModeration before processing.

interface ModerationResult {
  flagged: boolean;
  reason?: string;
}

/** Auto-detect environment from API key prefix */
function getModerationUrl(apiKey: string): string {
  // creem_test_* → sandbox, creem_* → production
  if (apiKey.startsWith("creem_test_")) {
    return "https://test-api.creem.io/v1/moderation/prompt";
  }
  return "https://api.creem.io/v1/moderation/prompt";
}

/**
 * Screen a prompt against Creem's Moderation API.
 *
 * - decision "allow" → pass
 * - decision "flag" or "deny" → block (Creem requires blocking both)
 * - API unreachable → fail closed in production, fail open in dev
 */
export async function checkContentModeration(
  prompt: string,
  _imageBase64?: string | null, // kept for backward compatibility, not sent to Creem
): Promise<ModerationResult> {
  const apiKey = process.env.CREEM_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[moderation] FATAL: CREEM_API_KEY not configured in production. ALL generation requests blocked.",
      );
      return {
        flagged: true,
        reason: "Content moderation is not configured. Please contact support.",
      };
    }
    console.warn("[moderation] CREEM_API_KEY not set — skipping moderation (dev only).");
    return { flagged: false };
  }

  const trimmed = prompt?.trim() || "";
  if (!trimmed || trimmed.length < 2) {
    console.warn("[moderation] Refusing empty or too-short prompt");
    return { flagged: true, reason: "Prompt is too short or empty" };
  }

  const url = getModerationUrl(apiKey);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout as per Creem docs

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ prompt: trimmed }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // 4xx — fail closed
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

    // 5xx — fail closed
    if (res.status >= 500) {
      console.error(`[moderation] Creem API server error (${res.status})`);
      return {
        flagged: true,
        reason: "Content moderation is temporarily unavailable. Please try again later.",
      };
    }

    const data = await res.json();
    const decision: string = data.decision || "";

    if (decision === "allow") {
      console.log("[moderation] Prompt allowed");
      return { flagged: false };
    }

    // "flag" or "deny" → block (Creem compliance requirement)
    console.warn(`[moderation] Prompt blocked — decision: ${decision}`);
    return {
      flagged: true,
      reason: "Content policy violation. This prompt has been flagged by our safety system.",
    };
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error(`[moderation] Request failed: ${errMsg}`);

    if (e instanceof DOMException && e.name === "AbortError") {
      return {
        flagged: true,
        reason: "Content moderation timed out. Please try again.",
      };
    }

    // Fail closed in production
    if (process.env.NODE_ENV === "production") {
      return {
        flagged: true,
        reason: "Content moderation is temporarily unavailable. Please try again later.",
      };
    }

    console.warn("[moderation] Network error in dev — allowing (fail-open for development)");
    return { flagged: false };
  }
}
