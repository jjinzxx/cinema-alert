// client/src/config.js
// Automatically routes API calls to Render when running on GitHub Pages / custom domain,
// and routes to local relative path when running on localhost or onrender.com itself.

const isDirectBackend =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname.endsWith('.onrender.com'));

export const API_BASE = isDirectBackend
  ? ''
  : 'https://cinema-alert.onrender.com';
