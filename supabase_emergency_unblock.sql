-- ============================================================
-- CODEVAULT — EMERGENCY UNBLOCK + STATUS FIX
-- Paste into: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Unblock ALL non-admin users that got stuck as blocked during testing
UPDATE public.user_activity
SET is_blocked = false, force_logout = false
WHERE is_blocked = true
  AND user_id != (SELECT id FROM auth.users WHERE email = 'admin@admin.com');

-- 2. Clear any device sessions that are wrongly 'active' on old ghost data
-- so Edge gets a clean slate on next login
UPDATE public.auth_device_sessions
SET status = 'revoked', revocation_reason = 'Reset for v2 migration'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email != 'admin@admin.com'
)
AND status IN ('active', 'pending');

-- Also reset all devices to 'pending' so they re-register cleanly
UPDATE public.user_devices
SET status = 'pending', is_primary = false
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email != 'admin@admin.com'
);

-- 3. Now update the function to return 'limit_reached' instead of 'blocked'
--    so the UI can show the right message
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
  v_settings         public.user_login_settings;
  v_activity         public.user_activity;
  v_device           public.user_devices;
  v_existing_session public.auth_device_sessions;
  v_existing_request public.device_login_requests;
  v_active_count     int;
  v_new_session_id   uuid;
  v_status           text;
  v_email            text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;

  INSERT INTO public.user_login_settings (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_settings
  FROM public.user_login_settings WHERE user_id = p_user_id FOR UPDATE;

  INSERT INTO public.user_activity (user_id, email, last_login_at, last_seen_at)
  VALUES (p_user_id, v_email, now(), now())
  ON CONFLICT (user_id) DO UPDATE SET last_seen_at = now();

  SELECT * INTO v_activity
  FROM public.user_activity WHERE user_id = p_user_id FOR UPDATE;

  -- Admin block or login disabled → 'blocked'
  IF v_activity.is_blocked THEN
    RETURN jsonb_build_object('status', 'blocked', 'reason', 'admin_blocked');
  END IF;

  IF v_settings.login_policy = 'login_disabled' THEN
    RETURN jsonb_build_object('status', 'blocked', 'reason', 'logins_disabled');
  END IF;

  SELECT * INTO v_device
  FROM public.user_devices
  WHERE user_id = p_user_id AND device_token_hash = p_device_token_hash;

  IF v_device IS NULL THEN
    INSERT INTO public.user_devices (user_id, device_token_hash, metadata, status)
    VALUES (p_user_id, p_device_token_hash, p_metadata, 'pending')
    RETURNING * INTO v_device;
  ELSE
    UPDATE public.user_devices
    SET last_seen_at = now(), metadata = p_metadata
    WHERE id = v_device.id;

    IF v_device.status = 'revoked' OR v_device.status = 'blocked' THEN
      RETURN jsonb_build_object('status', 'blocked', 'reason', 'device_revoked');
    END IF;
  END IF;

  -- Reuse existing session if valid
  SELECT * INTO v_existing_session
  FROM public.auth_device_sessions
  WHERE user_id = p_user_id
    AND device_id = v_device.id
    AND status IN ('active', 'pending')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing_session IS NOT NULL AND v_existing_session.status = 'active' THEN
    RETURN jsonb_build_object(
      'status', 'active',
      'device_id', v_device.id,
      'device_session_id', v_existing_session.id
    );
  END IF;

  IF v_existing_session IS NOT NULL AND v_existing_session.status = 'pending' THEN
    SELECT * INTO v_existing_request
    FROM public.device_login_requests
    WHERE device_session_id = v_existing_session.id
      AND status = 'pending'
      AND expires_at > now()
    LIMIT 1;

    IF v_existing_request IS NOT NULL THEN
      RETURN jsonb_build_object(
        'status', 'pending',
        'device_id', v_device.id,
        'device_session_id', v_existing_session.id,
        'request_id', v_existing_request.id,
        'approval_code_hash', v_existing_request.approval_code_hash
      );
    END IF;

    UPDATE public.auth_device_sessions
    SET status = 'revoked', revocation_reason = 'Approval request expired'
    WHERE id = v_existing_session.id;
  END IF;

  -- Admin always gets instant access
  IF v_email = 'admin@admin.com' THEN
    UPDATE public.user_devices
    SET status = 'approved', is_primary = true, approved_at = now()
    WHERE id = v_device.id;
    v_status := 'active';

  ELSIF v_device.status = 'approved' THEN
    SELECT count(*) INTO v_active_count
    FROM public.auth_device_sessions
    WHERE user_id = p_user_id AND status = 'active';

    IF v_device.is_primary OR v_active_count < v_settings.max_active_devices THEN
      v_status := 'active';
    ELSE
      -- Use 'limit_reached' so frontend shows a helpful message, not "blocked by admin"
      RETURN jsonb_build_object('status', 'limit_reached', 'reason', 'Maximum active device limit reached. Go to Settings → Security to increase your device limit.');
    END IF;

  ELSIF NOT EXISTS (
    SELECT 1 FROM public.auth_device_sessions
    WHERE user_id = p_user_id AND status = 'active'
  ) THEN
    UPDATE public.user_devices
    SET status = 'approved', is_primary = true, approved_at = now()
    WHERE id = v_device.id;
    v_status := 'active';

  ELSIF v_settings.login_policy = 'allow_all' THEN
    SELECT count(*) INTO v_active_count
    FROM public.auth_device_sessions
    WHERE user_id = p_user_id AND status = 'active';

    IF v_active_count < v_settings.max_active_devices THEN
      UPDATE public.user_devices
      SET status = 'approved', approved_at = now()
      WHERE id = v_device.id;
      v_status := 'active';
    ELSE
      RETURN jsonb_build_object('status', 'limit_reached', 'reason', 'Maximum active device limit reached.');
    END IF;

  ELSE
    SELECT count(*) INTO v_active_count
    FROM public.auth_device_sessions
    WHERE user_id = p_user_id AND status = 'active';

    IF v_active_count >= v_settings.max_active_devices THEN
      RETURN jsonb_build_object('status', 'limit_reached', 'reason', 'Maximum active device limit reached. Go to Settings → Security to increase your device limit.');
    END IF;
    v_status := 'pending';
  END IF;

  INSERT INTO public.auth_device_sessions (user_id, device_id, supabase_session_id, status)
  VALUES (p_user_id, v_device.id, p_supabase_session_id, v_status)
  RETURNING id INTO v_new_session_id;

  IF v_status = 'pending' THEN
    DECLARE
      v_code   text := COALESCE(p_approval_code_hash, LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0'));
      v_req_id uuid;
    BEGIN
      INSERT INTO public.device_login_requests (
        user_id, device_id, device_session_id, approval_code_hash, expires_at
      ) VALUES (
        p_user_id, v_device.id, v_new_session_id, v_code, now() + interval '5 minutes'
      ) RETURNING id INTO v_req_id;

      RETURN jsonb_build_object(
        'status', 'pending',
        'device_id', v_device.id,
        'device_session_id', v_new_session_id,
        'request_id', v_req_id,
        'approval_code_hash', v_code
      );
    END;
  END IF;

  RETURN jsonb_build_object(
    'status', 'active',
    'device_id', v_device.id,
    'device_session_id', v_new_session_id
  );
END;
$$;
