import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Coffee, Home, Search, ArrowLeft, MessageCircle, Terminal, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[140px] pointer-events-none animate-pulse" />

      <div className="max-w-lg w-full text-center space-y-8 z-10 animate-fadeIn">
        {/* Icon */}
        <div className="mx-auto w-24 h-24 bg-primary/10 border border-primary/30 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/10 rotate-3 hover:rotate-0 transition-transform">
          <Coffee size={44} className="text-primary" />
        </div>

        {/* Error Code & Header */}
        <div>
          <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold rounded-full mb-3 uppercase tracking-widest">
            Error 404 • Not Found
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white font-serif tracking-tight">
            Page Not Found
          </h1>
          <p className="text-dark-muted font-sans text-sm leading-relaxed max-w-md mx-auto mt-3">
            The code session, chat channel, or route you&apos;re trying to reach doesn&apos;t exist, has been deleted, or may have expired.
          </p>
          {location.pathname && (
            <div className="mt-3 inline-flex items-center gap-2 text-xs font-mono text-dark-text bg-dark-surface border border-dark-border rounded-xl px-4 py-2 shadow-inner">
              <span className="text-red-400 font-bold">404</span>
              <span className="text-dark-border">|</span>
              <span className="truncate max-w-[250px]">{location.pathname}</span>
            </div>
          )}
        </div>

        {/* Interactive Search Box */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto">
          <div className="relative flex items-center">
            <Search className="absolute left-4 text-dark-muted" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your code snippets or vault..."
              className="w-full bg-dark-surface border border-dark-border hover:border-primary/40 focus:border-primary rounded-xl pl-11 pr-24 py-3 text-sm text-white placeholder-dark-muted focus:outline-none transition-all shadow-lg"
            />
            <button
              type="submit"
              className="absolute right-2 bg-primary hover:bg-primary/90 text-dark-bg font-bold px-4 py-1.5 rounded-lg text-xs transition-transform active:scale-95 cursor-pointer"
            >
              Search
            </button>
          </div>
        </form>

        {/* Terminal style hint */}
        <div className="bg-dark-surface border border-dark-border rounded-2xl p-4 text-left space-y-1.5 font-mono text-xs shadow-xl">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-dark-border/60 text-dark-muted">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70"></div>
              <span className="ml-1 text-[11px] text-dark-text font-bold">bash — diagnostic</span>
            </div>
            <Terminal size={14} className="text-dark-muted" />
          </div>
          <p><span className="text-primary font-bold">$</span> <span className="text-dark-text">codevault inspect --path &quot;{location.pathname}&quot;</span></p>
          <p className="text-red-400">[ERROR] Target resource not found in vault index.</p>
          <p><span className="text-primary font-bold">$</span> <span className="text-dark-text">suggestion</span></p>
          <p className="text-green-400 flex items-center gap-1.5">
            <span>Try searching or returning to dashboard</span>
            <span className="inline-block w-2 h-3 bg-primary animate-pulse"></span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-dark-bg font-bold px-6 py-3 rounded-xl transition-all active:scale-95 text-sm shadow-lg shadow-primary/20 cursor-pointer"
          >
            <Home size={16} />
            Back to Dashboard
          </Link>
          <Link
            to="/chat"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-dark-surface border border-dark-border hover:border-primary/40 text-white font-semibold px-6 py-3 rounded-xl transition-all text-sm cursor-pointer"
          >
            <MessageCircle size={16} className="text-primary" />
            View Chats
          </Link>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-dark-muted font-mono tracking-widest uppercase">
          CODEVAULT — SYSTEM ERROR HANDLER
        </p>
      </div>
    </div>
  );
}
