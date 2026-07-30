import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldAlert, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DeviceLoginRequestDialog = () => {
  const { user, deviceSessionInfo } = useAuth();
  const [requests, setRequests] = useState([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user || !deviceSessionInfo?.device_id) return;

    // Fetch pending requests where this user is the owner, but it's NOT this device
    const fetchRequests = async () => {
      const { data } = await supabase
        .from('device_login_requests')
        .select(`
          id,
          requested_at,
          approval_code_hash,
          user_devices!device_login_requests_device_id_fkey (
            device_name,
            browser_name,
            operating_system,
            last_ip_hash
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .neq('device_id', deviceSessionInfo.device_id)
        .order('requested_at', { ascending: false });

      if (data) {
        setRequests(data);
      }
    };

    fetchRequests();

    // Subscribe to new requests
    const subscription = supabase.channel('device-requests')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'device_login_requests',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        if (payload.new.device_id !== deviceSessionInfo.device_id && payload.new.status === 'pending') {
          fetchRequests();
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'device_login_requests',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        if (payload.new.status !== 'pending') {
          setRequests(prev => prev.filter(r => r.id !== payload.new.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, deviceSessionInfo]);

  const handleApprove = async (requestId) => {
    setProcessing(true);
    try {
      const { error } = await supabase.rpc('approve_device_login_internal', {
        p_admin_user_id: user.id,
        p_admin_device_id: deviceSessionInfo.device_id,
        p_request_id: requestId,
        p_approval_mode: 'add_device'
      });
      if (error) throw error;
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      alert("Failed to approve: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (requestId) => {
    setProcessing(true);
    try {
      const { error } = await supabase.rpc('reject_device_login_internal', {
        p_admin_user_id: user.id,
        p_admin_device_id: deviceSessionInfo.device_id,
        p_request_id: requestId
      });
      if (error) throw error;
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      alert("Failed to reject: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (requests.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[100] w-80 space-y-4">
      {requests.map(req => (
        <div key={req.id} className="bg-dark-surface border border-primary/30 rounded-xl shadow-2xl p-4 animate-in slide-in-from-right-8 fade-in">
          <div className="flex items-start gap-3">
            <div className="bg-primary/20 p-2 rounded-full text-primary shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">New Login Request</h4>
              <p className="text-dark-muted text-xs mt-1">
                {req.user_devices?.device_name || 'Unknown device'} wants to access your account.
              </p>
              
              <div className="bg-dark-bg border border-dark-border rounded p-2 mt-3 mb-3 text-center">
                <p className="text-[10px] text-dark-muted uppercase tracking-widest mb-1">Verify Code</p>
                <p className="text-xl font-mono text-white tracking-[0.2em] font-bold">
                  {req.approval_code_hash}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  disabled={processing}
                  onClick={() => handleReject(req.id)}
                  className="flex-1 py-1.5 border border-red-500/50 hover:bg-red-500/10 text-red-400 text-xs font-bold rounded flex items-center justify-center gap-1 transition-colors"
                >
                  <X size={14} /> Reject
                </button>
                <button
                  disabled={processing}
                  onClick={() => handleApprove(req.id)}
                  className="flex-1 py-1.5 bg-primary hover:bg-primary/90 text-dark-bg text-xs font-bold rounded flex items-center justify-center gap-1 transition-colors"
                >
                  <Check size={14} /> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DeviceLoginRequestDialog;
