import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

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

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkRateLimit(clientIp, RATE_LIMITS.translate);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: rl.retryAfter },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
      );
    }

    if (!text?.trim()) {
      return NextResponse.json({ translated: text });
    }

    // Skip if already mostly English
    const asciiCount = [...text].filter((c) => c >= " " && c <= "~").length;
    if (asciiCount / text.length > 0.9) {
      return NextResponse.json({ translated: text });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ translated: text });
    }

    const res = await getOpenRouter().chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You are a translator. Translate the user's prompt into natural, fluent English suitable for AI image generation. Preserve all descriptive details, artistic style terms, and technical specifications. Output ONLY the translated English text, nothing else.",
        },
        { role: "user", content: text },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const translated = res.choices?.[0]?.message?.content?.trim() || text;
    return NextResponse.json({ translated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[translate]", msg);
    return NextResponse.json(
      { error: msg },
      { status: 500 },
    );
  }
}
