import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, Home, LogIn, ArrowLeft, Terminal } from 'lucide-react';

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Amber/Orange Ambient Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-red-500/10 blur-[140px] pointer-events-none animate-pulse" />

      <div className="max-w-lg w-full text-center space-y-8 z-10 animate-fadeIn">
        {/* Icon */}
        <div className="mx-auto w-24 h-24 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/10">
          <Lock size={44} className="text-amber-400 animate-bounce" />
        </div>

        {/* Header */}
        <div>
          <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-bold rounded-full mb-3 uppercase tracking-widest">
            Error 403 • Access Denied
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white font-serif tracking-tight">
            Restricted Access
          </h1>
          <p className="text-dark-muted font-sans text-sm leading-relaxed max-w-md mx-auto mt-3">
            You don&apos;t have authorization to view this private code session, locked group channel, or admin area.
          </p>
        </div>

        {/* Terminal diagnostic */}
        <div className="bg-dark-surface border border-dark-border rounded-2xl p-4 text-left space-y-1.5 font-mono text-xs shadow-xl">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-dark-border/60 text-dark-muted">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70"></div>
              <span className="ml-1 text-[11px] text-dark-text font-bold">security — policy check</span>
            </div>
            <ShieldAlert size={14} className="text-amber-400" />
          </div>
          <p><span className="text-amber-400 font-bold">$</span> <span className="text-dark-text">check-auth --resource restricted</span></p>
          <p className="text-red-400">[DENIED] Current user token lacks required read/write permissions.</p>
          <p><span className="text-amber-400 font-bold">$</span> <span className="text-dark-text">solution</span></p>
          <p className="text-green-400 flex items-center gap-1.5">
            <span>Request invite from session owner or switch accounts</span>
            <span className="inline-block w-2 h-3 bg-amber-400 animate-pulse"></span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-dark-bg font-bold px-6 py-3 rounded-xl transition-all active:scale-95 text-sm shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Home size={16} />
            Dashboard
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-dark-surface border border-dark-border hover:border-white/20 text-white font-semibold px-6 py-3 rounded-xl transition-all text-sm cursor-pointer"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-dark-muted font-mono tracking-widest uppercase">
          CODEVAULT — SECURITY POLICY ENFORCER
        </p>
      </div>
    </div>
  );
}
