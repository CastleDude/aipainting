-- ============================================
-- AI Painting — Database Schema (Canonical)
-- Auth: Auth.js v5 + local PostgreSQL
-- Last updated: 2026-07-08
-- ============================================

-- ── Profiles ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT UNIQUE,
  name           TEXT,
  password_hash  TEXT,                                   -- bcrypt hash for Auth.js credentials
  tier           TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'premium', 'ultimate')),
  credits        INTEGER NOT NULL DEFAULT 10,
  daily_reset_at TIMESTAMPTZ DEFAULT now(),
  role           TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ── Password Reset Tokens ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires    TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON public.password_reset_tokens(user_id);

-- ── Generations (last 20 per user, pruned automatically) ──────

CREATE TABLE IF NOT EXISTS public.generations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt      TEXT NOT NULL,
  model       TEXT NOT NULL DEFAULT 'schnell',
  image_url   TEXT NOT NULL,
  thumb_url   TEXT,                                     -- base64 thumbnail
  is_public   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generations_user_created
  ON public.generations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generations_public_created
  ON public.generations(created_at DESC) WHERE is_public = true;

-- ── Orders (Creem payments) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.orders (
  id                TEXT PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier              TEXT NOT NULL,
  amount            INTEGER NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'USD',
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  creem_checkout_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- ── Subscriptions (Creem recurring billing) ───────────────────

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                    TEXT PRIMARY KEY,
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier                  TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'active',
  creem_subscription_id TEXT UNIQUE,
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_creem_id ON public.subscriptions(creem_subscription_id);

-- ── Credit Logs (audit trail) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.credit_logs (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL,
  reason     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_logs_user ON public.credit_logs(user_id, created_at DESC);

-- ── Rate Limits (distributed coordination) ────────────────────

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key       TEXT PRIMARY KEY,
  count     INTEGER NOT NULL DEFAULT 1,
  reset_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Job Queue (async generation) ──────────────────────────────

CREATE TABLE IF NOT EXISTS public.job_queue (
  id         TEXT PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  images     TEXT[] DEFAULT '{}',
  error      TEXT,
  code       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_queue_status ON public.job_queue(status, created_at DESC);

-- ── Migration Tracking ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public._migrations (
  name       TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Auto-update updated_at trigger ────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- Notes:
-- - No auth.users dependency — profiles are standalone
-- - No RLS policies — security enforced at application layer
-- - Credits reset logic handled by app code (lib/credits.ts)
-- - Password hashing via bcryptjs in registration/reset API
-- ============================================================
