// ── Shared config ──────────────────────────────────────

import OpenAI from "openai";

const SIZES: Record<string, { width: number; height: number }> = {
  "1:1":  { width: 1024, height: 1024 },
  "4:3":  { width: 1280, height: 960 },
  "16:9": { width: 1344, height: 768 },
  "9:16": { width: 768, height: 1344 },
  "3:4":  { width: 960, height: 1280 },
  "2:3":  { width: 832, height: 1280 },
  "3:2":  { width: 1280, height: 832 },
  "21:9": { width: 1536, height: 640 },
};

export const RUNWARE_MODEL_MAP: Record<string, string> = {
  "schnell":   "runware:100@1",
  "sdxl":      "civitai:133005@782002",
  "flux-dev":  "runware:101@1",
};

// ── Runware (sync) ─────────────────────────────────────

async function generateWithRunware(
  prompt: string, model: string, aspectRatio: string, numImages: number, negativePrompt?: string, imageBase64?: string,
): Promise<string[]> {
  const apiKey = process.env.RUNWARE_API_KEY;
  if (!apiKey) throw new Error("RUNWARE_API_KEY not configured");

  const modelId = RUNWARE_MODEL_MAP[model] || RUNWARE_MODEL_MAP["schnell"];
  const dims = SIZES[aspectRatio] || SIZES["1:1"];
  const taskUUID = crypto.randomUUID();

  const task: Record<string, unknown> = {
    taskType: "imageInference",
    taskUUID,
    model: modelId,
    positivePrompt: prompt,
    width: dims.width,
    height: dims.height,
    numberResults: numImages,
    outputType: "URL",
    outputFormat: "JPG",
    includeCost: true,
  };
  // Add reference image for img2img (Runware uses rehostedImage)
  if (imageBase64?.trim()) {
    task.rehostedImage = imageBase64.trim();
    task.strength = 0.35; // lower = more faithful to reference (0=exact copy, 1=ignore)
    task.cfgScale = 3;    // lower = more creative freedom for img2img
    // Negative prompt to prevent unwanted changes
    if (!task.negativePrompt) task.negativePrompt = "";
    task.negativePrompt += " different person, different gender, gender swap, wrong gender, female body, different ethnic";
  }
  if (negativePrompt?.trim()) task.negativePrompt = negativePrompt.trim();

  const res = await fetch("https://api.runware.ai/v1", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify([task]),
  });

  const json = await res.json();
  if (!res.ok) {
    const msg = json.errorMessage || json.error || `Runware error ${res.status}`;
    throw Object.assign(new Error(msg), { status: res.status });
  }

  const data = json.data as Array<{ imageURL?: string }> | undefined;
  if (!data?.length) throw Object.assign(new Error("Runware returned no images"), { status: 500 });
  return data.map((img) => img.imageURL || "").filter(Boolean);
}

// ── Novita AI (async) ──────────────────────────────────

const NOVITA_MODEL_MAP: Record<string, string> = {
  "schnell":   "flux-1-schnell-fp8.safetensors",
  "sdxl":      "dreamshaperXL_v21TurboDPMSDE_1032.safetensors",
  "flux-dev":  "flux-1-dev-fp8.safetensors",
};

async function generateWithNovita(
  prompt: string, model: string, aspectRatio: string, numImages: number, negativePrompt?: string,
): Promise<string[]> {
  const apiKey = process.env.NOVITA_API_KEY;
  if (!apiKey) throw new Error("NOVITA_API_KEY not configured");

  const modelName = NOVITA_MODEL_MAP[model] || NOVITA_MODEL_MAP["schnell"];
  const dims = SIZES[aspectRatio] || SIZES["1:1"];
  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

  // Submit tasks
  const taskIds: string[] = [];
  for (let i = 0; i < numImages; i++) {
    const body: Record<string, unknown> = {
      request: {
        model_name: modelName,
        prompt,
        width: dims.width,
        height: dims.height,
        image_num: 1,
        steps: 25,
        guidance_scale: 7.5,
      },
    };
    if (negativePrompt?.trim()) {
      (body.request as Record<string, unknown>).negative_prompt = negativePrompt.trim();
    }

    const res = await fetch("https://api.novita.ai/v3/async/txt2img", {
      method: "POST", headers, body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data.error?.message || data.message || `Novita error ${res.status}`;
      throw Object.assign(new Error(msg), { status: res.status });
    }
    if (!data.task_id) throw new Error("No task_id in Novita response");
    taskIds.push(data.task_id);
  }

  // Poll all tasks
  const images: string[] = [];
  for (const taskId of taskIds) {
    for (let j = 0; j < 40; j++) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(`https://api.novita.ai/v3/async/task-result?task_id=${taskId}`, { headers });
      const pollData = await pollRes.json();

      if (pollData.task?.status === "TASK_STATUS_SUCCEED") {
        const url = pollData.images?.[0]?.image_url;
        if (url) images.push(url);
        break;
      }
      if (pollData.task?.status === "TASK_STATUS_FAILED") {
        throw new Error(pollData.task?.reason || "Novita generation failed");
      }
    }
    if (images.length <= taskIds.indexOf(taskId)) {
      throw new Error("Novita generation timed out");
    }
  }

  return images;
}

