export interface GenerateParams {
  prompt: string;
  negativePrompt?: string;
  model?: string;
  aspectRatio?: string;
  style?: string;
  numImages?: number;
}

// prettier-ignore
export const AI_MODELS = {
  "schnell":      { id: "schnell", name: "Flux Schnell (Fast)", provider: "Runware" },
  "sdxl":         { id: "sdxl", name: "SDXL (Quality)", provider: "Runware" },
  "flux-dev":     { id: "flux-dev", name: "Flux Dev (Pro)", provider: "Runware" },
  "seedream":     { id: "bytedance-seed/seedream-4.5", name: "Seedream 4.5", provider: "ByteDance" },
  "nano-banana":  { id: "google/gemini-2.5-flash-image", name: "Nano Banana", provider: "Google" },
  "nano-banana2": { id: "google/gemini-3.1-flash-image-preview", name: "Nano Banana 2", provider: "Google" },
  "banana-pro":   { id: "google/gemini-3-pro-image-preview", name: "Nano Banana Pro", provider: "Google" },
  "gpt-image":    { id: "openai/gpt-5-image-mini", name: "GPT-5 Image Mini", provider: "OpenAI" },
  "gpt-image-pro":{ id: "openai/gpt-5-image", name: "GPT-5 Image", provider: "OpenAI" },
} as const;

export const RUNWARE_MODELS = new Set(["schnell", "sdxl", "flux-dev"]);

export const ASPECT_RATIOS = [
  { value: "1:1", label: "Square (1:1)" },
  { value: "4:3", label: "Standard (4:3)" },
  { value: "16:9", label: "Widescreen (16:9)" },
  { value: "9:16", label: "Portrait (9:16)" },
  { value: "3:4", label: "Portrait (3:4)" },
  { value: "2:3", label: "Poster (2:3)" },
  { value: "3:2", label: "Landscape (3:2)" },
  { value: "21:9", label: "Ultrawide (21:9)" },
];

export const STYLES = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "anime", label: "Anime / Manga" },
  { value: "digital-art", label: "Digital Art" },
  { value: "oil-painting", label: "Oil Painting" },
  { value: "cinematic", label: "Cinematic" },
  { value: "ghibli", label: "Studio Ghibli" },
  { value: "3d-render", label: "3D Render" },
  { value: "line-art", label: "Line Art" },
];

export const STYLE_PROMPTS: Record<string, string> = {
  anime: "anime/manga art style, cel-shaded, vibrant colors, clean linework, Japanese animation aesthetic",
  "digital-art": "digital painting, smooth rendering, highly detailed concept art, matte painting, ArtStation trending",
  "oil-painting": "oil painting on canvas, visible brushstrokes, rich impasto textures, classical fine art, gallery quality",
  cinematic: "cinematic lighting, dramatic atmosphere, film still, anamorphic lens, depth of field, movie poster",
  ghibli: "Studio Ghibli hand-drawn animation style, soft watercolor backgrounds, whimsical, magical realism, Hayao Miyazaki aesthetic",
  "3d-render": "3D rendered, CGI, octane render, unreal engine 5, ray tracing, photorealistic materials",
  "line-art": "black and white line art, ink drawing, clean outlines, manga sketch, minimal shading, pen and ink illustration",
};
