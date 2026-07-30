-- ============================================================
-- CODEVAULT — MULTI-DEVICE LOGIN FIX REJECT LOGIC
-- Paste this script into: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Fix 1: Make reject_device_login_internal actually block the device
CREATE OR REPLACE FUNCTION public.reject_device_login_internal(
  p_admin_user_id uuid,
  p_admin_device_id uuid,
  p_request_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request public.device_login_requests;
BEGIN
  SELECT * INTO v_request FROM public.device_login_requests WHERE id = p_request_id FOR UPDATE;
  
  IF v_request IS NULL OR v_request.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found or not pending');
  END IF;

  UPDATE public.device_login_requests SET status = 'rejected', reviewed_at = now(), reviewed_by_device_id = p_admin_device_id WHERE id = p_request_id;
  UPDATE public.auth_device_sessions SET status = 'rejected' WHERE id = v_request.device_session_id;
  
  -- The critical fix: Actually block the device from trying again
  UPDATE public.user_devices SET status = 'blocked' WHERE id = v_request.device_id;
  
  INSERT INTO public.security_audit_logs (actor_id, actor_type, action, target_user_id, target_device_id)
  VALUES (p_admin_user_id, 'user', 'DEVICE_REJECTED', v_request.user_id, v_request.device_id);

  RETURN jsonb_build_object('success', true);
END;
$$;


-- Fix 2: Make register_device_login_internal respect blocked status
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
  v_settings public.user_login_settings;
  v_activity public.user_activity;
  v_device public.user_devices;
  v_active_sessions_count int;
  v_new_session_id uuid;
  v_status text;
  v_request_id uuid;
  v_existing_code text;
BEGIN
  INSERT INTO public.user_login_settings (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_settings FROM public.user_login_settings WHERE user_id = p_user_id FOR UPDATE;
  
  INSERT INTO public.user_activity (user_id, email, last_login_at, last_seen_at)
  SELECT p_user_id, (SELECT email FROM auth.users WHERE id = p_user_id), now(), now()
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT * INTO v_activity FROM public.user_activity WHERE user_id = p_user_id FOR UPDATE;

  IF v_activity.is_blocked OR v_settings.login_policy = 'login_disabled' THEN
    INSERT INTO public.security_audit_logs (actor_id, actor_type, action, target_user_id, details_json)
    VALUES (p_user_id, 'user', 'LOGIN_BLOCKED', p_user_id, jsonb_build_object('reason', 'account_blocked_or_disabled'));
    RETURN jsonb_build_object('status', 'blocked', 'reason', 'Account is blocked or logins disabled');
  END IF;

  SELECT * INTO v_device FROM public.user_devices WHERE user_id = p_user_id AND device_token_hash = p_device_token_hash;
  
  IF v_device IS NULL THEN
    INSERT INTO public.user_devices (user_id, device_token_hash, metadata, status)
    VALUES (p_user_id, p_device_token_hash, p_metadata, 'pending')
    RETURNING * INTO v_device;
    
    INSERT INTO public.security_audit_logs (actor_id, actor_type, action, target_user_id, target_device_id)
    VALUES (p_user_id, 'user', 'DEVICE_REGISTERED', p_user_id, v_device.id);
  ELSE
    -- Critical Fix: Block devices that are marked 'revoked' OR 'blocked'
    IF v_device.status = 'revoked' OR v_device.status = 'blocked' THEN
      RETURN jsonb_build_object('status', 'blocked', 'reason', 'Device access has been rejected or revoked');
    END IF;
    
    UPDATE public.user_devices SET last_seen_at = now(), metadata = p_metadata WHERE id = v_device.id;
  END IF;

  SELECT count(*) INTO v_active_sessions_count 
  FROM public.auth_device_sessions 
  WHERE user_id = p_user_id AND status = 'active';

  IF v_device.status = 'approved' AND (v_device.is_primary = true OR v_active_sessions_count < v_settings.max_active_devices) THEN
    v_status := 'active';
  ELSIF v_active_sessions_count = 0 THEN
    UPDATE public.user_devices SET status = 'approved', is_primary = true, approved_at = now() WHERE id = v_device.id;
    v_status := 'active';
  ELSE
    v_status := 'pending';
  END IF;

  SELECT id INTO v_new_session_id FROM public.auth_device_sessions 
  WHERE device_id = v_device.id AND status IN ('active', 'pending')
  ORDER BY created_at DESC LIMIT 1;

  IF v_new_session_id IS NULL THEN
    INSERT INTO public.auth_device_sessions (user_id, device_id, supabase_session_id, status)
    VALUES (p_user_id, v_device.id, p_supabase_session_id, v_status)
    RETURNING id INTO v_new_session_id;
  ELSE
    IF v_status = 'active' THEN
       UPDATE public.auth_device_sessions SET status = 'active' WHERE id = v_new_session_id;
    END IF;
  END IF;

  IF v_status = 'pending' THEN
    SELECT id, approval_code_hash INTO v_request_id, v_existing_code
    FROM public.device_login_requests
    WHERE device_id = v_device.id AND status = 'pending' AND expires_at > now()
    ORDER BY requested_at DESC LIMIT 1;
    
    IF v_request_id IS NULL THEN
      IF p_approval_code_hash IS NULL THEN
        RAISE EXCEPTION 'p_approval_code_hash is required for pending devices';
      END IF;
      
      INSERT INTO public.device_login_requests (user_id, device_id, device_session_id, approval_code_hash, expires_at)
      VALUES (p_user_id, v_device.id, v_new_session_id, p_approval_code_hash, now() + interval '5 minutes')
      RETURNING id INTO v_request_id;
      
      INSERT INTO public.security_audit_logs (actor_id, actor_type, action, target_user_id, target_device_id)
      VALUES (p_user_id, 'user', 'DEVICE_APPROVAL_REQUESTED', p_user_id, v_device.id);
      
      v_existing_code := p_approval_code_hash;
    END IF;
    
    RETURN jsonb_build_object(
      'status', 'pending',
      'device_id', v_device.id,
      'device_session_id', v_new_session_id,
      'request_id', v_request_id,
      'approval_code', v_existing_code
    );
  END IF;

  INSERT INTO public.security_audit_logs (actor_id, actor_type, action, target_user_id, target_device_id, target_session_id)
  VALUES (p_user_id, 'user', 'SESSION_ACTIVATED', p_user_id, v_device.id, v_new_session_id);

  RETURN jsonb_build_object(
    'status', 'active',
    'device_id', v_device.id,
    'device_session_id', v_new_session_id
  );
END;
$$;
