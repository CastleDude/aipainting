-- ============================================================
-- Sync to match canonical supabase-schema.sql
-- Run this if deploying from an older migration baseline
-- ============================================================

-- Add is_public column to generations (if missing)
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Index for gallery (public generations sorted by date)
CREATE INDEX IF NOT EXISTS idx_generations_public_created
  ON public.generations(created_at DESC) WHERE is_public = true;

-- Credit logs table (for admin audit trail)
CREATE TABLE IF NOT EXISTS public.credit_logs (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount    INTEGER NOT NULL,
  reason    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_logs ENABLE ROW LEVEL SECURITY;

-- Daily credit reset function
CREATE OR REPLACE FUNCTION public.reset_daily_credits()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET daily_used = 0, daily_reset_at = now()
  WHERE daily_reset_at < now() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Subscriptions updated_at trigger
DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── Additional RLS policies ────────────────────────────────

-- Public gallery read
DROP POLICY IF EXISTS "Anyone can read public generations" ON public.generations;
CREATE POLICY "Anyone can read public generations"
  ON public.generations FOR SELECT
  USING (is_public = true);

-- Admin generations read
DROP POLICY IF EXISTS "Admins read all generations" ON public.generations;
CREATE POLICY "Admins read all generations"
  ON public.generations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Admin orders management
DROP POLICY IF EXISTS "Admins manage orders" ON public.orders;
CREATE POLICY "Admins manage orders"
  ON public.orders FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Admin subscriptions management
DROP POLICY IF EXISTS "Admins manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admins manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Credit logs: users read own
DROP POLICY IF EXISTS "Users read own credit logs" ON public.credit_logs;
CREATE POLICY "Users read own credit logs"
  ON public.credit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Credit logs: admins manage all
DROP POLICY IF EXISTS "Admins manage credit logs" ON public.credit_logs;
CREATE POLICY "Admins manage credit logs"
  ON public.credit_logs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));
