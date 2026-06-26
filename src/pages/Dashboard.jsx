import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Coffee, Database, Star, FileText, X, TrendingUp, Users, ShieldCheck, Activity, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, java: 0, mongo: 0, favorites: 0 });
  const [allSessions, setAllSessions] = useState([]);
  const [studentStatsList, setStudentStatsList] = useState([]);
  const [adminUsersActivity, setAdminUsersActivity] = useState([]);
  const [selectedStudentFilter, setSelectedStudentFilter] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.email?.toLowerCase() === 'admin@admin.com';

  const fetchDashboardData = async () => {
      try {
        if (!user) return;

        let query = supabase
          .from('sessions')
          .select('id, title, subject, topic, tags, is_favorite, updated_at, user_email')
          .eq('is_archived', false)
          .order('updated_at', { ascending: false });

        if (!isAdmin) {
          query = query.eq('user_id', user.id);
        }

        const { data: sessions, error } = await query;
        if (error) throw error;

        setAllSessions(sessions);

        const javaCount = sessions.filter(s => s.subject === 'Java').length;
        const mongoCount = sessions.filter(s => s.subject === 'MongoDB').length;
        const favCount = sessions.filter(s => s.is_favorite).length;

        setStats({ total: sessions.length, java: javaCount, mongo: mongoCount, favorites: favCount });

        if (isAdmin) {
          // Fetch real-time user activity
          const { data: userActivity, error: activityError } = await supabase
            .from('user_activity')
            .select('*')
            .order('last_seen_at', { ascending: false });
            
          if (!activityError && userActivity) {
            setAdminUsersActivity(userActivity);
          }

          // Legacy stats based on sessions
          const statsMap = {};
          sessions.forEach(s => {
            const email = s.user_email || 'Unknown Student';
            if (!statsMap[email]) {
              statsMap[email] = { email, total: 0, java: 0, mongodb: 0, lastUpdated: null };
            }
            statsMap[email].total++;
            if (s.subject === 'Java') statsMap[email].java++;
            if (s.subject === 'MongoDB') statsMap[email].mongodb++;
            const sessionDate = new Date(s.updated_at);
            if (!statsMap[email].lastUpdated || sessionDate > statsMap[email].lastUpdated) {
              statsMap[email].lastUpdated = sessionDate;
            }
          });
          const statsArr = Object.values(statsMap).sort((a, b) => b.lastUpdated - a.lastUpdated);
          setStudentStatsList(statsArr);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <p className="text-dark-muted text-sm font-sans">Loading dashboard...</p>
      </div>
    </div>
  );

  const displaySessions = selectedStudentFilter
    ? allSessions.filter(s => s.user_email === selectedStudentFilter)
    : allSessions.slice(0, 6);

  const StatCard = ({ title, count, icon, color, borderColor }) => (
    <div className={`bg-dark-surface p-5 rounded-xl border ${borderColor || 'border-dark-border'} hover:border-primary/30 transition-all duration-200 flex items-center justify-between group cursor-default`}>
      <div>
        <p className="text-dark-muted text-xs font-medium mb-2 font-sans uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-bold text-white group-hover:text-primary transition-colors font-mono">{count}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-200`}>
        {icon}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 font-serif">
            Dashboard
            {isAdmin && (
              <span className="bg-primary/15 text-primary border border-primary/25 text-[11px] px-3 py-1 rounded-full font-mono tracking-wider uppercase font-bold flex items-center gap-1.5">
                <ShieldCheck size={12} /> Admin Mode
              </span>
            )}
          </h2>
          <p className="text-dark-muted text-sm font-sans mt-0.5">
            {isAdmin ? `Viewing all ${stats.total} sessions across ${studentStatsList.length} student${studentStatsList.length !== 1 ? 's' : ''}` : `You have ${stats.total} active sessions`}
          </p>
        </div>
        <Link
          to="/session/new"
          className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary/90 text-dark-bg px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 font-sans"
        >
          + New Session
        </Link>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Sessions" count={stats.total} icon={<FileText size={22} className="text-primary" />} color="bg-primary/10" />
        <StatCard title="Java Sessions" count={stats.java} icon={<Coffee size={22} className="text-orange-400" />} color="bg-orange-500/10" />
        <StatCard title="MongoDB Sessions" count={stats.mongo} icon={<Database size={22} className="text-green-400" />} color="bg-green-500/10" />
        <StatCard title="Favorites" count={stats.favorites} icon={<Star size={22} className="text-yellow-400" />} color="bg-yellow-500/10" />
      </div>

      {/* Admin Active Users Dashboard */}
      {isAdmin && (
        <div className="bg-dark-surface rounded-xl border border-dark-border overflow-hidden mt-6">
          <div className="p-5 border-b border-dark-border flex items-center justify-between bg-[#0a1410]">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/20 p-2 rounded-lg">
                <Activity size={18} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                  Active CodeVault Users
                </h3>
                <p className="text-xs text-dark-muted font-sans mt-0.5">Real-time status of user logins and active sessions</p>
              </div>
            </div>
            <button
              onClick={() => { setLoading(true); fetchDashboardData(); }}
              className="flex items-center gap-2 bg-dark-bg hover:bg-dark-border border border-dark-border text-dark-muted hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw size={14} /> Refresh List
            </button>
          </div>
          
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-dark-muted text-[11px] uppercase tracking-widest font-mono border-b border-dark-border/40">
                  <th className="py-2 px-4 font-medium">Status</th>
                  <th className="py-2 px-4 font-medium">User Email</th>
                  <th className="py-2 px-4 font-medium">Last Login</th>
                  <th className="py-2 px-4 font-medium">Last Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/20 text-sm font-sans">
                {adminUsersActivity.map((activity) => {
                  const lastSeen = new Date(activity.last_seen_at);
                  const isOnline = (new Date() - lastSeen) < 5 * 60 * 1000; // 5 mins
                  
                  return (
                    <tr key={activity.user_id} className="hover:bg-dark-bg/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className={`flex items-center gap-1.5 text-xs font-mono font-bold px-2 py-1 rounded-md w-max ${isOnline ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-dark-bg text-dark-muted border border-dark-border'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-dark-muted'}`}></span>
                          {isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white font-medium text-sm">{activity.email}</td>
                      <td className="py-3 px-4 text-dark-muted font-mono text-xs">
                        {activity.last_login_at ? formatDistanceToNow(new Date(activity.last_login_at), { addSuffix: true }) : '-'}
                      </td>
                      <td className="py-3 px-4 text-dark-muted font-mono text-xs">
                        {formatDistanceToNow(lastSeen, { addSuffix: true })}
                      </td>
                    </tr>
                  );
                })}
                {adminUsersActivity.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-dark-muted italic">No user activity recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Student Directory */}
      {isAdmin && (
        <div className="bg-dark-surface rounded-xl border border-dark-border overflow-hidden">
          <div className="p-5 border-b border-dark-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Users size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                  Student Session Directory
                  {studentStatsList.length > 0 && (
                    <span className="bg-primary/20 text-primary border border-primary/30 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                      {studentStatsList.length} student{studentStatsList.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-dark-muted font-sans mt-0.5">Click a row to filter sessions below</p>
              </div>
            </div>
            {selectedStudentFilter && (
              <button
                onClick={() => setSelectedStudentFilter(null)}
                className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 text-primary text-xs px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors font-sans cursor-pointer"
              >
                <span className="truncate max-w-[160px]">{selectedStudentFilter}</span>
                <X size={13} />
              </button>
            )}
          </div>

          {studentStatsList.length === 0 ? (
            <div className="text-center py-10 text-dark-muted font-sans border-dashed border border-dark-border/50 m-4 rounded-xl">
              No student submissions yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-dark-bg/60 text-dark-muted text-[11px] uppercase tracking-widest font-mono">
                    <th className="py-3 px-5 font-medium">Student Email</th>
                    <th className="py-3 px-4 text-center font-medium">Java</th>
                    <th className="py-3 px-4 text-center font-medium">MongoDB</th>
                    <th className="py-3 px-4 text-center font-medium">Total</th>
                    <th className="py-3 px-5 text-right font-medium">Last Saved Session</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/40 text-sm font-sans">
                  {studentStatsList.map((student) => (
                    <tr
                      key={student.email}
                      onClick={() => setSelectedStudentFilter(selectedStudentFilter === student.email ? null : student.email)}
                      className={`cursor-pointer hover:bg-primary/5 transition-all duration-150 ${
                         selectedStudentFilter === student.email
                           ? 'bg-primary/8 border-l-2 border-l-primary'
                           : ''
                      }`}
                    >
                      <td className="py-3 px-5 text-white font-medium font-mono text-xs">{student.email}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-orange-400 font-mono font-bold bg-orange-500/10 px-2 py-0.5 rounded text-xs">{student.java}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-green-400 font-mono font-bold bg-green-500/10 px-2 py-0.5 rounded text-xs">{student.mongodb}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-primary font-mono font-bold bg-primary/10 px-2 py-0.5 rounded text-xs">{student.total}</span>
                      </td>
                      <td className="py-3 px-5 text-right text-dark-muted font-mono text-xs">
                        {student.lastUpdated ? formatDistanceToNow(student.lastUpdated, { addSuffix: true }) : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Recently Updated */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            {selectedStudentFilter ? `Sessions by ${selectedStudentFilter.split('@')[0]}` : 'Recently Updated'}
          </h3>
          <Link to="/sessions/java" className="text-xs text-primary hover:text-primary/80 font-sans transition-colors">
            View all →
          </Link>
        </div>

        {displaySessions.length === 0 ? (
          <div className="bg-dark-surface p-10 rounded-xl border border-dark-border text-center text-dark-muted font-sans">
            {selectedStudentFilter ? 'No sessions for this student.' : 'No sessions yet. Create one to get started!'}
          </div>
        ) : (
          <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
            <ul className="divide-y divide-dark-border/60">
              {displaySessions.map((session) => (
                <li key={session.id} className="hover:bg-dark-border/20 transition-colors">
                  <Link to={`/session/${session.id}`} className="flex items-center justify-between p-4 gap-4">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${session.subject === 'Java' ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>
                        {session.subject === 'Java' ? <Coffee size={18} /> : <Database size={18} />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-white font-medium font-sans flex items-center gap-2 truncate">
                          {session.title || 'Untitled Session'}
                          {session.is_favorite && <Star size={13} className="text-yellow-400 fill-current shrink-0" />}
                        </h4>
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-0.5">
                          <span className="text-xs text-dark-muted font-sans">{session.subject}</span>
                          {session.topic && <span className="text-xs text-dark-muted">• {session.topic}</span>}
                          {isAdmin && session.user_email && (
                            <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded border border-primary/20 font-mono">
                              {session.user_email}
                            </span>
                          )}
                          {session.tags && session.tags.length > 0 && session.tags.map(tag => (
                            <span key={tag} className="bg-dark-bg text-dark-muted text-[10px] px-1.5 py-0.5 rounded border border-dark-border font-mono">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-dark-muted font-mono shrink-0">
                      {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
