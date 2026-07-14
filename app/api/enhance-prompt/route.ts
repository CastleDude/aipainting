import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt?.trim()) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_AUTH_TOKEN;
    if (!apiKey) return NextResponse.json({ enhanced: prompt });

    const baseUrl = process.env.ANTHROPIC_BASE_URL || "https://api.deepseek.com/anthropic";
    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "deepseek-v4-pro",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `You are an AI image prompt enhancer. Take the user's short prompt and expand it into a detailed, vivid description for image generation. Add details about: lighting, composition, quality, style, colors. Keep it under 200 characters. Output ONLY the enhanced prompt, nothing else.\n\nUser prompt: "${prompt.trim()}"`,
        }],
      }),
    });

    const data = await res.json();
    // Handle both Anthropic format (DeepSeek) and OpenAI format (OpenRouter)
    let enhanced = data?.choices?.[0]?.message?.content?.trim();
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
