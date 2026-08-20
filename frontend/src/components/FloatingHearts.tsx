import React, { useMemo } from 'react';

export const FloatingHearts: React.FC = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      size: Math.floor(Math.random() * 16) + 10,
      left: Math.random() * 100,
      top: Math.random() * 100,
      opacity: Math.random() * 0.15 + 0.05,
      duration: Math.floor(Math.random() * 15) + 15,
      delay: Math.random() * 5,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-rose-500/20 blur-xl animate-pulse"
          style={{
            width: `${p.size * 5}px`,
            height: `${p.size * 5}px`,
            left: `${p.left}%`,
            top: `${p.top}%`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};
