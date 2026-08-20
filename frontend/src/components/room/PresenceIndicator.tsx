import React from 'react';
import { Heart } from 'lucide-react';
import { User, PresenceStatus } from '../../types';
import { Avatar } from '../common/Avatar';

interface PresenceIndicatorProps {
  currentUser: User | null;
  partnerUser: User | null;
  partnerPresence: PresenceStatus;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  currentUser,
  partnerUser,
  partnerPresence,
}) => {
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-6 py-3 px-6 rounded-full bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-lg">
      {/* Current User */}
      <div className="flex items-center gap-2.5">
        <Avatar
          name={currentUser?.name || 'You'}
          avatarUrl={currentUser?.avatar_url}
          size="md"
          status="ONLINE"
        />
        <div className="flex flex-col text-left">
          <span className="text-xs font-semibold text-white">You</span>
          <span className="text-[10px] text-emerald-400 font-medium">In Room</span>
        </div>
      </div>

      {/* Heart Bridge */}
      <div className="flex items-center justify-center p-2 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse">
        <Heart className="w-4 h-4 fill-rose-500" />
      </div>

      {/* Partner User */}
      <div className="flex items-center gap-2.5">
        <div className="flex flex-col text-right">
          <span className="text-xs font-semibold text-white">
            {partnerUser?.name || 'Partner'}
          </span>
          <span
            className={`text-[10px] font-medium ${
              partnerPresence === 'IN_ROOM'
                ? 'text-emerald-400'
                : partnerPresence === 'RECONNECTING'
                ? 'text-amber-400 animate-pulse'
                : 'text-slate-400'
            }`}
          >
            {partnerPresence === 'IN_ROOM'
              ? 'In Room'
              : partnerPresence === 'RECONNECTING'
              ? 'Reconnecting...'
              : 'Away'}
          </span>
        </div>
        <Avatar
          name={partnerUser?.name || 'Partner'}
          avatarUrl={partnerUser?.avatar_url}
          size="md"
          status={partnerPresence}
        />
      </div>
    </div>
  );
};
