export const getWhatsAppShareUrl = (title, url) => {
  const text = `Check out this code snippet on CodeVault: ${title || 'Code Snippet'} — ${url}`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
};

export const getTelegramShareUrl = (title, url) => {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title || 'CodeVault Snippet')}`;
};

export const getQrCodeUrl = (url, size = '220x220') => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${encodeURIComponent(url)}&color=C8AB7E&bgcolor=1E222A`;
};
