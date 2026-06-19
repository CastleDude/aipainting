import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function levenshteinRatio(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0 && n === 0) return 1;
  if (m === 0 || n === 0) return 0;

  let prev = new Uint16Array(n + 1);
  let curr = new Uint16Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }

  return 1 - prev[n] / Math.max(m, n);
}

function normalizePrompt(p: string): string {
  return p.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function GET(req: NextRequest) {
  // Dev mock mode — return mock data from cookie
  if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true") {
    const cookieVal = req.cookies.get("mock_generations")?.value;
    const items = cookieVal ? JSON.parse(decodeURIComponent(cookieVal)) : [];
    return NextResponse.json({ generations: items });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ generations: [] });
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ generations: [] });
    }

    const { data } = await supabase
      .from("generations")
      .select("id, prompt, model, image_url, thumb_url, is_public, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({ generations: data || [] });
  } catch {
    return NextResponse.json({ generations: [] });
  }
}

export async function DELETE(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const ids = searchParams.get("ids");

    if (id) {
      // Single delete
      await supabase.from("generations").delete().eq("id", id).eq("user_id", user.id);
    } else if (ids) {
      // Batch delete
      const idList = ids.split(",");
      await supabase.from("generations").delete().in("id", idList).eq("user_id", user.id);
    } else {
      return NextResponse.json({ error: "Missing id or ids" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  // Dev mock mode — update cookie
  if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true") {
    try {
      const body = await req.json();
      const { id, is_public } = body;
      const cookieVal = req.cookies.get("mock_generations")?.value;
      const items: Array<{ id: string; is_public: boolean }> = cookieVal ? JSON.parse(decodeURIComponent(cookieVal)) : [];
      const idx = items.findIndex((g) => g.id === id);
      if (idx !== -1) {
        items[idx].is_public = is_public;
      }
      const response = NextResponse.json({ ok: true, is_public });
      response.cookies.set("mock_generations", encodeURIComponent(JSON.stringify(items)), {
        maxAge: 86400,
        path: "/",
        sameSite: "lax",
      });
      return response;
    } catch {
      return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, is_public } = body;

    if (!id || typeof is_public !== "boolean") {
      return NextResponse.json({ error: "Missing id or is_public" }, { status: 400 });
    }

    // Fetch the generation to verify ownership and get its prompt
    const { data: gen } = await supabase
      .from("generations")
      .select("id, prompt, is_public")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!gen) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // When sharing to gallery, check daily limit & similarity
    if (is_public && !gen.is_public) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tier")
        .eq("id", user.id)
        .single();

      const tier = (profile?.tier as string) || "free";

      // Daily share limit: free = 5/day, paid = unlimited
      if (tier === "free") {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const { count: todayShares } = await supabase
          .from("generations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_public", true)
          .gte("created_at", todayStart.toISOString());

        if (todayShares != null && todayShares >= 5) {
          return NextResponse.json({ ok: false, code: "share_limit" }, { status: 200 });
        }
      }

      // Prompt similarity dedup — check against own other public prompts
      const { data: existing } = await supabase
        .from("generations")
        .select("prompt")
        .eq("user_id", user.id)
        .eq("is_public", true)
        .neq("id", id)
        .limit(50);

      if (existing?.length) {
        const newNormalized = normalizePrompt(gen.prompt);
        for (const row of existing) {
          if (levenshteinRatio(newNormalized, normalizePrompt(row.prompt)) >= 0.7) {
            return NextResponse.json({ ok: false, code: "share_similar" }, { status: 200 });
          }
        }
      }
    }

    await supabase
      .from("generations")
      .update({ is_public })
      .eq("id", id)
      .eq("user_id", user.id);

    // Enforce gallery limit: max 50 public images, delete oldest excess
    if (is_public) {
      const { data: publicIds } = await supabase
        .from("generations")
        .select("id")
        .eq("is_public", true)
        .order("created_at", { ascending: true })
        .range(0, 999999);

      if (publicIds && publicIds.length > 50) {
        const toRemove = publicIds.slice(0, publicIds.length - 50);
        await supabase
          .from("generations")
          .update({ is_public: false })
          .in("id", toRemove.map((g: { id: string }) => g.id));
      }
    }

    return NextResponse.json({ ok: true, is_public });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
