import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Monitor, Smartphone, Globe, ShieldAlert, CheckCircle, Trash2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDeviceManager({ targetUserId, adminUser }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', targetUserId)
        .order('last_seen_at', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (err) {
      console.error("Failed to fetch devices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetUserId) {
      fetchDevices();
    }
  }, [targetUserId]);

  const handleRevoke = async (deviceId) => {
    if (!window.confirm("Are you sure you want to revoke this device? It will be logged out immediately.")) return;
    
    try {
      // Assuming you have an RPC to revoke a device. 
      // If not, we can just update the status to 'revoked' via RPC or direct update.
      // Since it's admin, they might have RLS bypass or need an RPC.
      // We will use the RPC `revoke_device_internal` if it exists, otherwise direct update.
      const { error } = await supabase.rpc('revoke_device_internal', {
        p_admin_user_id: adminUser.id,
        p_target_device_id: deviceId
      });
      
      if (error) {
        // Fallback for direct update if admin has permissions (RLS bypass for admin)
        const { error: updateError } = await supabase
          .from('user_devices')
          .update({ status: 'revoked', revoked_at: new Date().toISOString(), revoked_by: adminUser.id })
          .eq('id', deviceId);
        
        if (updateError) throw updateError;
      }
      
      fetchDevices();
    } catch (err) {
      alert("Failed to revoke device: " + err.message);
    }
  };

  if (loading) return <div className="p-4 text-center text-dark-muted text-xs animate-pulse">Loading devices...</div>;
  if (devices.length === 0) return <div className="p-4 text-center text-dark-muted text-xs">No devices found for this user.</div>;

  return (
    <div className="space-y-2 mt-2">
      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex justify-between items-center">
        <span>Connected Devices ({devices.length})</span>
      </h4>
      {devices.map(device => (
        <div key={device.id} className="bg-dark-bg/50 border border-dark-border rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${device.status === 'approved' ? 'bg-primary/10 text-primary' : device.status === 'revoked' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
               {device.operating_system?.includes('iOS') || device.operating_system?.includes('Android') ? <Smartphone size={16} /> : <Monitor size={16} />}
            </div>
            <div>
              <p className="text-sm text-white font-medium flex items-center gap-2">
                {device.device_name || 'Unknown Device'}
                {device.is_primary && <span className="bg-primary/20 text-primary text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider border border-primary/30">Primary</span>}
              </p>
              <div className="text-[10px] text-dark-muted font-mono mt-1 space-x-2 flex items-center">
                <span className="flex items-center gap-1">
                  {device.status === 'approved' && <CheckCircle size={10} className="text-green-400" />}
                  {device.status === 'revoked' && <XCircle size={10} className="text-red-400" />}
                  {device.status === 'pending' && <ShieldAlert size={10} className="text-yellow-400" />}
                  <span className={device.status === 'approved' ? 'text-green-400' : device.status === 'revoked' ? 'text-red-400' : 'text-yellow-400'}>
                    {device.status.toUpperCase()}
                  </span>
                </span>
                <span>•</span>
                <span>Last seen {formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          
          {device.status !== 'revoked' && (
            <button 
              onClick={() => handleRevoke(device.id)}
              className="p-1.5 text-dark-muted hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors border border-transparent hover:border-red-500/20"
              title="Revoke Access"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
