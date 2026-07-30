import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, Check, X, Monitor, Smartphone, Clock, Bell, BellOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminPendingRequests() {
  const { user, deviceSessionInfo } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('device_login_requests')
        .select(`
          id,
          user_id,
          requested_at,
          expires_at,
          approval_code_hash,
          status,
          user_devices!device_login_requests_device_id_fkey (
            id,
            device_name,
            browser_name,
            operating_system,
            metadata
          ),
          user_activity!device_login_requests_user_id_fkey (
            email
          )
        `)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (!error && data) setRequests(data);
    } catch (err) {
      console.error('Failed to fetch pending requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchRequests();

    // Realtime: auto-update when any request changes
    const channel = supabase
      .channel('admin-all-pending-requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'device_login_requests',
      }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  const handleApprove = async (req) => {
    setProcessing(req.id);
    try {
      const { data, error } = await supabase.rpc('approve_device_login_internal', {
        p_admin_user_id: user.id,
        p_admin_device_id: deviceSessionInfo?.device_id,
        p_request_id: req.id,
        p_approval_mode: 'add_device'
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data.error || 'Failed');
      setRequests(prev => prev.filter(r => r.id !== req.id));
    } catch (err) {
      alert('Failed to approve: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (req) => {
    setProcessing(req.id);
    try {
      const { data, error } = await supabase.rpc('reject_device_login_internal', {
        p_admin_user_id: user.id,
        p_admin_device_id: deviceSessionInfo?.device_id,
        p_request_id: req.id
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data.error || 'Failed');
      setRequests(prev => prev.filter(r => r.id !== req.id));
    } catch (err) {
      alert('Failed to reject: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const getDeviceName = (d) => d?.device_name || d?.metadata?.device_name || 'Unknown Device';
  const getBrowser = (d) => d?.browser_name || d?.metadata?.browser_name || 'Unknown';
  const getOS = (d) => d?.operating_system || d?.metadata?.operating_system || 'Unknown';
  const isExpired = (req) => new Date(req.expires_at) < new Date();
  const isMobile = (d) => {
    const os = getOS(d);
    return os.includes('iOS') || os.includes('Android');
  };

  if (loading) return null;

  return (
    <div className="bg-dark-surface rounded-xl border border-dark-border overflow-hidden mt-4">
      <div className="p-4 border-b border-dark-border flex items-center justify-between bg-yellow-500/5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${requests.length > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-dark-bg text-dark-muted'}`}>
            {requests.length > 0 ? <Bell size={16} className="animate-pulse" /> : <BellOff size={16} />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Pending Device Login Requests
              {requests.length > 0 && (
                <span className="bg-yellow-500 text-dark-bg text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {requests.length}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-dark-muted mt-0.5">
              {requests.length === 0 ? 'No pending requests — all clear' : 'Users waiting for approval to login on a new device'}
            </p>
          </div>
        </div>
        <button onClick={fetchRequests} className="text-[11px] text-dark-muted hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-dark-border">
          ↻ Refresh
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="p-6 text-center text-dark-muted text-sm italic">
          ✓ No devices waiting for approval
        </div>
      ) : (
        <div className="p-3 space-y-3">
          {requests.map(req => {
            const device = req.user_devices;
            const email = req.user_activity?.email || 'Unknown User';
            const expired = isExpired(req);

            return (
              <div key={req.id} className={`border rounded-xl overflow-hidden ${expired ? 'border-dark-border opacity-60' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${expired ? 'bg-dark-bg text-dark-muted' : 'bg-yellow-500/15 text-yellow-400'}`}>
                      {isMobile(device) ? <Smartphone size={18}/> : <Monitor size={18}/>}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{email}</span>
                        {expired && <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold border border-red-500/20">EXPIRED</span>}
                      </div>
                      <p className="text-xs text-dark-muted mt-0.5">
                        {getDeviceName(device)} · {getBrowser(device)} · {getOS(device)}
                      </p>
                    </div>
                  </div>

                  {!expired && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        disabled={processing === req.id}
                        onClick={() => handleReject(req)}
                        className="px-3 py-1.5 border border-red-500/40 hover:bg-red-500/10 text-red-400 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <X size={13}/> Reject
                      </button>
                      <button
                        disabled={processing === req.id}
                        onClick={() => handleApprove(req)}
                        className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <Check size={13}/> {processing === req.id ? 'Processing...' : 'Approve'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Details row */}
                <div className="border-t border-dark-border/30 bg-dark-bg/40 px-3 py-2 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4 text-[11px]">
                    <div>
                      <span className="text-dark-muted">Approval Code</span>
                      <p className="text-white font-mono font-bold tracking-widest text-base">{req.approval_code_hash}</p>
                    </div>
                    <div>
                      <span className="text-dark-muted">Requested</span>
                      <p className="text-white">{formatDistanceToNow(new Date(req.requested_at), {addSuffix: true})}</p>
                    </div>
                    <div>
                      <span className="text-dark-muted">Expires</span>
                      <p className={`font-medium ${expired ? 'text-red-400' : 'text-white'}`}>
                        {expired ? 'Expired' : formatDistanceToNow(new Date(req.expires_at), {addSuffix: true})}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-dark-muted">
                    <Clock size={10}/>
                    <span>ID: {req.id.substring(0, 8)}...</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}