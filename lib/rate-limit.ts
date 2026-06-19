/**
 * Hybrid rate limiter — in-memory (fast path) + Supabase (durable, multi-instance).
 */

import { createClient } from "@supabase/supabase-js";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const MAX_STORE_SIZE = 10_000;

// Clean up expired entries every 5 minutes, enforce max size
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) store.delete(key);
    }
    // Evict oldest if still over limit (safety valve)
    if (store.size > MAX_STORE_SIZE) {
      const keys = Array.from(store.keys()).slice(0, store.size - MAX_STORE_SIZE);
      for (const k of keys) store.delete(k);
    }
  }, 5 * 60 * 1000);
}

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Fire-and-forget persistence to Supabase (does not block the response)
function persistToDb(key: string, count: number, resetAt: number) {
  const db = getDb();
  if (!db) return;
  db.from("rate_limits")
    .upsert({ key, count, reset_at: new Date(resetAt).toISOString() })
    .then(({ error }) => {
      if (error) console.warn("[rate-limit] db persist:", error.message);
    });
}

async function fetchFromDb(key: string): Promise<RateLimitEntry | null> {
  const db = getDb();
  if (!db) return null;
  const { data, error } = await db
    .from("rate_limits")
    .select("count, reset_at")
    .eq("key", key)
    .single();
  if (error || !data) return null;
  return { count: data.count, resetAt: new Date(data.reset_at).getTime() };
}

export interface RateLimitConfig {
  limit: number;
  interval: number;
  key: string;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): { allowed: true } | { allowed: false; retryAfter: number } {
  const now = Date.now();
  const storeKey = `${config.key}:${identifier}`;
  const entry = store.get(storeKey);

  if (!entry || now >= entry.resetAt) {
    const resetAt = now + config.interval * 1000;
    store.set(storeKey, { count: 1, resetAt });
    persistToDb(storeKey, 1, resetAt);
    return { allowed: true };
  }

  if (entry.count >= config.limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  persistToDb(storeKey, entry.count, entry.resetAt);
  return { allowed: true };
}

/**
 * Async check — queries Supabase when the in-memory store doesn't have a record
 * (e.g. cold start or another instance handled the request). Use this in
 * multi-instance deployments; fall back to checkRateLimit for single-instance.
 */
export async function checkRateLimitAsync(
  identifier: string,
  config: RateLimitConfig,
): Promise<{ allowed: true } | { allowed: false; retryAfter: number }> {
  const now = Date.now();
  const storeKey = `${config.key}:${identifier}`;
  const entry = store.get(storeKey);

  // Fast path: in-memory hit
  if (entry && now < entry.resetAt) {
    if (entry.count >= config.limit) {
      return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
    }
    entry.count++;
    try { persistToDb(storeKey, entry.count, entry.resetAt); } catch {}
    return { allowed: true };
  }

  // Slow path: check Supabase (gracefully degrade if unreachable)
  let dbEntry = null;
  try { dbEntry = await fetchFromDb(storeKey); } catch { /* Supabase unavailable — use in-memory only */ }
  if (dbEntry && now < dbEntry.resetAt) {
    store.set(storeKey, dbEntry);
    if (dbEntry.count >= config.limit) {
      return { allowed: false, retryAfter: Math.ceil((dbEntry.resetAt - now) / 1000) };
    }
    dbEntry.count++;
    store.set(storeKey, dbEntry);
    persistToDb(storeKey, dbEntry.count, dbEntry.resetAt);
    return { allowed: true };
  }

  // No entry or expired — create new
  const resetAt = now + config.interval * 1000;
  store.set(storeKey, { count: 1, resetAt });
  persistToDb(storeKey, 1, resetAt);
  return { allowed: true };
}

export const RATE_LIMITS = {
  generate:   { limit: 20, interval: 60, key: "generate" },
  imageTools: { limit: 30, interval: 60, key: "image_tools" },
  translate:  { limit: 10, interval: 60, key: "translate" },
  checkout:   { limit: 5,  interval: 60, key: "checkout" },
} satisfies Record<string, RateLimitConfig>;
