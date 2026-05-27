import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { canGenerate, getDeductFields, getCreditCount } from "@/lib/credits";
import { createJob, enqueueJob } from "@/lib/queue";
import type { SubscriptionTier } from "@/lib/supabase";
import { STYLE_PROMPTS, RUNWARE_MODELS } from "@/lib/openrouter";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { generateRunware } from "@/lib/runware";

// ── Config ──────────────────────────────────────────────

const OPENROUTER_MODELS: Record<string, { id: string; modalities: string[] }> = {
  seedream: { id: "bytedance-seed/seedream-4.5", modalities: ["image"] },
  "nano-banana": { id: "google/gemini-2.5-flash-image", modalities: ["image", "text"] },
  "nano-banana2": { id: "google/gemini-3.1-flash-image-preview", modalities: ["image", "text"] },
  "banana-pro": { id: "google/gemini-3-pro-image-preview", modalities: ["image", "text"] },
  "gpt-image": { id: "openai/gpt-5-image-mini", modalities: ["image", "text"] },
  "gpt-image-pro": { id: "openai/gpt-5-image", modalities: ["image", "text"] },
};

// ── Clients ─────────────────────────────────────────────

let _openrouter: OpenAI | null = null;
function getOpenRouter(): OpenAI {
  if (!_openrouter) {
    _openrouter = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY || "",
    });
  }
  return _openrouter;
}

// ── OpenRouter ──────────────────────────────────────────

// Pixel dimensions per aspect ratio (used as native params for models that support them)
const ASPECT_PIXELS: Record<string, { width: number; height: number }> = {
  "1:1": { width: 2048, height: 2048 },
  "4:3": { width: 2304, height: 1728 },
  "16:9": { width: 2560, height: 1440 },
  "9:16": { width: 1440, height: 2560 },
  "3:4": { width: 1728, height: 2304 },
  "2:3": { width: 1664, height: 2496 },
  "3:2": { width: 2496, height: 1664 },
  "21:9": { width: 3024, height: 1296 },
};

async function generateOpenRouter(
  model: string,
  prompt: string,
  negativePrompt: string | undefined,
  aspectRatio: string,
  n: number,
  refImage?: string
): Promise<string[]> {
  const cfg = OPENROUTER_MODELS[model] || OPENROUTER_MODELS["seedream"];
  const negPrompt = negativePrompt?.trim();
  const dims = ASPECT_PIXELS[aspectRatio] || ASPECT_PIXELS["1:1"];
  const images: string[] = [];

  for (let i = 0; i < n; i++) {
    const userContent: Array<Record<string, unknown>> = [
      { type: "text", text: prompt },
    ];
    if (refImage) {
      userContent.push({ type: "image_url", image_url: { url: refImage } });
    }
    if (negPrompt) {
      userContent.push({ type: "text", text: `Avoid: ${negPrompt}` });
    }

    const params: Record<string, unknown> = {
      model: cfg.id,
      modalities: cfg.modalities,
      messages: [{ role: "user", content: userContent }],
      max_tokens: 8192,
    };

    // Pass native width/height for Seedream (supports pixel dimensions)
    if (model === "seedream") {
      params.width = dims.width;
      params.height = dims.height;
    }

    const response = await getOpenRouter().chat.completions.create(params as never);

    const message = response.choices[0]?.message;
    if (!message) continue;

    const raw = message as unknown as Record<string, unknown>;
    if (Array.isArray(raw.images)) {
      for (const img of raw.images as Array<{ image_url?: { url?: string } }>) {
        if (img.image_url?.url) images.push(img.image_url.url);
      }
      continue;
    }

    if (Array.isArray(message.content)) {
      for (const part of message.content) {
        if (part.type === "image_url" && part.image_url?.url) {
          images.push(part.image_url.url);
        }
      }
    } else if (typeof message.content === "string") {
      const base64Match = message.content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
      if (base64Match) { images.push(base64Match[0]); continue; }
      const mdMatch = message.content.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
      if (mdMatch) { images.push(mdMatch[1]); continue; }
      const urlMatch = message.content.match(/https?:\/\/[^\s]+\.(png|jpg|jpeg|gif|webp)(\?[^\s]*)?/i);
      if (urlMatch) images.push(urlMatch[0]);
    }
  }

  return images;
}

