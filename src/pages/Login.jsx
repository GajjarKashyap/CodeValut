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
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleRequestAccess = () => {
    navigator.clipboard.writeText('kashayapgajjar71@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 3000);
    window.open("mailto:kashayapgajjar71@gmail.com?subject=CodeVault%20Account%20Request&body=Hi%20Kashyap,%0D%0A%0D%0AI%20would%20like%20to%20request%20a%20new%20student%20account%20on%20CodeVault.%0D%0A%0D%0AHere%20are%20my%20details:%0D%0A-%20Full%20Name:%20[Enter%20Your%20Name]%0D%0A-%20Roll%20Number%20/%20Student%20ID:%20[Enter%20ID]%0D%0A-%20Class%20/%20Batch:%20[Enter%20Class]%0D%0A-%20Preferred%20Login%20Email:%20[Enter%20Email]%0D%0A%0D%0AThank%20you!", "_blank");
  };

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
          <div className="text-center pt-3 border-t border-dark-border/40 space-y-2">
            <p className="text-xs text-dark-muted font-sans">
              New user? Accounts are managed by the administrator.
            </p>
            <button 
              type="button"
              onClick={handleRequestAccess}
              className="w-full bg-dark-bg border border-dark-border hover:border-primary/50 text-white font-mono text-xs py-2.5 px-4 rounded-xl transition-all duration-300 transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {copiedEmail ? (
                <span className="text-green-400 font-bold">Email Copied to Clipboard!</span>
              ) : (
                <>
                  <Mail size={12} className="text-primary" />
                  <span>Request Account from Dev Kashyap Gajjar</span>
                </>
              )}
            </button>
            {copiedEmail && (
              <p className="text-[10px] text-dark-muted font-sans animate-fadeIn">
                Default mail client not opening? Just paste the copied email in your email app.
              </p>
            )}
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
