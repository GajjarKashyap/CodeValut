import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle, Send } from 'lucide-react';
import { getWhatsAppShareUrl, getTelegramShareUrl, getQrCodeUrl } from '../../utils/shareUtils';

export default function ShareModal({ isOpen, onClose, title, language, shareUrl }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'CodeVault Snippet',
          url: shareUrl
        });
      } catch (e) {
        console.log('Native share cancelled or failed:', e);
      }
    }
  };

  const qrUrl = getQrCodeUrl(shareUrl);
  const waUrl = getWhatsAppShareUrl(title, shareUrl);
  const tgUrl = getTelegramShareUrl(title, shareUrl);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
      <div className="bg-dark-surface border border-primary/20 p-6 rounded-2xl max-w-sm w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-dark-border pb-3">
          <div>
            <h3 id="share-modal-title" className="text-lg font-bold text-white font-serif">Share Code</h3>
            <p className="text-xs text-dark-muted truncate max-w-[200px] font-mono">{title || "Snippet"}</p>
          </div>
          <button onClick={onClose} className="text-dark-muted hover:text-white p-1 rounded-lg transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center bg-dark-bg p-4 rounded-xl border border-dark-border">
          {shareUrl ? (
            <>
              <img 
                src={qrUrl} 
                alt="QR Code" 
                className="w-[200px] h-[200px] rounded-lg shadow-md bg-white p-2 border border-primary/30 object-contain"
                onError={(e) => {
                  e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareUrl)}`;
                }}
              />
              <span className="text-[11px] text-dark-muted mt-2 font-mono">Scan QR to open directly on phone</span>
            </>
          ) : (
            <div className="w-[200px] h-[200px] flex flex-col items-center justify-center text-center p-4 text-dark-muted font-mono text-xs gap-2">
              <span>No public link available.</span>
              <span>Save and enable sharing (Public/Unlisted) to generate a QR code!</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono text-dark-muted">PUBLIC LINK</label>
          <div className="flex items-center gap-2">
            <input type="text" readOnly value={shareUrl || "Please save/enable sharing first"} className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text font-mono truncate focus:outline-none focus:border-primary" />
            <button onClick={handleCopy} disabled={!shareUrl} className="bg-primary/10 hover:bg-primary/20 disabled:opacity-50 text-primary border border-primary/30 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <a href={shareUrl ? waUrl : "#"} target={shareUrl ? "_blank" : "_self"} rel="noopener noreferrer" className={`flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 py-2 rounded-xl text-xs font-medium transition-colors ${!shareUrl ? "opacity-50 pointer-events-none" : ""}`}>
            <MessageCircle size={16} />
            <span>WhatsApp</span>
          </a>
          <a href={shareUrl ? tgUrl : "#"} target={shareUrl ? "_blank" : "_self"} rel="noopener noreferrer" className={`flex items-center justify-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 py-2 rounded-xl text-xs font-medium transition-colors ${!shareUrl ? "opacity-50 pointer-events-none" : ""}`}>
            <Send size={16} />
            <span>Telegram</span>
          </a>
        </div>

          {navigator.share && shareUrl && (
          <button onClick={handleNativeShare} className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer">
            <Share2 size={16} />
            <span>More Share Options</span>
          </button>
        )}
      </div>
    </div>
  );
}