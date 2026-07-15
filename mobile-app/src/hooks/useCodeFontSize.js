import { useState, useEffect, useCallback } from 'react';

const SIZES = [10, 12, 14, 16, 18, 20, 24];
const DEFAULT_SIZE = 14;

let listeners = [];

const notifyListeners = (newSize) => {
  listeners.forEach(listener => listener(newSize));
};

export const useCodeFontSize = () => {
  const [fontSize, setFontSizeState] = useState(() => {
    try {
      const stored = localStorage.getItem('codevault_code_font_size');
      const parsed = Number(stored);
      return SIZES.includes(parsed) ? parsed : DEFAULT_SIZE;
    } catch {
      return DEFAULT_SIZE;
    }
  });

  useEffect(() => {
    const listener = (newSize) => {
      setFontSizeState(newSize);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const updateSize = useCallback((newSize) => {
    if (SIZES.includes(newSize)) {
      setFontSizeState(newSize);
      try {
        localStorage.setItem('codevault_code_font_size', newSize);
      } catch {}
      notifyListeners(newSize);
      window.dispatchEvent(new CustomEvent('codevault_fontsize_changed', { detail: newSize }));
    }
  }, []);

  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail && SIZES.includes(e.detail) && e.detail !== fontSize) {
        setFontSizeState(e.detail);
      }
    };
    const handleStorage = (e) => {
      if (e.key === 'codevault_code_font_size' && e.newValue) {
        const parsed = Number(e.newValue);
        if (SIZES.includes(parsed)) {
          setFontSizeState(parsed);
          notifyListeners(parsed);
        }
      }
    };
    window.addEventListener('codevault_fontsize_changed', handleSync);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('codevault_fontsize_changed', handleSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, [fontSize]);

  const increaseFontSize = () => {
    const idx = SIZES.indexOf(fontSize);
    if (idx < SIZES.length - 1) {
      updateSize(SIZES[idx + 1]);
    }
  };

  const decreaseFontSize = () => {
    const idx = SIZES.indexOf(fontSize);
    if (idx > 0) {
      updateSize(SIZES[idx - 1]);
    }
  };

  const resetFontSize = () => updateSize(DEFAULT_SIZE);

  return {
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    canIncrease: fontSize < SIZES[SIZES.length - 1],
    canDecrease: fontSize > SIZES[0]
  };
};