// Job queue for async image generation.
// Primary: Supabase (durable). Cache: in-memory Map (fast reads).

import { createClient } from "@supabase/supabase-js";

export interface QueueJob {
  id: string;
  userId?: string;
  status: "pending" | "processing" | "completed" | "failed";
  images?: string[];
  error?: string;
  code?: string;
  daily_used?: number;
  credits?: number;
  createdAt: number;
}

const cache = new Map<string, QueueJob>();

// Auto-cleanup cached jobs older than 10 minutes
setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [id, job] of cache) {
    if (job.createdAt < cutoff) cache.delete(id);
  }
}, 60 * 1000);

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function persistJob(job: QueueJob) {
  const db = getDb();
  if (!db) return;
  db.from("job_queue")
    .upsert({
      id: job.id,
      user_id: job.userId || null,
      status: job.status,
      images: job.images || [],
      error: job.error || null,
      code: job.code || null,
      updated_at: new Date().toISOString(),
    })
    .then(({ error }) => {
      if (error) console.error("[queue] persist error:", error.message);
    });
}

export function createJob(userId?: string): QueueJob {
  const id = crypto.randomUUID();
  const job: QueueJob = { id, userId, status: "pending", createdAt: Date.now() };
  cache.set(id, job);
  persistJob(job);
  return job;
}

export async function getJob(id: string): Promise<QueueJob | undefined> {
  // Memory first
  const cached = cache.get(id);
  if (cached) return cached;

  // Fall back to Supabase
  const db = getDb();
  if (!db) return undefined;

  const { data, error } = await db
    .from("job_queue")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return undefined;

  const recovered: QueueJob = {
    id: data.id,
    userId: data.user_id,
    status: data.status,
    images: data.images || [],
    error: data.error,
    code: data.code,
    createdAt: new Date(data.created_at).getTime(),
  };
  cache.set(id, recovered);
  return recovered;
}

export function updateJob(id: string, updates: Partial<QueueJob>) {
  const job = cache.get(id);
  if (job) {
    Object.assign(job, updates);
    persistJob(job);
  }
}

export function enqueueJob(job: QueueJob, processFn: () => Promise<QueueJob>) {
  job.status = "processing";
  cache.set(job.id, job);
  persistJob(job);

  processFn()
    .then((result) => {
      updateJob(result.id, { ...result, status: result.status || "completed" });
    })
    .catch((err) => {
      updateJob(job.id, {
        status: "failed",
        error: err?.message || "Generation failed",
        code: err?.code,
      });
    });
}
