import { useState, useEffect } from 'react';
import { ArrowLeft, Coffee, Download, Star, User, Check, Sparkles, ShieldCheck, Code, Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function DownloadApp() {
  const [reviews, setReviews] = useState([]);

  // Form State
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch reviews on mount and subscribe to realtime updates
  useEffect(() => {
    fetchReviews();

    const channel = supabase
      .channel('app_reviews_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'app_reviews' },
        (payload) => {
          const newRev = {
            id: payload.new.id,
            name: payload.new.name,
            rating: payload.new.rating,
            comment: payload.new.comment,
            date: new Date(payload.new.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })
          };
          setReviews((prev) => {
            if (prev.some((r) => r.id === newRev.id)) return prev;
            return [newRev, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('app_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formatted = data.map((r) => ({
          id: r.id,
          name: r.name,
          rating: r.rating,
          comment: r.comment,
          date: new Date(r.created_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })
        }));
        setReviews(formatted);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Stats calculation
  const totalReviewsCount = reviews.length;
  const averageRating = totalReviewsCount > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviewsCount).toFixed(1)
    : "0.0";

  // Dynamic Star Percentage calculation
  const getStarPercentage = (star) => {
    if (totalReviewsCount === 0) return 0;
    const count = reviews.filter(r => r.rating === star).length;
    return Math.round((count / totalReviewsCount) * 100);
  };

  // Screenshots array
  const screenshots = [
    { name: 'Dashboard View', path: 'screenshots/dashboard.png', desc: 'Monitor your lab practicals and subject stats in one screen.' },
    { name: 'Hacker IDE Code Editor', path: 'screenshots/session_editor.png', desc: 'Write, edit, and organize code sessions with premium syntax highlights.' },
    { name: 'Real-time Chat', path: 'screenshots/search.png', desc: 'Chat instantly with peers and share updates during sessions.' },
    { name: 'Notebook Repository', path: 'screenshots/session_list.png', desc: 'Access your full subject practical directories.' },
    { name: 'Secure Login', path: 'screenshots/login.png', desc: 'Hacker-terminal styled secure entrance.' }
  ];

  const handleBackToLogin = () => {
    window.location.hash = '/login';
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;

    const reviewData = {
      name: name.trim(),
      rating: rating,
      comment: comment.trim()
    };

    // Optimistic update
    const tempId = 'temp-' + Date.now();
    const tempReview = {
      id: tempId,
      ...reviewData,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    };
    setReviews((prev) => [tempReview, ...prev]);

    try {
      const { data, error } = await supabase
        .from('app_reviews')
        .insert(reviewData)
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const savedReview = {
          id: data[0].id,
          name: data[0].name,
          rating: data[0].rating,
          comment: data[0].comment,
          date: new Date(data[0].created_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })
        };
        // Replace optimistic temp review with actual database review
        setReviews((prev) =>
          prev.map((r) => (r.id === tempId ? savedReview : r))
        );
      }

      setName('');
      setComment('');
      setRating(5);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (err) {
      console.error('Error submitting review:', err.message);
      // Rollback optimistic update
      setReviews((prev) => prev.filter((r) => r.id !== tempId));
      alert('Failed to submit review. Make sure the app_reviews table is created in Supabase!');
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text pb-12 relative overflow-hidden bg-grid-pattern">
      {/* Dynamic Style Block for Custom Scrollbars & Animations */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .theme-bg-primary-5 {
          background-color: color-mix(in srgb, var(--color-primary) 5%, transparent);
        }
        .theme-bg-primary-10 {
          background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
        }
        .theme-bg-primary-15 {
          background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
        }
        .theme-border-primary-20 {
          border-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
        }
        .theme-border-primary-30 {
          border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
        }
        .theme-border-primary-40 {
          border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
        }
        .theme-border-primary-50 {
          border-color: color-mix(in srgb, var(--color-primary) 50%, transparent);
        }
      `}</style>

      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Header bar */}
      <header className="sticky top-0 z-40 w-full bg-dark-bg/80 backdrop-blur-md border-b border-dark-border px-4 py-3 flex items-center justify-between">
        <button
          onClick={handleBackToLogin}
          className="flex items-center gap-2 text-dark-muted hover:text-primary transition-colors font-mono text-xs cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>[BACK_TO_LOGIN]</span>
        </button>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/GajjarKashyap/CodeValut"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dark-muted hover:text-primary transition-colors font-mono text-xs cursor-pointer flex items-center gap-1"
          >
            <span>[VIEW_ON_GITHUB]</span>
          </a>
          <div className="flex items-center gap-2 border-l border-dark-border pl-4">
            <Coffee size={18} className="text-primary animate-pulse" />
            <span className="font-serif font-bold text-sm tracking-wide text-primary">CodeVault Hub</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-8 relative z-10">
        
        {/* PlayStore Hero Section */}
        <div className="bg-dark-surface border border-dark-border rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row gap-6 items-start relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/20 rounded-tl-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/20 rounded-br-3xl pointer-events-none"></div>

          {/* App Logo */}
          <div className="theme-bg-primary-10 w-28 h-28 rounded-3xl flex items-center justify-center border theme-border-primary-30 shadow-2xl shrink-0 mx-auto md:mx-0">
            <Coffee size={56} className="text-primary animate-pulse" />
          </div>

          {/* App Metadata & Actions */}
          <div className="flex-1 text-center md:text-left space-y-4 w-full">
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1.5">
                <h1 className="text-2xl md:text-3xl font-bold font-serif text-dark-text">CodeVault Mobile</h1>
                <span className="text-[9px] font-mono font-bold bg-green-500/10 border border-green-500/20 text-green-500 px-2 py-0.5 rounded-full uppercase tracking-wider">Beta v1</span>
              </div>
              <a 
                href="https://github.com/GajjarKashyap/CodeValut" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary text-xs font-mono font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>GajjarKashyap/CodeValut Android Client</span>
                <span className="text-[9px]">↗</span>
              </a>
              <p className="text-dark-muted text-xs font-sans mt-2 leading-relaxed">
                Compile lab assignments, view practical lists, and chat in real-time right from your mobile device.
              </p>
            </div>

            {/* Download Action */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <a
                href="./APP/app-debug.apk"
                className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-dark-bg font-sans font-bold text-xs px-5 py-3 rounded-xl transition-all active:scale-95 cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <Download size={15} />
                <span>Latest Auto Build APK</span>
              </a>
              <a
                href="./APP/CODEVAULT.apk"
                download="CODEVAULT.apk"
                className="w-full sm:w-auto bg-transparent border border-dark-border hover:border-primary/50 text-dark-text hover:text-primary font-sans font-bold text-xs px-5 py-3 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Download size={15} />
                <span>Stable Manual APK (~5.4 MB)</span>
              </a>
            </div>
          </div>
        </div>

        {/* Stats Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-dark-surface/50 backdrop-blur-sm border border-dark-border/60 rounded-2xl p-4 text-center">
          <div className="space-y-1">
            <div className="text-xs font-mono text-dark-muted uppercase tracking-wider">Rating</div>
            <div className="text-lg font-bold text-dark-text flex items-center justify-center gap-1">
              <span>{averageRating}</span>
              <Star size={16} className="text-yellow-500 fill-yellow-500" />
            </div>
            <div className="text-[10px] text-dark-muted">{totalReviewsCount} Reviews</div>
          </div>
          <div className="space-y-1 border-l border-dark-border/40">
            <div className="text-xs font-mono text-dark-muted uppercase tracking-wider">Security</div>
            <div className="text-lg font-bold text-dark-text font-sans">Safe & Secure</div>
            <div className="text-[10px] text-dark-muted">Verified Build Sandbox</div>
          </div>
          <div className="space-y-1 border-l border-dark-border/40">
            <div className="text-xs font-mono text-dark-muted uppercase tracking-wider">File Size</div>
            <div className="text-lg font-bold text-dark-text font-mono">5.4 MB</div>
            <div className="text-[10px] text-dark-muted">Compressed Binary</div>
          </div>
          <div className="space-y-1 border-l border-dark-border/40 col-span-2 md:col-span-1 border-t md:border-t-0 border-dark-border/40 pt-2 md:pt-0">
            <div className="text-xs font-mono text-dark-muted uppercase tracking-wider">Requirements</div>
            <div className="text-lg font-bold text-dark-text font-sans">Android 8+</div>
            <div className="text-[10px] text-dark-muted">API Level 26+</div>
          </div>
        </div>

        {/* Screenshots Horizontal Carousel */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold font-serif text-dark-text border-l-2 border-primary pl-2.5">App Interface</h2>
          
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x">
            {screenshots.map((s, idx) => (
              <div 
                key={idx} 
                className="w-[280px] bg-dark-surface border border-dark-border/80 rounded-2xl p-3 shadow-xl shrink-0 snap-start transition-all hover:border-primary/20 group"
              >
                <div className="relative aspect-[9/16] bg-neutral-950 rounded-xl overflow-hidden mb-2 border border-dark-border flex items-center justify-center">
                  <img 
                    src={s.path} 
                    alt={s.name} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/CodeValut/' + s.path;
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <span className="text-[9px] font-mono text-primary font-bold uppercase tracking-wider mb-1">Slide {idx + 1}</span>
                    <p className="text-[11px] text-white leading-snug">{s.desc}</p>
                  </div>
                </div>
                <div className="text-center font-mono text-[10px] text-dark-muted tracking-wide mt-1">
                  {s.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Info Cards */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold font-serif text-dark-text border-l-2 border-primary pl-2.5">Technical Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-dark-surface/40 border border-dark-border/80 rounded-2xl p-5 space-y-2">
              <Code size={20} className="text-primary" />
              <h3 className="font-bold text-sm text-dark-text">Vite + React Client</h3>
              <p className="text-xs text-dark-muted leading-relaxed">
                Blazing fast layout updates, micro-animations, and dynamic theme settings matching the web vault.
              </p>
            </div>
            <div className="bg-dark-surface/40 border border-dark-border/80 rounded-2xl p-5 space-y-2">
              <Smartphone size={20} className="text-primary" />
              <h3 className="font-bold text-sm text-dark-text">Capacitor Wrapper</h3>
              <p className="text-xs text-dark-muted leading-relaxed">
                Wraps standard web assets into a native container to deploy on Android devices with zero overhead.
              </p>
            </div>
            <div className="bg-dark-surface/40 border border-dark-border/80 rounded-2xl p-5 space-y-2">
              <ShieldCheck size={20} className="text-primary" />
              <h3 className="font-bold text-sm text-dark-text">Native local notifications</h3>
              <p className="text-xs text-dark-muted leading-relaxed">
                Runs background listeners with Android permissions to deliver system tray alerts immediately when broadcasts are sent.
              </p>
            </div>
          </div>
        </div>

        {/* Rating Summaries & Reviews */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold font-serif text-dark-text border-l-2 border-primary pl-2.5">Ratings & Reviews</h2>
          
          <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 flex flex-col md:flex-row gap-8 items-center">
            {/* Left Big Number */}
            <div className="text-center shrink-0">
              <div className="text-5xl font-black text-dark-text font-serif">{averageRating}</div>
              <div className="flex justify-center gap-0.5 my-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={16} 
                    className={i < Math.round(Number(averageRating)) ? "text-yellow-500 fill-yellow-500" : "text-dark-border"} 
                  />
                ))}
              </div>
              <div className="text-[10px] text-dark-muted uppercase font-mono tracking-wider">{totalReviewsCount} reviews total</div>
            </div>

            {/* Right Distribution Bars */}
            <div className="flex-1 w-full space-y-2 font-mono text-xs">
              {[5, 4, 3, 2, 1].map((star) => {
                const pct = getStarPercentage(star);
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="w-3">{star}</span>
                    <div className="flex-1 h-2 bg-neutral-900 border border-dark-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="w-8 text-right text-dark-muted">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form to submit review */}
          <div className="bg-dark-surface/40 border border-dark-border rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold font-serif text-dark-text flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <span>Write a Review</span>
            </h3>

            {showSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3.5 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
                <Check size={16} />
                <span>Review submitted successfully! Recalculating metrics...</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold text-dark-muted uppercase font-mono tracking-wider">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-neutral-950 border border-dark-border rounded-xl px-4 py-2.5 text-xs text-dark-text focus:outline-none placeholder-dark-muted"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold text-dark-muted uppercase font-mono tracking-wider">Star Rating</label>
                  <div className="flex items-center h-10 gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="text-dark-muted hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          size={24}
                          className={(hoverRating || rating) >= star ? "text-yellow-500 fill-yellow-500" : "text-dark-border"}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold text-dark-muted uppercase font-mono tracking-wider">Your Review</label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details of your experience with CodeVault Mobile..."
                  className="w-full bg-neutral-950 border border-dark-border rounded-xl p-4 text-xs text-dark-text focus:outline-none placeholder-dark-muted resize-none"
                />
              </div>

              <button
                type="submit"
                className="theme-bg-primary-15 hover:bg-primary border theme-border-primary-40 hover:text-dark-bg text-primary text-xs font-semibold py-2.5 px-6 rounded-xl uppercase tracking-wider transition-all duration-300 font-mono cursor-pointer"
              >
                Submit Review
              </button>
            </form>
          </div>

          {/* Active reviews list */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 border border-dashed border-dark-border rounded-2xl bg-dark-surface/10">
                <p className="text-xs text-dark-muted font-mono animate-pulse">Loading reviews from database...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-dark-border rounded-2xl bg-dark-surface/10">
                <p className="text-xs text-dark-muted font-sans">No reviews yet. Be the first to share your experience!</p>
              </div>
            ) : (
              reviews.map((r) => (
                <div 
                  key={r.id} 
                  className="bg-dark-surface/20 border border-dark-border/80 rounded-2xl p-5 space-y-3 animate-fadeIn"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-neutral-900 border border-dark-border flex items-center justify-center">
                        <User size={14} className="text-dark-muted" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-dark-text">{r.name}</div>
                        <div className="text-[9px] font-mono text-dark-muted">{r.date}</div>
                      </div>
                    </div>

                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={12} 
                          className={i < r.rating ? "text-yellow-500 fill-yellow-500" : "text-dark-border"} 
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-dark-muted leading-relaxed font-sans pl-0.5">
                    {r.comment}
                  </p>
                </div>
              ))
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
