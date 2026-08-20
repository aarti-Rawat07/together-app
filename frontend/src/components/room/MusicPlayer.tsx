import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ListMusic,
  Disc3,
  Radio,
} from 'lucide-react';
import { Track } from '../../types';

interface MusicPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onTogglePlay: () => void;
  onSeek: (position: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onOpenQueue: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onOpenQueue,
  onNextTrack,
  onPrevTrack,
}) => {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPos, setSeekPos] = useState(0);

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? ((isSeeking ? seekPos : currentTime) / duration) * 100 : 0;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSeeking(true);
    setSeekPos(parseFloat(e.target.value));
  };

  const handleSeekEnd = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    setIsSeeking(false);
    onSeek(parseFloat((e.target as HTMLInputElement).value));
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-8 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
      {/* Subtle background glow from album cover */}
      {currentTrack?.cover_url && (
        <div
          className="absolute inset-0 opacity-15 blur-3xl scale-125 pointer-events-none transition-all duration-1000"
          style={{
            backgroundImage: `url(${currentTrack.cover_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Sync Status Badge */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium mb-6 animate-pulse">
        <Radio className="w-3.5 h-3.5 text-rose-400" />
        <span>Synchronized Duo Audio</span>
      </div>

      {/* Vinyl Disc & Album Art */}
      <div className="relative mb-6">
        <div
          className={`w-44 h-44 sm:w-52 sm:h-52 rounded-full p-2 bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 border-4 border-slate-700/50 shadow-[0_0_50px_rgba(0,0,0,0.6)] flex items-center justify-center relative overflow-hidden ${
            isPlaying ? 'animate-spin-slow' : ''
          }`}
        >
          {/* Vinyl grooves styling */}
          <div className="absolute inset-2 rounded-full border border-white/5" />
          <div className="absolute inset-6 rounded-full border border-white/5" />
          <div className="absolute inset-10 rounded-full border border-white/5" />
          <div className="absolute inset-14 rounded-full border border-white/5" />

          {/* Center Album Artwork */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-white/20 shadow-inner relative z-10">
            {currentTrack?.cover_url ? (
              <img
                src={currentTrack.cover_url}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center">
                <Disc3 className="w-10 h-10 text-white opacity-80" />
              </div>
            )}
          </div>
          {/* Spindle hole */}
          <div className="absolute w-4 h-4 rounded-full bg-slate-950 border-2 border-slate-700 z-20" />
        </div>
      </div>

      {/* Track Metadata */}
      <div className="text-center max-w-xs mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight truncate">
          {currentTrack?.title || 'Select a Track'}
        </h2>
        <p className="text-sm text-slate-400 mt-1 truncate">
          {currentTrack?.artist || 'Together Ambient Collection'}
        </p>
      </div>

      {/* Progress Bar & Seek */}
      <div className="w-full max-w-md flex flex-col gap-1.5 mb-6">
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={isSeeking ? seekPos : currentTime}
            onChange={handleSeekChange}
            onMouseUp={handleSeekEnd}
            onTouchEnd={handleSeekEnd}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 focus:outline-none"
            style={{
              background: `linear-gradient(to right, #f43f5e ${progressPercent}%, #1e293b ${progressPercent}%)`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 font-mono">
          <span>{formatTime(isSeeking ? seekPos : currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-between w-full max-w-md px-4">
        {/* Queue Button */}
        <button
          onClick={onOpenQueue}
          title="Open Library & Queue"
          className="p-2.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ListMusic className="w-5 h-5" />
        </button>

        {/* Core Media Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={onPrevTrack}
            title="Previous Track"
            className="p-3 rounded-full text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
            className="p-4 rounded-full bg-gradient-to-tr from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white translate-x-0.5" />
            )}
          </button>

          <button
            onClick={onNextTrack}
            title="Next Track"
            className="p-3 rounded-full text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Volume Popover / Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="p-2.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-rose-400" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-16 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 hidden sm:block"
          />
        </div>
      </div>
    </div>
  );
};
