import { supabase } from '../lib/supabase';

export const getOrGenerateDeviceToken = () => {
  let token = localStorage.getItem('codevault_device_token');
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem('codevault_device_token', token);
  }
  return token;
};

export const getDeviceMetadata = () => {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let osName = 'Unknown';

  if (ua.includes('Firefox')) browserName = 'Firefox';
  else if (ua.includes('Chrome')) browserName = 'Chrome';
  else if (ua.includes('Safari')) browserName = 'Safari';
  else if (ua.includes('Edge')) browserName = 'Edge';

  if (ua.includes('Win')) osName = 'Windows';
  else if (ua.includes('Mac')) osName = 'macOS';
  else if (ua.includes('Linux')) osName = 'Linux';
  else if (ua.includes('Android')) osName = 'Android';
  else if (ua.includes('like Mac')) osName = 'iOS';

  return {
    device_name: ${browserName} on ,
    browser_name: browserName,
    operating_system: osName,
    user_agent: ua
  };
};

export const registerDevice = async () => {
  const deviceToken = getOrGenerateDeviceToken();
  const metadata = getDeviceMetadata();

  try {
    const { data: userSession } = await supabase.auth.getSession();
    if (!userSession?.session?.user) return null;

    const { data, error } = await supabase.rpc('register_device_login_internal', {
      p_user_id: userSession.session.user.id,
      p_device_token_hash: deviceToken, 
      p_metadata: metadata,
      p_approval_code_hash: Math.floor(100000 + Math.random() * 900000).toString(),
      p_supabase_session_id: userSession.session.id
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Device registration failed:', error);
    return { status: 'error', reason: error.message };
  }
};
