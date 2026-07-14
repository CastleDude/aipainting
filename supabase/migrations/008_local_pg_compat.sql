-- ============================================================
-- Migration 008: Local PG Compatibility Cleanup
-- Removes Supabase-specific objects not available in plain PG.
-- Safe to run on Supabase too — just drops what we don't use.
-- ============================================================

-- Drop auth.users trigger (app uses Auth.js, not Supabase Auth)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop daily reset function (now handled in app code)
DROP FUNCTION IF EXISTS public.reset_daily_credits();

-- Drop all RLS policies (security enforced at application layer)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END
$$;

-- Disable RLS on all tables (no policies needed without RLS)
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.generations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.credit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.job_queue DISABLE ROW LEVEL SECURITY;

-- Drop deprecated columns (already unused by app code)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS daily_used;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS tools_daily_used;

-- Drop auth.users FK if it exists (profiles are now standalone)
-- Note: this may fail if the constraint doesn't exist — that's OK
DO $$
BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
EXCEPTION WHEN others THEN NULL;
END
$$;

-- Ensure password_hash column exists (added after Auth.js migration)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Ensure thumb_url exists on generations
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS thumb_url TEXT;

-- Ensure password_reset_tokens table exists
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

-- Ensure migration tracking table exists
CREATE TABLE IF NOT EXISTS public._migrations (
  name       TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
