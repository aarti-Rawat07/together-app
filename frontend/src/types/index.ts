export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar_url?: string;
  status: string;
  created_at: string;
}

export interface UserSearchResult extends User {
  connection_status?: 'PENDING_SENT' | 'PENDING_RECEIVED' | 'ACCEPTED' | 'BLOCKED' | null;
  contact_id?: number | null;
}

export interface Contact {
  id: number;
  requester_id: number;
  addressee_id: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
  created_at: string;
  updated_at: string;
  requester: User;
  addressee: User;
  partner?: User;
}

export interface ContactListResponse {
  accepted: Contact[];
  pending_sent: Contact[];
  pending_received: Contact[];
}

export interface PlaybackState {
  id: number;
  room_id: number;
  track_id?: string;
  track_title?: string;
  track_artist?: string;
  track_url?: string;
  track_cover_url?: string;
  track_duration: number;
  is_playing: boolean;
  position: number;
  server_timestamp: number;
  updated_by_user_id?: number;
}

export interface Room {
  id: number;
  uuid_token: string;
  creator_id: number;
  partner_id: number;
  is_active: boolean;
  created_at: string;
  creator: User;
  partner: User;
  playback_state?: PlaybackState;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  url: string;
  cover_url: string;
  category?: string;
}

export interface TrackCategory {
  id: string;
  name: string;
  tracks: Track[];
}

export interface Message {
  id: number;
  room_id: number;
  sender_id: number;
  sender_name?: string;
  sender_username?: string;
  sender_avatar?: string;
  content: string;
  created_at: string;
  sender?: User;
}

export interface Notification {
  id: number;
  user_id: number;
  sender_id?: number;
  type: 'CONTACT_REQUEST' | 'CONTACT_ACCEPTED' | 'ROOM_INVITE' | 'SYSTEM';
  title: string;
  message: string;
  data?: string;
  is_read: boolean;
  created_at: string;
  sender?: User;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  sender_name: string;
  x: number; // Random horizontal starting percent
}

export type PresenceStatus = 'ONLINE' | 'IN_ROOM' | 'CONNECTING' | 'RECONNECTING' | 'OFFLINE';

export interface VoiceState {
  isMuted: boolean;
  isSpeaking: boolean;
  isConnected: boolean;
  peerMuted: boolean;
  peerSpeaking: boolean;
  status: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed';
}
