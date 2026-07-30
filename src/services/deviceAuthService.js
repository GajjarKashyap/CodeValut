import { supabase } from '../lib/supabase';

// Generate or retrieve the device token securely
export const getOrGenerateDeviceToken = () => {
  let token = localStorage.getItem('codevault_device_token');
  if (!token) {
    // Generate a secure random UUID as the device token
    token = crypto.randomUUID();
    localStorage.setItem('codevault_device_token', token);
  }
  return token;
};

// Gather non-sensitive descriptive metadata about the browser
export const getDeviceMetadata = () => {
  const ua = navigator.userAgent;
  let browserName = "Unknown";
  let osName = "Unknown";

  if (ua.includes("Firefox")) browserName = "Firefox";
  else if (ua.includes("Chrome")) browserName = "Chrome";
  else if (ua.includes("Safari")) browserName = "Safari";
  else if (ua.includes("Edge")) browserName = "Edge";

  if (ua.includes("Win")) osName = "Windows";
  else if (ua.includes("Mac")) osName = "macOS";
  else if (ua.includes("Linux")) osName = "Linux";
  else if (ua.includes("Android")) osName = "Android";
  else if (ua.includes("like Mac")) osName = "iOS";

  return {
    device_name: browserName + " on " + osName,
    browser_name: browserName,
    operating_system: osName,
    user_agent: ua
  };
};

/**
 * Calls the secure Postgres RPC to register the device.
 */
export const registerDevice = async () => {
  const deviceToken = getOrGenerateDeviceToken();
  const metadata = getDeviceMetadata();
  const approvalCode = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const { data: userSession } = await supabase.auth.getSession();
    if (!userSession?.session?.user) return null;

    const { data, error } = await supabase.rpc('register_device_login_internal', {
      p_user_id: userSession.session.user.id,
      p_device_token_hash: deviceToken, 
      p_metadata: metadata,
      p_approval_code_hash: approvalCode,
      p_supabase_session_id: userSession.session.id
    });

    if (error) throw error;
    
    // Attach approval code so the UI can display it (use backend existing code if available to prevent refresh issues)
    if (data?.status === 'pending') {
      data.approvalCode = data.approval_code || approvalCode;
    }
    
    return data;
  } catch (error) {
    console.error("Device registration failed:", error);
    return { status: 'error', reason: error.message };
  }
};
