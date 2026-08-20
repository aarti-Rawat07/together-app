import React from 'react';
import { PresenceStatus } from '../../types';

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: PresenceStatus | 'online' | 'offline' | 'in_room' | string;
  isSpeaking?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  status,
  isSpeaking = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-2xl',
    '2xl': 'w-28 h-28 text-3xl',
  };

  const badgeSizeClasses = {
    sm: 'w-2.5 h-2.5 ring-2',
    md: 'w-3.5 h-3.5 ring-2',
    lg: 'w-4 h-4 ring-2',
    xl: 'w-5 h-5 ring-3',
    '2xl': 'w-6 h-6 ring-4',
  };

  const getStatusColor = (s?: string) => {
    switch (s?.toUpperCase()) {
      case 'ONLINE':
      case 'IN_ROOM':
        return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]';
      case 'CONNECTING':
      case 'RECONNECTING':
        return 'bg-amber-400 animate-pulse';
      case 'OFFLINE':
      default:
        return 'bg-slate-500';
    }
  };

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'T';

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`relative rounded-full flex items-center justify-center overflow-hidden font-bold transition-all duration-300 ${
          sizeClasses[size]
        } ${
          isSpeaking
            ? 'ring-4 ring-rose-500 ring-offset-2 ring-offset-slate-950 shadow-[0_0_20px_rgba(244,63,94,0.6)] scale-105'
            : 'ring-2 ring-white/10'
        }`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover rounded-full bg-slate-800"
            onError={(e) => {
              // fallback to initials on broken image
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-500 to-indigo-600 text-white">
            {initials}
          </div>
        )}
      </div>

      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-slate-950 ${
            badgeSizeClasses[size]
          } ${getStatusColor(status)}`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};
