import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Dev mock mode
    if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true") {
      const cookieVal = req.cookies.get("mock_generations")?.value;
      const allItems: Array<{ id: string; prompt: string; model: string; image_url: string; is_public: boolean; created_at: string }> = cookieVal ? JSON.parse(decodeURIComponent(cookieVal)) : [];
      const publicItems = allItems.filter((g) => g.is_public);
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "24"), 48);
      const offset = (page - 1) * limit;
      const items = publicItems.slice(offset, offset + limit).map((g) => ({ ...g, user_name: "You (demo)" }));
      return NextResponse.json({ items, total: publicItems.length, page, limit });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "24"), 48);
    const offset = (page - 1) * limit;

    // Showcase images — always appear at the end of the gallery
    const SHOWCASE = [
      { id: "sc-1", prompt: "A cyberpunk samurai standing in neon-lit Tokyo streets at night, rain drops, blade reflections", image_url: "/images/1.png", user_name: "AI Painting" },
      { id: "sc-2", prompt: "A cute fluffy cat wearing a wizard hat, casting magical spells with glowing sparkles, fantasy art", image_url: "/images/2.png", user_name: "AI Painting" },
      { id: "sc-3", prompt: "A serene mountain lake at sunrise, misty pine trees, crystal clear water reflections, photorealistic", image_url: "/images/3.png", user_name: "AI Painting" },
      { id: "sc-4", prompt: "An astronaut riding a horse on Mars, red desert landscape, Earth visible in the sky, cinematic", image_url: "/images/4.png", user_name: "AI Painting" },
      { id: "sc-5", prompt: "A Victorian-era steampunk airship flying over London, gears and brass details, dramatic sky", image_url: "/images/5.png", user_name: "AI Painting" },
      { id: "sc-6", prompt: "A Ghibli-style cozy treehouse village at twilight, warm glowing windows, fireflies, magical forest", image_url: "/images/6.png", user_name: "AI Painting" },
      { id: "sc-7", prompt: "A majestic dragon soaring through stormy clouds above ancient Chinese mountains, ink wash painting style", image_url: "/images/7.png", user_name: "AI Painting" },
      { id: "sc-8", prompt: "A cozy autumn cafe window view with falling leaves, warm candlelight, rainy afternoon, oil painting", image_url: "/images/8.png", user_name: "AI Painting" },
      { id: "sc-9", prompt: "An underwater palace of coral and pearl, mermaids swimming through sunbeams, ethereal atmosphere", image_url: "/images/9.png", user_name: "AI Painting" },
      { id: "sc-10", prompt: "A futuristic Chinese city with floating lanterns and holographic billboards, cyberpunk meets tradition", image_url: "/images/10.png", user_name: "AI Painting" },
      { id: "sc-11", prompt: "A mystical forest spirit made of autumn leaves, glowing embers dancing in twilight air, ethereal fantasy", image_url: "/images/11.png", user_name: "AI Painting" },
      { id: "sc-12", prompt: "A crystal cave with bioluminescent flowers, mirror-like water pools, magical underground sanctuary", image_url: "/images/12.png", user_name: "AI Painting" },
    ];

    // Query user-shared items from local PG
    const { rows: dbItems } = await pool.query(
      `SELECT g.id, g.user_id, g.prompt, g.model, g.image_url, g.thumb_url, g.created_at, COALESCE(p.name, 'Anonymous') as user_name
       FROM generations g LEFT JOIN profiles p ON g.user_id = p.id
       WHERE g.is_public = true
       ORDER BY g.created_at DESC`,
      [],
    );

    // Combine: user items first, then showcase
    const allItems = [...dbItems, ...SHOWCASE];
    const total = allItems.length;
    const items = allItems.slice(offset, offset + limit);

    return NextResponse.json({ items, total, page, limit });
  } catch (e) {
    console.error("[gallery] Error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
