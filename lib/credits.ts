import { SubscriptionTier } from "./supabase";
import { MODEL_COST_MULTIPLIER } from "./openrouter";

/** Credit amount per reset cycle for each tier */
export const TIER_CREDIT_AMOUNT: Record<SubscriptionTier, number> = {
  free: 10,      // 10/day
  basic: 500,    // 500/month
  premium: 2000, // 2000/month
  ultimate: 5000,// 5000/month
};

/** Reset interval in milliseconds for each tier */
export const TIER_RESET_MS: Record<SubscriptionTier, number> = {
  free: 24 * 60 * 60 * 1000,       // 24 hours
  basic: 30 * 24 * 60 * 60 * 1000, // 30 days
  premium: 30 * 24 * 60 * 60 * 1000,
  ultimate: 30 * 24 * 60 * 60 * 1000,
};

// Legacy alias
export const TIER_MONTHLY_CREDITS = TIER_CREDIT_AMOUNT;

export const TIER_CONFIG = {
  free: {
    name: "Free",
    monthlyCredits: 10,
    price: 0,
    features: [
      "10 credits per day",
      "Credit pooling for all features",
      "Basic models (Flux Schnell, Gemini Flash)",
      "Basic image quality (up to 1024px)",
      "Community support",
    ],
  },
  basic: {
    name: "Basic",
    monthlyCredits: 500,
    price: 6,
    features: [
      "500 credits per month",
      "All AI models included",
      "HD resolution (up to 1664px)",
      "AI image tools included",
      "No ads",
      "Email support",
    ],
  },
  premium: {
    name: "Premium",
    monthlyCredits: 2000,
    price: 10,
    features: [
      "2,000 credits per month",
      "All premium models included",
      "High resolution (up to 2048px)",
      "AI photo editor included",
      "No watermarks",
      "Priority queue",
      "Email support",
    ],
  },
  ultimate: {
    name: "Ultimate",
    monthlyCredits: 5000,
    price: 20,
    features: [
      "5,000 credits per month",
      "All models + early access",
      "Ultra HD resolution (up to 4096px)",
      "All AI tools + refine tools",
      "Complete privacy mode",
      "No watermarks",
      "Top priority queue",
      "Priority support",
    ],
  },
} as const;

export function getTierConfig(tier: SubscriptionTier) {
  return TIER_CONFIG[tier];
}

/**
 * Compute total credit deduction for one generation request.
 * Formula: numImages × presetMultiplier × modelMultiplier
 */
export function computeDeduction(
  numImages: number,
  model: string,
  presetMultiplier: number = 1,
): number {
  const modelMult = MODEL_COST_MULTIPLIER[model] || 1;
  return Math.max(1, Math.ceil(numImages * presetMultiplier * modelMult));
}

/** Tool-specific credit costs */
export const TOOL_CREDIT_COST: Record<string, number> = {
  remove_bg: 1,
  replace_bg: 2,
  smooth: 3,
  upscale: 2,
  filters: 0,   // free (client-side)
  crop: 0,      // free (client-side)
  compress: 0,  // free (client-side)
};

export function canGenerate(
  tier: SubscriptionTier,
  remainingCredits: number,
): { allowed: boolean; reason?: string } {
  if (remainingCredits <= 0) {
    if (tier === "free") {
      return {
        allowed: false,
        reason: "Monthly credits exhausted. Upgrade for more.",
      };
    }
    return {
      allowed: false,
      reason: "Monthly credits exhausted. Upgrade or wait for renewal.",
    };
  }
  return { allowed: true };
}

export function getCreditCount(tier: SubscriptionTier, profile: { credits: number }) {
  return profile.credits;
}

/** Always deduct from credits — unified for all tiers */
export function getDeductFields(tier: SubscriptionTier, count: number) {
  return { credits: -count };
}

/**
 * Check if credit reset is needed (daily for free, monthly for paid).
 * Returns the new credit balance if reset was applied, or null if no reset needed.
 */
export function shouldResetCredits(
  daily_reset_at: string | null,
  tier: SubscriptionTier,
): number | null {
  if (!daily_reset_at) return null;
  const resetAt = new Date(daily_reset_at);
  const interval = TIER_RESET_MS[tier];
  if (Date.now() - resetAt.getTime() > interval) {
    return TIER_CREDIT_AMOUNT[tier];
  }
  return null;
}
