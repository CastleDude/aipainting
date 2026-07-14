import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import { canGenerate, computeDeduction, shouldResetCredits } from "@/lib/credits";
import { createJob, enqueueJob } from "@/lib/queue";
import pool, { ensureProfile } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { SubscriptionTier } from "@/lib/supabase";
import { STYLE_PROMPTS, RUNWARE_MODELS } from "@/lib/openrouter";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logError } from "@/lib/analytics";
import { checkContentModeration, trackBlockedAttempt } from "@/lib/moderation";

// Default negative prompt for quality boost (EasyNegative equivalent concepts)
const DEFAULT_NEGATIVE = "blurry, low quality, distorted, watermark, text, signature, bad anatomy, deformed, disfigured, extra fingers, mutated";

// ── Describe an image via Gemini Vision ──
async function describeImage(base64: string): Promise<string | null> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY || ""}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        modalities: ["image", "text"],
        messages: [{ role: "user", content: [
          { type: "text", text: "Describe this image in 1-2 sentences. Focus on: subject, style, colors, composition, mood. Be concise." },
          { type: "image_url", image_url: { url: base64 } },
        ]}],
        max_tokens: 150,
      }),
    });
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) { console.warn("[describeImage]", (e as Error).message); return null; }
}
import { generateRunware } from "@/lib/runware";
import { generateThumbnail } from "@/lib/thumbnail";

// ── Config ──────────────────────────────────────────────

