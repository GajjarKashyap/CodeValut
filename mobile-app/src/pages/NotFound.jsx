import { Link, useLocation } from 'react-router-dom';
import { Coffee, Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="max-w-lg w-full text-center space-y-8 z-10">
        {/* Icon */}
        <div className="mx-auto w-24 h-24 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/5">
          <Coffee size={44} className="text-primary" />
        </div>

        {/* Error code */}
        <div>
          <h1 className="text-8xl font-black text-dark-border font-mono select-none leading-none">
            404
          </h1>
          <div className="mt-4 space-y-2">
            <h2 className="text-2xl font-bold text-white font-serif">Page Not Found</h2>
            <p className="text-dark-muted font-sans text-sm leading-relaxed">
              The session you&apos;re looking for doesn&apos;t exist or may have been archived.
            </p>
            {location.pathname && (
              <p className="text-xs font-mono text-dark-border bg-dark-surface border border-dark-border rounded-lg px-4 py-2 inline-block mt-2">
                {location.pathname}
              </p>
            )}
          </div>
        </div>

        {/* Terminal style hint */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-4 text-left space-y-1 font-mono text-xs">
          <div className="flex items-center gap-2 text-dark-muted mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
            <span className="ml-2 text-dark-border">terminal</span>
          </div>
          <p><span className="text-primary">$</span> <span className="text-dark-muted">find session --path &quot;{location.pathname}&quot;</span></p>
          <p className="text-red-400">Error: No such file or directory</p>
          <p><span className="text-primary">$</span> <span className="text-dark-muted">cd /dashboard</span></p>
          <p className="text-green-400 flex items-center gap-1">
            <span className="inline-block w-2 h-3 bg-primary animate-pulse"></span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-dark-bg font-bold px-6 py-3 rounded-xl transition-all active:scale-95 font-sans text-sm shadow-lg shadow-primary/20"
          >
            <Home size={16} />
            Back to Dashboard
          </Link>
          <Link
            to="/search"
            className="flex items-center gap-2 bg-dark-surface border border-dark-border hover:border-primary/40 text-white px-6 py-3 rounded-xl transition-all font-sans text-sm"
          >
            <Search size={16} />
            Search Sessions
          </Link>
        </div>

        {/* Footer */}
        <p className="text-xs text-dark-border font-mono tracking-widest">
          CODEVAULT — LAB NOTEBOOK
        </p>
      </div>
    </div>
  );
}
