import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Coffee, Mail, Lock, Terminal, Check, Copy } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [copiedSection, setCopiedSection] = useState('');
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Subtle golden code/binary characters
    const codingChars = [
      'const', 'let', 'function', 'import', 'return', 'await', 'async',
      '=>', 'true', 'false', 'null', 'undefined', 'class', 'extends',
      '0', '1', '&&', '||', '===', '++', '--', '+=', '-=',
      '{', '}', '[', ']', '(', ')', ';', '<', '>', '/', '?'
    ];
    
    const fontSize = 12;
    const columns = Math.ceil(canvas.width / 40); // space columns
    
    const drops = Array.from({ length: columns }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      speed: Math.random() * 1.5 + 0.5,
      text: codingChars[Math.floor(Math.random() * codingChars.length)],
      opacity: Math.random() * 0.2 + 0.05
    }));

    const draw = () => {
      ctx.fillStyle = 'rgba(18, 18, 18, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = '11px "JetBrains Mono", monospace';

      drops.forEach((drop) => {
        ctx.fillStyle = `rgba(200, 171, 126, ${drop.opacity})`;
        ctx.fillText(drop.text, drop.x, drop.y);

        drop.y += drop.speed;

        if (drop.y > canvas.height) {
          drop.y = Math.random() * -100;
          drop.x = Math.random() * canvas.width;
          drop.text = codingChars[Math.floor(Math.random() * codingChars.length)];
          drop.opacity = Math.random() * 0.2 + 0.05;
          drop.speed = Math.random() * 1.5 + 0.5;
        }
      });
    };

    const animate = () => {
      draw();
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
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
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden bg-grid-pattern">
      {/* Dynamic Code Rain Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none w-full h-full"
      />

      {/* Visual Accent Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[130px] pointer-events-none animate-pulse-gold" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[130px] pointer-events-none animate-pulse-gold" style={{ animationDuration: '10s' }} />

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
              <Mail size={12} className="text-primary" />
              <span>Request Account from Dev Kashyap Gajjar</span>
            </button>
          </div>
        </div>

        {/* System Footer Accent */}
        <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-mono text-dark-muted uppercase tracking-widest">
          <div className="size-1.5 bg-primary rounded-full animate-pulse"></div>
          <span>SECURE VAULT SESSION ACTIVE</span>
        </div>

        {/* Development Notice */}
        <div className="mt-4 text-center">
          <p className="text-[10px] font-mono text-dark-muted/60 uppercase tracking-wider">
            App under development — data is safe but UI/UX changes daily
          </p>
        </div>
      </div>

      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-surface border border-primary/20 p-6 md:p-8 rounded-2xl max-w-lg w-full space-y-5 shadow-2xl relative animate-fadeIn">
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

            <p className="text-xs text-dark-muted leading-relaxed font-sans">
              Copy the details below and send them to the developer to get your account created.
            </p>

            {/* Copy Fields */}
            <div className="space-y-4 font-sans text-sm text-left">
              {/* Email */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-dark-muted uppercase tracking-wider font-mono">Recipient Email</label>
                <div className="flex items-center bg-dark-bg border border-dark-border rounded-xl p-2.5 gap-2">
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
                <div className="flex items-center bg-dark-bg border border-dark-border rounded-xl p-2.5 gap-2">
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
                <div className="relative bg-dark-bg border border-dark-border rounded-xl p-4">
                  <pre className="text-white text-xs font-sans whitespace-pre-wrap leading-relaxed select-all overflow-y-auto max-h-[160px] pb-8 pr-2">{"Hi Kashyap,\n\nI would like to request a new student account on CodeVault.\n\nHere are my details:\n- Full Name: [Enter Your Name]\n- Roll Number / Student ID: [Enter ID]\n- Class / Batch: [Enter Class]\n- Preferred Login Email: [Enter Email]\n\nThank you!"}</pre>
                  <button 
                    type="button" 
                    onClick={() => {
                      navigator.clipboard.writeText("Hi Kashyap,\n\nI would like to request a new student account on CodeVault.\n\nHere are my details:\n- Full Name: [Enter Your Name]\n- Roll Number / Student ID: [Enter ID]\n- Class / Batch: [Enter Class]\n- Preferred Login Email: [Enter Email]\n\nThank you!");
                      setCopiedSection('body');
                      setTimeout(() => setCopiedSection(''), 2000);
                    }}
                    className="absolute right-3 bottom-3 bg-dark-surface border border-dark-border hover:border-primary/50 text-xs text-primary hover:text-primary/80 font-mono flex items-center gap-1.5 px-3 py-1 rounded-lg cursor-pointer shadow-lg"
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
