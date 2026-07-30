import { supabase } from '../lib/supabase';

const DEVICE_TOKEN_KEY = 'codevault_device_token';
const DEVICE_SESSION_KEY = 'codevault_device_session';

// Generate or retrieve the device token — persists across browser sessions
export const getOrGenerateDeviceToken = () => {
  let token = localStorage.getItem(DEVICE_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
  }
  return token;
};

// Cache the device session result so refresh doesn't create new DB rows
export const getCachedDeviceSession = () => {
  try {
    const raw = sessionStorage.getItem(DEVICE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setCachedDeviceSession = (data) => {
  try {
    sessionStorage.setItem(DEVICE_SESSION_KEY, JSON.stringify(data));
  } catch {}
};

export const clearCachedDeviceSession = () => {
  sessionStorage.removeItem(DEVICE_SESSION_KEY);
};

// Gather non-sensitive descriptive metadata about the browser
export const getDeviceMetadata = () => {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let osName = 'Unknown';

  if (ua.includes('Edg/')) browserName = 'Edge';
  else if (ua.includes('Chrome')) browserName = 'Chrome';
  else if (ua.includes('Firefox')) browserName = 'Firefox';
  else if (ua.includes('Safari')) browserName = 'Safari';

  if (ua.includes('Win')) osName = 'Windows';
  else if (ua.includes('Android')) osName = 'Android';
  else if (ua.includes('like Mac')) osName = 'iOS';
  else if (ua.includes('Mac')) osName = 'macOS';
  else if (ua.includes('Linux')) osName = 'Linux';

  return {
    device_name: `${browserName} on ${osName}`,
    browser_name: browserName,
    operating_system: osName,
    user_agent: ua,
  };
};

/**
 * Registers the device with the backend.
 * Uses sessionStorage cache so refresh never creates duplicate DB rows.
 * On first call it creates the session; subsequent calls in the same tab return the cached result.
 */
export const registerDevice = async (forceRefresh = false) => {
  // Return cached result immediately if available and not forced
  if (!forceRefresh) {
    const cached = getCachedDeviceSession();
    if (cached && cached.status === 'active') {
      return cached;
    }
    // For pending: also return cached so the code stays stable across refreshes
    if (cached && cached.status === 'pending') {
      return cached;
    }
  }

  const deviceToken = getOrGenerateDeviceToken();
  const metadata = getDeviceMetadata();
  // Generate a 6-digit code locally — backend will echo it back (or replace with existing)
  const approvalCode = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) return null;

    const { data, error } = await supabase.rpc('register_device_login_internal', {
      p_user_id: sessionData.session.user.id,
      p_device_token_hash: deviceToken,
      p_metadata: metadata,
      p_approval_code_hash: approvalCode,
      p_supabase_session_id: sessionData.session.id ?? null,
    });

    if (error) throw error;

    if (data) {
      // Backend returns the canonical approval code — prefer it over our locally generated one
      if (data.status === 'pending') {
        data.approvalCode = data.approval_code_hash || approvalCode;
      }
      // Cache the result so future refreshes don't hit the DB again
      setCachedDeviceSession(data);
    }

    return data;
  } catch (error) {
    console.error('Device registration failed:', error);
    return { status: 'error', reason: error.message };
  }
};
