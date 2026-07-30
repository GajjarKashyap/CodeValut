import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Monitor, Smartphone, ShieldAlert, CheckCircle, XCircle, Trash2, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDeviceManager({ targetUserId, adminUser }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', targetUserId)
        .order('last_seen_at', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (err) {
      console.error('AdminDeviceManager fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetUserId) fetchDevices();
  }, [targetUserId]);

  const getDeviceName = (d) => d.device_name || d.metadata?.device_name || 'Unknown Device';
  const getBrowserName = (d) => d.browser_name || d.metadata?.browser_name || '';
  const getOS = (d) => d.operating_system || d.metadata?.operating_system || '';

  const handleRevoke = async (deviceId) => {
    if (!window.confirm('Revoke this device? The user will be logged out.')) return;
    try {
      const { error } = await supabase.rpc('revoke_device_internal', {
        p_admin_user_id: adminUser.id,
        p_target_device_id: deviceId
      });
      if (error) {
        const { error: ue } = await supabase
          .from('user_devices')
          .update({ status: 'revoked', revoked_at: new Date().toISOString(), revoked_by: adminUser.id })
          .eq('id', deviceId);
        if (ue) throw ue;
      }
      fetchDevices();
    } catch (err) {
      alert('Failed to revoke: ' + err.message);
    }
  };

  const handleRestore = async (deviceId) => {
    try {
      const { error } = await supabase
        .from('user_devices')
        .update({ status: 'pending', revoked_at: null })
        .eq('id', deviceId);
      if (error) throw error;
      fetchDevices();
    } catch (err) {
      alert('Failed to restore: ' + err.message);
    }
  };

  if (loading) return <div className="p-3 text-center text-dark-muted text-xs animate-pulse">Loading devices...</div>;
  if (error) return <div className="p-3 text-center text-red-400 text-xs">Error: {error}</div>;
  if (devices.length === 0) return <div className="p-3 text-center text-dark-muted text-xs">No devices registered for this user.</div>;

  return (
    <div className="space-y-2 mt-2">
      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
        Connected Devices ({devices.length})
      </h4>
      {devices.map(device => {
        const name = getDeviceName(device);
        const browser = getBrowserName(device);
        const os = getOS(device);
        const isMobile = os.includes('iOS') || os.includes('Android');

        return (
          <div key={device.id} className="bg-dark-bg/50 border border-dark-border rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                device.status === 'approved' ? 'bg-primary/10 text-primary'
                : device.status === 'revoked' ? 'bg-red-500/10 text-red-500'
                : 'bg-yellow-500/10 text-yellow-500'
              }`}>
                {isMobile ? <Smartphone size={16} /> : <Monitor size={16} />}
              </div>
              <div>
                <p className="text-sm text-white font-medium flex items-center gap-2">
                  {name}
                  {device.is_primary && (
                    <span className="bg-primary/20 text-primary text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider border border-primary/30">Primary</span>
                  )}
                </p>
                <div className="text-[10px] text-dark-muted font-mono mt-1 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    {device.status === 'approved' && <CheckCircle size={10} className="text-green-400" />}
                    {device.status === 'revoked' && <XCircle size={10} className="text-red-400" />}
                    {device.status === 'pending' && <ShieldAlert size={10} className="text-yellow-400" />}
                    <span className={device.status === 'approved' ? 'text-green-400' : device.status === 'revoked' ? 'text-red-400' : 'text-yellow-400'}>
                      {device.status.toUpperCase()}
                    </span>
                  </span>
                  {browser && <><span>•</span><span>{browser}</span></>}
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-1">
              {device.status === 'revoked' ? (
                <button
                  onClick={() => handleRestore(device.id)}
                  className="p-1.5 text-dark-muted hover:text-green-400 hover:bg-green-500/10 rounded-md transition-colors border border-transparent hover:border-green-500/20"
                  title="Restore Access"
                >
                  <RotateCcw size={14} />
                </button>
              ) : (
                <button
                  onClick={() => handleRevoke(device.id)}
                  className="p-1.5 text-dark-muted hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors border border-transparent hover:border-red-500/20"
                  title="Revoke Access"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}