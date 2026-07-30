import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { supabase } from '../lib/supabase';
import { Coffee, Database, Star, FileText, X, TrendingUp, Users, ShieldCheck, Activity, RefreshCw, Bell, Trash2, Megaphone, AlertTriangle, CheckCircle, LogOut, Key, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { getTodayPasskey } from '../utils/passkeyUtils';
import AdminDeviceManager from '../components/AdminDeviceManager';
import AdminPendingRequests from '../components/AdminPendingRequests';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, java: 0, mongo: 0, favorites: 0 });
  const [allSessions, setAllSessions] = useState([]);
  const [reportedSessions, setReportedSessions] = useState([]);
  const [studentStatsList, setStudentStatsList] = useState([]);
  const [adminUsersActivity, setAdminUsersActivity] = useState([]);
  const [adminUserSettings, setAdminUserSettings] = useState({});
  const [selectedStudentFilter, setSelectedStudentFilter] = useState(null);
  const [expandedUserDevices, setExpandedUserDevices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [startY, setStartY] = useState(0);
  const [refreshDist, setRefreshDist] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isAdmin = user?.email?.trim()?.toLowerCase() === 'admin@admin.com';

  const [todayPasskey, setTodayPasskey] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [profiles, setProfiles] = useState({});
  const [avatarToDelete, setAvatarToDelete] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      getTodayPasskey(supabase).then(setTodayPasskey);
    }
  }, [isAdmin]);

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
      const { data: allUsers, error: selectError } = await supabase.from('user_activity').select('user_id');
      if (selectError) throw selectError;
      
      if (allUsers && allUsers.length > 0) {
        const notifications = allUsers.map(u => ({
          user_id: u.user_id,
          type: 'announcement',
          message: announcement,
          link: '/dashboard',
          is_read: false
        }));
        
        const { error: insertError } = await supabase.from('notifications').insert(notifications);
        if (insertError) throw insertError;
        
        alert('Announcement sent to ' + notifications.length + ' users!');
        setAnnouncement('');
      } else {
        alert('No active users found in user_activity to send the announcement to.');
      }
    } catch (e) {
      alert('Failed to send announcement: ' + e.message);
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

  
  const handleToggleSingleDevice = async (userId, currentValue) => {
    try {
      const newValue = !currentValue;
      await supabase.from('user_login_settings').upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });
      const { error } = await supabase.from('user_login_settings').update({ single_device_mode: newValue }).eq('user_id', userId);
      if (error) throw error;
      setAdminUserSettings(prev => ({ ...prev, [userId]: { ...prev[userId], single_device_mode: newValue } }));
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handleForceLogout = async (userId) => {
    const confirmLogout = window.confirm("Are you sure you want to block & force logout this student?");
    if (!confirmLogout) return;
    try {
      const { error } = await supabase
        .from('user_activity')
        .update({ force_logout: true, is_blocked: true })
        .eq('user_id', userId);
      if (error) throw error;
      
      supabase.from('audit_logs').insert({
        admin_id: user.id,
        action: 'force_logout',
        target_user_id: userId,
        details: 'Admin blocked and force-logged out student'
      });
      
      setAdminUsersActivity(prev => prev.map(a => a.user_id === userId ? { ...a, is_blocked: true } : a));
    } catch (err) {
      console.error('Error sending force logout:', err);
      alert('Failed: ' + err.message);
    }
  };

  const handleUnblockUser = async (userId) => {
    const confirmUnblock = window.confirm("Are you sure you want to unblock this student?");
    if (!confirmUnblock) return;
    try {
      const { error } = await supabase
        .from('user_activity')
        .update({ is_blocked: false, force_logout: false })
        .eq('user_id', userId);
      if (error) throw error;
      
      supabase.from('audit_logs').insert({
        admin_id: user.id,
        action: 'unblock_user',
        target_user_id: userId,
        details: 'Admin unblocked student'
      });
      
      setAdminUsersActivity(prev => prev.map(a => a.user_id === userId ? { ...a, is_blocked: false, force_logout: false } : a));
    } catch (err) {
      console.error('Error unblocking user:', err);
      alert('Failed: ' + err.message);
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
      .update({ is_blocked: false, force_logout: false })
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
          const { data: userSettings } = await supabase.from('user_login_settings').select('user_id, single_device_mode');
          if (userSettings) {
             const settingsMap = {};
             userSettings.forEach(s => settingsMap[s.user_id] = s);
             setAdminUserSettings(settingsMap);
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
      const hasSeenSecurityUpdate = localStorage.getItem('codevault_security_update_v2');
      if (!hasSeenSecurityUpdate) {
        setShowUpdateModal(true);
      }
    }
  }, [user]);

  const closeUpdateModal = () => {
    localStorage.setItem('codevault_security_update_v2', 'true');
    setShowUpdateModal(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: '#99CB64', borderTopColor: 'transparent' }}></div>
        <p className="text-sm font-sans font-medium" style={{ color: '#99CB64' }}>Loading dashboard...</p>
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

  const handleTouchStart = (e) => {
    const container = document.getElementById('dashboard-container');
    if (container && container.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (startY === 0) return;
    const currentY = e.touches[0].clientY;
    const dist = currentY - startY;
    if (dist > 0) {
      setRefreshDist(Math.min(dist, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (refreshDist > 70) {
      setIsRefreshing(true);
      try {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const enableHaptics = localStorage.getItem('codevault_flag_enable_haptics') !== 'false';
        if (!prefersReduced && enableHaptics && Capacitor.isNativePlatform()) {
          try {
            await Haptics.impact({ style: ImpactStyle.Light });
          } catch (e) {}
        }
      } catch (e) {}

      await fetchDashboardData();
      if (isAdmin) {
        await fetchReportedSessions();
      }
      setIsRefreshing(false);
    }
    setStartY(0);
    setRefreshDist(0);
  };

  return (
    <div 
      id="dashboard-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="space-y-6 max-w-6xl overflow-y-auto"
    >
      {refreshDist > 20 && (
        <div className="w-full flex justify-center py-2 text-primary font-mono text-xs animate-pulse">
          {refreshDist > 70 ? '🟢 Release to refresh...' : '👇 Pull down to refresh...'}
        </div>
      )}
      {isRefreshing && (
        <div className="w-full flex items-center justify-center gap-2 py-2 text-primary font-mono text-xs">
          <RefreshCw size={14} className="animate-spin" />
          <span>Refreshing data...</span>
        </div>
      )}


      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-dark-surface border border-primary/30 max-w-md w-full rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-primary/10 p-5 border-b border-primary/20 flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg text-dark-bg">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-dark-text font-bold font-serif text-lg">New Security Feature Added</h3>
                <p className="text-primary text-xs font-mono">Device Login Protection</p>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="flex gap-4">
                <div className="text-green-400 mt-1 shrink-0"><ShieldCheck size={20} /></div>
                <div>
                  <h4 className="text-white font-bold text-sm mb-1 font-sans">What has changed?</h4>
                  <ul className="text-dark-muted text-sm font-sans leading-relaxed list-disc list-inside space-y-1">
                    <li>The first computer logged into your account becomes the primary device.</li>
                    <li>When someone tries to log in from a new computer, access may require approval.</li>
                    <li>You can review and manage devices connected to your account.</li>
                    <li>Administrators can view active devices and revoke unauthorised access.</li>
                    <li>Multiple-device access may be limited depending on your account settings.</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-red-400 mt-1 shrink-0"><AlertTriangle size={20} /></div>
                <div>
                  <h4 className="text-white font-bold text-sm mb-1 font-sans">Important</h4>
                  <p className="text-dark-muted text-sm font-sans leading-relaxed mb-2">
                    Do not share your CodeVault email, password, or approval code with anyone.
                  </p>
                  <p className="text-dark-muted text-sm font-sans leading-relaxed mb-1">
                    When you receive a new device request, approve it only when:
                  </p>
                  <ul className="text-dark-muted text-sm font-sans leading-relaxed list-disc list-inside space-y-1">
                    <li>You recognise the device.</li>
                    <li>You started the login.</li>
                    <li>The approval code matches the code shown on the new device.</li>
                  </ul>
                  <p className="text-red-400/90 text-sm font-sans leading-relaxed mt-2 font-medium">
                    Unknown login requests should be rejected immediately.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-dark-border bg-dark-bg/50 flex justify-end">
              <button
                onClick={closeUpdateModal}
                className="bg-primary hover:bg-primary/90 text-dark-bg font-bold px-6 py-2 rounded-lg transition-all active:scale-95 text-sm"
              >
                Got it
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


      {/* Admin Daily Passkey Card */}
      {isAdmin && todayPasskey && (
        <div className="bg-gradient-to-r from-dark-surface via-dark-surface to-primary/10 rounded-xl border border-primary/30 overflow-hidden mt-6 p-5 relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-primary/5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <Key size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-sans">
                  Today's Daily Passkey
                </h3>
                <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase">
                  Active
                </span>
              </div>
              <p className="text-dark-muted text-xs mt-0.5 font-sans">
                Share this key with students to unlock full read access across both Web and CLI tools today.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto bg-dark-bg/80 border border-primary/25 rounded-lg px-4 py-2.5">
            <span className="font-mono text-lg font-black text-primary tracking-wider select-all">
              {todayPasskey}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(todayPasskey);
                alert('Daily passkey copied to clipboard!');
              }}
              title="Copy Passkey"
              className="p-1.5 hover:bg-primary/20 text-dark-muted hover:text-primary rounded-md transition-colors ml-2"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Admin Announcement Tool */}
      {isAdmin && (
        <div className="bg-dark-surface rounded-xl border border-primary/20 overflow-hidden mt-6 p-5 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none">
          </div>
          <h3 className="text-base font-bold text-white font-sans flex items-center gap-2 mb-3">
            <Megaphone size={18} className="text-primary" />
            Global Announcement
          </h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <input 
              type="text" 
              value={announcement}
              onChange={e => setAnnouncement(e.target.value)}
              placeholder="Broadcast a message to all users..."
              className="flex-1 bg-dark-bg border border-dark-border focus:border-primary/50 text-dark-text rounded-lg px-4 py-2.5 focus:outline-none transition-all font-sans text-sm"
            />
            <button 
              onClick={sendGlobalAnnouncement}
              disabled={sendingAnnouncement || !announcement.trim()}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 disabled:opacity-50 text-dark-bg px-4 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 shrink-0"
            >
              {sendingAnnouncement ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {/* Admin Moderation Queue */}
      {isAdmin && reportedSessions.length > 0 && (
        <div className="bg-dark-surface rounded-xl border border-red-500/20 overflow-hidden mt-6 p-5 relative font-sans animate-fadeIn">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl bg-red-500/5 pointer-events-none">
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
          
          {/* Pending Device Login Requests — realtime */}
          <AdminPendingRequests />

        <div className="p-3 space-y-2 mt-4">
            {adminUsersActivity.map((activity) => {
              const lastSeen = new Date(activity.last_seen_at);
              const isOnline = (new Date() - lastSeen) < 5 * 60 * 1000;
              return (
                <div key={activity.user_id} className="flex flex-col bg-dark-bg/40 rounded-xl border border-dark-border/40 overflow-hidden">
                  <div className="flex items-center gap-3 p-3">

                  <div className="w-10 h-10 rounded-full border border-dark-border bg-dark-bg flex items-center justify-center overflow-hidden shrink-0">
                    {profiles[activity.user_id] ? (
                      <img src={profiles[activity.user_id]} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-dark-muted font-mono">{activity.email.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-white font-medium truncate max-w-[180px]">{activity.email}</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${isOnline ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-dark-bg text-dark-muted border border-dark-border'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-dark-muted'}`}></span>
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-dark-muted font-mono">
                      <span>Last seen {formatDistanceToNow(lastSeen, { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {profiles[activity.user_id] && (
                      <button onClick={() => setAvatarToDelete(activity.user_id)} className="text-dark-muted hover:text-red-400 p-1.5 transition-colors" title="Remove Avatar">
                        <Trash2 size={14} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleToggleSingleDevice(activity.user_id, adminUserSettings[activity.user_id]?.single_device_mode)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 mr-1 ${
                        adminUserSettings[activity.user_id]?.single_device_mode 
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20' 
                          : 'bg-dark-bg text-dark-muted border-dark-border hover:text-white'
                      }`}
                      title="Single Device Mode (Kicks old devices on new login)"
                    >
                      <Smartphone size={12} /> 1-Device
                    </button>
                    <button 
        onClick={() => setExpandedUserDevices(prev => prev === activity.user_id ? null : activity.user_id)}
        className="text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 px-2 py-1.5 rounded-lg text-xs font-bold transition-all mr-1 cursor-pointer"
        title="View User Devices"
      >
        Devices
      </button>
                    {activity.user_id !== user.id && (
                      activity.is_blocked ? (
                        <button 
                          onClick={() => handleUnblockUser(activity.user_id)} 
                          className="text-green-400 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 p-1.5 rounded-lg transition-all cursor-pointer" 
                          title="Unblock Student"
                        >
                          <CheckCircle size={14} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleForceLogout(activity.user_id)} 
                          className="text-dark-muted hover:text-red-400 hover:bg-red-500/10 border border-dark-border hover:border-red-500/20 p-1.5 rounded-lg transition-all cursor-pointer" 
                          title="Block & Force Logout"
                        >
                          <LogOut size={14} />
                        </button>
                      )
                    )}
                  </div>
                
                  </div>
                  {expandedUserDevices === activity.user_id && (
                    <div className="p-3 bg-dark-surface border-t border-dark-border/50">
                      <AdminDeviceManager targetUserId={activity.user_id} adminUser={user} />
                    </div>
                  )}
                </div>
              );
            })}
            {adminUsersActivity.length === 0 && (
              <div className="py-8 text-center text-dark-muted italic text-sm">No user activity recorded yet.</div>
            )}
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
                  <Link to={`/session/${session.id}`} className="flex items-start gap-3 p-4">
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${session.subject === 'Java' ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>
                      {session.subject === 'Java' ? <Coffee size={18} /> : <Database size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-white font-medium font-sans truncate text-sm flex-1 min-w-0">
                          {session.title || 'Untitled Session'}
                          {session.is_favorite && <Star size={13} className="text-yellow-400 fill-current inline ml-1 shrink-0" />}
                        </h4>
                        <span className="text-[10px] text-dark-muted font-mono shrink-0 whitespace-nowrap">
                          {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center flex-wrap gap-1.5 mt-1">
                        <span className="text-[11px] text-dark-muted font-sans">{session.subject}</span>
                        {session.topic && <span className="text-[11px] text-dark-muted">• {session.topic}</span>}
                        {isAdmin && session.user_email && (
                          <span className="bg-primary/10 text-primary text-[9px] px-1.5 py-0.5 rounded border border-primary/20 font-mono truncate max-w-[130px]">
                            {session.user_email}
                          </span>
                        )}
                        {session.tags && session.tags.length > 0 && session.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="bg-dark-bg text-dark-muted text-[9px] px-1.5 py-0.5 rounded border border-dark-border font-mono truncate max-w-[80px]">
                            {tag}
                          </span>
                        ))}
                      </div>
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
