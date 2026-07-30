-- ============================================================
-- CODEVAULT — STRICT 1-DEVICE SYSTEM
-- Simplifies login to auto-kick old sessions and approve new ones.
-- Paste into: Supabase Dashboard → SQL Editor → Run
-- ============================================================

CREATE OR REPLACE FUNCTION public.register_device_login_internal(
  p_user_id uuid,
  p_device_token_hash text,
  p_metadata jsonb,
  p_approval_code_hash text DEFAULT NULL,
  p_supabase_session_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity         public.user_activity;
  v_device           public.user_devices;
  v_existing_session public.auth_device_sessions;
  v_new_session_id   uuid;
  v_email            text;
BEGIN
  -- 1. Get user email
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;

  -- 2. Upsert user activity (last seen)
  INSERT INTO public.user_activity (user_id, email, last_login_at, last_seen_at)
  VALUES (p_user_id, v_email, now(), now())
  ON CONFLICT (user_id) DO UPDATE SET last_seen_at = now();

  SELECT * INTO v_activity FROM public.user_activity WHERE user_id = p_user_id FOR UPDATE;

  IF v_activity.is_blocked THEN
    RETURN jsonb_build_object('status', 'blocked', 'reason', 'admin_blocked');
  END IF;

  -- 3. Check for existing device
  SELECT * INTO v_device FROM public.user_devices
  WHERE user_id = p_user_id AND device_token_hash = p_device_token_hash;

  -- 4. Upsert device (force it to be approved and primary, unblock if it was blocked/revoked)
  IF v_device IS NULL THEN
    INSERT INTO public.user_devices (user_id, device_token_hash, metadata, status, is_primary, approved_at)
    VALUES (p_user_id, p_device_token_hash, p_metadata, 'approved', true, now())
    RETURNING * INTO v_device;
  ELSE
    UPDATE public.user_devices 
    SET last_seen_at = now(), metadata = p_metadata, status = 'approved', is_primary = true 
    WHERE id = v_device.id;
  END IF;

  -- 5. Check if THIS exact device already has an active session
  SELECT * INTO v_existing_session FROM public.auth_device_sessions
  WHERE user_id = p_user_id AND device_id = v_device.id AND status = 'active'
  ORDER BY created_at DESC LIMIT 1;

  IF v_existing_session IS NOT NULL THEN
    -- They are already logged in on this exact device and session is active
    RETURN jsonb_build_object('status','active','device_id',v_device.id,'device_session_id',v_existing_session.id);
  END IF;

  -- 6. STRICT 1-DEVICE RULE: Revoke ALL existing active sessions for this user (other devices)
  UPDATE public.auth_device_sessions
  SET status = 'revoked', revocation_reason = 'Logged in from another device'
  WHERE user_id = p_user_id AND status = 'active';

  -- We do NOT set other devices to 'revoked' in user_devices. We just leave them as history.
  -- This prevents permanent lockouts.

  -- 7. Create NEW active session for this device
  INSERT INTO public.auth_device_sessions (user_id, device_id, supabase_session_id, status)
  VALUES (p_user_id, v_device.id, p_supabase_session_id, 'active')
  RETURNING id INTO v_new_session_id;

  RETURN jsonb_build_object('status','active','device_id',v_device.id,'device_session_id',v_new_session_id);
END;
$$;
