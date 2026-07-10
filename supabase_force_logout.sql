-- ============================================================
-- CODEVAULT — ADMIN FORCE LOGOUT MIGRATION
-- Paste this script into: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Add force_logout column to user_activity if it doesn't exist
ALTER TABLE public.user_activity 
ADD COLUMN IF NOT EXISTS force_logout BOOLEAN DEFAULT false;

-- 2. Drop the existing update policy on user_activity
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.user_activity;
DROP POLICY IF EXISTS "update_user_activity" ON public.user_activity;

-- 3. Re-create the update policy to allow users to update their own activity,
-- and the App Admin (admin@admin.com) to update any user's activity
CREATE POLICY "update_user_activity" ON public.user_activity
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR auth.jwt() ->> 'email' = 'admin@admin.com'
  );

-- 4. Verify table schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_activity' AND table_schema = 'public';
