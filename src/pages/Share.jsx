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
  const [showRequestModal, setShowRequestModal] = useState(false);
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
          <div className="flex items-center gap-3">
            <a
              href="#/login"
              className="bg-primary/10 border border-primary/20 hover:border-primary/50 hover:bg-primary/15 text-primary px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-sans"
            >
              Sign In
            </a>
            <button
              onClick={exportAsTxt}
              className="flex items-center space-x-2 bg-dark-bg border border-dark-border hover:border-primary text-dark-muted hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer font-sans"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
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
              <CopyButton label="Copy Code" onClick={() => copyToClipboard(session.code, 'code')} isCopied={copiedSection === 'code'} />
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
                <CopyButton label="Copy Output" onClick={() => copyToClipboard(session.output, 'output')} isCopied={copiedSection === 'output'} />
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
                <CopyButton label="Copy Notes" onClick={() => copyToClipboard(session.notes, 'notes')} isCopied={copiedSection === 'notes'} />
              </div>
              <div className="bg-dark-bg border border-dark-border rounded-xl p-4 md:p-5 text-dark-text whitespace-pre-wrap leading-relaxed font-sans">
                {session.notes}
              </div>
            </div>
          )}
        </div>

        {/* Promotion & Action Card */}
        <div className="bg-dark-surface border border-primary/20 p-6 md:p-8 rounded-2xl shadow-xl space-y-5 text-center relative overflow-hidden mt-6">
          <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />
          
          <div className="max-w-xl mx-auto space-y-4">
            <h3 className="text-xl font-bold text-white font-serif">Organize Your College Practicals with CodeVault</h3>
            <p className="text-dark-muted text-sm leading-relaxed font-sans">
              CodeVault is a secure, premium digital lab notebook designed to manage Java and MongoDB sessions, recover lost drafts, and share solutions instantly.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#/login"
                className="bg-primary hover:bg-primary/90 text-dark-bg font-bold px-6 py-2.5 rounded-xl transition-all duration-300 transform active:scale-95 shadow-md shadow-primary/10 hover:shadow-primary/20 font-sans text-sm inline-block cursor-pointer"
              >
                Sign In
              </a>
              <button
                type="button"
                onClick={() => setShowRequestModal(true)}
                className="bg-dark-bg border border-dark-border hover:border-primary/50 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors duration-300 font-sans text-sm inline-block cursor-pointer min-w-[190px]"
              >
                Request Account from Dev
              </button>
            </div>
            <p className="text-[10px] text-dark-border font-mono uppercase tracking-widest pt-2">
              Dev: Kashyap Gajjar — In Beta Phase
            </p>
          </div>
        </div>
      </main>

      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-surface border border-primary/20 p-6 md:p-8 rounded-2xl max-w-lg w-full space-y-5 shadow-2xl relative animate-fadeIn text-left">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-dark-border pb-3">
              <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                <Mail size={18} className="text-primary" /> Request Account
              </h3>
              <button 
                onClick={() => setShowRequestModal(false)}
                className="text-dark-muted hover:text-white transition-colors cursor-pointer text-sm font-mono"
              >
                [ESC/CLOSE]
              </button>
            </div>

            <p className="text-xs text-dark-muted leading-relaxed font-sans">
              Copy the details below and send them to the developer to get your account created.
            </p>

            {/* Copy Fields */}
            <div className="space-y-4 font-sans text-sm">
              {/* Email */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-dark-muted uppercase tracking-wider font-mono">Recipient Email</label>
                <div className="flex items-center bg-dark-bg border border-dark-border rounded-xl p-2.5 gap-2">
                  <span className="text-white text-xs font-mono select-all truncate flex-1">kashayapgajjar71@gmail.com</span>
                  <button 
                    type="button" 
                    onClick={() => {
                      navigator.clipboard.writeText('kashayapgajjar71@gmail.com');
                      copyToClipboard('kashayapgajjar71@gmail.com', 'admin_email');
                    }}
                    className="text-xs text-primary hover:text-primary/80 font-mono flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedSection === 'admin_email' ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    {copiedSection === 'admin_email' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-dark-muted uppercase tracking-wider font-mono">Subject</label>
                <div className="flex items-center bg-dark-bg border border-dark-border rounded-xl p-2.5 gap-2">
                  <span className="text-white text-xs font-mono select-all truncate flex-1">CodeVault Account Request</span>
                  <button 
                    type="button" 
                    onClick={() => {
                      navigator.clipboard.writeText('CodeVault Account Request');
                      copyToClipboard('CodeVault Account Request', 'admin_subject');
                    }}
                    className="text-xs text-primary hover:text-primary/80 font-mono flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedSection === 'admin_subject' ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    {copiedSection === 'admin_subject' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Body Template */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-dark-muted uppercase tracking-wider font-mono">Email Body Template</label>
                <div className="relative bg-dark-bg border border-dark-border rounded-xl p-4">
                  <pre className="text-white text-xs font-sans whitespace-pre-wrap leading-relaxed select-all overflow-y-auto max-h-[160px] pb-8 pr-2">{"Hi Kashyap,\n\nI would like to request a new student account on CodeVault.\n\nHere are my details:\n- Full Name: [Enter Your Name]\n- Roll Number / Student ID: [Enter ID]\n- Class / Batch: [Enter Class]\n- Preferred Login Email: [Enter Email]\n\nThank you!"}</pre>
                  <button 
                    type="button" 
                    onClick={() => {
                      navigator.clipboard.writeText("Hi Kashyap,\n\nI would like to request a new student account on CodeVault.\n\nHere are my details:\n- Full Name: [Enter Your Name]\n- Roll Number / Student ID: [Enter ID]\n- Class / Batch: [Enter Class]\n- Preferred Login Email: [Enter Email]\n\nThank you!");
                      copyToClipboard("Hi Kashyap,\n\nI would like to request a new student account on CodeVault.\n\nHere are my details:\n- Full Name: [Enter Your Name]\n- Roll Number / Student ID: [Enter ID]\n- Class / Batch: [Enter Class]\n- Preferred Login Email: [Enter Email]\n\nThank you!", 'admin_body');
                    }}
                    className="absolute right-3 bottom-3 bg-dark-surface border border-dark-border hover:border-primary/50 text-xs text-primary hover:text-primary/80 font-mono flex items-center gap-1.5 px-3 py-1 rounded-lg cursor-pointer shadow-lg"
                  >
                    {copiedSection === 'admin_body' ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    {copiedSection === 'admin_body' ? 'Template Copied!' : 'Copy Template'}
                  </button>
                </div>
              </div>
            </div>

            {/* Close Action */}
            <button 
              type="button"
              onClick={() => {
                setShowRequestModal(false);
                window.open("mailto:kashayapgajjar71@gmail.com?subject=CodeVault%20Account%20Request&body=Hi%20Kashyap,%0D%0A%0D%0AI%20would%20like%20to%20request%20a%20new%20student%20account%20on%20CodeVault.%0D%0A%0D%0AHere%20are%20my%20details:%0D%0A-%20Full%20Name:%20[Enter%20Your%20Name]%0D%0A-%20Roll%20Number%20/%20Student%20ID:%20[Enter%20ID]%0D%0A-%20Class%20/%20Batch:%20[Enter%20Class]%0D%0A-%20Preferred%20Login%20Email:%20[Enter%20Email]%0D%0A%0D%0AThank%20you!", "_blank");
              }}
              className="w-full bg-primary hover:bg-primary/90 text-dark-bg font-bold py-2.5 rounded-xl transition-all duration-300 transform active:scale-95 cursor-pointer font-sans text-sm mt-2"
            >
              Done — Open Email App
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const CopyButton = ({ label, onClick, isCopied }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-xs flex items-center gap-1.5 bg-dark-bg border border-dark-border hover:border-primary/50 text-dark-muted hover:text-white px-2.5 py-1.5 rounded-lg transition-colors font-sans cursor-pointer"
  >
    {isCopied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
    {isCopied ? 'Copied!' : label}
  </button>
);
