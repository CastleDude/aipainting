// ── Creem Content Moderation ──────────────────────────────────
// https://docs.creem.io/features/moderation

const CREEM_MODERATION_URL = "https://api.creem.io/v1/moderation/check";

interface ModerationResult {
  flagged: boolean;
  reason?: string;
}

export async function checkContentModeration(
  prompt: string,
  imageBase64?: string | null,
): Promise<ModerationResult> {
  const apiKey = process.env.CREEM_API_KEY;
  if (!apiKey) {
    // If Creem is not configured, skip moderation (dev mode / pre-launch)
    console.warn("[moderation] CREEM_API_KEY not set — skipping content moderation");
    return { flagged: false };
  }

  try {
    const body: Record<string, unknown> = { prompt };
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
    });

    if (!res.ok) {
      // If moderation API fails, log and allow (fail-open for now)
      console.error("[moderation] API error:", res.status, await res.text().catch(() => ""));
      return { flagged: false };
    }

    const data = await res.json();
    // Creem returns { flagged: boolean, categories?: string[], ... }
    if (data.flagged) {
      return {
        flagged: true,
        reason: data.categories?.join(", ") || "Content policy violation",
      };
    }

    return { flagged: false };
  } catch (e) {
    console.error("[moderation] Request failed:", (e as Error).message);
    return { flagged: false };
  }
}
