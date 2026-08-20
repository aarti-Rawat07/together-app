import React from 'react';
import { FloatingReaction } from '../../types';

interface ReactionsOverlayProps {
  reactions: FloatingReaction[];
}

export const ReactionsOverlay: React.FC<ReactionsOverlayProps> = ({ reactions }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {reactions.map((reaction) => (
        <div
          key={reaction.id}
          className="absolute bottom-10 flex flex-col items-center animate-float-up pointer-events-none"
          style={{
            left: `${reaction.x}%`,
          }}
        >
          <span className="text-4xl sm:text-5xl filter drop-shadow-[0_0_12px_rgba(244,63,94,0.7)] transform active:scale-125">
            {reaction.emoji}
          </span>
          <span className="text-[10px] bg-slate-900/80 border border-white/10 px-2 py-0.5 rounded-full text-slate-200 mt-1 shadow-md">
            {reaction.sender_name}
          </span>
        </div>
      ))}
    </div>
  );
};
