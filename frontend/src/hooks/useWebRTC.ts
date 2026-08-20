import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceState } from '../types';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

interface UseWebRTCProps {
  isPartnerInRoom: boolean;
  sendWebRTC: (type: string, payload: any) => void;
}

export const useWebRTC = ({ isPartnerInRoom, sendWebRTC }: UseWebRTCProps) => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [voiceState, setVoiceState] = useState<VoiceState>({
    isMuted: true,
    isSpeaking: false,
    isConnected: false,
    peerMuted: true,
    peerSpeaking: false,
    status: 'idle',
  });

  const [localAudioLevel, setLocalAudioLevel] = useState<number>(0);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState<number>(0);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

  // Setup Remote HTML5 Audio tag
  useEffect(() => {
    const audio = new Audio();
    audio.autoplay = true;
    remoteAudioRef.current = audio;
    return () => {
      audio.pause();
      audio.srcObject = null;
    };
  }, []);

  // Voice activity loop (AnalyserNode)
  useEffect(() => {
    const checkAudioLevels = () => {
      // Local
      if (localAnalyserRef.current && !voiceState.isMuted) {
        const data = new Uint8Array(localAnalyserRef.current.frequencyBinCount);
        localAnalyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        const norm = Math.min(100, Math.round((avg / 255) * 200));
        setLocalAudioLevel(norm);
        setVoiceState((prev) => ({ ...prev, isSpeaking: norm > 15 }));
      } else {
        setLocalAudioLevel(0);
        setVoiceState((prev) => ({ ...prev, isSpeaking: false }));
      }

      // Remote
      if (remoteAnalyserRef.current) {
        const data = new Uint8Array(remoteAnalyserRef.current.frequencyBinCount);
        remoteAnalyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        const norm = Math.min(100, Math.round((avg / 255) * 200));
        setRemoteAudioLevel(norm);
        setVoiceState((prev) => ({ ...prev, peerSpeaking: norm > 15 }));
      }

      animationFrameRef.current = requestAnimationFrame(checkAudioLevels);
    };

    animationFrameRef.current = requestAnimationFrame(checkAudioLevels);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [voiceState.isMuted]);

  // Initialize WebRTC Peer Connection
  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // ICE Candidate
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendWebRTC('WEBRTC_ICE_CANDIDATE', { candidate: event.candidate });
      }
    };

    // Remote Track
    pc.ontrack = (event) => {
      if (remoteAudioRef.current && event.streams[0]) {
        remoteAudioRef.current.srcObject = event.streams[0];
        remoteAudioRef.current.play().catch(() => {});

        // Setup remote audio analyzer
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioCtx.createMediaStreamSource(event.streams[0]);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          remoteAnalyserRef.current = analyser;
        } catch {
          // AudioContext setup fallback
        }
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected') {
        setVoiceState((prev) => ({ ...prev, isConnected: true, status: 'connected' }));
      } else if (state === 'connecting') {
        setVoiceState((prev) => ({ ...prev, status: 'connecting' }));
      } else if (state === 'disconnected' || state === 'failed') {
        setVoiceState((prev) => ({ ...prev, isConnected: false, status: 'reconnecting' }));
      }
    };

    return pc;
  }, [sendWebRTC]);

  // Request Microphone Access
  const startVoiceChat = async () => {
    try {
      setMicPermissionError(null);
      setVoiceState((prev) => ({ ...prev, status: 'connecting' }));

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      localStreamRef.current = stream;

      // Local analyzer setup
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      localAnalyserRef.current = analyser;

      // Start unmuted
      stream.getAudioTracks().forEach((t) => (t.enabled = true));
      setVoiceState((prev) => ({ ...prev, isMuted: false }));

      const pc = createPeerConnection();

      // Create Offer if partner is in room
      if (isPartnerInRoom) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendWebRTC('WEBRTC_OFFER', { offer });
      }
    } catch (err: any) {
      console.error('Microphone permission denied', err);
      setMicPermissionError('Microphone permission denied. Please allow mic access to talk.');
      setVoiceState((prev) => ({ ...prev, status: 'failed' }));
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    if (!localStreamRef.current) {
      startVoiceChat();
      return;
    }

    const nextMuted = !voiceState.isMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });

    setVoiceState((prev) => ({ ...prev, isMuted: nextMuted }));
    sendWebRTC('WEBRTC_VOICE_STATUS', { isMuted: nextMuted });
  };

  // Handle incoming signaling messages
  const handleSignalingMessage = useCallback(async (type: string, payload: any) => {
    let pc = peerConnectionRef.current;
    if (!pc) {
      pc = createPeerConnection();
    }

    try {
      if (type === 'WEBRTC_OFFER' && payload?.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendWebRTC('WEBRTC_ANSWER', { answer });
      } else if (type === 'WEBRTC_ANSWER' && payload?.answer) {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
      } else if (type === 'WEBRTC_ICE_CANDIDATE' && payload?.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } else if (type === 'WEBRTC_VOICE_STATUS') {
        setVoiceState((prev) => ({ ...prev, peerMuted: !!payload?.isMuted }));
      }
    } catch (err) {
      console.error('WebRTC signaling error:', err);
    }
  }, [createPeerConnection, sendWebRTC]);

  // Clean up
  const endVoiceChat = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setVoiceState({
      isMuted: true,
      isSpeaking: false,
      isConnected: false,
      peerMuted: true,
      peerSpeaking: false,
      status: 'idle',
    });
  };

  return {
    voiceState,
    localAudioLevel,
    remoteAudioLevel,
    micPermissionError,
    startVoiceChat,
    toggleMute,
    endVoiceChat,
    handleSignalingMessage,
  };
};
