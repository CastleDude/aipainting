import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

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

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const response = await getOR().chat.completions.create({
      model: "google/gemini-2.5-flash",
      modalities: ["image", "text"],
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Analyze this product image. Return ONLY a JSON object with these 3 fields (no markdown, no explanation): {\"title\": \"product name in Chinese\", \"copy\": \"catchy ad copy in Chinese (15 words max)\", \"points\": \"3-4 key selling points in Chinese, separated by commas\"}" },
          { type: "image_url", image_url: { url: image } },
        ],
      }] as never,
      max_tokens: 300,
    } as never);

    const text = (response.choices[0]?.message as { content?: string })?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return NextResponse.json(JSON.parse(jsonMatch[0]));
    }
    return NextResponse.json(null);
  } catch (e) {
    console.error("[analyze-product]", (e as Error).message);
    return NextResponse.json(null, { status: 500 });
  }
}
