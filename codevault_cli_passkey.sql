-- ==============================================================================
-- CodeVault CLI & Daily Passkey Access Control Migration Script
-- ==============================================================================
-- This script creates the deterministic daily passkey generation and secure
-- RPC retrieval functions for both the Web Admin console and CLI interface.
-- ==============================================================================

-- 1. Function for Admins to view today's deterministic passkey (CV-XXXXXX)
CREATE OR REPLACE FUNCTION get_today_passkey()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_today_key TEXT;
BEGIN
  -- Retrieve email from the current JWT claims
  v_user_email := auth.jwt() ->> 'email';
  
  -- Only admin@admin.com can retrieve the daily passkey
  IF v_user_email = 'admin@admin.com' THEN
    v_today_key := 'CV-' || SUBSTRING(UPPER(MD5(TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD') || 'CODEVAULT_DAILY_LAB_KEY')), 1, 6);
    RETURN v_today_key;
  ELSE
    RAISE EXCEPTION 'Access Denied: Only Admin (admin@admin.com) can view today''s daily passkey.';
  END IF;
END;
$$;

-- 2. Function for CLI & Web users to fetch sessions based on passkey validity
CREATE OR REPLACE FUNCTION get_cli_sessions(p_passkey TEXT DEFAULT NULL)
RETURNS SETOF sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today_key TEXT;
  v_user_id UUID;
BEGIN
  -- Retrieve the current authenticated user ID
  v_user_id := auth.uid();

  -- Calculate today's deterministic daily passkey
  v_today_key := 'CV-' || SUBSTRING(UPPER(MD5(TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD') || 'CODEVAULT_DAILY_LAB_KEY')), 1, 6);

  -- If the passed passkey matches today's passkey (case-insensitive), unlock ALL sessions
  IF p_passkey IS NOT NULL AND UPPER(TRIM(p_passkey)) = v_today_key THEN
    RETURN QUERY
      SELECT * FROM sessions
      ORDER BY created_at DESC;
  -- Otherwise, restrict strictly to the authenticated user's own created sessions
  ELSE
    RETURN QUERY
      SELECT * FROM sessions
      WHERE user_id = v_user_id
      ORDER BY created_at DESC;
  END IF;
END;
$$;

-- 3. Grant execution permissions to authenticated and anonymous roles
GRANT EXECUTE ON FUNCTION get_today_passkey() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_cli_sessions(TEXT) TO authenticated, anon;
