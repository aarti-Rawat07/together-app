// Configuration helper for REST API, static files, and WebSocket URLs

const LIVE_BACKEND_URL = 'https://together-backend-p53w.onrender.com';

const getHostUrl = (): string => {
  const envUrl = ((import.meta as any).env?.VITE_API_URL || '').trim();
  if (envUrl) return envUrl;
  
  // If hosted on production Vercel/Netlify, default to live Render backend
  if (typeof window !== 'undefined' && (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('netlify.app'))) {
    return LIVE_BACKEND_URL;
  }
  
  // Local development
  return '';
};

// Base REST API URL
export const getApiBaseUrl = (): string => {
  const host = getHostUrl();
  if (!host) return '/api';
  const clean = host.replace(/\/$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

// Base Static Files URL
export const getStaticBaseUrl = (): string => {
  const host = getHostUrl() || LIVE_BACKEND_URL;
  return host.replace(/^https?:\/\//, 'https://').replace(/\/api\/?$/, '').replace(/\/$/, '');
};

// WebSocket URL for Rooms
export const getWebSocketRoomUrl = (roomUuid: string, token: string): string => {
  const host = getHostUrl() || LIVE_BACKEND_URL;
  
  if (host) {
    const wsProtocol = host.startsWith('https:') ? 'wss:' : 'ws:';
    const cleanHost = host.replace(/^https?:\/\//, '').replace(/\/api\/?$/, '').replace(/\/$/, '');
    return `${wsProtocol}//${cleanHost}/ws/rooms/${roomUuid}?token=${encodeURIComponent(token)}`;
  }

  // Local development fallback
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/rooms/${roomUuid}?token=${encodeURIComponent(token)}`;
};
