import { useState, useEffect } from 'react';
import { Palette, CheckCircle2, Upload, User, Check, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const themes = [
  { id: 'original', name: 'Original Gold', color: '#c8ab7e', bg: '#121212' },
  { id: 'ocean', name: 'Ocean Blue', color: '#3b82f6', bg: '#0f172a' },
  { id: 'emerald', name: 'Emerald Hack', color: '#10b981', bg: '#022c22' },
  { id: 'pearl', name: 'Pearl Light', color: '#8b5cf6', bg: '#f8fafc', isLight: true }
];

export default function Settings() {
  const [activeTheme, setActiveTheme] = useState('original');

  const { user } = useAuth();
  const [profile, setProfile] = useState({ username: '', display_name: '', avatar_url: '' });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          if (error && error.code !== 'PGRST116') throw error;
          if (data) setProfile(data);
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const updateProfile = async () => {
    try {
      setMessage({ text: 'Saving...', type: 'info' });
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
      setMessage({ text: 'Profile updated!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    }
  };

  const handleAvatarUpload = async (e) => {
    try {
      setUploading(true);
      setMessage({ text: 'Uploading avatar...', type: 'info' });
      
      const file = e.target.files[0];
      if (!file) return;
      
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Image size must be less than 2MB');
      }
      
      const fileExt = file.name.split('.').pop();
      if (!['jpg', 'jpeg', 'png', 'webp'].includes(fileExt.toLowerCase())) {
        throw new Error('Only JPG, PNG, and WEBP images are allowed');
      }

      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        });

      setMessage({ text: 'Avatar uploaded successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      
      window.dispatchEvent(new Event('profile-updated'));
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  };


  useEffect(() => {
    const saved = localStorage.getItem('codevault_theme') || 'original';
    setActiveTheme(saved);
  }, []);

  const handleThemeChange = (themeId) => {
    setActiveTheme(themeId);
    localStorage.setItem('codevault_theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="bg-dark-surface border border-dark-border p-6 rounded-2xl flex items-center justify-between shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold font-serif text-white tracking-wide flex items-center gap-3">
            <Palette className="text-primary" size={32} />
            Settings
          </h1>
          <p className="text-dark-muted font-sans mt-2">Customize your CodeVault experience.</p>
        </div>
      </header>


      <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6 border-b border-dark-border pb-4">User Profile</h2>
        
        {message.text && (
          <div className={`p-3 rounded-lg mb-6 text-sm flex items-center gap-2 ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
             {message.type === 'error' ? <AlertTriangle size={16} /> : <Check size={16} />}
             {message.text}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-dark-bg border-2 border-dark-border overflow-hidden flex items-center justify-center shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-dark-muted font-bold font-mono">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            
            <label className="cursor-pointer bg-dark-bg border border-dark-border hover:border-primary/50 text-dark-text hover:text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all">
              <Upload size={14} />
              {uploading ? 'Uploading...' : 'Change Avatar'}
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/webp" 
                className="hidden" 
                onChange={handleAvatarUpload} 
                disabled={uploading}
              />
            </label>
            <p className="text-[10px] text-dark-muted font-mono">Max 2MB (JPG, PNG, WEBP)</p>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-xs font-bold text-dark-muted mb-1.5 uppercase tracking-wider font-mono">Display Name</label>
              <input 
                type="text" 
                value={profile.display_name || ''} 
                onChange={e => setProfile({...profile, display_name: e.target.value})}
                placeholder="How should we call you?"
                className="w-full bg-dark-bg border border-dark-border focus:border-primary/50 text-white rounded-lg px-4 py-2.5 focus:outline-none transition-all font-sans"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-dark-muted mb-1.5 uppercase tracking-wider font-mono">Username</label>
              <input 
                type="text" 
                value={profile.username || ''} 
                onChange={e => setProfile({...profile, username: e.target.value})}
                placeholder="@username"
                className="w-full bg-dark-bg border border-dark-border focus:border-primary/50 text-white rounded-lg px-4 py-2.5 focus:outline-none transition-all font-sans"
              />
            </div>

            <div className="pt-2">
              <button 
                onClick={updateProfile}
                className="bg-primary hover:bg-primary/90 text-dark-bg px-6 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 cursor-pointer"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      </div>


      <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6 border-b border-dark-border pb-4">Theme Engine</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {themes.map(theme => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
                activeTheme === theme.id 
                  ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--color-primary),0.2)]' 
                  : 'border-dark-border hover:border-primary/50 hover:bg-dark-bg'
              }`}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-10 h-10 rounded-full border border-dark-border shadow-inner flex overflow-hidden"
                >
                  <div className="w-1/2 h-full" style={{ backgroundColor: theme.bg }}></div>
                  <div className="w-1/2 h-full" style={{ backgroundColor: theme.color }}></div>
                </div>
                <div className="text-left">
                  <p className={`font-bold ${activeTheme === theme.id ? 'text-primary' : 'text-white'}`}>
                    {theme.name}
                  </p>
                  <p className="text-xs text-dark-muted mt-0.5">
                    {theme.isLight ? 'Light Mode' : 'Dark Mode'}
                  </p>
                </div>
              </div>
              {activeTheme === theme.id && <CheckCircle2 className="text-primary" size={20} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
