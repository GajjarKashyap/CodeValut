-- ============================================================
-- CODEVAULT — ADMIN USER BLOCK/UNBLOCK MIGRATION
-- Paste this script into: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Add is_blocked column to user_activity if it doesn't exist
ALTER TABLE public.user_activity 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

-- 2. Verify schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_activity' AND table_schema = 'public';
