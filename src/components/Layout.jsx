import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Home, Coffee, Database, Search, Star, LogOut, PlusSquare, ShieldCheck, Zap, Archive, MessageCircle } from 'lucide-react';

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      supabase.from('user_activity').upsert({
        user_id: user.id,
        email: user.email,
        last_seen_at: new Date().toISOString()
      }, { onConflict: 'user_id' }).then(({ error }) => {
        if (error) console.error('Error updating last_seen_at:', error);
      });
    }
  }, [location.pathname, user]);
  const isAdmin = user?.email?.trim()?.toLowerCase() === 'admin@admin.com';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navLinks = [
    { to: "/", icon: <Home size={20} />, label: "Dashboard" },
    { to: "/chat", icon: <MessageCircle size={20} />, label: "Chat" },
    { to: "/sessions/java", icon: <Coffee size={20} />, label: "Java" },
    { to: "/sessions/mongodb", icon: <Database size={20} />, label: "MongoDB" },
    { to: "/search", icon: <Search size={20} />, label: "Search" },
    { to: "/favorites", icon: <Star size={20} />, label: "Favorites" },
    { to: "/archive", icon: <Archive size={20} />, label: "Archive" },
  ];

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U';
  const shortEmail = user?.email?.length > 22 ? user.email.substring(0, 20) + '…' : user?.email;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-dark-bg text-dark-text">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-dark-border bg-dark-surface p-4 shrink-0">
        {/* Logo */}
        <div className="flex items-center space-x-3 mb-7 px-2">
          <div className="bg-primary/15 p-2 rounded-xl border border-primary/20 shadow-lg shadow-primary/10">
            <Coffee size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide font-serif leading-none">CodeVault</h1>
            <p className="text-[10px] text-dark-muted font-mono tracking-widest mt-0.5">LAB NOTEBOOK</p>
          </div>
        </div>

        {/* Beta Notice */}
        <div className="mb-5 mx-1 px-3 py-2.5 rounded-lg bg-primary/8 border border-primary/20 space-y-1">
          <div className="flex items-center gap-1.5">
            <Zap size={11} className="text-primary" />
            <span className="text-[10px] text-primary font-mono font-bold tracking-widest uppercase">Beta Phase</span>
          </div>
          <p className="text-[10px] text-dark-muted font-sans leading-relaxed">
            Progress is safe but app changes every day.
          </p>
          <p className="text-[10px] text-primary/70 font-mono">Dev: Kashyap Gajjar</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 font-sans">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-primary/15 text-primary font-semibold border border-primary/20'
                    : 'text-dark-muted hover:text-white hover:bg-dark-border/40'
                }`
              }
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Info */}
        <div className="mt-4 pt-4 border-t border-dark-border space-y-3">
          <div className="px-3 flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center text-sm font-bold text-primary font-mono shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-white truncate font-sans">{shortEmail}</p>
              {isAdmin && (
                <p className="text-[10px] text-primary font-mono tracking-wide flex items-center gap-1 mt-0.5">
                  <ShieldCheck size={10} /> ADMIN
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 text-dark-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-sans cursor-pointer"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pb-16 md:pb-0 h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 flex items-center justify-between px-5 border-b border-dark-border bg-dark-surface/80 backdrop-blur-md shrink-0">
          <div className="font-medium font-mono text-xs text-dark-muted tracking-wide">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/session/new')}
              className="bg-primary hover:bg-primary/90 text-dark-bg px-4 py-1.5 rounded-lg text-sm font-bold flex items-center transition-all shadow-lg shadow-primary/15 cursor-pointer font-sans active:scale-95"
            >
              <PlusSquare size={15} className="mr-1.5" /> Quick Save
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-dark-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-dark-surface border-t border-dark-border flex items-center justify-around px-2 z-50">
        {navLinks.slice(0,5).map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-0.5 ${
                isActive ? 'text-primary' : 'text-dark-muted'
              }`
            }
          >
            {link.icon}
            <span className="text-[10px] font-medium font-sans">{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
