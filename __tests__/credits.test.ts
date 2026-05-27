import { describe, it, expect } from "vitest";

// credits.ts has a dependency on ./supabase which imports @supabase/ssr,
// so we test via dynamic import to allow module resolution.

describe("TIER_CONFIG", () => {
  it("has correct tier definitions", async () => {
    const { TIER_CONFIG } = await import("@/lib/credits");
    expect(TIER_CONFIG.free.name).toBe("Free");
    expect(TIER_CONFIG.free.dailyCredits).toBe(20);
    expect(TIER_CONFIG.free.monthlyCredits).toBeNull();
    expect(TIER_CONFIG.free.price).toBe(0);

    expect(TIER_CONFIG.basic.price).toBe(6);
    expect(TIER_CONFIG.basic.monthlyCredits).toBe(500);

    expect(TIER_CONFIG.premium.price).toBe(10);
    expect(TIER_CONFIG.premium.monthlyCredits).toBe(2000);

    expect(TIER_CONFIG.ultimate.price).toBe(20);
    expect(TIER_CONFIG.ultimate.monthlyCredits).toBe(5000);
  });

  it("free tier has dailyCredits", async () => {
    const { TIER_CONFIG } = await import("@/lib/credits");
    expect(TIER_CONFIG.free.dailyCredits).toBe(20);
  });

  it("paid tiers have no dailyCredits", async () => {
    const { TIER_CONFIG } = await import("@/lib/credits");
    expect(TIER_CONFIG.basic.dailyCredits).toBeNull();
    expect(TIER_CONFIG.premium.dailyCredits).toBeNull();
    expect(TIER_CONFIG.ultimate.dailyCredits).toBeNull();
  });
});

describe("getTierConfig", () => {
  it("returns correct tier by key", async () => {
    const { getTierConfig } = await import("@/lib/credits");
    expect(getTierConfig("free")?.name).toBe("Free");
    expect(getTierConfig("basic")?.price).toBe(6);
    expect(getTierConfig("premium")?.monthlyCredits).toBe(2000);
    expect(getTierConfig("ultimate")).toBeDefined();
  });
});

describe("canGenerate", () => {
  it("free tier with remaining daily returns allowed", async () => {
    const { canGenerate } = await import("@/lib/credits");
    expect(canGenerate("free", 0, 5).allowed).toBe(true);
  });

  it("free tier with exhausted daily returns not allowed", async () => {
    const { canGenerate } = await import("@/lib/credits");
    expect(canGenerate("free", 0, 20).allowed).toBe(false);
  });

  it("premium tier with credits returns allowed", async () => {
    const { canGenerate } = await import("@/lib/credits");
    expect(canGenerate("premium", 100, 999).allowed).toBe(true);
  });

  it("premium tier with no credits returns not allowed", async () => {
    const { canGenerate } = await import("@/lib/credits");
    expect(canGenerate("premium", 0, 0).allowed).toBe(false);
  });
});

describe("getCreditCount", () => {
  it("returns remaining daily for free tier", async () => {
    const { getCreditCount } = await import("@/lib/credits");
    expect(getCreditCount("free", { daily_used: 5, credits: 0 })).toBe(15);
  });

  it("returns credits for paid tier", async () => {
    const { getCreditCount } = await import("@/lib/credits");
    expect(getCreditCount("premium", { daily_used: 0, credits: 500 })).toBe(500);
  });
});

describe("getDeductFields", () => {
  it("returns daily_used increment for free tier", async () => {
    const { getDeductFields } = await import("@/lib/credits");
    expect(getDeductFields("free", 3)).toEqual({ daily_used: 3 });
  });

  it("returns negative credits for paid tier", async () => {
    const { getDeductFields } = await import("@/lib/credits");
    expect(getDeductFields("premium", 3)).toEqual({ credits: -3 });
  });
});
