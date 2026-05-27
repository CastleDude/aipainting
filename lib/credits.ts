import { SubscriptionTier } from "./supabase";

export const TIER_CONFIG = {
  free: {
    name: "Free",
    dailyCredits: 20,
    monthlyCredits: null,
    price: 0,
    features: [
      "20 fast images per day",
      "Unlimited slow queue generation",
      "Basic image quality (up to 1024px)",
      "Standard models (Flux Schnell, Gemini Flash)",
      "Community support",
    ],
  },
  basic: {
    name: "Basic",
    dailyCredits: null,
    monthlyCredits: 500,
    price: 6,
    features: [
      "500 fast images per month",
      "Normal queue priority",
      "HD resolution (up to 1664px)",
      "Most models included",
      "No ads",
      "Email support",
    ],
  },
  premium: {
    name: "Premium",
    dailyCredits: null,
    monthlyCredits: 2000,
    price: 10,
    features: [
      "2,000 fast images per month",
      "Priority queue",
      "High resolution (up to 2048px)",
      "All models included",
      "No ads & no watermarks",
      "Fast AI photo editor",
      "Email support",
    ],
  },
  ultimate: {
    name: "Ultimate",
    dailyCredits: null,
    monthlyCredits: 5000,
    price: 20,
    features: [
      "5,000 fast images per month",
      "Highest priority queue",
      "Ultra HD resolution (up to 4096px)",
      "All models + early access to new models",
      "No ads & no watermarks",
      "Instant AI photo editor",
      "Advanced refine tools",
      "Complete privacy mode",
      "Priority support",
    ],
  },
} as const;

export function getTierConfig(tier: SubscriptionTier) {
  return TIER_CONFIG[tier];
}

export function canGenerate(
  tier: SubscriptionTier,
  remainingCredits: number,
  dailyUsed: number
): { allowed: boolean; reason?: string } {
  const config = TIER_CONFIG[tier];

  if (tier === "free") {
    if (dailyUsed >= config.dailyCredits!) {
      return {
        allowed: false,
        reason: `Daily limit reached (${config.dailyCredits} images). Upgrade to Premium for more.`,
      };
    }
  } else {
    if (remainingCredits <= 0) {
      return {
        allowed: false,
        reason: "Monthly credits exhausted. Upgrade or wait for renewal.",
      };
    }
  }

  return { allowed: true };
}

export function getCreditCount(tier: SubscriptionTier, profile: { daily_used: number; credits: number }) {
  if (tier === "free") {
    return Math.max(0, TIER_CONFIG.free.dailyCredits - profile.daily_used);
  }
  return profile.credits;
}

/**
 * Returns how many images can be generated in this request.
 * For free tier, deduct from daily_used. For paid tiers, deduct from credits.
 */
export function getDeductFields(tier: SubscriptionTier, count: number) {
  if (tier === "free") {
    return { daily_used: count };
  }
  return { credits: -count };
}
