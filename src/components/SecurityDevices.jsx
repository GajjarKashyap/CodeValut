import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Monitor, Smartphone, ShieldAlert, CheckCircle, Trash2, XCircle, Settings2, Save } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function SecurityDevices() {
  const { user, deviceSessionInfo } = useAuth();
  const [devices, setDevices] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [devicesRes, settingsRes] = await Promise.all([
        supabase
          .from('user_devices')
          .select('*')
          .eq('user_id', user.id)
          .order('last_seen_at', { ascending: false }),
        supabase
          .from('user_login_settings')
          .select('*')
          .eq('user_id', user.id)
          .single()
      ]);

      if (devicesRes.error) throw devicesRes.error;
      setDevices(devicesRes.data || []);
      
      if (settingsRes.error && settingsRes.error.code !== 'PGRST116') throw settingsRes.error;
      setSettings(settingsRes.data || { max_active_devices: 5 });
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleRevoke = async (deviceId) => {
    if (!window.confirm("Are you sure you want to log out and revoke this device?")) return;
    
    try {
      const { error } = await supabase.rpc('revoke_device_internal', {
        p_admin_user_id: user.id,
        p_target_device_id: deviceId
      });
      
      if (error) {
         const { error: updateError } = await supabase
          .from('user_devices')
          .update({ status: 'revoked', revoked_at: new Date().toISOString() })
          .eq('id', deviceId)
          .eq('user_id', user.id);
          
         if (updateError) throw updateError;
      }
      
      fetchData();
    } catch (err) {
      alert("Failed to revoke device. Error: " + err.message);
    }
  };

  const handleUpdateLimit = async (newLimit) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_login_settings')
        .upsert({ user_id: user.id, max_active_devices: newLimit });
        
      if (error) throw error;
      setSettings({ ...settings, max_active_devices: newLimit });
    } catch (err) {
      alert("Failed to update limit: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4 text-center text-dark-muted animate-pulse font-sans">Loading your devices...</div>;

  return (
    <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 shadow-xl font-sans mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Monitor className="text-primary" />
            Your Connected Devices
          </h2>
          <p className="text-dark-muted text-sm">Manage the computers and browsers that have access to your account.</p>
        </div>
        
        {settings && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="bg-dark-bg border border-dark-border rounded-xl p-3 flex items-center gap-4">
              <div className="text-sm">
                <span className="text-dark-muted">Max Devices: </span>
                <span className="text-white font-bold">{settings.max_active_devices}</span>
              </div>
              <select 
                value={settings.max_active_devices}
                onChange={async (e) => {
                  setSaving(true);
                  try {
                    const { error } = await supabase.from('user_login_settings').upsert({ user_id: user.id, max_active_devices: parseInt(e.target.value) });
                    if (error) throw error;
                    setSettings({ ...settings, max_active_devices: parseInt(e.target.value) });
                  } catch (err) { alert(err.message); }
                  setSaving(false);
                }}
                disabled={saving}
                className="bg-dark-surface text-white border border-dark-border rounded-lg px-2 py-1 text-sm outline-none focus:border-primary"
              >
                {[1, 2, 3, 5, 10].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            
            <div className="bg-dark-bg border border-dark-border rounded-xl p-3 flex items-center gap-4">
              <div className="text-sm">
                <span className="text-dark-muted">Login Policy: </span>
              </div>
              <select 
                value={settings.login_policy || 'require_approval'}
                onChange={async (e) => {
                  setSaving(true);
                  try {
                    const { error } = await supabase.from('user_login_settings').upsert({ user_id: user.id, login_policy: e.target.value });
                    if (error) throw error;
                    setSettings({ ...settings, login_policy: e.target.value });
                  } catch (err) { alert(err.message); }
                  setSaving(false);
                }}
                disabled={saving}
                className="bg-dark-surface text-white border border-dark-border rounded-lg px-2 py-1 text-sm outline-none focus:border-primary"
              >
                <option value="require_approval">Require Approval</option>
                <option value="allow_all">Direct Grant</option>
                <option value="login_disabled">Logins Disabled</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      {devices.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-dark-border/50 rounded-xl text-dark-muted">
          No devices found.
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map(device => {
            const isCurrentDevice = deviceSessionInfo?.device_id === device.id;
            return (
              <div key={device.id} className={`bg-dark-bg/50 border rounded-xl p-4 flex items-center justify-between ${isCurrentDevice ? 'border-primary/40 shadow-[0_0_10px_rgba(var(--color-primary),0.1)]' : 'border-dark-border'}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${device.status === 'approved' ? 'bg-primary/10 text-primary' : device.status === 'revoked' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {device.operating_system?.includes('iOS') || device.operating_system?.includes('Android') ? <Smartphone size={20} /> : <Monitor size={20} />}
                  </div>
                  <div>
                    <p className="text-base text-white font-medium flex items-center gap-2">
                      {device.device_name || 'Unknown Device'}
                      {isCurrentDevice && <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider border border-primary/30">This Device</span>}
                      {device.is_primary && !isCurrentDevice && <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider border border-primary/20">Primary</span>}
                    </p>
                    <div className="text-xs text-dark-muted mt-1 space-x-2 flex items-center">
                      <span className="flex items-center gap-1 font-mono">
                        {device.status === 'approved' && <CheckCircle size={12} className="text-green-400" />}
                        {device.status === 'revoked' && <XCircle size={12} className="text-red-400" />}
                        {device.status === 'pending' && <ShieldAlert size={12} className="text-yellow-400" />}
                        <span className={device.status === 'approved' ? 'text-green-400' : device.status === 'revoked' ? 'text-red-400' : 'text-yellow-400'}>
                          {device.status.toUpperCase()}
                        </span>
                      </span>
                      <span>•</span>
                      <span>{device.browser_name}</span>
                      <span>•</span>
                      <span>Active {formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                
                {device.status !== 'revoked' && !isCurrentDevice && (
                  <button 
                    onClick={() => handleRevoke(device.id)}
                    className="px-3 py-2 text-dark-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 text-sm font-bold flex items-center gap-2"
                    title="Revoke Access"
                  >
                    <Trash2 size={16} /> <span className="hidden sm:inline">Revoke</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}