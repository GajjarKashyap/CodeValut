import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Home, Coffee, Database, Search, Star, LogOut, PlusSquare, ShieldCheck, Zap, Archive, Settings, MessageCircle, Bell, BellRing, X, Share2, Menu } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  
  // Mobile enhancements
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [sharedBadge, setSharedBadge] = useState(false);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const [profileLoading, setProfileLoading] = useState(true);

  // Swipe gesture variables
  const [touchStart, setTouchStart] = useState(null);
  const [touchTranslation, setTouchTranslation] = useState(0);

  // Safe plugin helper
  const triggerHaptic = async () => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const enableHaptics = localStorage.getItem('codevault_flag_enable_haptics') !== 'false';
    if (prefersReduced || !enableHaptics) return;
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (e) {
        console.warn('Haptics not available:', e);
      }
    }
  };

  // Sync window size
  useEffect(() => {
    const handleResize = () => {
      setIsTablet(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // System theme synchronization
  useEffect(() => {
    const syncTheme = () => {
      const savedTheme = localStorage.getItem('codevault_theme') || 'original';
      if (savedTheme === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', systemDark ? 'original' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', savedTheme);
      }
    };
    syncTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', syncTheme);
    window.addEventListener('theme-changed', syncTheme);
    return () => {
      mediaQuery.removeEventListener('change', syncTheme);
      window.removeEventListener('theme-changed', syncTheme);
    };
  }, []);

  // Safe Capacitor Native Permissions
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const requestCapacitorPermission = async () => {
        try {
          const permStatus = await LocalNotifications.checkPermissions();
          if (permStatus.display !== 'granted') {
            await LocalNotifications.requestPermissions();
          }
        } catch (err) {
          console.warn('Capacitor LocalNotifications permission failed:', err);
        }
      };
      requestCapacitorPermission();
    }
  }, []);

  // Keyboard avoidance
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      try {
        const showListener = Keyboard.addListener('keyboardWillShow', () => setIsKeyboardVisible(true));
        const hideListener = Keyboard.addListener('keyboardWillHide', () => setIsKeyboardVisible(false));
        return () => {
          showListener.then(l => l.remove());
          hideListener.then(l => l.remove());
        };
      } catch (e) {
        console.warn('Keyboard listeners not available:', e);
      }
    }
  }, []);

  // Android hardware back button handler
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      try {
        const backListener = App.addListener('backButton', () => {
          if (showMenuDrawer) {
            triggerHaptic();
            setShowMenuDrawer(false);
          } else if (window.history.state && window.history.state.idx > 0) {
            triggerHaptic();
            window.history.back();
          } else {
            App.exitApp();
          }
        });
        return () => {
          backListener.then(l => l.remove());
        };
      } catch (e) {
        console.warn('Back button listener failed:', e);
      }
    }
  }, [showMenuDrawer]);

  // Deep Link parser
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      try {
        const urlListener = App.addListener('appUrlOpen', (event) => {
          const urlStr = event.url;
          const parts = urlStr.split('#');
          if (parts.length > 1) {
            const route = parts[1];
            triggerHaptic();
            navigate(route);
          } else {
            const pathParts = urlStr.split('/CodeValut/');
            if (pathParts.length > 1) {
              const route = pathParts[1].replace(/^\/?#?/, '');
              triggerHaptic();
              navigate('/' + route);
            }
          }
        });
        return () => {
          urlListener.then(l => l.remove());
        };
      } catch (e) {
        console.warn('Deep link listener failed:', e);
      }
    }
  }, [navigate]);

  // App State Pause & Resume check
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      try {
        const stateListener = App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            const now = Date.now();
            if (now - lastRefreshTime >= 30000) {
              setLastRefreshTime(now);
              fetchProfileAndNotifications();
              checkChatUnread();
              checkSharedBadge();
              window.dispatchEvent(new CustomEvent('app-foreground-refresh'));
            }
          } else {
            localStorage.setItem('codevault_last_active_route', location.pathname);
          }
        });
        return () => {
          stateListener.then(l => l.remove());
        };
      } catch (e) {
        console.warn('AppState listener failed:', e);
      }
    }
  }, [lastRefreshTime, location.pathname]);

  // Persist last route
  useEffect(() => {
    localStorage.setItem('codevault_last_active_route', location.pathname);
  }, [location.pathname]);

  // Check last active tab on startup
  useEffect(() => {
    const lastRoute = localStorage.getItem('codevault_last_active_route');
    if (lastRoute && lastRoute !== location.pathname && lastRoute !== '/login' && lastRoute !== '/register') {
      navigate(lastRoute);
    }
  }, []);

  // Offline / Online listeners & Mutation Queue processing
  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      
      // Process offline queue
      const queue = JSON.parse(localStorage.getItem('codevault_offline_queue') || '[]');
      if (queue.length > 0) {
        setIsSyncing(true);
        triggerHaptic();
        try {
          for (const item of queue) {
            if (item.type === 'favorite') {
              await supabase.from('sessions').update({ is_favorite: item.status }).eq('id', item.id);
            } else if (item.type === 'archive') {
              await supabase.from('sessions').update({ is_archived: item.status }).eq('id', item.id);
            }
          }
          localStorage.removeItem('codevault_offline_queue');
        } catch (err) {
          console.error('Offline queue sync failed:', err);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Clean drafts older than 7 days
  useEffect(() => {
    try {
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('codevault_draft_')) {
          const draftStr = localStorage.getItem(key);
          if (draftStr) {
            const draft = JSON.parse(draftStr);
            if (draft.timestamp && (now - draft.timestamp > maxAge)) {
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Old drafts cleanup failed:', e);
    }
  }, []);

  const fetchProfileAndNotifications = async () => {
    if (!user) return;
    setProfileLoading(true);
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
        
      if (profileData) setProfile(profileData);
      
      // Fetch notifications
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (notifs) setNotifications(notifs);
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const checkChatUnread = async () => {
    try {
      const lastOpen = localStorage.getItem('codevault_last_chat_open_time') || new Date(0).toISOString();
      const { count, error } = await supabase
        .from('group_messages')
        .select('created_at', { count: 'exact', head: true })
        .gt('created_at', lastOpen);
      if (!error && count !== null) {
        setChatUnread(count);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const checkSharedBadge = async () => {
    try {
      const lastOpen = localStorage.getItem('codevault_last_shared_open_time') || new Date(0).toISOString();
      const { count, error } = await supabase
        .from('sessions')
        .select('shared_at', { count: 'exact', head: true })
        .eq('share_mode', 'public')
        .eq('is_blocked', false)
        .eq('is_archived', false)
        .gt('shared_at', lastOpen);
      if (!error && count && count > 0) {
        setSharedBadge(true);
      } else {
        setSharedBadge(false);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    fetchProfileAndNotifications();
    checkChatUnread();
    checkSharedBadge();
    
    window.addEventListener('profile-updated', fetchProfileAndNotifications);
    window.addEventListener('chat-opened', () => {
      localStorage.setItem('codevault_last_chat_open_time', new Date().toISOString());
      setChatUnread(0);
    });
    window.addEventListener('shared-opened', () => {
      localStorage.setItem('codevault_last_shared_open_time', new Date().toISOString());
      setSharedBadge(false);
    });
    
    if (user) {
      const channel = supabase.channel('notifications_channel')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + user.id }, (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('CodeVault', {
              body: payload.new.message,
              icon: '/CodeValut/favicon.svg'
            });
          }
          if (Capacitor.isNativePlatform()) {
            const triggerLocalNotification = async () => {
              try {
                await LocalNotifications.schedule({
                  notifications: [
                    {
                      title: 'CodeVault Alert',
                      body: payload.new.message,
                      id: Math.floor(Math.random() * 1000000),
                      schedule: { at: new Date(Date.now() + 50) }
                    }
                  ]
                });
              } catch (err) {
                console.warn('Capacitor schedule local notification failed:', err);
              }
            };
            triggerLocalNotification();
          }
        })
        .subscribe();
        
      return () => {
        window.removeEventListener('profile-updated', fetchProfileAndNotifications);
        supabase.removeChannel(channel);
      }
    }
  }, [user]);

  const markAsRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

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
    triggerHaptic();
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
    { to: "/shared", icon: <Share2 size={20} />, label: "Shared" },
    { to: "/archive", icon: <Archive size={20} />, label: "Archive" },
    { to: "/settings", icon: <Settings size={20} />, label: "Settings" },
  ];

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U';
  const shortEmail = user?.email?.length > 22 ? user.email.substring(0, 20) + '…' : user?.email;

  // Touch handlers for Menu Drawer swipe to close
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (touchStart === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStart;
    if (diff > 0) {
      setTouchTranslation(diff);
    }
  };

  const handleTouchEnd = () => {
    if (touchTranslation > 100) {
      setShowMenuDrawer(false);
      triggerHaptic();
    }
    setTouchStart(null);
    setTouchTranslation(0);
  };

  const isMenuTabActive = showMenuDrawer || ['/sessions/java', '/sessions/mongodb', '/favorites', '/archive', '/settings'].includes(location.pathname);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-dark-bg text-dark-text overflow-hidden">
      
      {/* Offline Indicator & Sync status */}
      {isOffline && (
        <div className="bg-red-600 text-white text-[11px] font-mono py-1 px-4 text-center w-full z-[100] shrink-0 animate-pulse">
          ⚠️ OFFLINE MODE — Changes will be queued and synchronized automatically when connection is restored.
        </div>
      )}
      {isSyncing && (
        <div className="bg-primary text-dark-bg text-[11px] font-mono py-1 px-4 text-center w-full z-[100] shrink-0 font-bold">
          🔄 Syncing queued offline actions...
        </div>
      )}

      {/* Desktop Sidebar (Rendered on tablet >= 768px as well) */}
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
            <span className="text-[10px] text-primary font-mono font-bold tracking-widest uppercase">v1.1.0 Release</span>
          </div>
          <p className="text-[10px] text-dark-muted font-sans leading-relaxed">
            Layout redesign, offline auto-sync & version tracking.
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
              onClick={triggerHaptic}
              className={({ isActive }) =>
                'flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-150 ' + (
                  isActive
                    ? 'bg-primary/15 text-primary font-semibold border border-primary/20'
                    : 'text-dark-muted hover:text-primary hover:bg-dark-surface'
                )
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
            <div className="w-8 h-8 bg-dark-bg border-2 border-dark-border rounded-full flex items-center justify-center text-sm font-bold text-dark-muted font-mono shrink-0 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="User" className="w-full h-full object-cover" />
              ) : (
                userInitial
              )}
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-14 flex items-center justify-between px-5 border-b border-dark-border bg-dark-surface/80 backdrop-blur-md shrink-0">
          <div className="font-medium font-mono text-xs text-dark-muted tracking-wide flex items-center gap-3">
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            <span className="text-primary/40 hidden sm:inline">|</span>
            <span className="text-primary font-sans text-[10px] font-semibold bg-primary/10 border border-primary/20 rounded px-2 py-0.5 whitespace-nowrap">v1.2.3 Live</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => { triggerHaptic(); navigate('/session/new'); }}
              className="bg-primary hover:bg-primary/90 text-dark-bg px-2.5 py-1.5 sm:px-4 rounded-lg text-sm font-bold flex items-center transition-all shadow-lg shadow-primary/15 cursor-pointer font-sans active:scale-95"
            >
              <PlusSquare size={15} className="sm:mr-1.5" />
              <span className="hidden sm:inline"> Quick Save</span>
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

        {/* Dynamic Nested Page Content (Supports notch area padding-bottom) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6" style={{ paddingBottom: isTablet ? '1.5rem' : 'calc(5.5rem + env(safe-area-inset-bottom, 20px))' }}>
          <Outlet />
        </div>
      </main>

      {/* 📱 Mobile Bottom Tab Bar (hidden on tablet >= 768px or when soft keyboard is open) */}
      {!isTablet && !isKeyboardVisible && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-surface/95 border-t border-dark-border flex items-center justify-around px-2 z-40" style={{ height: 'calc(4rem + env(safe-area-inset-bottom, 0px))', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          
          {/* Dashboard Tab */}
          <NavLink
            to="/"
            end
            onClick={triggerHaptic}
            className={({ isActive }) =>
              'flex flex-col items-center justify-center w-full h-full space-y-1 min-h-[48px] min-w-[48px] ' + (
                isActive ? 'text-primary' : 'text-dark-muted'
              )
            }
          >
            <Home size={22} />
            <span className="text-[9px] font-medium font-sans">Home</span>
          </NavLink>

          {/* Chat Tab (with Notification Count Badge) */}
          <NavLink
            to="/chat"
            onClick={() => { triggerHaptic(); window.dispatchEvent(new CustomEvent('chat-opened')); }}
            className={({ isActive }) =>
              'flex flex-col items-center justify-center w-full h-full space-y-1 min-h-[48px] min-w-[48px] relative ' + (
                isActive ? 'text-primary' : 'text-dark-muted'
              )
            }
          >
            <MessageCircle size={22} />
            {chatUnread > 0 && (
              <span className="absolute top-2 right-6 bg-red-500 text-white font-sans font-bold text-[8px] px-1.5 py-0.5 rounded-full scale-95 border border-dark-surface min-w-[14px] text-center">
                {chatUnread}
              </span>
            )}
            <span className="text-[9px] font-medium font-sans">Chat</span>
          </NavLink>

          {/* Shared Tab (with new content dot Badge) */}
          <NavLink
            to="/shared"
            onClick={() => { triggerHaptic(); window.dispatchEvent(new CustomEvent('shared-opened')); }}
            className={({ isActive }) =>
              'flex flex-col items-center justify-center w-full h-full space-y-1 min-h-[48px] min-w-[48px] relative ' + (
                isActive ? 'text-primary' : 'text-dark-muted'
              )
            }
          >
            <Share2 size={22} />
            {sharedBadge && (
              <span className="absolute top-2.5 right-7 w-2 h-2 rounded-full bg-primary border border-dark-surface animate-pulse" />
            )}
            <span className="text-[9px] font-medium font-sans">Shared</span>
          </NavLink>

          {/* Search Tab */}
          <NavLink
            to="/search"
            onClick={triggerHaptic}
            className={({ isActive }) =>
              'flex flex-col items-center justify-center w-full h-full space-y-1 min-h-[48px] min-w-[48px] ' + (
                isActive ? 'text-primary' : 'text-dark-muted'
              )
            }
          >
            <Search size={22} />
            <span className="text-[9px] font-medium font-sans">Search</span>
          </NavLink>

          {/* Menu Drawer Toggle Tab */}
          <button
            onClick={() => { triggerHaptic(); setShowMenuDrawer(!showMenuDrawer); }}
            className={'flex flex-col items-center justify-center w-full h-full space-y-1 min-h-[48px] min-w-[48px] outline-none cursor-pointer ' + (
              isMenuTabActive ? 'text-primary' : 'text-dark-muted'
            )}
          >
            <Menu size={22} />
            <span className="text-[9px] font-medium font-sans">Menu</span>
          </button>
        </nav>
      )}

      {/* 🚀 Mobile Bottom Menu Slide-up Drawer */}
      {showMenuDrawer && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ease-out"
            onClick={() => { triggerHaptic(); setShowMenuDrawer(false); }}
          />

          {/* Drawer Panel */}
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-surface border-t border-dark-border rounded-t-2xl z-50 transition-transform duration-300 ease-out select-none shadow-2xl overflow-hidden"
            style={{ 
              transform: 'translateY(' + touchTranslation + 'px)',
              maxHeight: '80vh',
              paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 16px))'
            }}
          >
            {/* Top Drag handle bar */}
            <div className="w-full flex justify-center py-3 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-dark-border rounded-full" />
            </div>

            {/* Profile Section */}
            <div className="px-6 pb-4 border-b border-dark-border flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-dark-bg border-2 border-dark-border rounded-full flex items-center justify-center text-sm font-bold text-dark-muted font-mono overflow-hidden">
                  {profileLoading ? (
                    <div className="w-full h-full bg-dark-surface animate-pulse" />
                  ) : profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    userInitial
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight font-sans">
                    {profileLoading ? <span className="inline-block w-24 h-4 bg-dark-bg animate-pulse rounded" /> : shortEmail}
                  </h4>
                  {isAdmin && (
                    <span className="text-[9px] text-primary font-mono tracking-wider font-bold bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded mt-1 inline-block">ADMIN</span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => { triggerHaptic(); setShowMenuDrawer(false); }}
                className="p-1.5 bg-dark-bg border border-dark-border hover:border-red-500/20 text-dark-muted hover:text-red-400 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Grid menu choices */}
            <div className="px-6 py-4 grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto font-sans">
              
              {/* Java Notebook option */}
              <button
                onClick={() => { triggerHaptic(); setShowMenuDrawer(false); navigate('/sessions/java'); }}
                className="flex items-center space-x-3 p-3 bg-dark-bg border border-dark-border hover:border-primary/20 rounded-xl text-left cursor-pointer transition-colors"
              >
                <Coffee size={20} className="text-orange-400" />
                <span className="text-xs font-semibold text-white">Java Sessions</span>
              </button>

              {/* MongoDB Notebook option */}
              <button
                onClick={() => { triggerHaptic(); setShowMenuDrawer(false); navigate('/sessions/mongodb'); }}
                className="flex items-center space-x-3 p-3 bg-dark-bg border border-dark-border hover:border-primary/20 rounded-xl text-left cursor-pointer transition-colors"
              >
                <Database size={20} className="text-green-400" />
                <span className="text-xs font-semibold text-white">MongoDB</span>
              </button>

              {/* Favorites option */}
              <button
                onClick={() => { triggerHaptic(); setShowMenuDrawer(false); navigate('/favorites'); }}
                className="flex items-center space-x-3 p-3 bg-dark-bg border border-dark-border hover:border-primary/20 rounded-xl text-left cursor-pointer transition-colors"
              >
                <Star size={20} className="text-yellow-400" />
                <span className="text-xs font-semibold text-white">Favorites</span>
              </button>

              {/* Archive option */}
              <button
                onClick={() => { triggerHaptic(); setShowMenuDrawer(false); navigate('/archive'); }}
                className="flex items-center space-x-3 p-3 bg-dark-bg border border-dark-border hover:border-primary/20 rounded-xl text-left cursor-pointer transition-colors"
              >
                <Archive size={20} className="text-blue-400" />
                <span className="text-xs font-semibold text-white">Archive</span>
              </button>

              {/* Settings option */}
              <button
                onClick={() => { triggerHaptic(); setShowMenuDrawer(false); navigate('/settings'); }}
                className="flex items-center space-x-3 p-3 bg-dark-bg border border-dark-border hover:border-primary/20 rounded-xl text-left cursor-pointer transition-colors"
              >
                <Settings size={20} className="text-dark-muted" />
                <span className="text-xs font-semibold text-white">Settings</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={() => { setShowMenuDrawer(false); handleLogout(); }}
                className="flex items-center space-x-3 p-3 bg-red-950/20 border border-red-900/30 hover:bg-red-950/40 rounded-xl text-left cursor-pointer transition-colors"
              >
                <LogOut size={20} className="text-red-400" />
                <span className="text-xs font-semibold text-red-400">Logout</span>
              </button>
            </div>

            {/* Version indicators */}
            <div className="px-6 pt-2 text-center text-[10px] text-dark-muted font-mono uppercase tracking-widest">
              CodeVault Mobile v1.1.0
            </div>
          </div>
        </>
      )}

    </div>
  );
}
