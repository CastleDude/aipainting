// ── Creem Content Moderation + Local Blacklist ─────────────────
// https://docs.creem.io/features/moderation

import { checkRateLimit } from "./rate-limit";

interface ModerationResult {
  flagged: boolean;
  reason?: string;
}

// ── Local banned keywords (first-pass filter, Creem fallback) ──

const BANNED_PATTERNS = [
  /\b(nsfw|porn|xxx|sex|nude|naked|explicit)\b/i,
  /\b(child|underage|minor)\s*(porn|nude|sex)/i,
  /\b(violence|gore|murder|torture|blood)\b/i,
  /\b(terroris|bomb|weapon|massacre)\b/i,
  /\b(self.?harm|suicide|kill yourself)\b/i,
];

function checkLocalBlacklist(prompt: string): { flagged: boolean; reason?: string } {
  const trimmed = prompt?.trim().toLowerCase() || "";
  if (!trimmed || trimmed.length < 2) {
    return { flagged: true, reason: "Prompt is too short or empty" };
  }
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(trimmed)) {
      console.warn(`[moderation] Local blacklist match: ${trimmed.slice(0, 60)}`);
      return { flagged: true, reason: "Content policy violation. This prompt has been flagged by our safety system." };
    }
  }
  return { flagged: false };
}

// ── Rate limit for blocked attempts ──

function checkBlockedAttemptLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  // Allow max 5 blocked attempts per 10 minutes — exceed → temp ban
  const result = checkRateLimit(identifier, {
    key: "moderation_blocked",
    limit: 5,
    interval: 600, // 10 minutes
  });
  if (!result.allowed) {
    return { allowed: false, retryAfter: result.retryAfter };
  }
  return { allowed: true };
}

// ── Creem API ──────────────────────────────────────────────────

function getModerationUrl(apiKey: string): string {
  if (apiKey.startsWith("creem_test_")) {
    return "https://test-api.creem.io/v1/moderation/prompt";
  }
  return "https://api.creem.io/v1/moderation/prompt";
}

/**
 * Screen a prompt against Creem's Moderation API with local fallback.
 */
export async function checkContentModeration(
  prompt: string,
  _imageBase64?: string | null,
): Promise<ModerationResult> {
  // ── Step 1: Local blacklist (always active, instant) ──
  const local = checkLocalBlacklist(prompt);
  if (local.flagged) return local;

  // ── Step 2: Creem API (if configured) ──
  // Creem moderation disabled — too many false positives on legitimate prompts
  // (e.g., "fine dining gourmet" flagged as violation). Relying on local blacklist only.
  return { flagged: false };
  }

  const trimmed = prompt?.trim() || "";
  const url = getModerationUrl(apiKey);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ prompt: trimmed }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.status >= 400 && res.status < 500) {
      console.error(`[moderation] Creem client error ${res.status} — blocking`);
      return { flagged: true, reason: "Content moderation service error. Please try again later." };
    }

    if (res.status >= 500) {
      console.error(`[moderation] Creem server error ${res.status} — fail-open`);
      return { flagged: false }; // Fail-open on server errors
    }

    const data = await res.json();
    const decision: string = data.decision || "";

    if (decision === "allow") {
      return { flagged: false };
    }

    console.warn(`[moderation] Creem blocked — decision: ${decision}`);
    return { flagged: true, reason: "Content policy violation. This prompt has been flagged by our safety system." };
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error(`[moderation] Creem request failed: ${errMsg}`);

    if (e instanceof DOMException && e.name === "AbortError") {
      // Timeout — fail-open (don't block users for Creem being slow)
      console.warn("[moderation] Creem timed out — fail-open");
      return { flagged: false };
    }

    // Network error — fail-open in all environments
    console.warn("[moderation] Creem unreachable — fail-open, relying on local blacklist");
    return { flagged: false };
  }
}

/**
 * Check and enforce rate limits for blocked moderation attempts.
 * Call AFTER blocking a prompt to track the violation.
 * Returns true if the user should be temporarily banned.
 */
export function trackBlockedAttempt(identifier: string): { banned: boolean; retryAfter?: number } {
  const result = checkBlockedAttemptLimit(identifier);
  return { banned: !result.allowed, retryAfter: result.retryAfter };
}
