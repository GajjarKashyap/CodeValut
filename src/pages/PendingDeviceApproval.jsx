import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, RefreshCw, Copy, CheckCircle } from 'lucide-react';

const PendingDeviceApproval = () => {
  const { deviceSessionInfo, setDeviceStatus } = useAuth();
  const [copied, setCopied] = React.useState(false);

  const approvalCode = deviceSessionInfo?.approvalCode || '------';
  
  const handleCopy = () => {
    navigator.clipboard.writeText(approvalCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = () => {
    // Force a reload which will trigger AuthContext to check again
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="bg-dark-surface max-w-md w-full rounded-2xl border border-primary/20 shadow-2xl overflow-hidden text-center p-8 space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <ShieldAlert size={32} />
        </div>
        
        <div>
          <h2 className="text-xl font-bold font-serif text-white mb-2">Device Approval Required</h2>
          <p className="text-dark-muted text-sm leading-relaxed">
            For security, new devices must be approved by your primary device.
          </p>
        </div>

        <div className="bg-dark-bg border border-dark-border rounded-xl p-6 relative group">
          <p className="text-xs text-primary font-mono uppercase tracking-widest mb-3">Your Approval Code</p>
          <div className="text-4xl font-mono font-bold text-white tracking-[0.2em]">{approvalCode}</div>
          
          <button 
            onClick={handleCopy}
            className="absolute top-2 right-2 p-2 text-dark-muted hover:text-white bg-dark-surface rounded-lg opacity-0 group-hover:opacity-100 transition-all"
          >
            {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
          </button>
        </div>

        <div className="text-xs text-dark-muted bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg text-left space-y-2">
          <p className="font-semibold text-yellow-500">How to approve:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open CodeVault on your main computer.</li>
            <li>A popup will ask you to approve this new device.</li>
            <li>Verify that the 6-digit code matches exactly.</li>
          </ol>
        </div>

        <button
          onClick={handleRefresh}
          className="w-full bg-primary hover:bg-primary/90 text-dark-bg font-bold py-3 px-6 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <RefreshCw size={18} />
          <span>I've Approved It</span>
        </button>
      </div>
    </div>
  );
};

export default PendingDeviceApproval;
