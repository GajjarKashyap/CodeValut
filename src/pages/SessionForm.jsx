import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Editor from '@monaco-editor/react';
import { Save, Download, Copy, Clock, Share2, Globe, Check, Tag, ShieldCheck, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function SessionForm() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [draftRecovered, setDraftRecovered] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [useSimpleEditor, setUseSimpleEditor] = useState(
    localStorage.getItem('codevault_editor_mode') === 'simple'
  );

  const [formData, setFormData] = useState({
    title: '', subject: 'Java', topic: '', aim: '', code: '', output: '',
    notes: '', tags: '', is_shared: false, share_id: '',
    user_id: '', user_email: '', created_at: '', updated_at: ''
  });

  const DRAFT_KEY = `codevault_draft_${id || 'new'}`;
  const isAdmin = user?.email?.toLowerCase() === 'admin@admin.com';

  // Fetch session if editing
  useEffect(() => {
    if (id && user) {
      const fetchSession = async () => {
        let query = supabase.from('sessions').select('*').eq('id', id);
        if (!isAdmin) query = query.eq('user_id', user.id);
        const { data } = await query.single();
        if (data) {
          setFormData({
            title: data.title || '', subject: data.subject || 'Java',
            topic: data.topic || '', aim: data.aim || '',
            code: data.code || '', output: data.output || '',
            notes: data.notes || '', tags: data.tags ? data.tags.join(', ') : '',
            is_shared: !!data.is_shared, share_id: data.share_id || '',
            user_id: data.user_id || '', user_email: data.user_email || '',
            created_at: data.created_at || '', updated_at: data.updated_at || ''
          });
        }
        setLoading(false);
      };
      fetchSession();
    } else {
      setLoading(false);
    }
  }, [id, user]);

  // Draft recovery
  useEffect(() => {
    if (!loading) {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setFormData(prev => ({ ...prev, ...parsed }));
          setDraftRecovered(true);
          setTimeout(() => setDraftRecovered(false), 5000);
        } catch (e) {}
      }
    }
  }, [loading]);

  // Auto-save draft
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        const { is_shared, share_id, user_id, user_email, created_at, updated_at, ...draftData } = formData;
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
        setSaveStatus('Draft saved locally');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, loading]);

  const handleSave = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveStatus('Saving...');

    const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
    const sessionData = {
      user_id: id ? (formData.user_id || user.id) : user.id,
      user_email: id ? (formData.user_email || user.email) : user.email,
      title: formData.title, subject: formData.subject, topic: formData.topic,
      aim: formData.aim, code: formData.code, output: formData.output,
      notes: formData.notes, tags: tagsArray, is_shared: formData.is_shared
    };

    try {
      if (id) {
        const { error } = await supabase.from('sessions').update(sessionData).eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('sessions').insert([sessionData]).select();
        if (error) throw error;
        if (data && data[0]) navigate(`/session/${data[0].id}`, { replace: true });
      }
      setSaveStatus('Saved to cloud ✓');
      localStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      setSaveStatus('Save failed. Draft kept.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  }, [formData, id, user]);

  const handleToggleShare = async () => {
    const nextShared = !formData.is_shared;
    setFormData(prev => ({ ...prev, is_shared: nextShared }));
    if (id) {
      const { error } = await supabase.from('sessions').update({ is_shared: nextShared }).eq('id', id);
      if (error) {
        setFormData(prev => ({ ...prev, is_shared: !nextShared }));
        alert('Failed to update sharing: ' + error.message);
      }
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const copyShareLink = (link) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const toggleEditorMode = () => {
    const nextMode = !useSimpleEditor;
    setUseSimpleEditor(nextMode);
    localStorage.setItem('codevault_editor_mode', nextMode ? 'simple' : 'rich');
  };

  const handleCodeTab = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd, value } = e.target;
      const newValue = value.substring(0, selectionStart) + '    ' + value.substring(selectionEnd);
      setFormData(prev => ({ ...prev, code: newValue }));
      const target = e.target;
      setTimeout(() => { target.selectionStart = target.selectionEnd = selectionStart + 4; }, 0);
    }
  };

  // Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const exportAsTxt = () => {
    const lines = ['Title: ' + formData.title, 'Date: ' + new Date().toLocaleDateString(), 'Subject: ' + formData.subject, 'Topic: ' + formData.topic, '', 'Aim:', formData.aim, '', 'Code:', formData.code, '', 'Output:', formData.output, '', 'Notes:', formData.notes];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = (formData.title || 'session') + '.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>
  );


  const inputClass = "w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-white transition-colors font-sans text-sm placeholder-dark-border/80";

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white font-serif">{id ? 'Edit Session' : 'New Session'}</h2>
          {isAdmin && formData.user_email && (
            <span className="bg-primary/15 text-primary border border-primary/25 text-[11px] px-2.5 py-1 rounded-full font-mono font-bold flex items-center gap-1">
              <ShieldCheck size={11} /> Admin Edit
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {draftRecovered && (
            <span className="text-yellow-400 text-xs flex items-center gap-1 font-sans">
              <Zap size={13} /> Draft recovered
            </span>
          )}
          {saveStatus && <span className={`text-xs font-sans ${saveStatus.includes('failed') ? 'text-red-400' : saveStatus.includes('cloud') ? 'text-green-400' : 'text-dark-muted'}`}>{saveStatus}</span>}

          {/* Editor mode toggle */}
          <button
            type="button"
            onClick={toggleEditorMode}
            className="text-xs bg-dark-surface text-dark-muted hover:text-white border border-dark-border px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-mono"
          >
            {useSimpleEditor ? '⚡ Rich Editor' : '✏ Simple Editor'}
          </button>

          {/* Share */}
          {id && (
            <div className="relative font-sans">
              <button
                type="button"
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center gap-2 px-3 py-1.5 text-dark-muted hover:text-white bg-dark-surface rounded-lg border border-dark-border transition-colors cursor-pointer text-sm"
              >
                <Share2 size={16} />
                <span>Share</span>
                {formData.is_shared && <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>}
              </button>
              {showShareMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-dark-surface border border-dark-border rounded-xl shadow-2xl p-4 z-50 space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe size={15} className={formData.is_shared ? 'text-green-400' : 'text-dark-muted'} />
                        <span className="text-sm font-semibold text-white">Share to Web</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleShare}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${formData.is_shared ? 'bg-primary' : 'bg-dark-bg border border-dark-border'}`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${formData.is_shared ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <p className="text-xs text-dark-muted leading-relaxed">
                      {formData.is_shared
                        ? 'Public — anyone with the link can view this session.'
                        : 'Private — only you can access this session.'}
                    </p>
                    {formData.is_shared && formData.share_id && (
                      <div className="flex items-center bg-dark-bg border border-dark-border rounded-lg p-2 gap-2">
                        <input
                          type="text" readOnly
                          value={window.location.origin + import.meta.env.BASE_URL + '#/share/' + formData.share_id}
                          className="bg-transparent text-xs text-dark-text outline-none w-full font-mono"
                        />
                        <button type="button" onClick={() => copyShareLink(window.location.origin + import.meta.env.BASE_URL + '#/share/' + formData.share_id)} className="p-1 text-primary hover:bg-primary/10 rounded transition-colors cursor-pointer">
                          {copiedLink ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <button onClick={exportAsTxt} className="p-2 text-dark-muted hover:text-white bg-dark-surface rounded-lg border border-dark-border transition-colors cursor-pointer" title="Download as TXT">
            <Download size={18} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-dark-bg font-bold rounded-lg cursor-pointer transition-all active:scale-95 font-sans text-sm disabled:opacity-60"
          >
            <Save size={16} className="mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Metadata Bar */}
      {id && formData.created_at && (
        <div className="bg-dark-surface/50 border border-dark-border rounded-xl p-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-dark-muted mb-6 font-sans animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-primary font-bold text-xs font-mono uppercase tracking-wider">Created by</span>
            <span className="text-white font-mono bg-dark-bg px-2 py-0.5 rounded border border-dark-border text-xs">
              {formData.user_email || 'You'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary font-bold text-xs font-mono uppercase tracking-wider">Created</span>
            <span className="text-white text-sm">
              {new Date(formData.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary font-bold text-xs font-mono uppercase tracking-wider">Updated</span>
            <span className="text-white text-sm">
              {formatDistanceToNow(new Date(formData.updated_at || new Date()), { addSuffix: true })}
            </span>
          </div>
        </div>
      )}

      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        {/* Title & Subject */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <InputLabel>Title</InputLabel>
            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={inputClass} placeholder="e.g. ArrayList Program" required />
          </div>
          <div>
            <InputLabel>Subject</InputLabel>
            <select value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className={inputClass}>
              <option value="Java">Java</option>
              <option value="MongoDB">MongoDB</option>
            </select>
          </div>
        </div>

        {/* Topic & Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <InputLabel>Topic</InputLabel>
            <input type="text" value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} className={inputClass} placeholder="e.g. Collections" />
          </div>
          <div>
            <InputLabel>Tags (comma separated)</InputLabel>
            <div className="relative">
              <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" />
              <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className={inputClass + ' pl-8'} placeholder="important, viva, exam" />
            </div>
          </div>
        </div>

        {/* Aim */}
        <div>
          <InputLabel>Aim</InputLabel>
          <textarea value={formData.aim} onChange={e => setFormData({...formData, aim: e.target.value})} rows={2} className={inputClass + ' resize-none'} placeholder="Demonstrate usage of..." />
        </div>

        {/* Code */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <InputLabel>Code</InputLabel>
            <button type="button" onClick={() => copyToClipboard(formData.code, 'code')} className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 font-sans transition-colors">
              {copiedField === 'code' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
              {copiedField === 'code' ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          {useSimpleEditor ? (
            <textarea
              value={formData.code}
              onChange={e => setFormData({...formData, code: e.target.value})}
              onKeyDown={handleCodeTab}
              className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-white font-mono text-sm leading-relaxed h-[400px] resize-y transition-colors"
              placeholder="// Write your Java/MongoDB code here..."
              spellCheck={false}
            />
          ) : (
            <div className="rounded-xl overflow-hidden border border-dark-border h-[400px]">
              <Editor
                height="100%"
                language={formData.subject === 'Java' ? 'java' : 'javascript'}
                theme="vs-dark"
                value={formData.code}
                onChange={(value) => setFormData({...formData, code: value || ''})}
                options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false }}
              />
            </div>
          )}
        </div>

        {/* Output */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <InputLabel>Output</InputLabel>
            <button type="button" onClick={() => copyToClipboard(formData.output, 'output')} className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 font-sans transition-colors">
              {copiedField === 'output' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
              {copiedField === 'output' ? 'Copied!' : 'Copy Output'}
            </button>
          </div>
          {useSimpleEditor ? (
            <textarea
              value={formData.output}
              onChange={e => setFormData({...formData, output: e.target.value})}
              className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-white font-mono text-sm leading-relaxed h-[180px] resize-y transition-colors"
              placeholder="// Terminal output goes here..."
              spellCheck={false}
            />
          ) : (
            <div className="rounded-xl overflow-hidden border border-dark-border h-[180px]">
              <Editor
                height="100%"
                language="plaintext"
                theme="vs-dark"
                value={formData.output}
                onChange={(value) => setFormData({...formData, output: value || ''})}
                options={{ minimap: { enabled: false }, fontSize: 14, lineNumbers: 'off', scrollBeyondLastLine: false }}
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <InputLabel>Notes</InputLabel>
            <button type="button" onClick={() => copyToClipboard(formData.notes, 'notes')} className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 font-sans transition-colors">
              {copiedField === 'notes' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
              {copiedField === 'notes' ? 'Copied!' : 'Copy Notes'}
            </button>
          </div>
          <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={5} className={inputClass + ' resize-y'} placeholder="Observations, key points, exam tips..." />
        </div>
      </form>
    </div>
  );
}

const InputLabel = ({ children }) => (
  <label className="block text-xs font-medium text-dark-muted mb-1.5 font-mono uppercase tracking-wider">{children}</label>
);
