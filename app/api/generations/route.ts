import { NextRequest, NextResponse } from "next/server";

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

/** Extract user ID from Supabase auth cookie JWT */
function getUserIdFromCookies(cookies: { name: string; value: string }[]): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  // Auth cookie name: sb-{project-ref}-auth-token
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1];
  if (!projectRef) return null;
  const cookieName = `sb-${projectRef}-auth-token`;
  const cookie = cookies.find((c) => c.name === cookieName);
  if (!cookie) return null;
  try {
    // Auth cookie is a JSON array: [access_token, refresh_token, ...]
    const parts = JSON.parse(cookie.value);
    const token = Array.isArray(parts) ? parts[0] : null;
    if (!token) return null;
    // Decode JWT payload (base64url)
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
    return decoded.sub || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  // Dev mock mode — return mock data from cookie
  if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true") {
    const cookieVal = req.cookies.get("mock_generations")?.value;
    const items = cookieVal ? JSON.parse(decodeURIComponent(cookieVal)) : [];
    return NextResponse.json({ generations: items });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ generations: [] });
  }

  try {
    // Extract user ID from JWT in auth cookie
    const userId = getUserIdFromCookies(req.cookies.getAll());
    if (!userId) {
      return NextResponse.json({ generations: [] });
    }

    // Query directly via REST API with service role (bypasses auth issues)
    const select = "id,prompt,model,image_url,thumb_url,is_public,created_at";
    const order = "order=created_at.desc";
    const limit = "limit=20";
    const filter = `user_id=eq.${encodeURIComponent(userId)}`;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/generations?select=${select}&${filter}&${order}&${limit}`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );

    if (!res.ok) {
      console.error("[generations] Query failed:", res.status, await res.text().catch(() => ""));
      return NextResponse.json({ generations: [] });
    }

    const data = await res.json();
    return NextResponse.json({ generations: data || [] });
  } catch (e) {
    console.error("[generations] Error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ generations: [] });
  }
}

export async function DELETE(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  try {
    const userId = getUserIdFromCookies(req.cookies.getAll());
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const ids = searchParams.get("ids");

    if (id) {
      await fetch(`${supabaseUrl}/rest/v1/generations?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
    } else if (ids) {
      const idList = ids.split(",");
      for (const gid of idList) {
        await fetch(`${supabaseUrl}/rest/v1/generations?id=eq.${encodeURIComponent(gid)}&user_id=eq.${encodeURIComponent(userId)}`, {
          method: "DELETE",
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        });
      }
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
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  try {
    const userId = getUserIdFromCookies(req.cookies.getAll());
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, is_public } = body;

    if (!id || typeof is_public !== "boolean") {
      return NextResponse.json({ error: "Missing id or is_public" }, { status: 400 });
    }

    // Fetch the generation to verify ownership
    const res1 = await fetch(
      `${supabaseUrl}/rest/v1/generations?select=id,prompt,is_public&id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    const [gen] = await res1.json();
    if (!gen) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // When sharing to gallery, check daily limit & similarity
    if (is_public && !gen.is_public) {
      const resP = await fetch(
        `${supabaseUrl}/rest/v1/profiles?select=tier&id=eq.${encodeURIComponent(userId)}&limit=1`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
      );
      const [profile] = await resP.json();
      const tier = (profile?.tier as string) || "free";

      if (tier === "free") {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const countRes = await fetch(
          `${supabaseUrl}/rest/v1/generations?select=id&user_id=eq.${encodeURIComponent(userId)}&is_public=eq.true&created_at=gte.${encodeURIComponent(todayStart.toISOString())}&limit=0`,
          { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Prefer: "count=exact" } }
        );
        const total = parseInt(countRes.headers.get("content-range")?.split("/")[1] || "0");
        if (total >= 5) {
          return NextResponse.json({ ok: false, code: "share_limit" }, { status: 200 });
        }
      }

      // Prompt similarity dedup
      const dedupRes = await fetch(
        `${supabaseUrl}/rest/v1/generations?select=prompt&user_id=eq.${encodeURIComponent(userId)}&is_public=eq.true&id=neq.${encodeURIComponent(id)}&limit=50`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
      );
      const existing = await dedupRes.json();
      if (existing?.length) {
        const newNormalized = normalizePrompt(gen.prompt);
        for (const row of existing) {
          if (levenshteinRatio(newNormalized, normalizePrompt(row.prompt)) >= 0.7) {
            return NextResponse.json({ ok: false, code: "share_similar" }, { status: 200 });
          }
        }
      }
    }

    // Update
    await fetch(
      `${supabaseUrl}/rest/v1/generations?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ is_public }),
      }
    );

    // Enforce gallery limit: max 50 public images
    if (is_public) {
      const pubRes = await fetch(
        `${supabaseUrl}/rest/v1/generations?select=id&is_public=eq.true&order=created_at.asc`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
      );
      const pubIds = await pubRes.json();
      if (pubIds && pubIds.length > 50) {
        const toRemove = pubIds.slice(0, pubIds.length - 50);
        for (const g of toRemove) {
          await fetch(
            `${supabaseUrl}/rest/v1/generations?id=eq.${encodeURIComponent(g.id)}`,
            {
              method: "PATCH",
              headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal",
              },
              body: JSON.stringify({ is_public: false }),
            }
          );
        }
      }
    }

    return NextResponse.json({ ok: true, is_public });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
