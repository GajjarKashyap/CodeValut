import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Archive, Coffee, Database, Star, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ArchivePage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);

  const isAdmin = user?.email?.trim()?.toLowerCase() === 'admin@admin.com';

  useEffect(() => {
    if (user) {
      const fetch = async () => {
        let query = supabase
          .from('sessions')
          .select('id, title, subject, topic, updated_at, user_email, is_favorite')
          .eq('is_archived', true)
          .order('updated_at', { ascending: false });

        if (!isAdmin) query = query.eq('user_id', user.id);

        const { data, error } = await query;
        if (!error && data) setSessions(data);
        setLoading(false);
      };
      fetch();
    }
  }, [user]);

  const handleRestore = async (id) => {
    setRestoring(id);
    const { error } = await supabase.from('sessions').update({ is_archived: false }).eq('id', id);
    if (!error) setSessions(sessions.filter(s => s.id !== id));
    setRestoring(null);
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm('Permanently delete this session? This cannot be undone.')) return;
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (!error) setSessions(sessions.filter(s => s.id !== id));
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 font-serif">
            <Archive size={24} className="text-dark-muted" /> Archive
          </h2>
          <p className="text-dark-muted text-sm font-sans mt-0.5">{sessions.length} archived session{sessions.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-dark-surface p-12 rounded-xl border border-dashed border-dark-border text-center space-y-3">
          <Archive size={40} className="text-dark-muted mx-auto opacity-40" />
          <p className="text-dark-muted font-sans">No archived sessions. Archive a session from the session list to see it here.</p>
          <Link to="/" className="inline-block text-primary text-sm hover:underline">← Back to Dashboard</Link>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-yellow-400 text-xs font-sans">
            <AlertTriangle size={14} />
            Archived sessions are hidden from your main lists. Restore them to make them active again.
          </div>
          <div className="grid gap-3">
            {sessions.map(session => (
              <div key={session.id} className="bg-dark-surface border border-dark-border rounded-xl p-5 flex justify-between items-center gap-4 group">
                <div className="flex items-center space-x-4 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 opacity-60 ${session.subject === 'Java' ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>
                    {session.subject === 'Java' ? <Coffee size={20} /> : <Database size={20} />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white/80 font-semibold font-sans truncate">{session.title || 'Untitled Session'}</h3>
                    <div className="flex items-center gap-2 text-xs text-dark-muted mt-1 font-sans">
                      <span>{session.subject}</span>
                      {session.topic && <span>• {session.topic}</span>}
                      {isAdmin && session.user_email && (
                        <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded border border-primary/20 font-mono">{session.user_email}</span>
                      )}
                      <span>• Archived {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleRestore(session.id)}
                    disabled={restoring === session.id}
                    className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 text-xs px-3 py-1.5 rounded-lg transition-colors font-sans cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw size={13} className={restoring === session.id ? 'animate-spin' : ''} />
                    Restore
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(session.id)}
                    className="p-2 text-dark-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Delete permanently"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
