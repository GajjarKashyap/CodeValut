import React, { useState } from 'react';
import { Copy, Check, Download, QrCode, Share2 } from 'lucide-react';
import { downloadCodeFile } from '../../utils/downloadCodeFile';

export default function CodeToolbar({ code, title, language, onShare, showShare = false }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadCodeFile(code, title, language);
  };

  return (
    <div className="flex items-center gap-2 bg-dark-bg/90 border border-dark-border px-3 py-1.5 rounded-xl shadow-sm">
      <button
        onClick={handleCopy}
        className="text-dark-muted hover:text-primary p-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono"
        title="Copy code to clipboard"
      >
        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>

      <div className="w-[1px] h-3.5 bg-dark-border" />

      <button
        onClick={handleDownload}
        className="text-dark-muted hover:text-primary p-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono"
        title="Download code as source file"
      >
        <Download size={14} />
        <span>Download File</span>
      </button>

      {(showShare || onShare) && (
        <>
          <div className="w-[1px] h-3.5 bg-dark-border" />
          <button
            onClick={onShare}
            className="flex items-center gap-1.5 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs font-mono font-bold shadow-sm active:scale-95"
            title="Share via QR Code & Socials"
          >
            <QrCode size={14} />
            <span>Share QR</span>
          </button>
        </>
      )}
    </div>
  );
}