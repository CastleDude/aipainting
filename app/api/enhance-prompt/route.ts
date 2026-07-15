import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt?.trim()) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ enhanced: prompt });

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `You are an AI image prompt enhancer. Take the user's short prompt and expand it into a detailed, vivid description for image generation. Add details about: lighting, composition, quality, style, colors. Keep it under 200 characters. Output ONLY the enhanced prompt, nothing else.\n\nUser prompt: "${prompt.trim()}"`,
        }],
      }),
    });

    const data = await res.json();
    const enhanced = data?.choices?.[0]?.message?.content?.trim() || prompt;
    return NextResponse.json({ enhanced });
  } catch {
    return NextResponse.json({ enhanced: "" }, { status: 500 });
  }
}
