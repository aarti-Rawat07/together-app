import { useState, useEffect, useRef, useCallback } from 'react';
import { Track, PlaybackState } from '../types';
import { getStaticBaseUrl } from '../config';

interface UseSynchronizedAudioProps {
  sendMusicPlay: (trackId?: string, position?: number) => void;
  sendMusicPause: (position?: number) => void;
  sendMusicSeek: (position: number) => void;
  sendMusicChangeTrack: (track: Track) => void;
  sendMusicSyncRequest: () => void;
}

const resolveAudioUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const staticBase = getStaticBaseUrl();
  return staticBase ? `${staticBase}${url}` : url;
};

export const useSynchronizedAudio = ({
  sendMusicPlay,
  sendMusicPause,
  sendMusicSeek,
  sendMusicChangeTrack,
  sendMusicSyncRequest,
}: UseSynchronizedAudioProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(180);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
      setIsLoading(false);
    };

    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => setIsLoading(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      sendMusicSyncRequest();
    }, 8000);
    return () => clearInterval(interval);
  }, [isPlaying, sendMusicSyncRequest]);

  const handleRemoteStateUpdate = useCallback((playback: PlaybackState) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playback.track_id && (!currentTrack || currentTrack.id !== playback.track_id)) {
      const trackUrl = resolveAudioUrl(playback.track_url || '/static/music/midnight_serenade.mp3');
      const newTrack: Track = {
        id: playback.track_id,
        title: playback.track_title || 'Together Song',
        artist: playback.track_artist || 'Together Lo-Fi',
        url: trackUrl,
        cover_url: playback.track_cover_url || '',
        duration: playback.track_duration || 180,
      };
      setCurrentTrack(newTrack);
      audio.src = trackUrl;
      audio.load();
    }

    const now = Date.now() / 1000;
    let targetPos = playback.position;
    if (playback.is_playing && playback.server_timestamp > 0) {
      const elapsed = Math.max(0, now - playback.server_timestamp);
      targetPos = Math.min(playback.position + elapsed, playback.track_duration || duration);
    }

    const drift = Math.abs(audio.currentTime - targetPos);

    if (drift > 1.2) {
      audio.currentTime = targetPos;
      audio.playbackRate = 1.0;
    } else if (drift > 0.25) {
      if (audio.currentTime < targetPos) {
        audio.playbackRate = 1.05;
      } else {
        audio.playbackRate = 0.95;
      }
      setTimeout(() => {
        if (audioRef.current) audioRef.current.playbackRate = 1.0;
      }, 2000);
    } else {
      audio.playbackRate = 1.0;
    }

    if (playback.is_playing) {
      audio.play().catch(() => {});
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [currentTrack, duration]);

  const handleRemoteSeek = useCallback((position: number, serverTimestamp: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const now = Date.now() / 1000;
    const elapsed = serverTimestamp > 0 ? Math.max(0, now - serverTimestamp) : 0;
    audio.currentTime = position + elapsed;
    setCurrentTime(position + elapsed);
  }, []);

  const handleRemoteTrackChange = useCallback((payload: any) => {
    const audio = audioRef.current;
    if (!audio) return;

    const trackUrl = resolveAudioUrl(payload.url);
    const newTrack: Track = {
      id: payload.track_id,
      title: payload.title,
      artist: payload.artist,
      url: trackUrl,
      cover_url: payload.cover_url,
      duration: payload.duration,
    };
    setCurrentTrack(newTrack);
    audio.src = trackUrl;
    audio.currentTime = 0;

    if (payload.is_playing) {
      audio.play().catch(() => {});
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleRemoteSyncResponse = useCallback((payload: any) => {
    const audio = audioRef.current;
    if (!audio || !payload.is_playing) return;

    const drift = Math.abs(audio.currentTime - payload.position);
    if (drift > 1.2) {
      audio.currentTime = payload.position;
    } else if (drift > 0.25) {
      audio.playbackRate = audio.currentTime < payload.position ? 1.05 : 0.95;
      setTimeout(() => {
        if (audioRef.current) audioRef.current.playbackRate = 1.0;
      }, 2000);
    }
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      sendMusicPause(audio.currentTime);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
      sendMusicPlay(currentTrack?.id, audio.currentTime);
    }
  };

  const seek = (newTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    sendMusicSeek(newTime);
  };

  const changeTrack = (track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;

    const trackUrl = resolveAudioUrl(track.url);
    setCurrentTrack({ ...track, url: trackUrl });
    audio.src = trackUrl;
    audio.currentTime = 0;
    audio.play().catch(() => {});
    setIsPlaying(true);
    sendMusicChangeTrack({ ...track, url: trackUrl });
  };

  const changeVolume = (newVolume: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    setVolume(newVolume);
    audio.volume = isMuted ? 0 : newVolume;
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setIsMuted(!isMuted);
    audio.volume = !isMuted ? 0 : volume;
  };

  return {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoading,
    togglePlay,
    seek,
    changeTrack,
    changeVolume,
    toggleMute,
    handleRemoteStateUpdate,
    handleRemoteSeek,
    handleRemoteTrackChange,
    handleRemoteSyncResponse,
  };
};
