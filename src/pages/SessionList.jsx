import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Coffee, Database, Star, Clock, Trash2, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function SessionList({ filter }) {
  const { subject } = useParams();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.email?.toLowerCase() === 'admin@admin.com';
  const displayTitle = filter === 'favorites' ? 'Favorites' : subject === 'java' ? 'Java Sessions' : 'MongoDB Sessions';

  useEffect(() => {
    if (user) {
      const fetchSessions = async () => {
        setLoading(true);

        let query = supabase
          .from('sessions')
          .select('id, title, subject, topic, tags, is_favorite, updated_at, user_email')
          .eq('is_archived', false)
          .order('updated_at', { ascending: false });

        if (!isAdmin) {
          query = query.eq('user_id', user.id);
        }

        if (filter === 'favorites') {
          query = query.eq('is_favorite', true);
        } else if (subject) {
          query = query.ilike('subject', subject);
        }

        const { data, error } = await query;
        if (!error && data) setSessions(data);
        setLoading(false);
      };
      fetchSessions();
    }
  }, [subject, filter, user]);

  const toggleFavorite = async (id, currentStatus, e) => {
    e.preventDefault();
    e.stopPropagation();
    const { error } = await supabase.from('sessions').update({ is_favorite: !currentStatus }).eq('id', id);
    if (!error) {
      if (filter === 'favorites' && currentStatus) {
        setSessions(sessions.filter(s => s.id !== id));
      } else {
        setSessions(sessions.map(s => s.id === id ? { ...s, is_favorite: !currentStatus } : s));
      }
    }
  };

  const handleArchive = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Archive this session? You can restore it later.')) {
      const { error } = await supabase.from('sessions').update({ is_archived: true }).eq('id', id);
      if (!error) setSessions(sessions.filter(s => s.id !== id));
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <p className="text-dark-muted text-sm font-sans">Loading sessions...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 font-serif">
            {filter === 'favorites' && <Star className="text-yellow-400 fill-current" size={24} />}
            {subject === 'java' && <Coffee className="text-orange-400" size={24} />}
            {subject === 'mongodb' && <Database className="text-green-400" size={24} />}
            {displayTitle}
          </h2>
          <p className="text-dark-muted text-sm font-sans mt-0.5">{sessions.length} session{sessions.length !== 1 ? 's' : ''} found</p>
        </div>
        <Link to="/session/new" className="bg-primary hover:bg-primary/90 text-dark-bg px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 font-sans">
          + New Session
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-dark-surface p-10 rounded-xl border border-dashed border-dark-border text-center font-sans space-y-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${filter === 'favorites' ? 'bg-yellow-500/10 text-yellow-400' : subject === 'java' ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>
            {filter === 'favorites' ? <Star size={28} /> : subject === 'java' ? <Coffee size={28} /> : <Database size={28} />}
          </div>
          <p className="text-dark-muted">No sessions found. Create your first one!</p>
          <Link to="/session/new" className="inline-block text-primary text-sm hover:underline">+ Create Session →</Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {sessions.map(session => (
            <Link key={session.id} to={`/session/${session.id}`} className="bg-dark-surface border border-dark-border hover:border-primary/40 rounded-xl p-5 transition-all duration-200 group block">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-start space-x-4 min-w-0">
                  <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${session.subject === 'Java' ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>
                    {session.subject === 'Java' ? <Coffee size={22} /> : <Database size={22} />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold font-sans flex items-center gap-2 truncate">
                      {session.title || 'Untitled Session'}
                      {session.is_favorite && <Star size={14} className="text-yellow-400 fill-current shrink-0" />}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-dark-muted mt-1.5 font-sans">
                      <span className="flex items-center gap-1"><Clock size={12} /> {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}</span>
                      {session.topic && <span className="text-dark-muted/70">• {session.topic}</span>}
                      {isAdmin && session.user_email && (
                        <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded border border-primary/20 font-mono">
                          {session.user_email}
                        </span>
                      )}
                    </div>
                    {session.tags && session.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {session.tags.map(tag => (
                          <span key={tag} className="flex items-center gap-1 bg-dark-bg text-dark-muted border border-dark-border text-[10px] px-2 py-0.5 rounded-full font-mono">
                            <Tag size={9} />{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={(e) => toggleFavorite(session.id, session.is_favorite, e)}
                    className={`p-2 rounded-lg transition-all ${session.is_favorite ? 'text-yellow-400 bg-yellow-500/10' : 'text-dark-muted hover:text-yellow-400 hover:bg-yellow-500/10'}`}
                  >
                    <Star size={17} className={session.is_favorite ? 'fill-current' : ''} />
                  </button>
                  <button
                    onClick={(e) => handleArchive(session.id, e)}
                    className="p-2 text-dark-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
