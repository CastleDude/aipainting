-- Add thumb_url column to generations table for gallery optimization
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS thumb_url TEXT;
