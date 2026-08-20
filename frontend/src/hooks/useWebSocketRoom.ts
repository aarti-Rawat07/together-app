import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Message, FloatingReaction, PlaybackState, PresenceStatus } from '../types';
import { getWebSocketRoomUrl } from '../config';

interface UseWebSocketRoomProps {
  roomUuid: string;
  onWebRTCMessage?: (type: string, payload: any, senderId: number) => void;
  onMusicStateUpdate?: (playback: PlaybackState) => void;
  onMusicSeekUpdate?: (position: number, serverTimestamp: number) => void;
  onMusicChangeTrackUpdate?: (payload: any) => void;
  onMusicSyncResponse?: (payload: any) => void;
}

export const useWebSocketRoom = ({
  roomUuid,
  onWebRTCMessage,
  onMusicStateUpdate,
  onMusicSeekUpdate,
  onMusicChangeTrackUpdate,
  onMusicSyncResponse,
}: UseWebSocketRoomProps) => {
  const { token, user } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [partnerPresence, setPartnerPresence] = useState<PresenceStatus>('OFFLINE');
  const [partnerTyping, setPartnerTyping] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [roomError, setRoomError] = useState<string | null>(null);

  const onWebRTCMessageRef = useRef(onWebRTCMessage);
  onWebRTCMessageRef.current = onWebRTCMessage;

  const onMusicStateUpdateRef = useRef(onMusicStateUpdate);
  onMusicStateUpdateRef.current = onMusicStateUpdate;

  const onMusicSeekUpdateRef = useRef(onMusicSeekUpdate);
  onMusicSeekUpdateRef.current = onMusicSeekUpdate;

  const onMusicChangeTrackUpdateRef = useRef(onMusicChangeTrackUpdate);
  onMusicChangeTrackUpdateRef.current = onMusicChangeTrackUpdate;

  const onMusicSyncResponseRef = useRef(onMusicSyncResponse);
  onMusicSyncResponseRef.current = onMusicSyncResponse;

  const connect = useCallback(() => {
    if (!token || !roomUuid) return;

    const wsUrl = getWebSocketRoomUrl(roomUuid, token);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setRoomError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, payload, sender_id } = data;

        switch (type) {
          case 'ROOM_INIT':
            if (payload?.playback && onMusicStateUpdateRef.current) {
              onMusicStateUpdateRef.current(payload.playback);
            }
            if (payload?.active_participants && user) {
              const partnerIn = payload.active_participants.some((uid: number) => uid !== user.id);
              setPartnerPresence(partnerIn ? 'IN_ROOM' : 'OFFLINE');
            }
            break;

          case 'PRESENCE':
            if (payload?.user_id !== user?.id) {
              setPartnerPresence(payload?.in_room ? 'IN_ROOM' : 'OFFLINE');
            }
            break;

          case 'CHAT_MESSAGE':
            if (payload) {
              setMessages((prev) => [...prev, payload]);
            }
            break;

          case 'TYPING':
            if (payload?.user_id !== user?.id) {
              setPartnerTyping(!!payload?.is_typing);
            }
            break;

          case 'REACTION':
            if (payload?.emoji) {
              const newReaction: FloatingReaction = {
                id: `${Date.now()}-${Math.random()}`,
                emoji: payload.emoji,
                sender_name: payload.sender_name || 'Partner',
                x: 15 + Math.random() * 70,
              };
              setReactions((prev) => [...prev, newReaction]);
              setTimeout(() => {
                setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
              }, 3200);
            }
            break;

          case 'MUSIC_STATE':
            if (payload && onMusicStateUpdateRef.current) {
              onMusicStateUpdateRef.current(payload);
            }
            break;

          case 'MUSIC_SEEK':
            if (payload && onMusicSeekUpdateRef.current) {
              onMusicSeekUpdateRef.current(payload.position, payload.server_timestamp);
            }
            break;

          case 'MUSIC_CHANGE_TRACK':
            if (payload && onMusicChangeTrackUpdateRef.current) {
              onMusicChangeTrackUpdateRef.current(payload);
            }
            break;

          case 'MUSIC_SYNC_RESPONSE':
            if (payload && onMusicSyncResponseRef.current) {
              onMusicSyncResponseRef.current(payload);
            }
            break;

          case 'WEBRTC_OFFER':
          case 'WEBRTC_ANSWER':
          case 'WEBRTC_ICE_CANDIDATE':
          case 'WEBRTC_VOICE_STATUS':
            if (onWebRTCMessageRef.current) {
              onWebRTCMessageRef.current(type, payload, sender_id);
            }
            break;

          case 'ERROR':
            if (payload?.message) {
              setRoomError(payload.message);
            }
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    ws.onclose = (e) => {
      setIsConnected(false);
      if (e.code === 4003 || e.code === 4008) {
        setRoomError(e.reason || 'Room access denied');
      } else if (e.code !== 1000) {
        setPartnerPresence('RECONNECTING');
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, 3000);
      }
    };
  }, [token, roomUuid, user]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close(1000, 'User left page');
      }
    };
  }, [connect]);

  const sendEvent = useCallback((type: string, payload: any = {}) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const sendChatMessage = useCallback((content: string) => {
    sendEvent('CHAT_MESSAGE', { content });
  }, [sendEvent]);

  const sendReaction = useCallback((emoji: string) => {
    sendEvent('REACTION', { emoji });
  }, [sendEvent]);

  const sendTyping = useCallback((isTyping: boolean) => {
    sendEvent('TYPING', { is_typing: isTyping });
  }, [sendEvent]);

  const sendMusicPlay = useCallback((trackId?: string, position: number = 0) => {
    sendEvent('MUSIC_PLAY', { track_id: trackId, position });
  }, [sendEvent]);

  const sendMusicPause = useCallback((position: number = 0) => {
    sendEvent('MUSIC_PAUSE', { position });
  }, [sendEvent]);

  const sendMusicSeek = useCallback((position: number) => {
    sendEvent('MUSIC_SEEK', { position });
  }, [sendEvent]);

  const sendMusicChangeTrack = useCallback((track: any) => {
    sendEvent('MUSIC_CHANGE_TRACK', {
      track_id: track.id,
      title: track.title,
      artist: track.artist,
      url: track.url,
      cover_url: track.cover_url,
      duration: track.duration,
      autoplay: true,
    });
  }, [sendEvent]);

  const sendMusicSyncRequest = useCallback(() => {
    sendEvent('MUSIC_SYNC_REQUEST');
  }, [sendEvent]);

  const sendWebRTC = useCallback((type: string, payload: any) => {
    sendEvent(type, payload);
  }, [sendEvent]);

  return {
    isConnected,
    partnerPresence,
    partnerTyping,
    messages,
    setMessages,
    reactions,
    roomError,
    sendChatMessage,
    sendReaction,
    sendTyping,
    sendMusicPlay,
    sendMusicPause,
    sendMusicSeek,
    sendMusicChangeTrack,
    sendMusicSyncRequest,
    sendWebRTC,
  };
};
