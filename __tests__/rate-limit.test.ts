import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => null,
}));

beforeEach(() => {
  vi.resetModules();
});

describe("checkRateLimit", () => {
  it("allows first request", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const result = checkRateLimit("127.0.0.1", { limit: 5, interval: 60, key: "test" });
    expect(result.allowed).toBe(true);
  });

  it("allows requests up to limit", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit("127.0.0.2", { limit: 5, interval: 60, key: "test" });
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks requests over limit", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    for (let i = 0; i < 5; i++) {
      checkRateLimit("127.0.0.3", { limit: 5, interval: 60, key: "test" });
    }
    const result = checkRateLimit("127.0.0.3", { limit: 5, interval: 60, key: "test" });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(60);
    }
  });

  it("resets after interval expiry", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const config = { limit: 2, interval: 1, key: "test-expire" };
    checkRateLimit("127.0.0.4", config);
    checkRateLimit("127.0.0.4", config);
    const blocked = checkRateLimit("127.0.0.4", config);
    expect(blocked.allowed).toBe(false);

    await new Promise((r) => setTimeout(r, 1100));
    const allowed = checkRateLimit("127.0.0.4", config);
    expect(allowed.allowed).toBe(true);
  });

  it("isolates different keys", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const keyA = { limit: 3, interval: 60, key: "keyA" };
    const keyB = { limit: 1, interval: 60, key: "keyB" };

    checkRateLimit("127.0.0.5", keyA);
    checkRateLimit("127.0.0.5", keyA);
    checkRateLimit("127.0.0.5", keyA);
    expect(checkRateLimit("127.0.0.5", keyA).allowed).toBe(false);

    expect(checkRateLimit("127.0.0.5", keyB).allowed).toBe(true);
  });

  it("isolates different IPs", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const config = { limit: 1, interval: 60, key: "test-ip" };

    checkRateLimit("10.0.0.1", config);
    expect(checkRateLimit("10.0.0.1", config).allowed).toBe(false);
    expect(checkRateLimit("10.0.0.2", config).allowed).toBe(true);
  });
});

describe("RATE_LIMITS presets", () => {
  it("has 4 presets", async () => {
    const { RATE_LIMITS } = await import("@/lib/rate-limit");
    const keys = Object.keys(RATE_LIMITS);
    expect(keys).toHaveLength(4);
    expect(keys).toContain("generate");
    expect(keys).toContain("imageTools");
    expect(keys).toContain("translate");
    expect(keys).toContain("checkout");
  });

  it("all presets have valid config", async () => {
    const { RATE_LIMITS } = await import("@/lib/rate-limit");
    for (const config of Object.values(RATE_LIMITS)) {
      expect(config.limit).toBeGreaterThan(0);
      expect(config.interval).toBeGreaterThan(0);
      expect(typeof config.key).toBe("string");
    }
  });

  it("generate limit is most permissive", async () => {
    const { RATE_LIMITS } = await import("@/lib/rate-limit");
    expect(RATE_LIMITS.generate.limit).toBeGreaterThanOrEqual(10);
  });
});
