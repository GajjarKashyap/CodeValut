-- ============================================================
-- CODEVAULT — MULTI-DEVICE LOGIN REVOKE FUNCTION
-- Paste this script into: Supabase Dashboard → SQL Editor → Run
-- ============================================================

CREATE OR REPLACE FUNCTION public.revoke_device_internal(
  p_admin_user_id uuid,
  p_target_device_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_device public.user_devices;
  v_is_admin boolean;
BEGIN
  -- Check if the caller is an admin
  SELECT (email = 'admin@admin.com') INTO v_is_admin FROM auth.users WHERE id = p_admin_user_id;

  SELECT * INTO v_device FROM public.user_devices WHERE id = p_target_device_id FOR UPDATE;
  
  IF v_device IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Device not found');
  END IF;

  -- Ensure the caller has permission (must be their own device OR they must be the app admin)
  IF v_device.user_id != p_admin_user_id AND NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied. You can only revoke your own devices.');
  END IF;

  -- Revoke the device
  UPDATE public.user_devices 
  SET status = 'revoked', revoked_at = now(), revoked_by = p_admin_user_id 
  WHERE id = p_target_device_id;
  
  -- Revoke any active sessions tied to this device
  UPDATE public.auth_device_sessions 
  SET status = 'revoked', revoked_at = now(), revocation_reason = 'Device access revoked manually' 
  WHERE device_id = p_target_device_id AND status = 'active';
  
  -- Audit log
  INSERT INTO public.security_audit_logs (actor_id, actor_type, action, target_user_id, target_device_id)
  VALUES (p_admin_user_id, CASE WHEN v_is_admin THEN 'admin' ELSE 'user' END, 'DEVICE_REVOKED', v_device.user_id, p_target_device_id);

  RETURN jsonb_build_object('success', true);
END;
$$;
