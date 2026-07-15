import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Copy, Check, Home, Terminal, Cpu } from 'lucide-react';

export default function ServerError({ error = null, onRestart = null }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const errorMessage = error?.toString() || 'Fatal server or application execution exception caused by an unexpected runtime error.';
  const stackTrace = error?.stack || 'No detailed stack trace available for this error event.';

  const handleCopyError = () => {
    const report = `--- CodeVault Crash Report ---\nTimestamp: ${new Date().toISOString()}\nError: ${errorMessage}\nStack: ${stackTrace}`;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDefaultRestart = () => {
    localStorage.removeItem('codevault_last_active_route');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Crimson Ambient Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-red-500/10 blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[150px] pointer-events-none animate-pulse" />

      <div className="max-w-xl w-full text-center space-y-7 z-10 animate-fadeIn">
        {/* Icon */}
        <div className="mx-auto w-24 h-24 bg-red-500/10 border border-red-500/30 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-500/10">
          <AlertTriangle size={44} className="text-red-500 animate-pulse" />
        </div>

        {/* Header */}
        <div>
          <div className="inline-block px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono font-bold rounded-full mb-3 uppercase tracking-widest">
            Error 500 • Runtime Exception
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-serif tracking-tight">
            Something Went Wrong
          </h1>
          <p className="text-dark-muted font-sans text-sm leading-relaxed max-w-md mx-auto mt-3">
            CodeVault encountered an unexpected error while rendering this page or processing database operations.
          </p>
        </div>

        {/* Diagnostic Stack Box */}
        <div className="bg-dark-surface border border-red-500/30 rounded-2xl p-4 text-left space-y-2 font-mono text-xs shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-dark-border/60 text-dark-muted">
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-red-400" />
              <span className="font-bold text-dark-text">Crash Diagnostics Log</span>
            </div>
            <button
              type="button"
              onClick={handleCopyError}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-dark-bg hover:bg-dark-border/40 border border-dark-border rounded-lg text-[11px] text-dark-text font-bold transition-all cursor-pointer shadow-sm"
              title="Copy crash report to clipboard"
            >
              {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
              <span>{copied ? 'Copied Log!' : 'Copy Error Log'}</span>
            </button>
          </div>
          
          <div className="p-3 bg-dark-bg rounded-xl border border-dark-border overflow-x-auto max-h-48 text-red-300 select-all space-y-1">
            <p className="font-bold text-red-400">{errorMessage}</p>
            {stackTrace && (
              <pre className="text-[10px] text-dark-muted font-mono leading-tight whitespace-pre-wrap mt-2 pt-2 border-t border-dark-border/40">
                {stackTrace}
              </pre>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onRestart || handleDefaultRestart}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-dark-bg font-bold px-6 py-3 rounded-xl transition-all active:scale-95 text-sm shadow-lg shadow-primary/20 cursor-pointer"
          >
            <RefreshCw size={16} />
            <span>Restart &amp; Clear Cache</span>
          </button>
          <Link
            to="/"
            onClick={() => localStorage.removeItem('codevault_last_active_route')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-dark-surface border border-dark-border hover:border-white/20 text-white font-semibold px-6 py-3 rounded-xl transition-all text-sm cursor-pointer"
          >
            <Home size={16} />
            <span>Go to Dashboard</span>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-dark-muted font-mono tracking-widest uppercase">
          CODEVAULT — CRASH RECOVERY SHIELD
        </p>
      </div>
    </div>
  );
}
