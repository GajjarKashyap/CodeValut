const fs = require('fs');
const path = require('path');

const dirs = ['src/components', 'src/pages', 'src/contexts', 'src/lib'];
dirs.forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

fs.writeFileSync('src/index.css', \@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-dark-bg text-dark-text antialiased;
  }
}

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #121212; }
::-webkit-scrollbar-thumb { background: #2d2d2d; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #3d3d3d; }

.monaco-editor, .monaco-editor-background, .monaco-editor .inputarea.ime-input {
  background-color: transparent !important;
}
\);

fs.writeFileSync('src/lib/supabase.js', \import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
\);

fs.writeFileSync('src/contexts/AuthContext.jsx', \import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
\);
