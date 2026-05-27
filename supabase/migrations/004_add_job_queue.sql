-- ============================================================
-- Job Queue — async image generation persistence
-- ============================================================

CREATE TABLE IF NOT EXISTS public.job_queue (
  id        TEXT PRIMARY KEY,
  user_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status    TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  images    TEXT[] DEFAULT '{}',
  error     TEXT,
  code      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_queue_status ON public.job_queue(status, created_at DESC);

ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own jobs"
  ON public.job_queue FOR SELECT
  USING (auth.uid() = user_id);
