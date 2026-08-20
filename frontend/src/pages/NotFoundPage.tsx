import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Home } from 'lucide-react';
import { FloatingHearts } from '../components/FloatingHearts';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#090d16] relative overflow-hidden">
      <FloatingHearts />
      <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-2xl max-w-md w-full text-center shadow-2xl relative z-10">
        <Heart className="w-12 h-12 text-rose-500 mx-auto mb-4 animate-bounce" />
        <h1 className="text-4xl font-extrabold text-white">404</h1>
        <h2 className="text-lg font-semibold text-slate-200 mt-2">Page Not Found</h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          The romantic corner you are looking for doesn't exist.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold text-sm shadow-lg shadow-rose-500/25 transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Back to Safety</span>
        </Link>
      </div>
    </div>
  );
};
