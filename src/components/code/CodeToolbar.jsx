import React, { useState } from 'react';
import { Copy, Check, Download, Share2 } from 'lucide-react';
import { downloadCodeFile } from '../../utils/downloadCodeFile';
import { useCodeFontSize } from '../../hooks/useCodeFontSize';

export default function CodeToolbar({ code, title, language, onShare, showShare = false }) {
  const [copied, setCopied] = useState(false);
  const { fontSize, increaseFontSize, decreaseFontSize, canIncrease, canDecrease } = useCodeFontSize();

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
    <div className="flex items-center gap-1.5 bg-dark-bg/80 border border-dark-border px-2.5 py-1.5 rounded-lg">
      <button
        onClick={decreaseFontSize}
        disabled={!canDecrease}
        className="text-dark-muted hover:text-white disabled:opacity-30 disabled:hover:text-dark-muted p-1 rounded transition-colors cursor-pointer font-mono text-xs font-bold flex items-center"
        title="Decrease font size (A-)"
      >
        A-
      </button>
      <span className="text-[11px] text-dark-muted font-mono px-1">{fontSize}px</span>
      <button
        onClick={increaseFontSize}
        disabled={!canIncrease}
        className="text-dark-muted hover:text-white disabled:opacity-30 disabled:hover:text-dark-muted p-1 rounded transition-colors cursor-pointer font-mono text-xs font-bold flex items-center"
        title="Increase font size (A+)"
      >
        A+
      </button>

      <div className="w-[1px] h-3.5 bg-dark-border mx-1" />

      <button
        onClick={handleCopy}
        className="text-dark-muted hover:text-primary p-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-xs"
        title="Copy code"
      >
        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
      </button>

      <button
        onClick={handleDownload}
        className="text-dark-muted hover:text-primary p-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-xs"
        title={`Download ${title || 'code'} file`}
      >
        <Download size={14} />
      </button>

      {showShare && onShare && (
        <button
          onClick={onShare}
          className="text-dark-muted hover:text-primary p-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-xs"
          title="Share code modal"
        >
          <Share2 size={14} />
        </button>
      )}
    </div>
  );
}
