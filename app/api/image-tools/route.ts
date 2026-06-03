import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { checkContentModeration } from "@/lib/moderation";

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

const MODELSCOPE_URL = "https://api-inference.modelscope.cn";
const BAIDU_OAUTH_URL = "https://aip.baidubce.com/oauth/2.0/token";
const BAIDU_BODY_SEG_URL = "https://aip.baidubce.com/rest/2.0/image-classify/v1/body_seg";

// Cache Baidu AI access_token (valid for ~30 days)
let baiduTokenCache: { token: string; expiresAt: number } | null = null;

async function getBaiduAccessToken(): Promise<string> {
  if (baiduTokenCache && Date.now() < baiduTokenCache.expiresAt) {
    return baiduTokenCache.token;
  }

  const apiKey = process.env.BAIDU_AI_API_KEY;
  const secretKey = process.env.BAIDU_AI_SECRET_KEY;
  if (!apiKey || !secretKey) throw new Error("BAIDU_AI_API_KEY or BAIDU_AI_SECRET_KEY not configured");

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: apiKey,
    client_secret: secretKey,
  });

  const res = await fetch(`${BAIDU_OAUTH_URL}?${params.toString()}`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error_description || `Baidu OAuth error ${res.status}`);
  }

  baiduTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 7 * 86400) * 1000,
  };
  return data.access_token;
}

// Helper: download an image URL server-side and return as base64 data URL
async function urlToDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = res.headers.get("content-type") || "image/png";
  const b64 = buffer.toString("base64");
  return `data:${contentType};base64,${b64}`;
}

const TOOL_PROMPTS: Record<string, Record<string, string>> = {
  smooth: {
    light: "Apply very light skin smoothing to the image. Keep skin texture natural, do not blur facial features. Overall effect should be natural and clear.",
    medium:
      "Apply moderate skin smoothing and beautification to the image. Even out skin tone, reduce minor blemishes. Keep eyes, eyebrows, lips and hair sharp and clear. Background unchanged. Natural and realistic result.",
    strong:
      "Apply professional-level skin smoothing and portrait retouching. Significantly smooth skin while keeping eyes, eyebrows, lips and hair sharp. Keep background unchanged. Natural and premium result.",
  },
  upscale: {
    "2x": "Upscale this image by 2x. Keep all details sharp and clear, no blur or jagged edges. Enhance texture and edge details. Maintain accurate colors.",
    "4x": "Upscale this image by 4x. Keep all details sharp and clear, no blur or jagged edges. Enhance texture and edge details. Maintain accurate colors.",
  },
};

// ── Baidu AI portrait segmentation (free 50K calls, outputs RGBA foreground PNG) ──

