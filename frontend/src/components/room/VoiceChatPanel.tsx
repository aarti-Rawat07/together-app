import React from 'react';
import { Mic, MicOff, PhoneCall, PhoneOff, Radio } from 'lucide-react';
import { VoiceState, User } from '../../types';
import { VoiceVisualizer } from '../VoiceVisualizer';
import { Avatar } from '../common/Avatar';

interface VoiceChatPanelProps {
  voiceState: VoiceState;
  localAudioLevel: number;
  remoteAudioLevel: number;
  currentUser: User | null;
  partnerUser: User | null;
  isPartnerInRoom: boolean;
  onStartVoice: () => void;
  onToggleMute: () => void;
  onEndVoice: () => void;
}

export const VoiceChatPanel: React.FC<VoiceChatPanelProps> = ({
  voiceState,
  localAudioLevel,
  remoteAudioLevel,
  currentUser,
  partnerUser,
  isPartnerInRoom,
  onStartVoice,
  onToggleMute,
  onEndVoice,
}) => {
  const isCallActive = voiceState.status === 'connected' || voiceState.status === 'connecting';

  return (
    <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Voice Call</h3>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              voiceState.status === 'connected'
                ? 'bg-emerald-500/20 text-emerald-400'
                : voiceState.status === 'connecting'
                ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {voiceState.status === 'connected'
              ? 'P2P Connected'
              : voiceState.status === 'connecting'
              ? 'Connecting...'
              : 'Voice Idle'}
          </span>
        </div>

        {/* Member cards inside voice call */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Current User */}
          <div className="p-3 rounded-2xl bg-slate-950/40 border border-white/5 flex flex-col items-center text-center">
            <Avatar
              name={currentUser?.name || 'You'}
              avatarUrl={currentUser?.avatar_url}
              size="md"
              isSpeaking={voiceState.isSpeaking}
              status="ONLINE"
            />
            <span className="text-xs font-semibold text-white mt-2 truncate max-w-full">
              You
            </span>
            <div className="mt-1 flex items-center justify-center">
              <VoiceVisualizer
                level={localAudioLevel}
                isSpeaking={voiceState.isSpeaking}
                isMuted={voiceState.isMuted}
                color="from-rose-500 to-pink-500"
              />
            </div>
          </div>

          {/* Partner */}
          <div className="p-3 rounded-2xl bg-slate-950/40 border border-white/5 flex flex-col items-center text-center">
            <Avatar
              name={partnerUser?.name || 'Partner'}
              avatarUrl={partnerUser?.avatar_url}
              size="md"
              isSpeaking={voiceState.peerSpeaking}
              status={isPartnerInRoom ? 'ONLINE' : 'OFFLINE'}
            />
            <span className="text-xs font-semibold text-white mt-2 truncate max-w-full">
              {partnerUser?.name || 'Partner'}
            </span>
            <div className="mt-1 flex items-center justify-center">
              <VoiceVisualizer
                level={remoteAudioLevel}
                isSpeaking={voiceState.peerSpeaking}
                isMuted={voiceState.peerMuted}
                color="from-indigo-500 to-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Voice Action Buttons */}
      <div className="flex items-center justify-center gap-3 pt-2">
        {!isCallActive ? (
          <button
            onClick={onStartVoice}
            disabled={!isPartnerInRoom}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-medium text-sm transition-all ${
              isPartnerInRoom
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 active:scale-98'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span>{isPartnerInRoom ? 'Start Voice Chat' : 'Partner Offline'}</span>
          </button>
        ) : (
          <>
            <button
              onClick={onToggleMute}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-medium transition-all ${
                voiceState.isMuted
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-white/10 hover:bg-white/15 text-white'
              }`}
            >
              {voiceState.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{voiceState.isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            <button
              onClick={onEndVoice}
              title="Leave Call"
              className="p-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all active:scale-95"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
