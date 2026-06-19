-- Migration: Unified credit system
-- Removes daily_used and tools_daily_used counters, all users now use a single credits pool.

-- Step 1: Reset free tier users to 5 credits (daily reset, 5/day)
UPDATE profiles
SET credits = 5
WHERE tier = 'free' AND credits = 0;

-- Step 2: Drop daily_used column (previously used for free tier daily counter)
ALTER TABLE profiles
DROP COLUMN IF EXISTS daily_used;

-- Step 3: Drop tools_daily_used column (previously used for free tier image tools)
ALTER TABLE profiles
DROP COLUMN IF EXISTS tools_daily_used;
