import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search as SearchIcon, Coffee, Database, Star, Tag, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Search() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const isAdmin = user?.email?.toLowerCase() === '2072@admin.com' || user?.email?.toLowerCase() === 'admin@codevault.edu';

  useEffect(() => {
    if (user) {
      const delaySearch = setTimeout(async () => {
        setLoading(true);
        setHasSearched(true);

        let q = supabase
          .from('sessions')
          .select('id, title, subject, topic, tags, is_favorite, updated_at, user_email')
          .eq('is_archived', false);

        if (!isAdmin) {
          q = q.eq('user_id', user.id);
        }

        if (query.trim()) {
          q = q.or('title.ilike.%' + query + '%,topic.ilike.%' + query + '%');
        }

        if (filter === 'Java' || filter === 'MongoDB') {
          q = q.eq('subject', filter);
        } else if (filter === 'Favorites') {
          q = q.eq('is_favorite', true);
        }

        q = q.order('updated_at', { ascending: false });

        const { data, error } = await q;
        if (!error && data) setSessions(data);
        setLoading(false);
      }, 300);

      return () => clearTimeout(delaySearch);
    }
  }, [query, filter, user]);

  const filters = ['All', 'Java', 'MongoDB', 'Favorites'];

  return (
    <div className="max-w-5xl mx-auto pb-10 space-y-5">
      {/* Search Box */}
      <div className="bg-dark-surface p-5 rounded-xl border border-dark-border space-y-4 font-sans">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-muted" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or topic..."
            autoFocus
            className="w-full bg-dark-bg border border-dark-border rounded-xl pl-12 pr-4 py-3 text-white focus:border-primary focus:outline-none text-base font-sans transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 cursor-pointer ${
                filter === f
                  ? 'bg-primary text-dark-bg font-bold shadow-md shadow-primary/20'
                  : 'bg-dark-bg text-dark-muted hover:text-white border border-dark-border hover:border-dark-muted'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-primary"></div>
              <p className="text-dark-muted text-sm font-sans">Searching...</p>
            </div>
          </div>
        ) : !hasSearched ? (
          <div className="text-center py-16">
            <SearchIcon size={40} className="text-dark-muted mx-auto mb-3 opacity-50" />
            <p className="text-dark-muted font-sans">Start typing to search your sessions</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-dark-surface p-10 rounded-xl border border-dark-border text-center font-sans space-y-2">
            <SearchIcon size={36} className="text-dark-muted mx-auto opacity-40" />
            <p className="text-dark-muted">No results found for "{query || filter}"</p>
            <Link to="/session/new" className="inline-block text-primary text-sm hover:underline mt-1">+ Create a new session →</Link>
          </div>
        ) : (
          <>
            <p className="text-xs text-dark-muted font-mono mb-3 px-1">{sessions.length} result{sessions.length !== 1 ? 's' : ''}</p>
            <div className="grid gap-3">
              {sessions.map(session => (
                <Link
                  key={session.id}
                  to={`/session/${session.id}`}
                  className="bg-dark-surface border border-dark-border hover:border-primary/40 rounded-xl p-5 transition-all duration-200 flex justify-between items-start gap-4 group"
                >
                  <div className="flex items-start space-x-4 min-w-0">
                    <div className={`p-2.5 rounded-xl shrink-0 ${session.subject === 'Java' ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>
                      {session.subject === 'Java' ? <Coffee size={22} /> : <Database size={22} />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-white font-semibold font-sans flex items-center gap-2 truncate">
                        {session.title || 'Untitled Session'}
                        {session.is_favorite && <Star size={13} className="text-yellow-400 fill-current shrink-0" />}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-dark-muted mt-1 font-sans">
                        <span>{session.subject}</span>
                        {session.topic && <span>• {session.topic}</span>}
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
                  <div className="text-xs text-dark-muted font-mono shrink-0 flex items-center gap-1">
                    <Clock size={11} />
                    {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
