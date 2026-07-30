-- ============================================================
-- CODEVAULT — FIX DEVICE APPROVAL LIMITS
-- Paste this script into: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Increase the maximum number of active devices for existing users from 1 to 5
UPDATE public.user_login_settings SET max_active_devices = 5;

-- Update the table default so future users also get 5 devices by default
ALTER TABLE public.user_login_settings ALTER COLUMN max_active_devices SET DEFAULT 5;
