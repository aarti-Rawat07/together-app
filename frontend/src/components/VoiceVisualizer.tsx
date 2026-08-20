import React from 'react';

interface VoiceVisualizerProps {
  level: number; // 0 to 100
  isSpeaking: boolean;
  isMuted: boolean;
  color?: string;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  level,
  isSpeaking,
  isMuted,
  color = 'from-rose-500 to-pink-500',
}) => {
  const bars = [0.4, 0.7, 1.0, 0.85, 0.5];

  if (isMuted) {
    return (
      <div className="flex items-center gap-1 h-5 px-2">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 h-6 px-1">
      {bars.map((mult, i) => {
        const heightPx = isSpeaking ? Math.max(4, Math.min(22, (level / 100) * 22 * mult)) : 4;
        return (
          <div
            key={i}
            className={`w-1 rounded-full bg-gradient-to-t ${color} transition-all duration-75`}
            style={{ height: `${heightPx}px` }}
          />
        );
      })}
    </div>
  );
};
