import { NextRequest, NextResponse } from "next/server";

// Use Supabase REST API directly to avoid supabase-js WebSocket crash on Node 20
function supabaseUrl() { return process.env.NEXT_PUBLIC_SUPABASE_URL!; }
function serviceKey() { return process.env.SUPABASE_SERVICE_ROLE_KEY!; }

async function supabaseGet(path: string) {
  const res = await fetch(`${supabaseUrl()}/rest/v1/${path}`, {
    headers: {
      apikey: serviceKey(),
      Authorization: `Bearer ${serviceKey()}`,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase ${res.status}: ${body}`);
  }
  return res.json();
}

export async function GET(req: NextRequest) {
  try {
    // Dev mock mode — read from cookie
    if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true") {
      const cookieVal = req.cookies.get("mock_generations")?.value;
      const allItems: Array<{ id: string; prompt: string; model: string; image_url: string; is_public: boolean; created_at: string }> = cookieVal ? JSON.parse(decodeURIComponent(cookieVal)) : [];
      const publicItems = allItems.filter((g) => g.is_public);
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "24"), 48);
      const offset = (page - 1) * limit;
      const items = publicItems.slice(offset, offset + limit).map((g) => ({
        ...g,
        user_name: "You (demo)",
      }));
      return NextResponse.json({ items, total: publicItems.length, page, limit });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "24"), 48);
    const offset = (page - 1) * limit;

    // Use PostgREST directly (avoids supabase-js WebSocket issue on Node 20)
    const select = "id,user_id,prompt,model,image_url,created_at";
    const order = "order=created_at.desc";
    const range = `limit=${limit}&offset=${offset}`;
    const filter = "is_public=eq.true";

    // Get count via Prefer header
    const countRes = await fetch(
      `${supabaseUrl()}/rest/v1/generations?select=id&${filter}&${order}&limit=0`,
      {
        headers: {
          apikey: serviceKey(),
          Authorization: `Bearer ${serviceKey()}`,
          Prefer: "count=exact",
        },
      }
    );
    const total = parseInt(countRes.headers.get("content-range")?.split("/")[1] || "0");

    const data = await supabaseGet(
      `generations?select=${select}&${filter}&${order}&${range}`
    );

    // Fetch profiles for user names
    const userIds = [...new Set((data || []).map((g: { user_id: string }) => g.user_id))];
    let nameMap = new Map<string, string>();
    if (userIds.length > 0) {
      const profiles = await supabaseGet(
        `profiles?select=id,name&id=in.(${userIds.join(",")})`
      );
      (profiles || []).forEach((p: { id: string; name: string }) => nameMap.set(p.id, p.name));
    }

    const items = (data || []).map((g: { user_id: string }) => ({
      ...g,
      user_name: nameMap.get(g.user_id) || "Anonymous",
    }));

    return NextResponse.json({ items, total, page, limit });
  } catch (e) {
    console.error("[gallery] Error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
