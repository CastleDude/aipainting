import { describe, it, expect } from "vitest";

// credits.ts has a dependency on ./supabase which imports @supabase/ssr,
// so we test via dynamic import to allow module resolution.

describe("TIER_CONFIG", () => {
  it("has correct tier definitions", async () => {
    const { TIER_CONFIG } = await import("@/lib/credits");
    expect(TIER_CONFIG.free.name).toBe("Free");
    expect(TIER_CONFIG.free.monthlyCredits).toBe(10);
    expect(TIER_CONFIG.free.price).toBe(0);

    expect(TIER_CONFIG.basic.price).toBe(6);
    expect(TIER_CONFIG.basic.monthlyCredits).toBe(500);

    expect(TIER_CONFIG.premium.price).toBe(10);
    expect(TIER_CONFIG.premium.monthlyCredits).toBe(2000);

    expect(TIER_CONFIG.ultimate.price).toBe(20);
    expect(TIER_CONFIG.ultimate.monthlyCredits).toBe(5000);
  });

  it("all tiers have monthlyCredits", async () => {
    const { TIER_CONFIG, TIER_MONTHLY_CREDITS } = await import("@/lib/credits");
    expect(TIER_MONTHLY_CREDITS.free).toBe(10);
    expect(TIER_MONTHLY_CREDITS.basic).toBe(500);
    expect(TIER_MONTHLY_CREDITS.premium).toBe(2000);
    expect(TIER_MONTHLY_CREDITS.ultimate).toBe(5000);
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
  it("returns allowed when credits remain", async () => {
    const { canGenerate } = await import("@/lib/credits");
    expect(canGenerate("free", 100).allowed).toBe(true);
    expect(canGenerate("premium", 500).allowed).toBe(true);
  });

  it("returns not allowed when credits exhausted", async () => {
    const { canGenerate } = await import("@/lib/credits");
    expect(canGenerate("free", 0).allowed).toBe(false);
    expect(canGenerate("premium", 0).allowed).toBe(false);
  });
});

describe("getCreditCount", () => {
  it("returns credits for all tiers", async () => {
    const { getCreditCount } = await import("@/lib/credits");
    expect(getCreditCount("free", { credits: 10 })).toBe(10);
    expect(getCreditCount("premium", { credits: 500 })).toBe(500);
  });
});

describe("computeDeduction", () => {
  it("applies model multiplier correctly", async () => {
    const { computeDeduction } = await import("@/lib/credits");
    // 4 images × 1 preset × 1 model = 4
    expect(computeDeduction(4, "schnell", 1)).toBe(4);
    // 1 image × 1 preset × 3 model = 3
    expect(computeDeduction(1, "flux-dev", 1)).toBe(2);
    // 2 images × 2 preset × 3 model = 12
    expect(computeDeduction(2, "flux-dev", 2)).toBe(8);
  });

  it("handles unknown model as 1x multiplier", async () => {
    const { computeDeduction } = await import("@/lib/credits");
    expect(computeDeduction(1, "unknown-model", 1)).toBe(1);
  });

  it("minimum deduction is 1", async () => {
    const { computeDeduction } = await import("@/lib/credits");
    expect(computeDeduction(0, "schnell", 1)).toBe(1);
  });
});