// ── OpenRouter (universal fallback) ─────────────────────

const OPENROUTER_FALLBACK: Record<string, { id: string; modalities: string[] }> = {
  "schnell":   { id: "google/gemini-2.5-flash-image", modalities: ["image", "text"] },
  "sdxl":      { id: "google/gemini-2.5-flash-image", modalities: ["image", "text"] },
  "flux-dev":  { id: "google/gemini-3-pro-image-preview", modalities: ["image", "text"] },
};

let _openrouter: OpenAI | null = null;
function getOR(): OpenAI {
  if (!_openrouter) {
    _openrouter = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY || "",
    });
  }
  return _openrouter;
}

async function generateWithOpenRouter(
  prompt: string, model: string, aspectRatio: string, numImages: number, negativePrompt?: string,
): Promise<string[]> {
  const cfg = OPENROUTER_FALLBACK[model] || OPENROUTER_FALLBACK["schnell"];
  const dims = SIZES[aspectRatio] || SIZES["1:1"];
  const images: string[] = [];

  for (let i = 0; i < numImages; i++) {
    const userContent: Array<Record<string, unknown>> = [{ type: "text", text: `${prompt}. High quality, detailed.` }];
    if (negativePrompt?.trim()) {
      userContent.push({ type: "text", text: `Avoid: ${negativePrompt.trim()}` });
    }

    const params: Record<string, unknown> = {
      model: cfg.id,
      modalities: cfg.modalities,
      messages: [{ role: "user", content: userContent }],
      max_tokens: 8192,
    };
    // Only Seedream uses native width/height
    if (model === "seedream") {
      params.width = dims.width;
      params.height = dims.height;
    }

    const res = await getOR().chat.completions.create(params as never);

    const msg = res.choices[0]?.message;
    if (!msg) continue;

    const raw = msg as unknown as Record<string, unknown>;
    if (Array.isArray(raw.images)) {
      for (const img of raw.images as Array<{ image_url?: { url?: string } }>) {
        if (img.image_url?.url) images.push(img.image_url.url);
      }
      continue;
    }
    if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === "image_url" && part.image_url?.url) images.push(part.image_url.url);
      }
    }
  }

  return images;
}

// ── Unified export ─────────────────────────────────────

export async function generateRunware(
  prompt: string, model: string, aspectRatio: string, numImages: number, negativePrompt?: string, imageBase64?: string,
): Promise<string[]> {
  // 1. Runware (cheapest, direct, supports aspect ratio + img2img)
  if (process.env.RUNWARE_API_KEY) {
    try {
      return await generateWithRunware(prompt, model, aspectRatio, numImages, negativePrompt, imageBase64);
    } catch (e) {
      console.warn("[ai] Runware failed:", (e as Error).message);
    }
  }

  // 2. Novita AI (cheap, async)
  if (process.env.NOVITA_API_KEY) {
    try {
      return await generateWithNovita(prompt, model, aspectRatio, numImages, negativePrompt);
    } catch (e) {
      console.warn("[ai] Novita failed:", (e as Error).message);
    }
  }

  // 3. OpenRouter (universal fallback, uses existing key)
  if (process.env.OPENROUTER_API_KEY) {
    return await generateWithOpenRouter(prompt, model, aspectRatio, numImages, negativePrompt);
  }

  throw new Error(
    "No AI provider configured. Set one of: RUNWARE_API_KEY, NOVITA_API_KEY, or OPENROUTER_API_KEY in .env.local.",
  );
}
