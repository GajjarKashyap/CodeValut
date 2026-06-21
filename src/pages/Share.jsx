import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Editor from '@monaco-editor/react';
import { Coffee, Database, Copy, Download, Globe, AlertCircle, Check, Tag, User, Calendar, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Share() {
  const { shareId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedSection, setCopiedSection] = useState('');
  const [useSimpleEditor, setUseSimpleEditor] = useState(
    localStorage.getItem('codevault_editor_mode') === 'simple'
  );

  useEffect(() => {
    const fetchSharedSession = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('share_id', shareId)
          .single();

        if (error) throw error;
        setSession(data);
      } catch (err) {
        console.error('Error fetching shared session:', err);
      } finally {
        setLoading(false);
      }
    };

    if (shareId) fetchSharedSession();
  }, [shareId]);

  const copyToClipboard = (text, sectionName) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionName);
    setTimeout(() => setCopiedSection(''), 2000);
  };

  const toggleEditorMode = () => {
    const nextMode = !useSimpleEditor;
    setUseSimpleEditor(nextMode);
    localStorage.setItem('codevault_editor_mode', nextMode ? 'simple' : 'rich');
  };

  const exportAsTxt = () => {
    if (!session) return;
    const content = [
      'Title: ' + session.title,
      'Date: ' + new Date(session.updated_at).toLocaleDateString(),
      'Subject: ' + session.subject,
      'Topic: ' + session.topic,
      '',
      'Aim:',
      session.aim,
      '',
      'Code:',
      session.code,
      '',
      'Output:',
      session.output,
      '',
      'Notes:',
      session.notes
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (session.title || 'shared-session') + '.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-dark-muted font-sans">Loading shared session...</p>
        </div>
      </div>
    );
  }

  if (!session || !session.is_shared) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-dark-surface border border-dark-border p-8 rounded-2xl shadow-xl">
          <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-red-500">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-bold font-serif">Private Session</h1>
          <p className="text-dark-muted text-sm font-sans">
            This session is private or the share link has expired. The owner needs to toggle "Share to Web" to make it accessible.
          </p>
        </div>
      </div>
    );
  }

  const CopyButton = ({ text, label, section }) => (
    <button
      type="button"
      onClick={() => copyToClipboard(text, section)}
      className="text-xs flex items-center gap-1.5 bg-dark-bg border border-dark-border hover:border-primary/50 text-dark-muted hover:text-white px-2.5 py-1.5 rounded-lg transition-colors font-sans cursor-pointer"
    >
      {copiedSection === section ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
      {copiedSection === section ? 'Copied!' : label}
    </button>
  );

  return (
    <div className="min-h-screen bg-dark-bg text-white pb-12">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark-surface/80 backdrop-blur-md border-b border-dark-border py-3 px-6 mb-8 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 p-2 rounded-xl border border-primary/20">
              <Coffee size={22} className="text-primary" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white font-serif">CodeVault</span>
              <span className="ml-2 text-xs bg-primary/15 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-mono inline-flex items-center gap-1">
                <Globe size={11} /> Shared
              </span>
            </div>
          </div>
          <button
            onClick={exportAsTxt}
            className="flex items-center space-x-2 bg-dark-bg border border-dark-border hover:border-primary text-dark-muted hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer font-sans"
          >
            <Download size={16} />
            <span>Download</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 space-y-6">
        {/* Title Card */}
        <div className="bg-dark-surface border border-dark-border p-6 md:p-8 rounded-2xl shadow-xl space-y-5">
          {/* Title & Subject */}
          <div className="border-b border-dark-border pb-5">
            <h1 className="text-3xl font-extrabold text-white font-serif mb-3">{session.title || 'Untitled Session'}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-dark-muted font-sans">
              <span className="flex items-center bg-dark-bg px-3 py-1.5 rounded-lg border border-dark-border font-medium gap-1.5">
                {session.subject === 'Java' ? (
                  <Coffee size={14} className="text-orange-400" />
                ) : (
                  <Database size={14} className="text-green-400" />
                )}
                {session.subject}
              </span>
              {session.topic && (
                <span className="bg-dark-bg px-3 py-1.5 rounded-lg border border-dark-border">
                  {session.topic}
                </span>
              )}
              {session.tags && session.tags.length > 0 && session.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-dark-bg text-dark-muted border border-dark-border text-xs px-2.5 py-1 rounded-full font-mono">
                  <Tag size={10} />{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Metadata Bar */}
          <div className="bg-dark-bg/50 border border-dark-border rounded-xl p-4 flex flex-wrap gap-x-8 gap-y-2 text-sm font-sans">
            <div className="flex items-center gap-2">
              <User size={14} className="text-primary" />
              <span className="text-dark-muted">Created by:</span>
              <span className="text-white font-mono bg-dark-surface px-2 py-0.5 rounded border border-dark-border text-xs">
                {session.user_email || 'Student'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-primary" />
              <span className="text-dark-muted">Created:</span>
              <span className="text-white font-medium">
                {new Date(session.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-primary" />
              <span className="text-dark-muted">Updated:</span>
              <span className="text-white font-medium">
                {formatDistanceToNow(new Date(session.updated_at || new Date()), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Aim */}
          {session.aim && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-dark-muted uppercase tracking-widest font-mono">Aim</h2>
              <div className="bg-dark-bg border border-dark-border rounded-xl p-4 text-dark-text whitespace-pre-wrap font-sans leading-relaxed">
                {session.aim}
              </div>
            </div>
          )}

          {/* Code */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold text-dark-muted uppercase tracking-widest font-mono">Code</h2>
                <button
                  type="button"
                  onClick={toggleEditorMode}
                  className="text-[10px] bg-dark-bg text-dark-muted hover:text-white border border-dark-border px-2 py-0.5 rounded transition-colors cursor-pointer font-mono"
                >
                  {useSimpleEditor ? 'Rich View' : 'Simple View'}
                </button>
              </div>
              <CopyButton text={session.code} label="Copy Code" section="code" />
            </div>

            {useSimpleEditor ? (
              <pre className="w-full bg-dark-bg border border-dark-border rounded-xl p-4 overflow-auto font-mono text-sm leading-relaxed text-left text-[#e0e0e0] whitespace-pre h-[400px]">
                <code>{session.code || ''}</code>
              </pre>
            ) : (
              <div className="rounded-xl overflow-hidden border border-dark-border h-[400px]">
                <Editor
                  height="100%"
                  language={session.subject === 'Java' ? 'java' : 'javascript'}
                  theme="vs-dark"
                  value={session.code || ''}
                  options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, automaticLayout: true }}
                />
              </div>
            )}
          </div>

          {/* Output */}
          {session.output && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-semibold text-dark-muted uppercase tracking-widest font-mono">Output</h2>
                  <button
                    type="button"
                    onClick={toggleEditorMode}
                    className="text-[10px] bg-dark-bg text-dark-muted hover:text-white border border-dark-border px-2 py-0.5 rounded transition-colors cursor-pointer font-mono"
                  >
                    {useSimpleEditor ? 'Rich View' : 'Simple View'}
                  </button>
                </div>
                <CopyButton text={session.output} label="Copy Output" section="output" />
              </div>

              {useSimpleEditor ? (
                <pre className="w-full bg-dark-bg border border-dark-border rounded-xl p-4 overflow-auto font-mono text-sm leading-relaxed text-[#e0e0e0] whitespace-pre h-[200px]">
                  <code>{session.output}</code>
                </pre>
              ) : (
                <div className="rounded-xl overflow-hidden border border-dark-border h-[200px]">
                  <Editor
                    height="100%"
                    language="plaintext"
                    theme="vs-dark"
                    value={session.output || ''}
                    options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14, lineNumbers: 'off', scrollBeyondLastLine: false, automaticLayout: true }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {session.notes && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-semibold text-dark-muted uppercase tracking-widest font-mono">Notes</h2>
                <CopyButton text={session.notes} label="Copy Notes" section="notes" />
              </div>
              <div className="bg-dark-bg border border-dark-border rounded-xl p-4 md:p-5 text-dark-text whitespace-pre-wrap leading-relaxed font-sans">
                {session.notes}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
