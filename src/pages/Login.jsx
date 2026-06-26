import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Coffee, Mail, Lock, Terminal, Check, Copy, Smartphone, Fingerprint, LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [copiedSection, setCopiedSection] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('codevault_theme') || 'original';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleRequestAccess = () => {
    setShowRequestModal(true);
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
    <div className="min-h-screen bg-dark-bg text-dark-text flex items-center justify-center p-4 relative overflow-hidden bg-grid-pattern">
      <style>{`
        @keyframes scanline {
          0% { bottom: 100%; }
          100% { bottom: -100px; }
        }
        .scanline {
          width: 100%;
          height: 100px;
          z-index: 5;
          background: linear-gradient(0deg, rgba(200, 171, 126, 0) 0%, rgba(200, 171, 126, 0.03) 50%, rgba(200, 171, 126, 0) 100%);
          opacity: 0.15;
          position: absolute;
          bottom: 100%;
          animation: scanline 8s linear infinite;
          pointer-events: none;
        }
        .theme-bg-primary-5 {
          background-color: color-mix(in srgb, var(--color-primary) 5%, transparent);
        }
        .theme-bg-primary-10 {
          background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
        }
        .theme-bg-primary-15 {
          background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
        }
        .theme-border-primary-20 {
          border-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
        }
        .theme-border-primary-25 {
          border-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
        }
        .theme-border-primary-40 {
          border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
        }
        .theme-border-primary-45 {
          border-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
        }
      `}</style>

      {/* Scanline decoration */}
      <div className="scanline" />

      {/* Subtle Corner Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Centered Golden Backlight Glow behind the login card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] md:w-[450px] md:h-[450px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full z-10 flex flex-col items-center">
        {/* Compact Header Section */}
        <div className="text-center mb-4 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="theme-bg-primary-10 w-10 h-10 rounded-xl flex items-center justify-center border theme-border-primary-20 shadow-lg shadow-primary/5 animate-pulse">
              <Coffee size={22} className="text-primary" />
            </div>
            <h1 className="text-3xl font-bold font-serif text-primary tracking-tight">CodeVault</h1>
          </div>
          <div className="px-3 py-1 rounded-full border theme-border-primary-20 theme-bg-primary-5 shadow-sm">
            <span className="font-mono text-[9px] uppercase tracking-widest text-primary font-semibold">
              Developed by Kashyap Gajjar
            </span>
          </div>
        </div>

        {/* Glassmorphic Terminal Card (More Compact) */}
        <div className="bg-dark-surface backdrop-blur-md p-6 rounded-2xl border border-primary/20 shadow-2xl space-y-4 relative overflow-hidden group transition-all duration-300 hover:border-primary/30 w-full">
          {/* Decorative Corner Accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/30 rounded-tl-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/30 rounded-br-2xl pointer-events-none"></div>

          {/* Terminal Window Header Decoration */}
          <div className="flex items-center justify-between border-b border-dark-border pb-3 -mt-1">
            <div className="flex items-center space-x-2 text-[11px] font-mono text-dark-muted">
              <Terminal size={12} className="text-primary" />
              <span>ssh student@codevault</span>
            </div>
            <div className="flex gap-1.5">
              <div className="size-1.5 rounded-full bg-red-500/30"></div>
              <div className="size-1.5 rounded-full bg-yellow-500/30"></div>
              <div className="size-1.5 rounded-full bg-green-500/30"></div>
            </div>
          </div>

          <div className="text-left mb-3">
            <h2 className="text-xl font-bold font-serif text-dark-text mb-0.5">Secure Access</h2>
            <p className="text-dark-muted font-mono text-[10px]">Enter credentials to decrypt session.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-sans text-left">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-[9px] font-semibold font-mono uppercase tracking-widest text-primary mb-1.5">Access Identity</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-muted">
                  <Fingerprint size={16} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border focus:border-primary focus:ring-2 focus:ring-primary/10 text-dark-text rounded-xl pl-12 pr-4 py-2.5 focus:outline-none transition-all font-sans placeholder-dark-muted text-xs"
                  placeholder="student1@codevault.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-semibold font-mono uppercase tracking-widest text-primary mb-1.5">Security Protocol</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-muted">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border focus:border-primary focus:ring-2 focus:ring-primary/10 text-dark-text rounded-xl pl-12 pr-4 py-2.5 focus:outline-none transition-all font-sans placeholder-dark-muted text-xs"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-dark-bg font-bold py-3 rounded-xl transition-all duration-300 transform active:scale-95 shadow-lg shadow-primary/10 hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed font-sans cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span className="uppercase tracking-widest text-xs font-semibold">
                {loading ? 'Establishing connection...' : 'Initiate Session'}
              </span>
              <LogIn size={14} className="transition-transform group-hover:translate-x-1" />
            </button>
          </form>
          
          {/* Account Request Info */}
          <div className="text-center pt-3 border-t border-dark-border/40 space-y-1.5">
            <p className="text-[11px] text-dark-muted font-sans">
              New user? Accounts are managed by the administrator.
            </p>
            <button 
              type="button"
              onClick={handleRequestAccess}
              className="w-full bg-transparent border border-dark-border hover:border-primary/50 text-dark-text font-mono text-[11px] py-2 px-3 rounded-xl transition-all duration-300 transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Mail size={11} className="text-primary" />
              <span>Request Account from Dev Kashyap Gajjar</span>
            </button>
          </div>
        </div>

        {/* Compact Android App Promotion Banner */}
        <div className="mt-3.5 theme-bg-primary-5 backdrop-blur-md p-4 rounded-xl border theme-border-primary-20 shadow-2xl flex items-center justify-between gap-3 animate-pulse-gold w-full">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl theme-bg-primary-10 flex items-center justify-center border theme-border-primary-20 shrink-0">
              <Smartphone size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-primary font-bold text-xs tracking-tight flex items-center gap-1.5">
                Android App Beta v1
                <span className="text-[8px] font-bold text-dark-bg bg-primary px-1 rounded font-mono uppercase tracking-wider">Live</span>
              </h3>
              <p className="text-dark-muted text-[10px] leading-tight mt-0.5">Mobile vault access now available for testing.</p>
            </div>
          </div>
          <a 
            href="https://github.com/GajjarKashyap/CodeValut/actions" 
            target="_blank" 
            rel="noopener noreferrer"
            className="theme-bg-primary-15 border theme-border-primary-45 text-primary text-[9px] font-bold py-2 px-3.5 rounded-lg uppercase tracking-widest hover:bg-primary hover:text-dark-bg transition-all duration-300 whitespace-nowrap cursor-pointer shadow-md shrink-0 text-center"
          >
            Download APK
          </a>
        </div>

        {/* System Footer Accent */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[9px] font-mono text-dark-muted uppercase tracking-widest">
          <div className="size-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <span>System Uplink Stable: 256-bit AES</span>
        </div>

        {/* Development Notice */}
        <div className="mt-2 text-center">
          <p className="text-[9px] font-mono text-dark-muted opacity-50 uppercase tracking-wider">
            App under development — data is safe but UI/UX changes daily
          </p>
        </div>
      </div>

      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-primary/20 p-6 md:p-8 rounded-2xl max-w-lg w-full space-y-5 shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-dark-border pb-3">
              <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                <Mail size={18} className="text-primary" /> Request Account
              </h3>
              <button 
                onClick={() => setShowRequestModal(false)}
                className="text-dark-muted hover:text-white transition-colors cursor-pointer text-sm font-mono"
              >
                [ESC/CLOSE]
              </button>
            </div>

            <p className="text-xs text-dark-muted leading-relaxed font-sans text-left">
              Copy the details below and send them to the developer to get your account created.
            </p>

            {/* Copy Fields */}
            <div className="space-y-4 font-sans text-sm text-left">
              {/* Email */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-dark-muted uppercase tracking-wider font-mono">Recipient Email</label>
                <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 gap-2">
                  <span className="text-white text-xs font-mono select-all truncate flex-1">kashayapgajjar71@gmail.com</span>
                  <button 
                    type="button" 
                    onClick={() => {
                      navigator.clipboard.writeText('kashayapgajjar71@gmail.com');
                      setCopiedSection('email');
                      setTimeout(() => setCopiedSection(''), 2000);
                    }}
                    className="text-xs text-primary hover:text-primary/80 font-mono flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedSection === 'email' ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    {copiedSection === 'email' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-dark-muted uppercase tracking-wider font-mono">Subject</label>
                <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 gap-2">
                  <span className="text-white text-xs font-mono select-all truncate flex-1">CodeVault Account Request</span>
                  <button 
                    type="button" 
                    onClick={() => {
                      navigator.clipboard.writeText('CodeVault Account Request');
                      setCopiedSection('subject');
                      setTimeout(() => setCopiedSection(''), 2000);
                    }}
                    className="text-xs text-primary hover:text-primary/80 font-mono flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedSection === 'subject' ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    {copiedSection === 'subject' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Body Template */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-dark-muted uppercase tracking-wider font-mono">Email Body Template</label>
                <div className="relative bg-neutral-950 border border-neutral-800 rounded-xl p-4">
                  <pre className="text-white text-xs font-sans whitespace-pre-wrap leading-relaxed select-all overflow-y-auto max-h-[160px] pb-8 pr-2">{"Hi Kashyap,\n\nI would like to request a new student account on CodeVault.\n\nHere are my details:\n- Full Name: [Enter Your Name]\n- Roll Number / Student ID: [Enter ID]\n- Class / Batch: [Enter Class]\n- Preferred Login Email: [Enter Email]\n\nThank you!"}</pre>
                  <button 
                    type="button" 
                    onClick={() => {
                      navigator.clipboard.writeText("Hi Kashyap,\n\nI would like to request a new student account on CodeVault.\n\nHere are my details:\n- Full Name: [Enter Your Name]\n- Roll Number / Student ID: [Enter ID]\n- Class / Batch: [Enter Class]\n- Preferred Login Email: [Enter Email]\n\nThank you!");
                      setCopiedSection('body');
                      setTimeout(() => setCopiedSection(''), 2000);
                    }}
                    className="absolute right-3 bottom-3 bg-neutral-900 border border-neutral-800 hover:border-primary/50 text-xs text-primary hover:text-primary/80 font-mono flex items-center gap-1.5 px-3 py-1 rounded-lg cursor-pointer shadow-lg"
                  >
                    {copiedSection === 'body' ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    {copiedSection === 'body' ? 'Template Copied!' : 'Copy Template'}
                  </button>
                </div>
              </div>
            </div>

            {/* Close Action */}
            <button 
              type="button"
              onClick={() => {
                setShowRequestModal(false);
                window.open("mailto:kashayapgajjar71@gmail.com?subject=CodeVault%20Account%20Request&body=Hi%20Kashyap,%0D%0A%0D%0AI%20would%20like%20to%20request%20a%20new%20student%20account%20on%20CodeVault.%0D%0A%0D%0AHere%20are%20my%20details:%0D%0A-%20Full%20Name:%20[Enter%20Your%20Name]%0D%0A-%20Roll%20Number%20/%20Student%20ID:%20[Enter%20ID]%0D%0A-%20Class%20/%20Batch:%20[Enter%20Class]%0D%0A-%20Preferred%20Login%20Email:%20[Enter%20Email]%0D%0A%0D%0AThank%20you!", "_blank");
              }}
              className="w-full bg-primary hover:bg-primary/90 text-dark-bg font-bold py-2.5 rounded-xl transition-all duration-300 transform active:scale-95 cursor-pointer font-sans text-sm mt-2"
            >
              Done — Open Email App
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