// ── Error classifier ────────────────────────────────────

function classifyError(status: number, message: string) {
  const lower = message.toLowerCase();

  if (status === 403) {
    if (lower.includes("region") || lower.includes("location")) {
      return { code: "region_blocked", userMessage: "This model is not available in your region. Try Flux Schnell — it works globally for free." };
    }
    return { code: "access_denied", userMessage: "Access restricted. Try switching to Flux Schnell (free, no region limits)." };
  }
  if (status === 404) {
    return { code: "model_not_found", userMessage: "Model unavailable. Try Flux Schnell instead." };
  }
  if (status === 429) {
    return { code: "rate_limited", userMessage: "Too many requests. Please wait a moment." };
  }
  if (status === 402) {
    return { code: "quota_exceeded", userMessage: "API credits exhausted. Switch to Flux Schnell — it's completely free." };
  }
  if (lower.includes("timeout")) {
    return { code: "timeout", userMessage: "Generation timed out. Please try again." };
  }
  return { code: "server_error", userMessage: "Something went wrong. Please try again or switch models." };
}

// ── Handler ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, negativePrompt, model = "schnell", aspectRatio = "1:1", numImages = 4, speedMode, imageBase64, isPublic, async: asyncMode } = body;

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Please enter a prompt", code: "empty_prompt" }, { status: 400 });
    }

    // ── Rate limit ──
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkRateLimit(clientIp, RATE_LIMITS.generate);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: rl.retryAfter },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
      );
    }

    // ── Credit check (skip if Supabase not configured) ──
    let creditResult: { daily_used?: number; credits?: number } | undefined;

    // Dev mock mode — request-scoped credit tracking via cookie
    if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true") {
      const numToGenerate = speedMode === "fast" ? 1 : (numImages || 1);
      // Read current daily_used from cookie to persist across requests
      const cookieName = "mock_daily_used";
      const cookieVal = req.cookies.get(cookieName)?.value;
      let dailyUsed = parseInt(cookieVal || "0", 10) || 0;
      dailyUsed += numToGenerate;
      creditResult = { daily_used: dailyUsed };
      // Will set cookie in response
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let genUserId: string | undefined;

    if (supabaseUrl && supabaseKey && process.env.NEXT_PUBLIC_DEV_MOCK_USER !== "true") {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() { return req.cookies.getAll(); },
          setAll() {},
        },
      });

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
      genUserId = user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, tier, credits, daily_used, daily_reset_at")
        .eq("id", user.id)
        .single();

      if (profile) {
        const tier = profile.tier as SubscriptionTier;
        const numToGenerate = speedMode === "fast" ? 1 : (numImages || 1);
        let currentCredits = profile.credits;
        let currentDailyUsed = profile.daily_used;

        // Check daily reset for free users
        if (tier === "free" && profile.daily_reset_at) {
          const resetAt = new Date(profile.daily_reset_at as unknown as string);
          if (resetAt < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
            await supabase.from("profiles").update({ daily_used: 0, daily_reset_at: new Date().toISOString() }).eq("id", user.id);
            currentDailyUsed = 0;
          }
        }

        const result = canGenerate(tier, currentCredits, currentDailyUsed);
        if (!result.allowed) {
          return NextResponse.json(
            { error: result.reason, code: "credit_exhausted" },
            { status: 402 },
          );
        }

        // Deduct before generating to prevent double-spend
        const deduct = getDeductFields(tier, numToGenerate);
        if (Object.keys(deduct).length > 0) {
          const updates: Record<string, number> = {};
          if (deduct.daily_used) {
            currentDailyUsed += deduct.daily_used;
            updates.daily_used = currentDailyUsed;
          }
          if (deduct.credits) {
            currentCredits = Math.max(0, currentCredits + deduct.credits);
            updates.credits = currentCredits;
          }
          await supabase.from("profiles").update(updates).eq("id", user.id);

          if (deduct.credits) {
            await supabase.from("credit_logs").insert({
              id: `gen_${Date.now()}_${user.id.slice(0, 8)}`,
              user_id: user.id,
              amount: deduct.credits,
              reason: `Generate ${numToGenerate} image(s) — tier: ${tier}`,
            });
          }
        }

        creditResult = { daily_used: currentDailyUsed, credits: currentCredits };
      }
    }
    }

    // Build style hint from STYLE_PROMPTS map (strong descriptive prompts)
    const rawStyle: string = body.style || "";
    const styleKey = rawStyle.replace(/-/g, " ");
    const styleHint = rawStyle && rawStyle !== "photorealistic" && STYLE_PROMPTS[styleKey]
      ? ` in ${STYLE_PROMPTS[styleKey]}`
      : "";

    // ── Async mode: enqueue and return job ID ──
    if (asyncMode && speedMode !== "fast") {
      const job = createJob(genUserId);
      const genFn = async () => {
        let genImages: string[];
        if (RUNWARE_MODELS.has(model)) {
          genImages = await generateRunware(`${prompt.trim()}${styleHint}. High quality, detailed.`, model, aspectRatio, numImages, negativePrompt);
        } else {
          const arHint = `Create a ${aspectRatio} aspect ratio image: `;
          const fullPrompt = `${arHint}${prompt.trim()}${styleHint}. High quality, detailed.`;
          genImages = await generateOpenRouter(model, fullPrompt, negativePrompt, aspectRatio, numImages, imageBase64);
        }
        if (genImages.length === 0) throw Object.assign(new Error("No images returned"), { code: "no_output" });

        // Save to generations (best-effort)
        let saved = 0;
        const savedIds: string[] = [];
        if (supabaseUrl && supabaseKey && process.env.NEXT_PUBLIC_DEV_MOCK_USER !== "true") {
          try {
            const supabase = createServerClient(supabaseUrl, supabaseKey, { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } });
            const { data: { user: saveUser } } = await supabase.auth.getUser();
            if (saveUser) {
              for (const url of genImages) {
                const { data: inserted, error: insertErr } = await supabase.from("generations").insert({ user_id: saveUser.id, prompt: prompt.trim(), model, image_url: url, is_public: isPublic || false }).select("id").single();
                if (insertErr) {
                  console.error("[generate] Failed to save generation:", JSON.stringify(insertErr));
                } else {
                  saved++;
                  if (inserted) savedIds.push(inserted.id);
                }
              }
              if (saved > 0) {
                const { data: genList } = await supabase.from("generations").select("id").eq("user_id", saveUser.id).order("created_at", { ascending: false }).range(20, 999999);
                if (genList && genList.length > 0) await supabase.from("generations").delete().in("id", genList.map((g: { id: string }) => g.id));
              }
            } else {
              console.warn("[generate] User not authenticated, skipping save to generations");
            }
          } catch (e) {
            console.error("[generate] Save to generations failed:", e instanceof Error ? e.message : e);
          }
        }

        return { id: job.id, status: "completed" as const, images: genImages, daily_used: creditResult?.daily_used, credits: creditResult?.credits, saved, generationIds: savedIds, createdAt: job.createdAt };
      };

      enqueueJob(job, genFn);
      return NextResponse.json({ jobId: job.id, status: "pending" });
    }

    let images: string[];

    const genN = speedMode === "fast" ? 1 : numImages;
    if (RUNWARE_MODELS.has(model)) {
      const genRatio = speedMode === "fast" ? "1:1" : aspectRatio;
      images = await generateRunware(`${prompt.trim()}${styleHint}. High quality, detailed.`, model, genRatio, genN, negativePrompt);
    } else {
      // For OpenRouter models, embed aspect ratio in the prompt
      const arHint = `Create a ${aspectRatio} aspect ratio image: `;
      const fullPrompt = `${arHint}${prompt.trim()}${styleHint}. High quality, detailed.`;
      images = await generateOpenRouter(model, fullPrompt, negativePrompt, aspectRatio, genN, imageBase64);
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: "No images returned. Try a different prompt.", code: "no_output" },
        { status: 500 }
      );
    }

    // ── Save to generations table (best-effort, last 20 per user) ──
    let saved = 0;
    const savedIds: string[] = [];
    if (supabaseUrl && supabaseKey && process.env.NEXT_PUBLIC_DEV_MOCK_USER !== "true") {
      try {
        const supabase = createServerClient(supabaseUrl, supabaseKey, {
          cookies: {
            getAll() { return req.cookies.getAll(); },
            setAll() {},
          },
        });
        const { data: { user: saveUser } } = await supabase.auth.getUser();
        if (saveUser) {
          for (const url of images) {
            const { data: inserted, error: insertErr } = await supabase.from("generations").insert({
              user_id: saveUser.id,
              prompt: prompt.trim(),
              model,
              image_url: url,
              is_public: isPublic || false,
            }).select("id").single();
            if (insertErr) {
              console.error("[generate] Failed to save generation:", JSON.stringify(insertErr));
            } else {
              saved++;
              if (inserted) savedIds.push(inserted.id);
            }
          }
          // Prune oldest if > 20
          if (saved > 0) {
            const { data: genList } = await supabase
              .from("generations")
              .select("id")
              .eq("user_id", saveUser.id)
              .order("created_at", { ascending: false })
              .range(20, 999999);
            if (genList && genList.length > 0) {
              await supabase.from("generations").delete().in("id", genList.map((g: { id: string }) => g.id));
            }
          }
        } else {
          console.warn("[generate] User not authenticated, skipping save to generations");
        }
      } catch (e) {
        console.error("[generate] Save to generations failed:", e instanceof Error ? e.message : e);
      }
    }

    const result: { images: string[]; daily_used?: number; credits?: number; saved?: number; generationIds?: string[] } = { images };
    if (creditResult) {
      if (creditResult.daily_used !== undefined) result.daily_used = creditResult.daily_used;
      if (creditResult.credits !== undefined) result.credits = creditResult.credits;
    }
    if (saved > 0) { result.saved = saved; result.generationIds = savedIds; }
    const response = NextResponse.json(result);

    // Dev mock: persist daily_used and generations via cookies for request continuity
    if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true") {
      if (creditResult?.daily_used !== undefined) {
        response.cookies.set("mock_daily_used", String(creditResult.daily_used), {
          maxAge: 3600,
          path: "/",
          sameSite: "lax",
        });
      }
      // Sync mock_generations cookie so /api/generations and /api/gallery can read it
      try {
        const prevCookie = req.cookies.get("mock_generations")?.value;
        const prevItems: Array<{ id: string; prompt: string; model: string; image_url: string; is_public: boolean; created_at: string }> = prevCookie ? JSON.parse(decodeURIComponent(prevCookie)) : [];
        const newItems = images.map((url: string) => ({
          id: crypto.randomUUID(),
          prompt: prompt.trim(),
          model,
          image_url: url,
          is_public: isPublic || false,
          created_at: new Date().toISOString(),
        }));
        const merged = [...newItems, ...prevItems].slice(0, 20);
        response.cookies.set("mock_generations", encodeURIComponent(JSON.stringify(merged)), {
          maxAge: 86400,
          path: "/",
          sameSite: "lax",
        });
      } catch {}
    }

    return response;
  } catch (error: unknown) {
    let status = 500;
    let message = "Internal server error";

    if (error && typeof error === "object") {
      const e = error as Record<string, unknown>;
      if (typeof e.status === "number") status = e.status;
      if (typeof e.message === "string") message = e.message;

      if (e.response && typeof e.response === "object") {
        const r = e.response as Record<string, unknown>;
        if (typeof r.status === "number") status = r.status;
      }
      if (e.error && typeof e.error === "object") {
        const inner = e.error as Record<string, unknown>;
        if (typeof inner.message === "string") message = inner.message;
      }
    }

    const { code, userMessage } = classifyError(status, message);

    return NextResponse.json(
      { error: userMessage, code, detail: message },
      { status }
    );
  }
}
