-- Add tools_daily_used column if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tools_daily_used INTEGER NOT NULL DEFAULT 0;