const OPENROUTER_MODELS: Record<string, { id: string; modalities: string[] }> = {
  seedream: { id: "bytedance-seed/seedream-4.5", modalities: ["image"] },
  "nano-banana": { id: "google/gemini-2.5-flash-image", modalities: ["image", "text"] },
  "nano-banana2": { id: "google/gemini-3.1-flash-image-preview", modalities: ["image", "text"] },
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

    // Seedream: dimensions only work via prompt (chat completions ignores width/height params)
    if (model === "seedream") {
      params.width = dims.width;
      params.height = dims.height;
    }
    // CRITICAL: embed aspect ratio as part of the scene description, not a meta-instruction
    userContent.unshift({ type: "text", text: `Create a ${dims.width}x${dims.height} pixel image with a ${aspectRatio} aspect ratio. The final image must be ${aspectRatio} shape.` });

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
    const { prompt, negativePrompt, model = "schnell", aspectRatio = "1:1", numImages = 4, imageBase64, imageBase64_2, isPublic, async: asyncMode, multiplier } = body;
    const creditMultiplier: number = typeof multiplier === "number" && multiplier > 0 ? multiplier : 1;

    // Auth once — reuse throughout the handler
    const session = await auth();
    const authUser = session?.user ? { id: (session.user as any).id, email: session.user.email! } : null;

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Please enter a prompt", code: "empty_prompt" }, { status: 400 });
    }

    // ── Describe second image via Gemini Vision ──
    let image2Desc: string | null = null;
    if (imageBase64_2) {
      image2Desc = await describeImage(imageBase64_2);
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

    const moderation = await checkContentModeration(prompt?.trim() || "", imageBase64);
    if (moderation.flagged) {
      // Track blocked attempt — temp ban after 5 violations in 10 min
      const ban = trackBlockedAttempt(clientIp);
      if (ban.banned) {
        return NextResponse.json(
          { error: `Too many content policy violations. Please try again in ${ban.retryAfter} seconds.`, code: "moderation_ban" },
          { status: 429, headers: { "Retry-After": String(ban.retryAfter) } },
        );
      }
      return NextResponse.json(
        { error: "Content policy violation. This prompt has been flagged by our safety system.", code: "content_moderation" },
        { status: 400 },
      );
    }

    // ── Credit result (populated below) ──
    let creditResult: { credits?: number } | undefined;

    // ── Guest credit limit (5 credits/day, tracked via cookie) ──
    let guestData: { date: string; credits: number } | undefined;
    if (!authUser) {
      const GUEST_DAILY = 5;
      const cookieName = "guest_credits";
      const today = new Date().toISOString().slice(0, 10);
      const cookieVal = req.cookies.get(cookieName)?.value;
      try {
        guestData = cookieVal ? JSON.parse(decodeURIComponent(cookieVal)) : { date: today, credits: GUEST_DAILY };
      } catch {
        guestData = { date: today, credits: GUEST_DAILY };
      }
      if (guestData!.date !== today) {
        guestData = { date: today, credits: GUEST_DAILY };
      }
      const guestCost = computeDeduction(numImages || 1, model, creditMultiplier);
      if (guestData!.credits < guestCost) {
        return NextResponse.json(
          { error: "今日免费次数已用完，请注册登录后继续使用", code: "guest_quota_exhausted" },
          { status: 402 },
        );
      }
      guestData!.credits -= guestCost;
      creditResult = { credits: guestData!.credits };
    }

    // ── Credit check (skip if Supabase not configured) ──

    // Dev mock mode — request-scoped credit tracking via cookie
    if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true") {
      const numToGenerate = numImages || 1;
      const deductCount = computeDeduction(numToGenerate, model, creditMultiplier);
      const cookieName = "mock_credits";
      const cookieVal = req.cookies.get(cookieName)?.value;
      let mockCredits = parseInt(cookieVal || "10", 10) || 10;
      mockCredits = Math.max(0, mockCredits - deductCount);
      creditResult = { credits: mockCredits };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let genUserId: string | undefined;

    if (supabaseUrl && supabaseKey && process.env.NEXT_PUBLIC_DEV_MOCK_USER !== "true") {
      if (authUser) {
      genUserId = authUser.id;
      // Use local PG for profiles
      const localProfile = await ensureProfile(authUser.id, authUser.email);
      const tier = localProfile.tier as SubscriptionTier;
      const numToGenerate = numImages || 1;
      const deductCount = computeDeduction(numToGenerate, model, creditMultiplier);
      let currentCredits = localProfile.credits;

      // Monthly credit reset
      const resetCredits = shouldResetCredits(localProfile.daily_reset_at, tier);
      if (resetCredits !== null) {
        currentCredits = resetCredits;
        await pool.query("UPDATE profiles SET credits = $1, daily_reset_at = now() WHERE id = $2", [currentCredits, authUser.id]);
      }

      const result = canGenerate(tier, currentCredits);
      if (!result.allowed) {
        return NextResponse.json({ error: result.reason, code: "credit_exhausted" }, { status: 402 });
      }

      // Deduct before generating
      currentCredits = Math.max(0, currentCredits - deductCount);
      await pool.query("UPDATE profiles SET credits = $1, daily_reset_at = COALESCE(daily_reset_at, now()) WHERE id = $2", [currentCredits, authUser.id]);
      await pool.query("INSERT INTO credit_logs (id, user_id, amount, reason) VALUES ($1, $2, $3, $4)", [`gen_${Date.now()}_${authUser.id.slice(0, 8)}`, authUser.id, -deductCount, `Generate ${numToGenerate} image(s) [${model}] — ${tier}`]);
      creditResult = { credits: currentCredits };
    }
    }

    // Build style hint from STYLE_PROMPTS map (strong descriptive prompts)
    const rawStyle: string = body.style || "";
    const styleHint = rawStyle && rawStyle !== "photorealistic" && STYLE_PROMPTS[rawStyle]
      ? ` in ${STYLE_PROMPTS[rawStyle]}`
      : "";

    // ── Async mode: enqueue and return job ID ──
    if (asyncMode) {
      const job = createJob(genUserId);
      const genFn = async () => {
        let genImages: string[];
        if (RUNWARE_MODELS.has(model)) {
          genImages = await generateRunware(`${prompt.trim()}${styleHint}. High quality, detailed.`, model, aspectRatio, numImages, negativePrompt, imageBase64);
        } else {
          const arHint = ``;
          const fullPrompt = `${prompt.trim()}${styleHint}. High quality, detailed.`;
          genImages = await generateOpenRouter(model, fullPrompt, negativePrompt, aspectRatio, numImages, imageBase64);
        }
        if (genImages.length === 0) throw Object.assign(new Error("No images returned"), { code: "no_output" });

        // Save to generations (best-effort)
        let saved = 0;
        const savedIds: string[] = [];
        if (supabaseUrl && supabaseKey && process.env.NEXT_PUBLIC_DEV_MOCK_USER !== "true") {
          try {
            const saveUser = authUser?.id ? { id: authUser.id } : null;
            if (saveUser) {
              const genThumbs = await Promise.allSettled(genImages.map((url) => generateThumbnail(url)));
              const genThumbMap = new Map(genImages.map((url, i) => [url, genThumbs[i]?.status === "fulfilled" ? genThumbs[i].value : null] as const));
              for (const url of genImages) {
                try {
                  const { rows: [inserted] } = await pool.query(
                    "INSERT INTO generations (user_id, prompt, model, image_url, thumb_url, is_public) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
                    [saveUser.id, prompt.trim(), model, url, genThumbMap.get(url) ?? null, isPublic || false],
                  );
                  saved++;
                  if (inserted) savedIds.push(inserted.id);
                } catch (e) {
                  console.error("[generate] Failed to save generation:", e instanceof Error ? e.message : e);
                }
              }
              if (saved > 0) {
                await pool.query("DELETE FROM generations WHERE id IN (SELECT id FROM generations WHERE user_id = $1 ORDER BY created_at DESC OFFSET 20)", [saveUser.id]);
              }
            } else {
              console.warn("[generate] User not authenticated, skipping save to generations");
            }
          } catch (e) {
            console.error("[generate] Save to generations failed:", e instanceof Error ? e.message : e);
          }
        }

        return { id: job.id, status: "completed" as const, images: genImages, credits: creditResult?.credits, saved, generationIds: savedIds, createdAt: job.createdAt };
      };

      enqueueJob(job, genFn);
      return NextResponse.json({ jobId: job.id, status: "pending" });
    }

    let images: string[];

    const genN = numImages;
    if (RUNWARE_MODELS.has(model)) {
      // For img2img with two photos: first = inputImage, second = described via Gemini, embedded in prompt
      const img2Hint = image2Desc ? ` Second reference image description: ${image2Desc}.` : "";
      images = await generateRunware(`${prompt.trim()}${styleHint}${img2Hint}. High quality, detailed.`, model, aspectRatio, genN, negativePrompt, imageBase64);
    } else {
      // For OpenRouter models, embed aspect ratio in the prompt
      const arHint = ``;
      const fullPrompt = `${prompt.trim()}${styleHint}. High quality, detailed.`;
      images = await generateOpenRouter(model, fullPrompt, negativePrompt, aspectRatio, genN, imageBase64 || imageBase64_2);
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
        const saveUser = authUser?.id ? { id: authUser.id } : null;
        if (saveUser) {
          // Generate thumbnails in background (fire-and-forget)
          const thumbs = await Promise.allSettled(images.map((url) => generateThumbnail(url)));
          const thumbMap = new Map(images.map((url, i) => [url, thumbs[i]?.status === "fulfilled" ? thumbs[i].value : null] as const));

          for (const url of images) {
            try {
              const { rows: [inserted] } = await pool.query(
                "INSERT INTO generations (user_id, prompt, model, image_url, thumb_url, is_public) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
                [saveUser.id, prompt.trim(), model, url, thumbMap.get(url) ?? null, isPublic || false],
              );
              saved++;
              if (inserted) savedIds.push(inserted.id);
            } catch (e) {
              console.error("[generate] Failed to save generation:", e instanceof Error ? e.message : e);
            }
          }
          // Prune oldest if > 20
          if (saved > 0) {
            await pool.query(
              `DELETE FROM generations WHERE id IN (
                SELECT id FROM generations WHERE user_id = $1 ORDER BY created_at DESC OFFSET 20
              )`, [saveUser.id],
            );
          }
        } else {
          console.warn("[generate] User not authenticated, skipping save to generations");
        }
      } catch (e) {
        console.error("[generate] Save to generations failed:", e instanceof Error ? e.message : e);
      }
    }

    const result: { images: string[]; credits?: number; saved?: number; generationIds?: string[]; multiplier?: number } = { images };
    if (creditMultiplier > 1) result.multiplier = creditMultiplier;
    if (creditResult?.credits !== undefined) result.credits = creditResult.credits;
    if (saved > 0) { result.saved = saved; result.generationIds = savedIds; }
    const response = NextResponse.json(result);

    // Guest: persist remaining credits via cookie
    if (!authUser && guestData) {
      response.cookies.set("guest_credits", JSON.stringify(guestData), {
        maxAge: 86400,
        path: "/",
        sameSite: "lax",
      });
    }

    // Dev mock: persist credits and generations via cookies for request continuity
    if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true") {
      if (creditResult?.credits !== undefined) {
        response.cookies.set("mock_credits", String(creditResult.credits), {
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

    // Log server errors for admin dashboard
    if (status >= 500) {
      logError("generate", `[${code}] ${message}`);
    }

    return NextResponse.json(
      { error: userMessage, code, detail: message },
      { status }
    );
  }
}
