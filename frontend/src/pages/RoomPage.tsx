import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, LogOut, Share2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { roomService } from '../services/rooms';
import { musicService } from '../services/music';
import { Room, Track } from '../types';

import { useWebSocketRoom } from '../hooks/useWebSocketRoom';
import { useSynchronizedAudio } from '../hooks/useSynchronizedAudio';
import { useWebRTC } from '../hooks/useWebRTC';

import { PresenceIndicator } from '../components/room/PresenceIndicator';
import { MusicPlayer } from '../components/room/MusicPlayer';
import { VoiceChatPanel } from '../components/room/VoiceChatPanel';
import { RoomChat } from '../components/room/RoomChat';
import { ReactionsOverlay } from '../components/room/ReactionsOverlay';
import { TrackQueueModal } from '../components/room/TrackQueueModal';
import { FloatingHearts } from '../components/FloatingHearts';

export const RoomPage: React.FC = () => {
  const { roomUuid } = useParams<{ roomUuid: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [copyNotification, setCopyNotification] = useState<boolean>(false);

  // Load catalog for next/prev track handling
  useEffect(() => {
    musicService.getTracks().then(setAllTracks).catch(console.error);
  }, []);

  // 1. Initial Room Verification & Load
  useEffect(() => {
    if (!roomUuid) return;

    const fetchRoom = async () => {
      setIsLoading(true);
      setAccessError(null);
      try {
        const data = await roomService.getRoom(roomUuid);
        setRoom(data);

        // Load existing messages
        const oldMessages = await roomService.getMessages(roomUuid);
        setMessages(oldMessages);
      } catch (err: any) {
        if (err.response?.status === 403) {
          setAccessError('Room is full or private. Only the two authorized participants can join this Together session.');
        } else {
          setAccessError(err.response?.data?.detail || 'Could not load Together room.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoom();
  }, [roomUuid]);

  // 2. WebSocket Hook for Real-Time Sync
  const {
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
  } = useWebSocketRoom({
    roomUuid: roomUuid || '',
    onWebRTCMessage: (type, payload) => handleSignalingMessage(type, payload),
    onMusicStateUpdate: (state) => handleRemoteStateUpdate(state),
    onMusicSeekUpdate: (pos, ts) => handleRemoteSeek(pos, ts),
    onMusicChangeTrackUpdate: (p) => handleRemoteTrackChange(p),
    onMusicSyncResponse: (p) => handleRemoteSyncResponse(p),
  });

  // 3. Synchronized HTML5 Audio Hook
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlay,
    seek,
    changeTrack,
    changeVolume,
    toggleMute: toggleAudioMute,
    handleRemoteStateUpdate,
    handleRemoteSeek,
    handleRemoteTrackChange,
    handleRemoteSyncResponse,
  } = useSynchronizedAudio({
    sendMusicPlay,
    sendMusicPause,
    sendMusicSeek,
    sendMusicChangeTrack,
    sendMusicSyncRequest,
  });

  // 4. WebRTC Voice Chat Hook
  const {
    voiceState,
    localAudioLevel,
    remoteAudioLevel,
    startVoiceChat,
    toggleMute: toggleMicMute,
    endVoiceChat,
    handleSignalingMessage,
  } = useWebRTC({
    isPartnerInRoom: partnerPresence === 'IN_ROOM',
    sendWebRTC,
  });

  // Track switching helpers
  const handleNextTrack = () => {
    if (!allTracks.length) return;
    const currentIndex = allTracks.findIndex((t) => t.id === currentTrack?.id);
    const nextIndex = (currentIndex + 1) % allTracks.length;
    changeTrack(allTracks[nextIndex]);
  };

  const handlePrevTrack = () => {
    if (!allTracks.length) return;
    const currentIndex = allTracks.findIndex((t) => t.id === currentTrack?.id);
    const prevIndex = (currentIndex - 1 + allTracks.length) % allTracks.length;
    changeTrack(allTracks[prevIndex]);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyNotification(true);
    setTimeout(() => setCopyNotification(false), 3000);
  };

  const handleExitRoom = async () => {
    endVoiceChat();
    if (roomUuid) {
      try {
        await roomService.leaveRoom(roomUuid);
      } catch {}
    }
    navigate('/dashboard');
  };

  const partnerUser = room ? (room.creator_id === user?.id ? room.partner : room.creator) : null;

  // Access Denied / 3rd Participant Blocked Screen
  if (accessError || roomError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#090d16] relative overflow-hidden">
        <FloatingHearts />
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-rose-500/30 backdrop-blur-2xl max-w-md w-full text-center shadow-2xl relative z-10">
          <div className="p-4 rounded-full bg-rose-500/10 text-rose-500 mx-auto w-fit mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            {accessError || roomError || 'This private room belongs to only two connected participants.'}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold text-sm shadow-lg shadow-rose-500/25"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
          <p className="text-sm text-slate-400 font-medium tracking-wide">
            Entering your private Together room...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Floating Ambient Emojis & Hearts */}
      <FloatingHearts />
      <ReactionsOverlay reactions={reactions} />

      {/* Top Room Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-4 sm:px-8 py-3 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 shadow-md shadow-rose-500/25">
            <Heart className="w-4 h-4 text-white fill-white animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              Together Room
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
                Locked: 2 Max
              </span>
            </span>
          </div>
        </div>

        {/* Center: Live Presence Badge */}
        <div className="hidden md:block">
          <PresenceIndicator
            currentUser={user}
            partnerUser={partnerUser}
            partnerPresence={partnerPresence}
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleCopyLink}
            title="Copy Invite Link"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white transition-all font-medium"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {copyNotification ? 'Copied Link!' : 'Invite'}
            </span>
          </button>

          <button
            onClick={handleExitRoom}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 hover:text-white text-rose-300 text-xs font-semibold transition-all border border-rose-500/20 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Room</span>
          </button>
        </div>
      </header>

      {/* Mobile Presence Banner */}
      <div className="md:hidden p-3 flex justify-center border-b border-white/5 bg-slate-950/40">
        <PresenceIndicator
          currentUser={user}
          partnerUser={partnerUser}
          partnerPresence={partnerPresence}
        />
      </div>

      {/* Main Room Arena */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Synchronized Music Player (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <MusicPlayer
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            isMuted={isMuted}
            onTogglePlay={togglePlay}
            onSeek={seek}
            onVolumeChange={changeVolume}
            onToggleMute={toggleAudioMute}
            onOpenQueue={() => setIsQueueOpen(true)}
            onNextTrack={handleNextTrack}
            onPrevTrack={handlePrevTrack}
          />
        </div>

        {/* Right Side: Voice Call + Live Real-Time Chat (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 h-full">
          {/* Voice Chat Component */}
          <VoiceChatPanel
            voiceState={voiceState}
            localAudioLevel={localAudioLevel}
            remoteAudioLevel={remoteAudioLevel}
            currentUser={user}
            partnerUser={partnerUser}
            isPartnerInRoom={partnerPresence === 'IN_ROOM'}
            onStartVoice={startVoiceChat}
            onToggleMute={toggleMicMute}
            onEndVoice={endVoiceChat}
          />

          {/* Real-Time Room Chat Component */}
          <div className="flex-1 min-h-[360px]">
            <RoomChat
              messages={messages}
              currentUser={user}
              partnerUser={partnerUser}
              partnerTyping={partnerTyping}
              onSendMessage={sendChatMessage}
              onSendReaction={sendReaction}
              onTyping={sendTyping}
            />
          </div>
        </div>
      </main>

      {/* Track Queue & Music Catalog Modal */}
      <TrackQueueModal
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        currentTrackId={currentTrack?.id}
        onSelectTrack={(t) => changeTrack(t)}
      />
    </div>
  );
};
