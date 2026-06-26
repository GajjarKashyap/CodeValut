import { useState, useEffect } from 'react';
import { Palette, CheckCircle2 } from 'lucide-react';

const themes = [
  { id: 'original', name: 'Original Gold', color: '#c8ab7e', bg: '#121212' },
  { id: 'ocean', name: 'Ocean Blue', color: '#3b82f6', bg: '#0f172a' },
  { id: 'emerald', name: 'Emerald Hack', color: '#10b981', bg: '#022c22' },
  { id: 'pearl', name: 'Pearl Light', color: '#8b5cf6', bg: '#f8fafc', isLight: true }
];

export default function Settings() {
  const [activeTheme, setActiveTheme] = useState('original');

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
