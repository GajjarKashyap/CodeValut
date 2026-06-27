import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Coffee, Database, Star, FileText, X, TrendingUp, Users, ShieldCheck, Activity, RefreshCw, Bell, Trash2, Megaphone, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, java: 0, mongo: 0, favorites: 0 });
  const [allSessions, setAllSessions] = useState([]);
  const [reportedSessions, setReportedSessions] = useState([]);
  const [studentStatsList, setStudentStatsList] = useState([]);
  const [adminUsersActivity, setAdminUsersActivity] = useState([]);
  const [selectedStudentFilter, setSelectedStudentFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const isAdmin = user?.email?.trim()?.toLowerCase() === 'admin@admin.com';

  
  const [announcement, setAnnouncement] = useState('');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [profiles, setProfiles] = useState({});
  const [avatarToDelete, setAvatarToDelete] = useState(null);

  useEffect(() => {
    if (isAdmin && adminUsersActivity.length > 0) {
      // fetch profiles for the users in the table
      const userIds = adminUsersActivity.map(a => a.user_id);
      supabase.from('profiles').select('id, avatar_url').in('id', userIds).then(({ data }) => {
        if (data) {
          const map = {};
          data.forEach(p => map[p.id] = p.avatar_url);
          setProfiles(map);
        }
      });
    }
  }, [isAdmin, adminUsersActivity]);

  const sendGlobalAnnouncement = async () => {
    if (!announcement.trim()) return;
    setSendingAnnouncement(true);
    
    try {
      const { data: allUsers } = await supabase.from('user_activity').select('user_id');
      if (allUsers) {
        const notifications = allUsers.map(u => ({
          user_id: u.user_id,
          type: 'announcement',
          message: announcement,
          link: '/dashboard',
          is_read: false
        }));
        
        await supabase.from('notifications').insert(notifications);
        alert('Announcement sent to ' + notifications.length + ' users!');
        setAnnouncement('');
      }
    } catch (e) {
      alert('Failed: ' + e.message);
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const deleteAvatar = async () => {
    if (!avatarToDelete) return;
    try {
      // Get the current avatar URL
      const avatarUrl = profiles[avatarToDelete];
      if (avatarUrl) {
        const fileName = avatarUrl.split('/').pop();
        if (fileName) {
          await supabase.storage.from('avatars').remove([fileName]);
        }
      }
      
      // Remove from profile
      await supabase.from('profiles').update({ avatar_url: null }).eq('id', avatarToDelete);
      
      // Log it
      await supabase.from('audit_logs').insert({
        admin_id: user.id,
        action: 'deleted_avatar',
        target_user_id: avatarToDelete,
        details: 'Admin deleted avatar for breaking rules'
      });
      
      // Update local state
      setProfiles(prev => ({ ...prev, [avatarToDelete]: null }));
      setAvatarToDelete(null);
    } catch (e) {
      alert('Failed: ' + e.message);
    }
  };


  const fetchReportedSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title, user_email, report_count, is_blocked')
        .gt('report_count', 0)
        .order('report_count', { ascending: false });
      if (!error && data) {
        setReportedSessions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBlockSession = async (id) => {
    if (window.confirm('Are you sure you want to block this session? It will be hidden from all public views.')) {
      const { error } = await supabase
        .from('sessions')
        .update({ is_blocked: true })
        .eq('id', id);
      if (!error) {
        setReportedSessions(prev => prev.map(s => s.id === id ? { ...s, is_blocked: true } : s));
      }
    }
  };

  const handleUnblockSession = async (id) => {
    const { error } = await supabase
      .from('sessions')
      .update({ is_blocked: false })
      .eq('id', id);
    if (!error) {
      setReportedSessions(prev => prev.map(s => s.id === id ? { ...s, is_blocked: false } : s));
    }
  };

  const handleDismissReports = async (id) => {
    if (window.confirm('Are you sure you want to dismiss all reports for this session?')) {
      const { error: updateError } = await supabase
        .from('sessions').update({ report_count: 0 }).eq({ id }, id);
      const { error: deleteError } = await supabase
        .from('session_reports').delete().eq('session_id', id);
      if (!updateError && !deleteError) {
        setReportedSessions(prev => prev.filter(s => s.id !== id));
      }
    }
  };

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
        const sharedCount = sessions.filter(s => s.share_mode === 'public' || s.share_mode === 'unlisted').length;

        setStats({ total: sessions.length, java: javaCount, mongo: mongoCount, favorites: favCount, shared: sharedCount });

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
    if (user) {
      fetchDashboardData();
      if (isAdmin) {
        fetchReportedSessions();
      }
      const hasSeenUpdate = localStorage.getItem('codevault_update_v1');
      if (!hasSeenUpdate) {
        setShowUpdateModal(true);
      }
    }
  }, [user]);

  const closeUpdateModal = () => {
    localStorage.setItem('codevault_update_v1', 'true');
    setShowUpdateModal(false);
  };

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
        <h3 className="text-3xl font-bold text-dark-text group-hover:text-primary transition-colors font-mono">{count}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-200`}>
        {icon}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-dark-surface border border-primary/30 max-w-md w-full rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-primary/10 p-5 border-b border-primary/20 flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg text-dark-bg">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-dark-text font-bold font-serif text-lg">CodeVault Updates!</h3>
                <p className="text-primary text-xs font-mono">Fresh Start</p>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="flex gap-4">
                <div className="text-green-400 mt-1 shrink-0"><Database size={20} /></div>
                <div>
                  <h4 className="text-white font-bold text-sm mb-1 font-sans">Fresh Start & 100% Secured</h4>
                  <p className="text-dark-muted text-sm font-sans leading-relaxed">
                    During a recent update, some old data was accidentally deleted. But the good news is we are back with a completely fresh start, and your data is now <strong className="text-white">100% secured</strong>!
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-primary mt-1 shrink-0"><Users size={20} /></div>
                <div>
                  <h4 className="text-white font-bold text-sm mb-1 font-sans">New Feature: Usernames!</h4>
                  <p className="text-dark-muted text-sm font-sans leading-relaxed">
                    You can now set your own Username from the Chat section! Once you set it, other users will see your chosen name instead of your email address when chatting.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-dark-border bg-dark-bg/50 flex justify-end">
              <button
                onClick={closeUpdateModal}
                className="bg-primary hover:bg-primary/90 text-dark-bg font-bold px-6 py-2 rounded-lg transition-all active:scale-95 text-sm"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}

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


      {/* Admin Announcement Tool */}
      {isAdmin && (
        <div className="bg-dark-surface rounded-xl border border-primary/20 overflow-hidden mt-6 p-5 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl">
          </div>
          <h3 className="text-base font-bold text-white font-sans flex items-center gap-2 mb-3">
            <Megaphone size={18} className="text-primary" />
            Global Announcement
          </h3>
          <div className="flex gap-3">
            <input 
              type="text" 
              value={announcement}
              onChange={e => setAnnouncement(e.target.value)}
              placeholder="Broadcast a message to all users..."
              className="flex-1 bg-dark-bg border border-dark-border focus:border-primary/50 text-dark-text rounded-lg px-4 py-2 focus:outline-none transition-all font-sans text-sm"
            />
            <button 
              onClick={sendGlobalAnnouncement}
              disabled={sendingAnnouncement || !announcement.trim()}
              className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-dark-bg px-6 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 shrink-0"
            >
              {sendingAnnouncement ? 'Sending...' : 'Send Broadcast'}
            </button>
          </div>
        </div>
      )}

      {/* Admin Moderation Queue */}
      {isAdmin && reportedSessions.length > 0 && (
        <div className="bg-dark-surface rounded-xl border border-red-500/20 overflow-hidden mt-6 p-5 relative font-sans animate-fadeIn">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl bg-red-500/5">
          </div>
          <h3 className="text-base font-bold text-white font-sans flex items-center gap-2 mb-3">
            <ShieldCheck size={18} className="text-red-400" />
            Admin Moderation Queue ({reportedSessions.length})
          </h3>
          <div className="divide-y divide-dark-border">
            {reportedSessions.map((session) => (
              <div key={session.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-white">{session.title || 'Untitled Session'}</h4>
                  <div className="flex gap-3 text-xs text-dark-muted mt-1 font-mono">
                    <span>By: {session.user_email}</span>
                    <span className="text-red-400 font-bold">• {session.report_count} Reports</span>
                    {session.is_blocked && <span className="text-red-500 font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">Blocked</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {session.is_blocked ? (
                    <button
                      onClick={() => handleUnblockSession(session.id)}
                      className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 hover:text-white rounded-lg text-xs font-mono transition-colors cursor-pointer"
                    >
                      Unblock
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBlockSession(session.id)}
                      className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-white rounded-lg text-xs font-mono transition-colors cursor-pointer"
                    >
                      Block Session
                    </button>
                  )}
                  <button
                    onClick={() => handleDismissReports(session.id)}
                    className="px-3 py-1.5 bg-dark-bg border border-dark-border text-dark-muted hover:text-white rounded-lg text-xs font-mono transition-colors cursor-pointer"
                  >
                    Dismiss Reports
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Avatar Delete Modal */}
      {avatarToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-dark-surface border border-red-500/30 max-w-sm w-full rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <Trash2 size={24} />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Remove Avatar?</h3>
            <p className="text-dark-muted text-sm mb-6">
              Are you sure you want to delete this user's custom avatar? This action cannot be undone and will be logged.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setAvatarToDelete(null)} className="flex-1 border border-dark-border text-white px-4 py-2 rounded-lg hover:bg-dark-border/40 transition-colors">Cancel</button>
              <button onClick={deleteAvatar} className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors font-bold">Yes, Remove</button>
            </div>
          </div>
        </div>
      )}


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
                  <th className="py-2 px-4 font-medium">Avatar</th>
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
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full border border-dark-border bg-dark-bg flex items-center justify-center overflow-hidden shrink-0">
                            {profiles[activity.user_id] ? (
                              <img src={profiles[activity.user_id]} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-dark-muted font-mono">{activity.email.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          {profiles[activity.user_id] && (
                            <button onClick={() => setAvatarToDelete(activity.user_id)} className="text-dark-muted hover:text-red-400 p-1 transition-colors" title="Remove Avatar">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>

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
                  <tr className="bg-dark-bg text-dark-muted text-[11px] uppercase tracking-widest font-mono">
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
