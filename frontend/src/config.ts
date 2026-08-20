// Configuration helper for REST API, static files, and WebSocket URLs

const LIVE_BACKEND_URL = 'https://together-backend-p53w.onrender.com';

const rawApiUrl = ((import.meta as any).env?.VITE_API_URL || LIVE_BACKEND_URL).trim();

// Base REST API URL (e.g. "https://together-backend-p53w.onrender.com/api" or "/api")
export const getApiBaseUrl = (): string => {
  if (!rawApiUrl) return '/api';
  const clean = rawApiUrl.replace(/\/$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

// Base Static Files URL (e.g. "https://together-backend-p53w.onrender.com")
export const getStaticBaseUrl = (): string => {
  if (!rawApiUrl) return LIVE_BACKEND_URL;
  return rawApiUrl.replace(/^https?:\/\//, 'https://').replace(/\/api\/?$/, '').replace(/\/$/, '');
};

// WebSocket URL for Rooms
export const getWebSocketRoomUrl = (roomUuid: string, token: string): string => {
  const targetUrl = rawApiUrl || LIVE_BACKEND_URL;
  const wsProtocol = targetUrl.startsWith('https:') ? 'wss:' : 'ws:';
  const cleanHost = targetUrl.replace(/^https?:\/\//, '').replace(/\/api\/?$/, '').replace(/\/$/, '');
  return `${wsProtocol}//${cleanHost}/ws/rooms/${roomUuid}?token=${encodeURIComponent(token)}`;
};
