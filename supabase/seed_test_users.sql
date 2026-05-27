-- ============================================================
-- AI Painting — Test Member Accounts Seed Script
-- ============================================================
-- Run this in the Supabase SQL Editor (https://your-project.supabase.co)
-- All accounts use the same password: Test123456!
-- ============================================================

DO $$
DECLARE
  free_id UUID := gen_random_uuid();
  basic_id UUID := gen_random_uuid();
  premium_id UUID := gen_random_uuid();
  ultimate_id UUID := gen_random_uuid();
  admin_id UUID := gen_random_uuid();
  common_password TEXT := '$2b$10$WOels3HXLhEyMopICTUEzedODYfnVH53AZH5Ma6gWtamitFXKocve';
BEGIN

  -- ── Clean up any existing test accounts ────────────────
  DELETE FROM auth.identities WHERE provider_id IN (
    'free@test.local', 'basic@test.local', 'premium@test.local', 'ultimate@test.local', 'admin@test.local'
  );
  DELETE FROM auth.users WHERE email IN (
    'free@test.local', 'basic@test.local', 'premium@test.local', 'ultimate@test.local', 'admin@test.local'
  );

  -- ── 1. Free (free@test.local) ──────────────────────────
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', free_id, 'authenticated', 'authenticated',
    'free@test.local',
    common_password, now(),
    '{"provider":"email","providers":["email"]}', '{"name":"Free Tester"}',
    now(), now()
  );
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (free_id, free_id, 'free@test.local', jsonb_build_object('sub', free_id, 'email', 'free@test.local', 'email_verified', true), 'email', now(), now(), now());

  -- ── 2. Basic (basic@test.local) ────────────────────────
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', basic_id, 'authenticated', 'authenticated',
    'basic@test.local',
    common_password, now(),
    '{"provider":"email","providers":["email"]}', '{"name":"Basic Tester"}',
    now(), now()
  );
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (basic_id, basic_id, 'basic@test.local', jsonb_build_object('sub', basic_id, 'email', 'basic@test.local', 'email_verified', true), 'email', now(), now(), now());

  -- ── 3. Premium (premium@test.local) ────────────────────
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', premium_id, 'authenticated', 'authenticated',
    'premium@test.local',
    common_password, now(),
    '{"provider":"email","providers":["email"]}', '{"name":"Premium Tester"}',
    now(), now()
  );
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (premium_id, premium_id, 'premium@test.local', jsonb_build_object('sub', premium_id, 'email', 'premium@test.local', 'email_verified', true), 'email', now(), now(), now());

  -- ── 4. Ultimate (ultimate@test.local) ──────────────────
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', ultimate_id, 'authenticated', 'authenticated',
    'ultimate@test.local',
    common_password, now(),
    '{"provider":"email","providers":["email"]}', '{"name":"Ultimate Tester"}',
    now(), now()
  );
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (ultimate_id, ultimate_id, 'ultimate@test.local', jsonb_build_object('sub', ultimate_id, 'email', 'ultimate@test.local', 'email_verified', true), 'email', now(), now(), now());

  -- ── 5. Admin (admin@test.local) ────────────────────────
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
    'admin@test.local',
    common_password, now(),
    '{"provider":"email","providers":["email"]}', '{"name":"Admin Tester"}',
    now(), now()
  );
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (admin_id, admin_id, 'admin@test.local', jsonb_build_object('sub', admin_id, 'email', 'admin@test.local', 'email_verified', true), 'email', now(), now(), now());

  -- ── Update profiles (trigger created them, now set correct tier/credits) ──

  UPDATE public.profiles SET tier = 'free',      credits = 0,    daily_used = 5,    role = 'user'  WHERE id = free_id;
  UPDATE public.profiles SET tier = 'basic',     credits = 500,  daily_used = 0,    role = 'user'  WHERE id = basic_id;
  UPDATE public.profiles SET tier = 'premium',   credits = 2000, daily_used = 0,    role = 'user'  WHERE id = premium_id;
  UPDATE public.profiles SET tier = 'ultimate',  credits = 5000, daily_used = 0,    role = 'user'  WHERE id = ultimate_id;
  UPDATE public.profiles SET tier = 'ultimate',  credits = 9999, daily_used = 0,    role = 'admin' WHERE id = admin_id;

END $$;
