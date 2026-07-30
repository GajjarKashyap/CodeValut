import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { registerDevice, clearCachedDeviceSession } from '../services/deviceAuthService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [deviceSessionInfo, setDeviceSessionInfo] = useState(null);

  // Ref to track which user we've already done a device check for.
  // This prevents re-running the RPC on every re-render or tab focus event.
  const checkedForUserRef = useRef(null);

  const checkDevice = async (session) => {
    if (!session?.user) {
      setDeviceStatus(null);
      setDeviceSessionInfo(null);
      return;
    }

    // Already checked for this user in this tab session — skip the RPC call
    if (checkedForUserRef.current === session.user.id) {
      return;
    }

    setDeviceStatus('checking_device');
    try {
      const result = await registerDevice();

      if (result && result.status) {
        // Mark that we've done the check for this user so refresh doesn't repeat it
        checkedForUserRef.current = session.user.id;
        setDeviceStatus(result.status);
        setDeviceSessionInfo(result);
      } else {
        // Network/DB error — don't lock the user out, allow access
        console.warn('Device check returned no status, defaulting to active');
        checkedForUserRef.current = session.user.id;
        setDeviceStatus('active');
      }
    } catch (err) {
      console.error('Failed to verify device:', err);
      // On error, don't block — allow access so a Supabase hiccup doesn't lock users out
      checkedForUserRef.current = session.user.id;
      setDeviceStatus('active');
    }
  };

  useEffect(() => {
    let subscription = null;

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
        console.error('Supabase getSession error:', err);
        setLoading(false);
      });

    try {
      const res = supabase.auth.onAuthStateChange(async (event, session) => {
        const newUser = session?.user ?? null;
        setUser(newUser);

        if (newUser) {
          if (event === 'SIGNED_IN') {
            // New login — reset the check so we verify the fresh session
            checkedForUserRef.current = null;
            clearCachedDeviceSession();
            await checkDevice(session);

            // Record login activity
            try {
              await supabase.from('user_activity').upsert({
                user_id: session.user.id,
                email: session.user.email,
                last_login_at: new Date().toISOString(),
                last_seen_at: new Date().toISOString(),
              }, { onConflict: 'user_id' });
            } catch (err) {
              console.error('Failed to log user activity:', err);
            }
          }
          // INITIAL_SESSION = tab re-opened, page refreshed — skip re-checking device
          // The sessionStorage cache in registerDevice handles this
        } else {
          // User signed out — clear everything
          checkedForUserRef.current = null;
          clearCachedDeviceSession();
          setDeviceStatus(null);
          setDeviceSessionInfo(null);
        }
      });
      subscription = res.data?.subscription;
    } catch (err) {
      console.error('Supabase onAuthStateChange error:', err);
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, deviceStatus, deviceSessionInfo, setDeviceStatus, setDeviceSessionInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
