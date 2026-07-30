import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Monitor, Smartphone, ShieldAlert, CheckCircle, XCircle, Trash2, RotateCcw, Clock, Cpu } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function AdminDeviceManager({ targetUserId, adminUser }) {
  const [devices, setDevices] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setError(null);
    try {
      const [devRes, sessRes] = await Promise.all([
        supabase.from('user_devices').select('*').eq('user_id', targetUserId).order('last_seen_at', { ascending: false }),
        supabase.from('auth_device_sessions').select('*').eq('user_id', targetUserId).order('created_at', { ascending: false }).limit(20)
      ]);
      if (devRes.error) throw devRes.error;
      setDevices(devRes.data || []);
      if (!sessRes.error) setSessions(sessRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!targetUserId) return;
    fetchData();

    // Realtime: auto-refresh when this user's devices or sessions change
    const channel = supabase
      .channel(`admin-devices-${targetUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_devices', filter: `user_id=eq.${targetUserId}` }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auth_device_sessions', filter: `user_id=eq.${targetUserId}` }, fetchData)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [targetUserId]);

  const getName = (d) => d.device_name || d.metadata?.device_name || 'Unknown Device';
  const getBrowser = (d) => d.browser_name || d.metadata?.browser_name || 'Unknown';
  const getOS = (d) => d.operating_system || d.metadata?.operating_system || 'Unknown';
  const getUA = (d) => d.metadata?.user_agent || d.user_agent || '';
  const getDeviceSessions = (deviceId) => sessions.filter(s => s.device_id === deviceId);

  const handleRevoke = async (deviceId) => {
    if (!window.confirm('Revoke this device? The user will be logged out immediately.')) return;
    try {
      const { error } = await supabase.rpc('revoke_device_internal', {
        p_admin_user_id: adminUser.id,
        p_target_device_id: deviceId
      });
      if (error) {
        const { error: ue } = await supabase.from('user_devices')
          .update({ status: 'revoked', revoked_at: new Date().toISOString(), revoked_by: adminUser.id })
          .eq('id', deviceId);
        if (ue) throw ue;
      }
      fetchData();
    } catch (err) { alert('Failed to revoke: ' + err.message); }
  };

  const handleRestore = async (deviceId) => {
    try {
      const { error } = await supabase.from('user_devices')
        .update({ status: 'pending', revoked_at: null })
        .eq('id', deviceId);
      if (error) throw error;
      fetchData();
    } catch (err) { alert('Failed to restore: ' + err.message); }
  };

  if (loading) return <div className="p-4 text-center text-dark-muted text-xs animate-pulse">Loading devices...</div>;
  if (error) return <div className="p-3 text-center text-red-400 text-xs bg-red-500/10 rounded-lg">Error: {error}<br/><span className="text-dark-muted text-[10px]">Run supabase_admin_rls.sql to fix permissions.</span></div>;
  if (devices.length === 0) return <div className="p-4 text-center text-dark-muted text-xs italic">No devices registered for this user.</div>;

  return (
    <div className="space-y-3 mt-2">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Cpu size={11} className="text-primary"/>
          {devices.length} Device{devices.length !== 1 ? 's' : ''} · {sessions.filter(s=>s.status==='active').length} Active Session{sessions.filter(s=>s.status==='active').length !== 1 ? 's' : ''}
        </h4>
        <button onClick={fetchData} className="text-[10px] text-dark-muted hover:text-white transition-colors">↻ Refresh</button>
      </div>

      {devices.map(device => {
        const devSessions = getDeviceSessions(device.id);
        const activeSessions = devSessions.filter(s => s.status === 'active');
        const os = getOS(device);
        const browser = getBrowser(device);
        const isMobile = os.includes('iOS') || os.includes('Android');
        const isLive = device.status === 'approved' && activeSessions.length > 0;

        return (
          <div key={device.id} className={`border rounded-xl overflow-hidden ${
            device.status === 'revoked' ? 'border-red-500/20 bg-red-500/5 opacity-70'
            : device.status === 'pending' ? 'border-yellow-500/20 bg-yellow-500/5'
            : 'border-primary/20 bg-primary/5'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${device.status === 'approved' ? 'bg-primary/10 text-primary' : device.status === 'revoked' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                  {isMobile ? <Smartphone size={16}/> : <Monitor size={16}/>}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-white font-bold">{getName(device)}</span>
                    {device.is_primary && <span className="bg-primary/20 text-primary text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold border border-primary/30">Primary</span>}
                    {isLive && <span className="flex items-center gap-1 bg-green-500/10 text-green-400 text-[9px] px-1.5 py-0.5 rounded-full border border-green-500/20 font-bold"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>ACTIVE NOW</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {device.status === 'approved' && <CheckCircle size={10} className="text-green-400"/>}
                    {device.status === 'revoked' && <XCircle size={10} className="text-red-400"/>}
                    {device.status === 'pending' && <ShieldAlert size={10} className="text-yellow-400"/>}
                    <span className={`text-[10px] font-mono font-bold ${device.status === 'approved' ? 'text-green-400' : device.status === 'revoked' ? 'text-red-400' : 'text-yellow-400'}`}>{device.status.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <div>
                {device.status === 'revoked' ? (
                  <button onClick={() => handleRestore(device.id)} className="px-2 py-1.5 text-dark-muted hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors text-xs flex items-center gap-1 border border-transparent hover:border-green-500/20"><RotateCcw size={13}/> Restore</button>
                ) : (
                  <button onClick={() => handleRevoke(device.id)} className="px-2 py-1.5 text-dark-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-xs flex items-center gap-1 border border-transparent hover:border-red-500/20"><Trash2 size={13}/> Revoke</button>
                )}
              </div>
            </div>

            {/* Detail grid */}
            <div className="border-t border-dark-border/30 bg-dark-bg/30 p-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
              <div><span className="text-dark-muted">Browser</span><p className="text-white font-medium">{browser}</p></div>
              <div><span className="text-dark-muted">OS</span><p className="text-white font-medium">{os}</p></div>
              <div><span className="text-dark-muted">First Seen</span><p className="text-white font-medium">{device.created_at ? format(new Date(device.created_at), 'dd MMM yy, HH:mm') : '—'}</p></div>
              <div><span className="text-dark-muted">Last Active</span><p className="text-white font-medium">{device.last_seen_at ? formatDistanceToNow(new Date(device.last_seen_at), {addSuffix:true}) : '—'}</p></div>
              {device.approved_at && <div><span className="text-dark-muted">Approved</span><p className="text-green-400 font-medium">{format(new Date(device.approved_at), 'dd MMM yy, HH:mm')}</p></div>}
              {device.revoked_at && <div><span className="text-dark-muted">Revoked</span><p className="text-red-400 font-medium">{format(new Date(device.revoked_at), 'dd MMM yy, HH:mm')}</p></div>}
              {getUA(device) && (
                <div className="col-span-2">
                  <span className="text-dark-muted">User Agent</span>
                  <p className="text-dark-muted font-mono text-[9px] break-all mt-0.5 leading-relaxed">{getUA(device).substring(0,140)}{getUA(device).length>140?'...':''}</p>
                </div>
              )}
            </div>

            {/* Sessions */}
            {devSessions.length > 0 && (
              <div className="border-t border-dark-border/30 p-3">
                <p className="text-[10px] text-dark-muted uppercase tracking-wider font-bold mb-2 flex items-center gap-1"><Clock size={10}/> Sessions ({devSessions.length})</p>
                <div className="space-y-1">
                  {devSessions.slice(0,5).map(sess => (
                    <div key={sess.id} className="flex items-center justify-between text-[10px] font-mono bg-dark-bg/50 rounded px-2 py-1">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${sess.status==='active'?'bg-green-500/20 text-green-400':sess.status==='pending'?'bg-yellow-500/20 text-yellow-400':'bg-dark-border text-dark-muted'}`}>{sess.status.toUpperCase()}</span>
                      <span className="text-dark-muted">{sess.created_at ? formatDistanceToNow(new Date(sess.created_at),{addSuffix:true}) : ''}</span>
                      {sess.revocation_reason && <span className="text-red-400 text-[9px] truncate max-w-[120px]">{sess.revocation_reason}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}