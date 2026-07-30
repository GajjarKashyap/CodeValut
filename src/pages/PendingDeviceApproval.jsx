import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, RefreshCw, Copy, CheckCircle, Clock, LogOut } from 'lucide-react';

const EXPIRY_SECONDS = 5 * 60; // 5 minutes

const PendingDeviceApproval = () => {
  const { deviceSessionInfo, setDeviceStatus, setDeviceSessionInfo } = useAuth();
  const [copied, setCopied] = React.useState(false);
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS);
  const [expired, setExpired] = useState(false);
  const [approving, setApproving] = useState(false);

  const approvalCode = deviceSessionInfo?.approvalCode || deviceSessionInfo?.approval_code_hash || '------';
  const requestId = deviceSessionInfo?.request_id;

  const handleCopy = () => {
    navigator.clipboard.writeText(approvalCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleRequestNewCode = () => {
    // Clear the cache so next check generates a fresh request
    const { clearCachedDeviceSession } = require('../services/deviceAuthService');
    clearCachedDeviceSession();
    window.location.reload();
  };

  // Countdown timer
  useEffect(() => {
    if (expired) return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setExpired(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [expired]);

  // Realtime subscription — listen for approval on this specific request
  useEffect(() => {
    if (!requestId) return;

    const channel = supabase
      .channel(`device-request-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'device_login_requests',
          filter: `id=eq.${requestId}`,
        },
        (payload) => {
          if (payload.new.status === 'approved') {
            setApproving(true);
            // Update the device session cache status to active
            const { setCachedDeviceSession } = require('../services/deviceAuthService');
            const updated = { ...deviceSessionInfo, status: 'active' };
            setCachedDeviceSession(updated);
            setDeviceSessionInfo(updated);
            setDeviceStatus('active');
          } else if (payload.new.status === 'rejected') {
            supabase.auth.signOut();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  if (approving) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="bg-dark-surface max-w-md w-full rounded-2xl border border-green-500/30 shadow-2xl p-8 text-center space-y-4 animate-in fade-in zoom-in duration-300">
          <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-400">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-xl font-bold font-serif text-white">Device Approved!</h2>
          <p className="text-dark-muted text-sm">Logging you in...</p>
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="bg-dark-surface max-w-md w-full rounded-2xl border border-primary/20 shadow-2xl overflow-hidden text-center p-8 space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <ShieldAlert size={32} />
        </div>

        <div>
          <h2 className="text-xl font-bold font-serif text-white mb-2">Device Approval Required</h2>
          <p className="text-dark-muted text-sm leading-relaxed">
            For security, this new device must be approved by your primary device.
            This page will update <span className="text-white font-medium">automatically</span> once approved.
          </p>
        </div>

        {expired ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 space-y-3">
            <p className="text-red-400 font-bold text-sm">Code Expired</p>
            <p className="text-dark-muted text-xs">The 5-minute window has passed. Request a new code to try again.</p>
            <button
              onClick={handleRequestNewCode}
              className="w-full bg-primary hover:bg-primary/90 text-dark-bg font-bold py-2.5 px-6 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
            >
              <RefreshCw size={16} />
              Request New Code
            </button>
          </div>
        ) : (
          <>
            <div className="bg-dark-bg border border-dark-border rounded-xl p-6 relative group">
              <p className="text-xs text-primary font-mono uppercase tracking-widest mb-3">Your Approval Code</p>
              <div className="text-4xl font-mono font-bold text-white tracking-[0.2em]">
                {approvalCode}
              </div>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 text-dark-muted hover:text-white bg-dark-surface rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              >
                {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
            </div>

            {/* Countdown timer */}
            <div className="flex items-center justify-center gap-2 text-sm text-dark-muted">
              <Clock size={14} />
              <span>Code expires in <span className={`font-mono font-bold ${secondsLeft < 60 ? 'text-red-400' : 'text-white'}`}>
                {minutes}:{String(seconds).padStart(2, '0')}
              </span></span>
            </div>

            <div className="text-xs text-dark-muted bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg text-left space-y-2">
              <p className="font-semibold text-yellow-500">How to approve:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Open CodeVault on your main computer (Chrome).</li>
                <li>A popup will appear asking you to approve this device.</li>
                <li>Verify the 6-digit code matches and click Approve.</li>
                <li>This page will update automatically — no refresh needed!</li>
              </ol>
            </div>
          </>
        )}

        <button
          onClick={handleSignOut}
          className="w-full py-2.5 border border-dark-border text-dark-muted hover:text-red-400 hover:border-red-500/30 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
          Sign Out & Try Later
        </button>
      </div>
    </div>
  );
};

export default PendingDeviceApproval;
