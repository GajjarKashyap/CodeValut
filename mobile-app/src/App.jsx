import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import SessionForm from './pages/SessionForm';
import SessionList from './pages/SessionList';
import Search from './pages/Search';
import Share from './pages/Share';
import Archive from './pages/Archive';
import ChatDashboard from './pages/ChatDashboard';
import ChatRoom from './pages/ChatRoom';
import NotFound from './pages/NotFound';
import DownloadApp from './pages/DownloadApp';
import { RefreshCw, Download, Settings as SettingsIcon, X } from 'lucide-react';

// ----------------------------------------------------
// 1. Crash Recovery Layer (ErrorBoundary)
// ----------------------------------------------------
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught a fatal exception:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full text-center space-y-6 bg-dark-surface border border-red-500/20 p-8 rounded-2xl shadow-xl">
            <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-red-500 font-bold text-2xl animate-pulse">
              ⚠️
            </div>
            <h1 className="text-xl font-bold font-serif text-white">Something went wrong</h1>
            <p className="text-dark-muted text-xs font-mono leading-relaxed bg-dark-bg p-3 rounded-lg border border-dark-border text-left overflow-x-auto max-h-40">
              {this.state.error?.toString() || "Fatal execution exception"}
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('codevault_last_active_route');
                window.location.reload();
              }}
              className="w-full bg-primary hover:bg-primary/95 text-dark-bg font-bold py-2.5 rounded-lg transition-transform active:scale-95 text-sm cursor-pointer"
            >
              Restart App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ----------------------------------------------------
// 2. Protected Route Wrapper
// ----------------------------------------------------
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-dark-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        <p className="text-dark-muted text-sm font-mono tracking-wide">Loading CodeVault...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return children;
};

// ----------------------------------------------------
// 3. Version Checker Overlay Component
// ----------------------------------------------------
const CURRENT_VERSION = '1.2.2';

function compareVersions(v1, v2) {
  const p1 = v1.replace(/^v/, '').split('.').map(Number);
  const p2 = v2.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}

function VersionChecker() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isMandatory, setIsMandatory] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      const enabled = localStorage.getItem('codevault_flag_enable_update_checker') !== 'false';
      if (!enabled) return;

      try {
        const res = await fetch('https://gajjarkashyap.github.io/CodeValut/version.json?t=' + Date.now());
        if (!res.ok) throw new Error('Failed to download version file');
        const data = await res.json();
        
        // Skip check
        const skipped = localStorage.getItem('codevault_skipped_version');
        if (skipped === data.version) return;

        const cmp = compareVersions(data.version, CURRENT_VERSION);
        if (cmp > 0) {
          setUpdateInfo(data);
          
          const minCmp = compareVersions(data.min_version || '1.0.0', CURRENT_VERSION);
          if (minCmp > 0) {
            setIsMandatory(true);
            setShowPrompt(true);
          } else {
            setIsMandatory(false);
            setShowPrompt(true);
          }
        }
      } catch (err) {
        console.warn('Silently ignored version check error:', err.message);
      }
    };
    checkVersion();
  }, []);

  const handleSkip = () => {
    if (updateInfo) {
      localStorage.setItem('codevault_skipped_version', updateInfo.version);
    }
    setShowPrompt(false);
  };

  if (!showPrompt || !updateInfo) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-[9999] font-sans">
      <div className="max-w-md w-full bg-dark-surface border border-primary/20 rounded-2xl shadow-2xl p-6 space-y-5 animate-fadeIn">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 border border-primary/25 rounded-xl text-primary">
            <RefreshCw size={22} className="animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-serif">New Version Available!</h2>
            <p className="text-[10px] text-dark-muted font-mono uppercase tracking-wider">v{CURRENT_VERSION} → v{updateInfo.version}</p>
          </div>
        </div>

        <div className="bg-dark-bg border border-dark-border rounded-xl p-4 space-y-2 text-xs leading-relaxed text-dark-muted">
          <p className="font-semibold text-white">What's New in this update:</p>
          <p className="font-sans font-medium text-dark-text">{updateInfo.release_notes}</p>
          {isMandatory && (
            <p className="text-red-400 font-bold font-mono uppercase mt-2">
              ⚠️ MANDATORY UPDATE: This version contains critical security and API stability fixes.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <a
            href={window.location.origin + import.meta.env.BASE_URL + '#/download'}
            onClick={() => setShowPrompt(false)}
            className="w-full bg-primary hover:bg-primary/90 text-dark-bg font-bold py-2.5 rounded-lg text-center transition-all text-sm flex items-center justify-center gap-2"
          >
            <Download size={16} />
            <span>Update Now</span>
          </a>
          
          {!isMandatory && (
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => setShowPrompt(false)}
                className="bg-dark-bg border border-dark-border hover:border-white/20 text-dark-muted hover:text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer"
              >
                Remind Me Later
              </button>
              <button
                onClick={handleSkip}
                className="bg-dark-bg border border-dark-border hover:border-white/20 text-dark-muted hover:text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer"
              >
                Skip Version
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 4. Main App Routing & Setup
// ----------------------------------------------------
function App() {
  // Initialize default feature flags
  useEffect(() => {
    if (localStorage.getItem('codevault_flag_enable_haptics') === null) {
      localStorage.setItem('codevault_flag_enable_haptics', 'true');
    }
    if (localStorage.getItem('codevault_flag_enable_update_checker') === null) {
      localStorage.setItem('codevault_flag_enable_update_checker', 'true');
    }
    if (localStorage.getItem('codevault_flag_enable_tablet_mode') === null) {
      localStorage.setItem('codevault_flag_enable_tablet_mode', 'true');
    }
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/download" element={<DownloadApp />} />
            <Route path="/share/:shareId" element={<Share />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="chat" element={<ChatDashboard />} />
              <Route path="chat/:chatId" element={<ChatRoom />} />
              <Route path="session/new" element={<SessionForm />} />
              <Route path="session/:id" element={<SessionForm />} />
              <Route path="sessions/:subject" element={<SessionList />} />
              <Route path="favorites" element={<SessionList filter="favorites" />} />
              <Route path="shared" element={<SessionList filter="shared" />} />
              <Route path="search" element={<Search />} />
              <Route path="archive" element={<Archive />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <VersionChecker />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
