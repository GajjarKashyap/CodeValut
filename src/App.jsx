import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SessionForm from './pages/SessionForm';
import SessionList from './pages/SessionList';
import Search from './pages/Search';
import Share from './pages/Share';
import Archive from './pages/Archive';
import NotFound from './pages/NotFound';

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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/share/:shareId" element={<Share />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="session/new" element={<SessionForm />} />
            <Route path="session/:id" element={<SessionForm />} />
            <Route path="sessions/:subject" element={<SessionList />} />
            <Route path="favorites" element={<SessionList filter="favorites" />} />
            <Route path="search" element={<Search />} />
            <Route path="archive" element={<Archive />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;