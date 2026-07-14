import { describe, it, expect } from "vitest";

describe("RUNWARE_MODEL_MAP", () => {
  it("maps all three base models", async () => {
    const { RUNWARE_MODEL_MAP } = await import("@/lib/runware");
    expect(RUNWARE_MODEL_MAP).toHaveProperty("schnell");
    expect(RUNWARE_MODEL_MAP).toHaveProperty("sdxl");
    expect(RUNWARE_MODEL_MAP).toHaveProperty("flux-dev");
    expect(RUNWARE_MODEL_MAP["schnell"]).toBe("runware:100@1");
    expect(RUNWARE_MODEL_MAP["sdxl"]).toBe("civitai:133005@782002");
    expect(RUNWARE_MODEL_MAP["flux-dev"]).toBe("runware:101@1");
  });
});

describe("AI_MODELS", () => {
  it("has all 6 models", async () => {
    const { AI_MODELS } = await import("@/lib/openrouter");
    const keys = Object.keys(AI_MODELS);
    expect(keys).toHaveLength(6);
    expect(keys).toContain("schnell");
    expect(keys).toContain("sdxl");
    expect(keys).toContain("flux-dev");
    expect(keys).toContain("seedream");
    expect(keys).toContain("nano-banana");
    expect(keys).toContain("nano-banana2");
  });

  it("Runware models have provider Runware", async () => {
    const { AI_MODELS } = await import("@/lib/openrouter");
    expect(AI_MODELS["schnell"].provider).toBe("Runware");
    expect(AI_MODELS["sdxl"].provider).toBe("Runware");
    expect(AI_MODELS["flux-dev"].provider).toBe("Runware");
  });

  it("RUNWARE_MODELS set contains the 3 base models", async () => {
    const { RUNWARE_MODELS } = await import("@/lib/openrouter");
    expect(RUNWARE_MODELS.has("schnell")).toBe(true);
    expect(RUNWARE_MODELS.has("sdxl")).toBe(true);
    expect(RUNWARE_MODELS.has("flux-dev")).toBe(true);
    expect(RUNWARE_MODELS.has("seedream")).toBe(false);
    expect(RUNWARE_MODELS.size).toBe(3);
  });
});

describe("ASPECT_RATIOS", () => {
  it("has all required ratios", async () => {
    const { ASPECT_RATIOS } = await import("@/lib/openrouter");
    const values = ASPECT_RATIOS.map((r) => r.value);
    expect(values).toContain("1:1");
    expect(values).toContain("16:9");
    expect(values).toContain("9:16");
    expect(values).toContain("4:3");
    expect(values).toContain("3:4");
  });

  it("has 8 ratios", async () => {
    const { ASPECT_RATIOS } = await import("@/lib/openrouter");
    expect(ASPECT_RATIOS).toHaveLength(8);
  });
});

describe("STYLES", () => {
  it("has style definitions", async () => {
    const { STYLES } = await import("@/lib/openrouter");
    expect(STYLES.length).toBeGreaterThanOrEqual(6);
    const values = STYLES.map((s) => s.value);
    expect(values).toContain("photorealistic");
    expect(values).toContain("anime");
  });
});
