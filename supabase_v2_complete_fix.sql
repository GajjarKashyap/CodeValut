-- ============================================================
-- CODEVAULT — COMPLETE LOGIN SYSTEM REWRITE (v2)
-- This fixes the root cause: duplicate sessions on every refresh.
-- Paste into: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Step 1: Clean up duplicate/orphaned ghost sessions first
-- (Sessions that were created by the old buggy logic)
DELETE FROM public.auth_device_sessions a
USING (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY user_id, device_id
    ORDER BY created_at DESC
  ) AS rn
  FROM public.auth_device_sessions
  WHERE status IN ('active', 'pending')
) b
WHERE a.id = b.id AND b.rn > 1;

-- Step 2: Replace the core registration function with an idempotent version
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
  v_settings        public.user_login_settings;
  v_activity        public.user_activity;
  v_device          public.user_devices;
  v_existing_session public.auth_device_sessions;
  v_existing_request public.device_login_requests;
  v_active_count    int;
  v_new_session_id  uuid;
  v_status          text;
  v_email           text;
BEGIN
  -- 0. Get user email
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;

  -- 1. Ensure settings row exists
  INSERT INTO public.user_login_settings (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_settings
  FROM public.user_login_settings WHERE user_id = p_user_id FOR UPDATE;

  -- 2. Ensure activity row exists
  INSERT INTO public.user_activity (user_id, email, last_login_at, last_seen_at)
  VALUES (p_user_id, v_email, now(), now())
  ON CONFLICT (user_id) DO UPDATE SET last_seen_at = now();

  SELECT * INTO v_activity
  FROM public.user_activity WHERE user_id = p_user_id FOR UPDATE;

  -- 3. Block check
  IF v_activity.is_blocked OR v_settings.login_policy = 'login_disabled' THEN
    RETURN jsonb_build_object('status', 'blocked', 'reason', 'Account is blocked or logins disabled');
  END IF;

  -- 4. Find or create device record
  SELECT * INTO v_device
  FROM public.user_devices
  WHERE user_id = p_user_id AND device_token_hash = p_device_token_hash;

  IF v_device IS NULL THEN
    -- Brand new device never seen before
    INSERT INTO public.user_devices (user_id, device_token_hash, metadata, status)
    VALUES (p_user_id, p_device_token_hash, p_metadata, 'pending')
    RETURNING * INTO v_device;
  ELSE
    -- Known device: update last seen timestamp and metadata
    UPDATE public.user_devices
    SET last_seen_at = now(), metadata = p_metadata
    WHERE id = v_device.id;

    IF v_device.status = 'revoked' OR v_device.status = 'blocked' THEN
      RETURN jsonb_build_object('status', 'blocked', 'reason', 'Device has been revoked');
    END IF;
  END IF;

  -- ============================================================
  -- KEY FIX: Check if an active/pending session ALREADY EXISTS
  -- for this device. If so, REUSE it — don't create a new one.
  -- ============================================================
  SELECT * INTO v_existing_session
  FROM public.auth_device_sessions
  WHERE user_id = p_user_id
    AND device_id = v_device.id
    AND status IN ('active', 'pending')
  ORDER BY created_at DESC
  LIMIT 1;

  -- If already active → just return active (this is the "refresh" case)
  IF v_existing_session IS NOT NULL AND v_existing_session.status = 'active' THEN
    RETURN jsonb_build_object(
      'status', 'active',
      'device_id', v_device.id,
      'device_session_id', v_existing_session.id
    );
  END IF;

  -- If already pending → return same request so the code doesn't change on refresh
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
    -- If request expired, fall through to create a new session below
  END IF;

  -- ============================================================
  -- No existing valid session — determine policy and create one
  -- ============================================================

  -- Admin always gets instant access
  IF v_email = 'admin@admin.com' THEN
    UPDATE public.user_devices
    SET status = 'approved', is_primary = true, approved_at = now()
    WHERE id = v_device.id;
    v_status := 'active';

  -- Device already approved: check session count
  ELSIF v_device.status = 'approved' THEN
    SELECT count(*) INTO v_active_count
    FROM public.auth_device_sessions
    WHERE user_id = p_user_id AND status = 'active';

    IF v_device.is_primary OR v_active_count < v_settings.max_active_devices THEN
      v_status := 'active';
    ELSE
      v_status := 'pending';
    END IF;

  -- First device ever → auto-approve as primary
  ELSIF NOT EXISTS (
    SELECT 1 FROM public.auth_device_sessions
    WHERE user_id = p_user_id AND status = 'active'
  ) THEN
    UPDATE public.user_devices
    SET status = 'approved', is_primary = true, approved_at = now()
    WHERE id = v_device.id;
    v_status := 'active';

  -- Direct Grant policy → auto-approve without asking
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
      RETURN jsonb_build_object('status', 'blocked', 'reason', 'Maximum active device limit reached');
    END IF;

  -- Default: requires approval
  ELSE
    SELECT count(*) INTO v_active_count
    FROM public.auth_device_sessions
    WHERE user_id = p_user_id AND status = 'active';

    IF v_active_count >= v_settings.max_active_devices THEN
      RETURN jsonb_build_object('status', 'blocked', 'reason', 'Maximum active device limit reached. Please increase your device limit in Settings.');
    END IF;
    v_status := 'pending';
  END IF;

  -- Create the new session row
  INSERT INTO public.auth_device_sessions (user_id, device_id, supabase_session_id, status)
  VALUES (p_user_id, v_device.id, p_supabase_session_id, v_status)
  RETURNING id INTO v_new_session_id;

  -- If pending, create the approval request
  IF v_status = 'pending' THEN
    DECLARE
      v_code text := COALESCE(p_approval_code_hash, LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0'));
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

  -- Active case
  RETURN jsonb_build_object(
    'status', 'active',
    'device_id', v_device.id,
    'device_session_id', v_new_session_id
  );
END;
$$;
