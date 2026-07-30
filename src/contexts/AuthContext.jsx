import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { registerDevice } from '../services/deviceAuthService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Device status: 'checking', 'active', 'pending', 'blocked', 'error', null
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [deviceSessionInfo, setDeviceSessionInfo] = useState(null);

  useEffect(() => {
    let subscription = null;
    
    const checkDevice = async (session) => {
      if (!session?.user) {
        setDeviceStatus(null);
        setDeviceSessionInfo(null);
        return;
      }
      
      setDeviceStatus('checking');
      try {
        const result = await registerDevice();
        if (result && result.status) {
          setDeviceStatus(result.status); // 'active', 'pending', 'blocked'
          setDeviceSessionInfo(result);
        } else {
          setDeviceStatus('error');
        }
      } catch (err) {
        console.error('Failed to verify device:', err);
        setDeviceStatus('error');
      }
    };

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          checkDevice(session).then(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Supabase getSession error:", err);
        setLoading(false);
      });

    try {
      const res = supabase.auth.onAuthStateChange(async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            await checkDevice(session);
            
            // Record login activity
            try {
              await supabase.from('user_activity').upsert({
                user_id: session.user.id,
                email: session.user.email,
                last_login_at: new Date().toISOString(),
                last_seen_at: new Date().toISOString()
              });
            } catch (err) {
              console.error('Failed to log user activity:', err);
            }
          }
        } else {
          setDeviceStatus(null);
          setDeviceSessionInfo(null);
        }
      });
      subscription = res.data?.subscription;
    } catch (err) {
      console.error("Supabase onAuthStateChange error:", err);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, deviceStatus, deviceSessionInfo, setDeviceStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
