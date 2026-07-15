import { LANGUAGE_EXTENSIONS } from '../constants/languageExtensions';

export const downloadCodeFile = (code, title, language) => {
  if (!code || !code.trim()) return;
  const ext = LANGUAGE_EXTENSIONS[language?.toLowerCase()] || '.txt';
  const cleanTitle = (title || 'code_snippet')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_ -]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'code_snippet';
  
  const filename = cleanTitle.endsWith(ext) ? cleanTitle : `${cleanTitle}${ext}`;
  const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
