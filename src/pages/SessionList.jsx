import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Coffee, Database, Star, Clock, Trash2, Tag, Share2, Globe, Copy, Check, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function SessionList({ filter }) {
  const { subject } = useParams();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState(null);

  const isAdmin = user?.email?.trim()?.toLowerCase() === 'admin@admin.com';
  const displayTitle = filter === 'favorites' ? 'Favorites' : filter === 'shared' ? 'Shared Sessions' : subject === 'java' ? 'Java Sessions' : 'MongoDB Sessions';
  const LIMIT = 10;

  // Reset when filter/subject/sortBy changes
  useEffect(() => {
    setSessions([]);
    setOffset(0);
    setHasMore(true);
    setError(null);
  }, [subject, filter, sortBy]);

  useEffect(() => {
    if (user) {
      fetchSessions(offset === 0);
    }
  }, [subject, filter, sortBy, offset, user]);

  const fetchSessions = async (isReset) => {
    try {
      setLoading(true);
      setError(null);

      let queryBuilder = supabase
        .from('sessions')
        .select('id, title, subject, topic, tags, is_favorite, updated_at, user_email, share_mode, share_id, view_count, shared_at')
        .eq('is_archived', false)
        .eq('is_blocked', false);

      // Filter
      if (filter === 'shared') {
        queryBuilder = queryBuilder.eq('share_mode', 'public');
      } else {
        if (!isAdmin) {
          queryBuilder = queryBuilder.eq('user_id', user.id);
        }

        if (filter === 'favorites') {
          queryBuilder = queryBuilder.eq('is_favorite', true);
        } else if (subject) {
          queryBuilder = queryBuilder.ilike('subject', subject);
        }
      }

      // Sorting
      if (sortBy === 'most_viewed') {
        queryBuilder = queryBuilder.order('view_count', { ascending: false });
      } else if (sortBy === 'recently_updated') {
        queryBuilder = queryBuilder.order('updated_at', { ascending: false });
      } else {
        if (filter === 'shared') {
          queryBuilder = queryBuilder.order('shared_at', { ascending: false, nullsFirst: false });
        } else {
          queryBuilder = queryBuilder.order('updated_at', { ascending: false });
        }
      }

      // Pagination
      const from = offset;
      const to = offset + LIMIT - 1;
      queryBuilder = queryBuilder.range(from, to);

      const { data, error: queryError } = await queryBuilder;
      if (queryError) throw queryError;

      if (data) {
        if (isReset) {
          setSessions(data);
        } else {
          setSessions(prev => {
            const existingIds = new Set(prev.map(s => s.id));
            const newSessions = data.filter(s => !existingIds.has(s.id));
            return [...prev, ...newSessions];
          });
        }
        if (data.length < LIMIT) {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error('Error fetching sessions:', err.message);
      setError('Failed to fetch sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleShareModeChange = async (id, nextMode, currentMode, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (nextMode === 'private' && (currentMode === 'public' || currentMode === 'unlisted')) {
      const confirmPrivate = window.confirm('Disabling sharing will make this session private, and all existing share links will stop working. Continue?');
      if (!confirmPrivate) return;
    }

    const { error } = await supabase
      .from('sessions')
      .update({
        share_mode: nextMode,
        is_shared: nextMode === 'public' || nextMode === 'unlisted',
        shared_at: (nextMode === 'public' || nextMode === 'unlisted') ? new Date().toISOString() : null
      })
      .eq('id', id);

    if (!error) {
      if (filter === 'shared' && nextMode !== 'public') {
        setSessions(prev => prev.filter(s => s.id !== id));
      } else {
        setSessions(prev => prev.map(s => s.id === id ? { ...s, share_mode: nextMode } : s));
      }
    } else {
      alert('Failed to update sharing mode: ' + error.message);
    }
  };

  const handleNativeShare = async (title, shareId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!shareId) return;
    const shareLink = `${window.location.origin}${import.meta.env.BASE_URL}#/share/${shareId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `CodeVault Session: ${title}`,
          text: `Check out my CodeVault session: ${title}`,
          url: shareLink
        });
      } catch (err) {
        console.log('Native share failed or cancelled:', err);
      }
    } else {
      navigator.clipboard.writeText(shareLink);
      setCopiedId(shareId);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const getDisplayName = (session) => {
    if (session.user_email) {
      const parts = session.user_email.split('@');
      if (parts.length === 2) {
        const [local, domain] = parts;
        const maskedLocal = local.length > 2 
          ? `${local.slice(0, 2)}***${local.slice(-1)}` 
          : `${local[0]}***`;
        return `${maskedLocal}@${domain}`;
      }
      return session.user_email;
    }
    return 'Anonymous Student';
  };

  const handleArchive = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Archive this session? You can restore it later.')) {
      const { error } = await supabase.from('sessions').update({ is_archived: true }).eq('id', id);
      if (!error) setSessions(sessions.filter(s => s.id !== id));
    }
  };

  if (loading && sessions.length === 0) return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <p className="text-dark-muted text-sm font-sans">Loading sessions...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-sans mb-5">
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dark-text flex items-center gap-2 font-serif">
            {filter === 'favorites' && <Star className="text-yellow-400 fill-current" size={24} />}
            {filter === 'shared' && <Share2 className="text-primary" size={24} />}
            {subject === 'java' && <Coffee className="text-orange-400" size={24} />}
            {subject === 'mongodb' && <Database className="text-green-400" size={24} />}
            {displayTitle}
          </h2>
          <p className="text-dark-muted text-sm font-sans mt-0.5">{sessions.length} session{sessions.length !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-dark-surface border border-dark-border rounded-lg px-3 py-1.5 text-xs text-dark-muted gap-2 font-mono">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-white outline-none border-none cursor-pointer focus:ring-0"
            >
              <option value="newest">Newest</option>
              <option value="recently_updated">Recently Updated</option>
              <option value="most_viewed">Most Viewed</option>
            </select>
          </div>
          {filter !== 'shared' && (
            <Link to="/session/new" className="bg-primary hover:bg-primary/90 text-dark-bg px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 font-sans">
              + New Session
            </Link>
          )}
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-dark-surface p-10 rounded-xl border border-dashed border-dark-border text-center font-sans space-y-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${filter === 'favorites' ? 'bg-yellow-500/10 text-yellow-400' : filter === 'shared' ? 'bg-primary/10 text-primary' : subject === 'java' ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>
            {filter === 'favorites' ? <Star size={28} /> : filter === 'shared' ? <Share2 size={28} /> : subject === 'java' ? <Coffee size={28} /> : <Database size={28} />}
          </div>
          <p className="text-dark-muted">
            {filter === 'shared' ? 'No shared sessions found. Share a session or look for shared snippets in chats!' : 'No sessions found. Create your first one!'}
          </p>
          {filter !== 'shared' && (
            <Link to="/session/new" className="inline-block text-primary text-sm hover:underline">+ Create Session →</Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {sessions.map(session => {
            const isOwnSession = session.user_email === user?.email || isAdmin;
            const targetPath = isOwnSession ? `/session/${session.id}` : `/share/${session.share_id}`;
            const isShared = session.share_mode === 'public' || session.share_mode === 'unlisted';
            return (
              <Link key={session.id} to={targetPath} className="bg-dark-surface border border-dark-border hover:border-primary/40 rounded-xl p-5 transition-all duration-200 group block">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start space-x-4 min-w-0">
                    <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${session.subject === 'Java' ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>
                      {session.subject === 'Java' ? <Coffee size={22} /> : <Database size={22} />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-dark-text font-semibold font-sans flex items-center gap-2 truncate">
                        {session.title || 'Untitled Session'}
                        {session.is_favorite && <Star size={14} className="text-yellow-400 fill-current shrink-0" />}
                        {isShared && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider shrink-0 ${session.share_mode === 'public' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}>
                            {session.share_mode}
                          </span>
                        )}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-dark-muted mt-1.5 font-sans">
                        <span className="flex items-center gap-1"><Clock size={12} /> {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}</span>
                        {session.topic && <span className="text-dark-muted/70">• {session.topic}</span>}
                        <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded border border-primary/20 font-mono">
                          by {getDisplayName(session)}
                        </span>
                        {isShared && (
                          <span className="flex items-center gap-1 text-[11px] text-dark-muted bg-dark-bg px-2 py-0.5 rounded border border-dark-border font-mono">
                            <Eye size={12} /> {session.view_count || 0} views
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
                <div className="flex items-center space-x-1.5 shrink-0">
                  {isOwnSession ? (
                    <div className="relative font-mono text-[11px]">
                      <select
                        value={session.share_mode || 'private'}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onChange={(e) => handleShareModeChange(session.id, e.target.value, session.share_mode, e)}
                        className={`bg-dark-surface border border-dark-border text-dark-text text-[11px] px-2 py-1.5 rounded-lg focus:outline-none focus:border-primary/50 cursor-pointer font-bold uppercase tracking-wider transition-colors ${isShared ? 'text-primary border-primary/30 bg-primary/5' : ''}`}
                      >
                        <option value="private">Private</option>
                        <option value="unlisted">Unlisted</option>
                        <option value="public">Public</option>
                      </select>
                    </div>
                  ) : (
                    isShared && (
                      <button
                        onClick={(e) => handleNativeShare(session.title, session.share_id, e)}
                        className={`p-2 rounded-lg transition-all border border-dark-border cursor-pointer flex items-center justify-center ${copiedId === session.share_id ? 'text-green-400 bg-green-500/10 border-green-500/30' : 'text-dark-muted hover:text-primary hover:bg-primary/10 hover:border-primary/20 bg-dark-surface'}`}
                        title={copiedId === session.share_id ? "Link Copied!" : "Share / Copy Link"}
                      >
                        {copiedId === session.share_id ? <Check size={16} /> : <Share2 size={16} />}
                      </button>
                    )
                  )}

                  {isOwnSession && (
                    <>
                      <button
                        onClick={(e) => toggleFavorite(session.id, session.is_favorite, e)}
                        className={`p-2 rounded-lg border border-dark-border transition-all cursor-pointer ${session.is_favorite ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' : 'text-dark-muted hover:text-yellow-400 hover:bg-yellow-500/10 bg-dark-surface'}`}
                      >
                        <Star size={16} className={session.is_favorite ? 'fill-current' : ''} />
                      </button>
                      <button
                        onClick={(e) => handleArchive(session.id, e)}
                        className="p-2 text-dark-muted hover:text-red-400 hover:bg-red-500/10 border border-dark-border hover:border-red-500/20 rounded-lg transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 bg-dark-surface cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      )}

      {hasMore && sessions.length > 0 && (
        <div className="text-center mt-6">
          <button
            onClick={() => setOffset(prev => prev + LIMIT)}
            disabled={loading}
            className="px-6 py-2.5 bg-dark-surface border border-dark-border text-dark-muted hover:text-white rounded-xl text-xs font-mono tracking-wider transition-all hover:border-primary/20 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'LOADING...' : 'LOAD MORE SESSIONS'}
          </button>
        </div>
      )}
    </div>
  );
}
