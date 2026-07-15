import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt?.trim()) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_AUTH_TOKEN || process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ enhanced: prompt });

    // Try Anthropic-compatible API first, fall back to OpenRouter
    const baseUrl = process.env.ANTHROPIC_BASE_URL || "https://openrouter.ai/api/v1/chat/completions";
    const isOpenRouter = baseUrl.includes("openrouter.ai");

    const body = isOpenRouter
      ? {
          model: process.env.ANTHROPIC_MODEL || "deepseek/deepseek-chat",
          max_tokens: 500,
          messages: [{
            role: "user",
            content: `You are an AI image prompt enhancer. Take the user's short prompt and expand it into a detailed, vivid description for image generation. Add details about: lighting, composition, quality, style, colors. Keep it under 200 characters. Output ONLY the enhanced prompt, nothing else.\n\nUser prompt: "${prompt.trim()}"`,
          }],
        }
      : {
          model: process.env.ANTHROPIC_MODEL || "deepseek-v4-pro",
          max_tokens: 500,
          messages: [{
            role: "user",
            content: `You are an AI image prompt enhancer. Take the user's short prompt and expand it into a detailed, vivid description for image generation. Add details about: lighting, composition, quality, style, colors. Keep it under 200 characters. Output ONLY the enhanced prompt, nothing else.\n\nUser prompt: "${prompt.trim()}"`,
          }],
        };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (isOpenRouter) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else {
      headers["x-api-key"] = apiKey;
    }

    const res = await fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    // OpenAI/OpenRouter format
    let enhanced = data?.choices?.[0]?.message?.content?.trim();
    // Anthropic format (DeepSeek)
    if (!enhanced && data?.content) {
      const textPart = data.content.find((c: any) => c.type === "text");
      enhanced = textPart?.text?.trim();
    }
    enhanced = enhanced || prompt;

    return NextResponse.json({ enhanced });
  } catch {
    return NextResponse.json({ enhanced: "" }, { status: 500 });
  }
}
