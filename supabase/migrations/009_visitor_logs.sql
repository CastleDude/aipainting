-- ============================================================
-- Migration 009: Visitor Analytics
-- ============================================================

CREATE TABLE IF NOT EXISTS public.visitor_logs (
  id          BIGSERIAL PRIMARY KEY,
  ip          TEXT NOT NULL,
  country     TEXT,
  region      TEXT,
  page        TEXT NOT NULL,
  referrer    TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visitor_logs_created ON public.visitor_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_country ON public.visitor_logs(country);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_page ON public.visitor_logs(page);
