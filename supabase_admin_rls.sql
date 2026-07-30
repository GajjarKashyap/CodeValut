-- ============================================================
-- CODEVAULT — ADMIN RLS POLICIES FOR DEVICE MANAGEMENT
-- Allows admin@admin.com to read and manage all users' devices.
-- Paste into: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Helper function to check if the current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email = 'admin@admin.com'
  );
$$;

-- ============================================================
-- user_devices: Admin can read ALL users' devices
-- ============================================================
DROP POLICY IF EXISTS "Admin can view all devices" ON public.user_devices;
CREATE POLICY "Admin can view all devices"
  ON public.user_devices
  FOR SELECT
  TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS "Admin can update all devices" ON public.user_devices;
CREATE POLICY "Admin can update all devices"
  ON public.user_devices
  FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());

-- ============================================================
-- auth_device_sessions: Admin can read ALL sessions
-- ============================================================
DROP POLICY IF EXISTS "Admin can view all sessions" ON public.auth_device_sessions;
CREATE POLICY "Admin can view all sessions"
  ON public.auth_device_sessions
  FOR SELECT
  TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS "Admin can update all sessions" ON public.auth_device_sessions;
CREATE POLICY "Admin can update all sessions"
  ON public.auth_device_sessions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());

-- ============================================================
-- device_login_requests: Admin can read all pending requests
-- ============================================================
DROP POLICY IF EXISTS "Admin can view all requests" ON public.device_login_requests;
CREATE POLICY "Admin can view all requests"
  ON public.device_login_requests
  FOR SELECT
  TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());
