import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { WifiOff, RefreshCw, Home, Globe, Terminal } from 'lucide-react';

export default function NetworkError() {
  const [checking, setChecking] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Network or Supabase cloud endpoint unreachable.');

  const handleRetry = async () => {
    setChecking(true);
    setStatusMsg('Pinging CodeVault cloud services...');
    try {
      const res = await fetch('https://gajjarkashyap.github.io/CodeValut/version.json?t=' + Date.now());
      if (res.ok) {
        setStatusMsg('Connection restored! Reloading...');
        setTimeout(() => window.location.reload(), 800);
        return;
      }
      throw new Error('Endpoint not responding');
    } catch (err) {
      setTimeout(() => {
        setStatusMsg('Still unreachable. Please check your WiFi or network settings.');
        setChecking(false);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Cyan Ambient Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[140px] pointer-events-none animate-pulse" />

      <div className="max-w-lg w-full text-center space-y-8 z-10 animate-fadeIn">
        {/* Icon */}
        <div className="mx-auto w-24 h-24 bg-cyan-500/10 border border-cyan-500/30 rounded-3xl flex items-center justify-center shadow-2xl shadow-cyan-500/10">
          <WifiOff size={44} className="text-cyan-400 animate-pulse" />
        </div>

        {/* Header */}
        <div>
          <div className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-bold rounded-full mb-3 uppercase tracking-widest">
            Error 503 • Offline Mode
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white font-serif tracking-tight">
            Connection Lost
          </h1>
          <p className="text-dark-muted font-sans text-sm leading-relaxed max-w-md mx-auto mt-3">
            {statusMsg}
          </p>
        </div>

        {/* Terminal diagnostic */}
        <div className="bg-dark-surface border border-dark-border rounded-2xl p-4 text-left space-y-1.5 font-mono text-xs shadow-xl">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-dark-border/60 text-dark-muted">
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-cyan-400" />
              <span className="font-bold text-dark-text">network ping diagnostic</span>
            </div>
            <Terminal size={14} className="text-dark-muted" />
          </div>
          <p><span className="text-cyan-400 font-bold">$</span> <span className="text-dark-text">ping api.supabase.co -c 3</span></p>
          <p className="text-red-400">Request timeout for icmp_seq 0... Network unreachable.</p>
          <p><span className="text-cyan-400 font-bold">$</span> <span className="text-dark-text">status</span></p>
          <p className="text-yellow-400 flex items-center gap-1.5">
            <span>Waiting for network connectivity to restore...</span>
            <span className="inline-block w-2 h-3 bg-cyan-400 animate-pulse"></span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleRetry}
            disabled={checking}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-dark-bg font-bold px-6 py-3 rounded-xl transition-all active:scale-95 text-sm shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
            <span>{checking ? 'Checking...' : 'Retry Connection'}</span>
          </button>
          <Link
            to="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-dark-surface border border-dark-border hover:border-white/20 text-white font-semibold px-6 py-3 rounded-xl transition-all text-sm cursor-pointer"
          >
            <Home size={16} />
            Dashboard
          </Link>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-dark-muted font-mono tracking-widest uppercase">
          CODEVAULT — CLOUD CONNECTIVITY MONITOR
        </p>
      </div>
    </div>
  );
}
