import { useState, useEffect } from 'react';

const SIZES = [10, 12, 14, 16, 18, 20, 24];
const DEFAULT_SIZE = 14;

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
    try {
      localStorage.setItem('codevault_code_font_size', fontSize);
    } catch {}
  }, [fontSize]);

  const increaseFontSize = () => {
    setFontSizeState(prev => {
      const idx = SIZES.indexOf(prev);
      return idx < SIZES.length - 1 ? SIZES[idx + 1] : prev;
    });
  };

  const decreaseFontSize = () => {
    setFontSizeState(prev => {
      const idx = SIZES.indexOf(prev);
      return idx > 0 ? SIZES[idx - 1] : prev;
    });
  };

  const resetFontSize = () => setFontSizeState(DEFAULT_SIZE);

  return {
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    canIncrease: fontSize < SIZES[SIZES.length - 1],
    canDecrease: fontSize > SIZES[0]
  };
};
