import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Monitor, Smartphone, ShieldAlert, CheckCircle, Trash2, XCircle, RotateCcw, Star } from 'lucide-react';
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
      setSettings(settingsRes.data || { max_active_devices: 5, login_policy: 'require_approval' });
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  // FIX: Use UPDATE instead of upsert so we never accidentally overwrite other columns
  const updateSetting = async (field, value) => {
    setSaving(true);
    try {
      // First ensure the row exists
      await supabase
        .from('user_login_settings')
        .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true });

      // Then update just the one field
      const { error } = await supabase
        .from('user_login_settings')
        .update({ [field]: value })
        .eq('user_id', user.id);

      if (error) throw error;
      setSettings(prev => ({ ...prev, [field]: value }));
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (deviceId) => {
    if (!window.confirm('Are you sure you want to revoke access for this device?')) return;
    try {
      const { error } = await supabase.rpc('revoke_device_internal', {
        p_admin_user_id: user.id,
        p_target_device_id: deviceId
      });
      if (error) {
        const { error: updateError } = await supabase
          .from('user_devices')
          .update({ status: 'revoked' })
          .eq('id', deviceId)
          .eq('user_id', user.id);
        if (updateError) throw updateError;
      }
      fetchData();
    } catch (err) {
      alert('Failed to revoke device: ' + err.message);
    }
  };

  // FIX: Restore a revoked device so it can log in again
  const handleRestore = async (deviceId) => {
    if (!window.confirm('Restore access for this device? It will need to log in again.')) return;
    try {
      const { error } = await supabase
        .from('user_devices')
        .update({ status: 'pending', revoked_at: null })
        .eq('id', deviceId)
        .eq('user_id', user.id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert('Failed to restore device: ' + err.message);
    }
  };

  const handleSetPrimary = async (deviceId) => {
    if (!window.confirm('Set this device as your Primary device?')) return;
    setLoading(true);
    try {
      await supabase
        .from('user_devices')
        .update({ is_primary: false })
        .eq('user_id', user.id)
        .eq('is_primary', true);
        
      const { error } = await supabase
        .from('user_devices')
        .update({ is_primary: true })
        .eq('id', deviceId)
        .eq('user_id', user.id);
        
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert('Failed to set primary: ' + err.message);
      setLoading(false);
    }
  };

  // Helper: device name/browser from metadata or direct column
  const getDeviceName = (device) =>
    device.device_name || device.metadata?.device_name || 'Unknown Device';
  const getBrowserName = (device) =>
    device.browser_name || device.metadata?.browser_name || '';
  const getOS = (device) =>
    device.operating_system || device.metadata?.operating_system || '';

  if (loading) return <div className="p-4 text-center text-dark-muted animate-pulse font-sans">Loading your devices...</div>;

  const policyLabels = {
    require_approval: 'Require Approval',
    allow_all: 'Direct Grant',
    login_disabled: 'Logins Disabled'
  };

  return (
    <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 shadow-xl font-sans mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            <Monitor className="text-primary" />
            Your Connected Devices
          </h2>
          <p className="text-dark-muted text-sm">Manage devices and control how new logins are handled.</p>
        </div>

        {settings && (
          <div className="flex flex-col gap-2 min-w-[220px]">
            <div className="bg-dark-bg border border-dark-border rounded-xl p-3 flex items-center justify-between gap-3">
              <span className="text-dark-muted text-sm whitespace-nowrap">Max Devices</span>
              <select
                value={settings.max_active_devices ?? 5}
                onChange={(e) => updateSetting('max_active_devices', parseInt(e.target.value))}
                disabled={saving}
                className="bg-dark-surface text-white border border-dark-border rounded-lg px-2 py-1 text-sm outline-none focus:border-primary"
              >
                {[1, 2, 3, 5, 10].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="bg-dark-bg border border-dark-border rounded-xl p-3 flex items-center justify-between gap-3">
              <span className="text-dark-muted text-sm whitespace-nowrap">Login Policy</span>
              <select
                value={settings.login_policy ?? 'require_approval'}
                onChange={(e) => updateSetting('login_policy', e.target.value)}
                disabled={saving}
                className="bg-dark-surface text-white border border-dark-border rounded-lg px-2 py-1 text-sm outline-none focus:border-primary"
              >
                <option value="require_approval">Require Approval</option>
                <option value="allow_all">Direct Grant</option>
                <option value="login_disabled">Logins Disabled</option>
              </select>
            </div>

            <div className="text-[10px] text-dark-muted px-1">
              Current: <span className="text-white font-medium">{policyLabels[settings.login_policy] ?? 'Require Approval'}</span>
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
            const deviceName = getDeviceName(device);
            const browserName = getBrowserName(device);
            const osName = getOS(device);
            const isMobile = osName.includes('iOS') || osName.includes('Android');

            return (
              <div
                key={device.id}
                className={`bg-dark-bg/50 border rounded-xl p-4 flex items-center justify-between ${
                  isCurrentDevice ? 'border-primary/40 shadow-[0_0_10px_rgba(var(--color-primary),0.1)]' : 'border-dark-border'
                } ${device.status === 'revoked' ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${
                    device.status === 'approved' ? 'bg-primary/10 text-primary'
                    : device.status === 'revoked' ? 'bg-red-500/10 text-red-500'
                    : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {isMobile ? <Smartphone size={20} /> : <Monitor size={20} />}
                  </div>
                  <div>
                    <p className="text-base text-white font-medium flex items-center gap-2 flex-wrap">
                      {deviceName}
                      {isCurrentDevice && (
                        <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider border border-primary/30">This Device</span>
                      )}
                      {device.is_primary && (
                        <span className="bg-yellow-500/20 text-yellow-500 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider border border-yellow-500/30 flex items-center gap-1">
                          <Star size={10} className="fill-yellow-500" /> Primary
                        </span>
                      )}
                    </p>
                    <div className="text-xs text-dark-muted mt-1 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 font-mono">
                        {device.status === 'approved' && <CheckCircle size={12} className="text-green-400" />}
                        {device.status === 'revoked' && <XCircle size={12} className="text-red-400" />}
                        {device.status === 'pending' && <ShieldAlert size={12} className="text-yellow-400" />}
                        <span className={
                          device.status === 'approved' ? 'text-green-400'
                          : device.status === 'revoked' ? 'text-red-400'
                          : 'text-yellow-400'
                        }>
                          {device.status.toUpperCase()}
                        </span>
                      </span>
                      {browserName && <><span>•</span><span>{browserName}</span></>}
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  
                  {device.status === 'revoked' && !isCurrentDevice && (
                    <button
                      onClick={() => handleRestore(device.id)}
                      className="px-3 py-2 text-dark-muted hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors border border-transparent hover:border-green-500/20 text-sm font-bold flex items-center gap-1"
                      title="Restore Access"
                    >
                      <RotateCcw size={14} /> <span className="hidden sm:inline">Restore</span>
                    </button>
                  )}
                  {device.status !== 'revoked' && !isCurrentDevice && (
                    <button
                      onClick={() => handleRevoke(device.id)}
                      className="px-3 py-2 text-dark-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 text-sm font-bold flex items-center gap-1"
                      title="Revoke Access"
                    >
                      <Trash2 size={14} /> <span className="hidden sm:inline">Revoke</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}