async function removeBgWithBaidu(imageDataUrl: string): Promise<string> {
  const token = await getBaiduAccessToken();

  const base64 = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
  const encodedBody = new URLSearchParams({
    image: base64,
    type: "foreground",
  }).toString();

  const res = await fetch(`${BAIDU_BODY_SEG_URL}?access_token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: encodedBody,
  });

  const data = await res.json();
  if (!res.ok || data.error_code) {
    const msg = data.error_msg || `Baidu API error ${res.status}`;
    throw Object.assign(new Error(msg), { status: res.status });
  }

  if (data.foreground) {
    return `data:image/png;base64,${data.foreground}`;
  }

  throw new Error(`Unexpected Baidu response: ${JSON.stringify(data).slice(0, 300)}`);
}

// ── ModelScope Real-ESRGAN upscale (free, up to 2000/day) ──

async function upscaleWithRealESRGAN(imageDataUrl: string, scale: 2 | 4): Promise<string> {
  const apiKey = process.env.MODELSCOPE_API_KEY;
  if (!apiKey) throw new Error("MODELSCOPE_API_KEY not configured");

  const submitRes = await fetch(`${MODELSCOPE_URL}/api/v1/models/damo/cv_rrdb_esrgan/inference`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: {
        image: imageDataUrl,
        outscale: scale,
      },
    }),
  });

  const submitData = await submitRes.json();
  if (!submitRes.ok || submitData.code) {
    const msg = submitData.message || `ModelScope error ${submitRes.status}`;
    throw Object.assign(new Error(msg), { status: submitRes.status });
  }

  const outputUrl = submitData.Data?.output_image || submitData.data?.output_image || submitData.output?.url || submitData.output_image;
  if (outputUrl) return outputUrl;

  if (submitData.Data?.output_img || submitData.data?.output_img) {
    const b64 = submitData.Data?.output_img || submitData.data?.output_img;
    return `data:image/png;base64,${b64}`;
  }

  throw new Error(`Unexpected ModelScope response: ${JSON.stringify(submitData).slice(0, 300)}`);
}

// ── OpenRouter image-to-image (upscale fallback / smooth) ──

async function imageEditWithOpenRouter(prompt: string, imageDataUrl: string): Promise<string> {
  const response = await getOpenRouter().chat.completions.create({
    model: "bytedance-seed/seedream-4.5",
    modalities: ["image"],
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
    max_tokens: 8192,
  } as never);

  const message = response.choices[0]?.message;
  if (!message) throw new Error("No response from OpenRouter");

  const raw = message as unknown as Record<string, unknown>;
  if (Array.isArray(raw.images)) {
    for (const img of raw.images as Array<{ image_url?: { url?: string } }>) {
      if (img.image_url?.url) return img.image_url.url;
    }
  }

  if (Array.isArray(message.content)) {
    for (const part of message.content) {
      if (part.type === "image_url" && part.image_url?.url) {
        return part.image_url.url;
      }
    }
  }

  if (typeof message.content === "string") {
    const urlMatch = message.content.match(/https?:\/\/[^\s]+\.(png|jpg|jpeg|gif|webp)(\?[^\s]*)?/i);
    if (urlMatch) return urlMatch[0];
  }

  throw new Error("No image returned from OpenRouter");
}

// ── Handler ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, tool, smoothIntensity } = body;

    if (!image || !tool) {
      return NextResponse.json({ error: "Missing image or tool parameter" }, { status: 400 });
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkRateLimit(clientIp, RATE_LIMITS.imageTools);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: rl.retryAfter },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
      );
    }

    // ── Content Moderation ──
    const modCheck = await checkContentModeration("image processing request", image);
    if (modCheck.flagged) {
      return NextResponse.json(
        { error: "Content policy violation. This image has been flagged by our safety system.", code: "content_moderation" },
        { status: 400 },
      );
    }

    const imageUrl = image.startsWith("data:image/") ? image : `data:image/png;base64,${image}`;

    // ── Upscale: ModelScope Real-ESRGAN → OpenRouter fallback ──
    if (tool === "upscale") {
      const scale = (smoothIntensity === "4x" ? 4 : 2) as 2 | 4;

      const modelscopeKey = process.env.MODELSCOPE_API_KEY;
      if (modelscopeKey) {
        try {
          const url = await upscaleWithRealESRGAN(imageUrl, scale);
          const b64 = await urlToDataUrl(url);
          return NextResponse.json({ url: b64, upscaler: "real-esrgan" });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "ModelScope error";
          console.warn("[image-tools] Real-ESRGAN failed, falling back to OpenRouter:", msg);
        }
      }

      if (!process.env.OPENROUTER_API_KEY) {
        return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
      }
      try {
        const scaleLabel = scale === 4 ? "4x" : "2x";
        const prompt = TOOL_PROMPTS.upscale[scaleLabel];
        const url = await imageEditWithOpenRouter(prompt, imageUrl);
        const b64 = await urlToDataUrl(url);
        return NextResponse.json({ url: b64, upscaler: "openrouter" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upscale failed";
        console.error("[image-tools] OpenRouter upscale error:", msg);
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }

    // ── Remove BG: Baidu AI portrait segmentation ──
    if (tool === "remove_bg") {
      if (!process.env.BAIDU_AI_API_KEY) {
        return NextResponse.json({ error: "BAIDU_AI_API_KEY not configured" }, { status: 500 });
      }
      try {
        const b64 = await removeBgWithBaidu(imageUrl);
        return NextResponse.json({ url: b64 });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Background removal failed";
        console.error("[image-tools] Baidu body_seg error:", msg);
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }

    // ── Smooth: OpenRouter image editing ──
    if (tool === "smooth") {
      if (!process.env.OPENROUTER_API_KEY) {
        return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
      }
      try {
        const prompt = TOOL_PROMPTS.smooth[smoothIntensity || "medium"] || TOOL_PROMPTS.smooth.medium;
        const url = await imageEditWithOpenRouter(prompt, imageUrl);
        const b64 = await urlToDataUrl(url);
        return NextResponse.json({ url: b64 });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Smooth failed";
        console.error("[image-tools] OpenRouter smooth error:", msg);
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }

    return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[image-tools] Unexpected error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
