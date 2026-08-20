import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Heart,
  Radio,
  UserPlus,
  ArrowRight,
  Music,
  Mic,
  MessageSquare,
  Sparkles,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { contactService } from '../services/contacts';
import { roomService } from '../services/rooms';
import { Contact, Room } from '../types';
import { Avatar } from '../components/common/Avatar';
import { FloatingHearts } from '../components/FloatingHearts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [acceptedContacts, setAcceptedContacts] = useState<Contact[]>([]);
  const [pendingReceived, setPendingReceived] = useState<Contact[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingRoom, setIsStartingRoom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      const [contactsData, activeRoomData] = await Promise.all([
        contactService.getContacts(),
        roomService.getActiveRoom(),
      ]);
      setAcceptedContacts(contactsData.accepted);
      setPendingReceived(contactsData.pending_received);
      setActiveRoom(activeRoomData);
    } catch (err) {
      console.error('Error fetching dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 10000); // 10s refresh
    return () => clearInterval(interval);
  }, []);

  const handleStartSession = async (partnerId: number) => {
    setIsStartingRoom(true);
    setError(null);
    try {
      const room = await roomService.createRoom(partnerId);
      navigate(`/room/${room.uuid_token}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Could not start Together session.');
      setIsStartingRoom(false);
    }
  };

  const handleAcceptRequest = async (contactId: number) => {
    try {
      await contactService.acceptRequest(contactId);
      await loadDashboardData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to accept connection request.');
    }
  };

  const handleRejectRequest = async (contactId: number) => {
    try {
      await contactService.rejectRequest(contactId);
      await loadDashboardData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const primaryPartnerContact = acceptedContacts[0];
  const primaryPartner = primaryPartnerContact?.partner;

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto relative">
      <FloatingHearts />

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm font-medium flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          Welcome, {user?.name} <span className="text-rose-500">❤️</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Your private space to listen to music, talk, and spend real-time moments together.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Together Hero / Partner Connection Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* If Active Room Exists: Prompt Quick Rejoin */}
            {activeRoom && (
              <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-950/60 via-indigo-950/40 to-slate-900/80 border border-rose-500/30 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 animate-pulse">
                    <Radio className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold text-rose-400">
                      Active Together Session
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      Your room is live right now
                    </h3>
                    <p className="text-xs text-slate-400">
                      With {activeRoom.creator_id === user?.id ? activeRoom.partner.name : activeRoom.creator.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/room/${activeRoom.uuid_token}`)}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold text-sm shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                  <span>Rejoin Room</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* If Partner Connected */}
            {primaryPartner ? (
              <div className="p-8 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10">
                  <div className="flex items-center gap-5">
                    <Avatar
                      name={primaryPartner.name}
                      avatarUrl={primaryPartner.avatar_url}
                      size="xl"
                      status={primaryPartner.status}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white">{primaryPartner.name}</h2>
                        <span className="text-xs text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full font-medium">
                          Duo Partner ❤️
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">@{primaryPartner.username}</p>
                      <div className="flex items-center gap-1.5 mt-2 text-xs">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            primaryPartner.status === 'online'
                              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                              : 'bg-slate-500'
                          }`}
                        />
                        <span className="text-slate-300 capitalize">
                          {primaryPartner.status === 'online' ? 'Online & Available' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Start Room CTA */}
                  <button
                    onClick={() => handleStartSession(primaryPartner.id)}
                    disabled={isStartingRoom}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-base shadow-xl shadow-rose-500/30 flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {isStartingRoom ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Heart className="w-5 h-5 fill-white" />
                        <span>Start Together Session</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Features Highlights inside the duo room */}
                <div className="grid grid-cols-3 gap-4 pt-6 text-center">
                  <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 flex flex-col items-center">
                    <Music className="w-5 h-5 text-rose-400 mb-2" />
                    <span className="text-xs font-semibold text-white">Sync Music</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">Listen in unison</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 flex flex-col items-center">
                    <Mic className="w-5 h-5 text-indigo-400 mb-2" />
                    <span className="text-xs font-semibold text-white">Voice Call</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">P2P WebRTC talk</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 flex flex-col items-center">
                    <MessageSquare className="w-5 h-5 text-pink-400 mb-2" />
                    <span className="text-xs font-semibold text-white">Live Chat</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">Instant reactions</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Friendly Empty State Required by Prompt */
              <div className="p-10 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-2xl shadow-2xl text-center flex flex-col items-center justify-center">
                <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-4 animate-bounce">
                  <Heart className="w-10 h-10 fill-rose-500" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Add someone and start your first Together session ❤️
                </h2>
                <p className="text-sm text-slate-400 max-w-md mt-2 mb-6">
                  Together is designed exclusively for two connected people. Search for your
                  partner by username or email and send them a connection request!
                </p>
                <Link
                  to="/contacts"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold text-sm shadow-lg shadow-rose-500/25 flex items-center gap-2 hover:scale-105 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Find & Add Contact</span>
                </Link>
              </div>
            )}
          </div>

          {/* Right Column: Pending Requests & Connection Manager Quick view */}
          <div className="space-y-6">
            {/* Pending Requests Box */}
            <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-2xl shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>Connection Requests</span>
                  {pendingReceived.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-[10px] font-bold text-white">
                      {pendingReceived.length}
                    </span>
                  )}
                </h3>
                <Link to="/contacts" className="text-xs text-rose-400 hover:text-rose-300 font-medium">
                  View All
                </Link>
              </div>

              {pendingReceived.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No pending requests right now.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingReceived.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-3.5 rounded-2xl bg-slate-950/40 border border-white/5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          name={contact.requester.name}
                          avatarUrl={contact.requester.avatar_url}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {contact.requester.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            @{contact.requester.username}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleAcceptRequest(contact.id)}
                          title="Accept"
                          className="p-1.5 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRejectRequest(contact.id)}
                          title="Decline"
                          className="p-1.5 rounded-xl bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Rules / Privacy Reminder Card */}
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-3 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>The Together Guarantee</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span><strong>Strictly 2 People:</strong> No third parties can ever enter your room.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span><strong>Synchronized Audio:</strong> Drift-free playback locked in time.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span><strong>P2P Voice:</strong> Encrypted peer-to-peer audio communication.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
