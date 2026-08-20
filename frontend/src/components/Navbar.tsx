import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Users, Home, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './common/Avatar';
import { NotificationDropdown } from './NotificationDropdown';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  const isRoomPage = location.pathname.startsWith('/room/');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/70 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 shadow-lg shadow-rose-500/25 group-hover:scale-105 transition-transform">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              Together
              <span className="text-rose-500 text-xs px-1.5 py-0.5 rounded bg-rose-500/10 font-medium">
                duo
              </span>
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        {!isRoomPage && (
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                location.pathname === '/dashboard'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>

            <Link
              to="/contacts"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                location.pathname === '/contacts'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Contacts</span>
            </Link>
          </nav>
        )}

        {/* Right side Profile & Notifications */}
        <div className="flex items-center gap-3">
          <NotificationDropdown />

          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

          {/* User Profile avatar */}
          <div className="flex items-center gap-3 pl-1">
            <Avatar
              name={user?.name || 'User'}
              avatarUrl={user?.avatar_url}
              size="sm"
              status="ONLINE"
            />
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-semibold text-white leading-tight">
                {user?.name}
              </span>
              <span className="text-[11px] text-slate-400">@{user?.username}</span>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
