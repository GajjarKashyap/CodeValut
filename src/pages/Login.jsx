import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Coffee, Mail, Lock, Terminal } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Visual Accent Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full z-10">
        <div className="text-center mb-8">
          <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-xl shadow-primary/5 animate-pulse">
            <Coffee size={40} className="text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif text-white mb-2 tracking-tight">CodeVault</h1>
          <p className="text-dark-muted font-sans text-sm">Secure practical notebook for college labs</p>
        </div>

        {/* Glassmorphic Terminal Card */}
        <div className="bg-dark-surface/60 backdrop-blur-md p-8 rounded-2xl border border-primary/20 shadow-2xl space-y-6">
          {/* Terminal Window Header Decoration */}
          <div className="flex items-center justify-between border-b border-dark-border pb-4 -mt-2">
            <div className="flex items-center space-x-2 text-xs font-mono text-dark-muted">
              <Terminal size={14} className="text-primary" />
              <span>ssh student@codevault</span>
            </div>
            <div className="flex gap-1.5">
              <div className="size-2 rounded-full bg-red-500/30"></div>
              <div className="size-2 rounded-full bg-yellow-500/30"></div>
              <div className="size-2 rounded-full bg-green-500/30"></div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm font-sans">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-2 font-sans">Email Address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-muted">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-dark-bg/80 border border-dark-border focus:border-primary/50 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none transition-all font-sans placeholder-dark-border"
                  placeholder="student1@codevault.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-muted mb-2 font-sans">Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-muted">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-dark-bg/80 border border-dark-border focus:border-primary/50 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none transition-all font-sans placeholder-dark-border"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-dark-bg font-bold py-3 rounded-xl transition-all duration-300 transform active:scale-95 shadow-lg shadow-primary/10 hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed font-sans cursor-pointer"
            >
              {loading ? 'Establishing connection...' : 'Access Vault'}
            </button>
          </form>
          
          {/* Account Request Info */}
          <div className="text-center pt-3 border-t border-dark-border/40">
            <p className="text-xs text-dark-muted font-sans">
              New user? Accounts are managed by the administrator.
            </p>
            <a 
              href="mailto:2072@admin.com?subject=CodeVault Account Request&body=Hi, I would like to request an account on CodeVault. My student details are:%0A- Name:%0A- Student ID:%0A- Class/Year:"
              className="text-xs text-primary hover:underline font-mono mt-1 inline-block"
            >
              Request Access from Dev Kashyap Gajjar
            </a>
          </div>
        </div>

        {/* System Footer Accent */}
        <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-mono text-dark-muted uppercase tracking-widest">
          <div className="size-1.5 bg-primary rounded-full animate-pulse"></div>
          <span>SECURE VAULT SESSION ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
