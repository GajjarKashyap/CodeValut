import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription = null;
    
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch(err => {
        console.error("Supabase getSession error:", err);
        setLoading(false);
      });

    try {
      const res = supabase.auth.onAuthStateChange(async (event, session) => {
        setUser(session?.user ?? null);
        
        // Record login activity if signed in
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
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
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
