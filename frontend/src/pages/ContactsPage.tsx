import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  UserPlus,
  Heart,
  Check,
  Trash2,
  Users,
  Clock,
} from 'lucide-react';
import { contactService } from '../services/contacts';
import { roomService } from '../services/rooms';
import { Contact, UserSearchResult } from '../types';
import { Avatar } from '../components/common/Avatar';
import { FloatingHearts } from '../components/FloatingHearts';

export const ContactsPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'connected' | 'incoming' | 'outgoing'>('connected');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [contacts, setContacts] = useState<{
    accepted: Contact[];
    pending_sent: Contact[];
    pending_received: Contact[];
  }>({
    accepted: [],
    pending_sent: [],
    pending_received: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadContacts = async () => {
    try {
      const data = await contactService.getContacts();
      setContacts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setStatusMessage(null);
    try {
      const results = await contactService.searchUsers(searchQuery.trim());
      setSearchResults(results);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to search users.',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (usernameOrEmail: string) => {
    try {
      await contactService.sendRequest(usernameOrEmail);
      setStatusMessage({ type: 'success', text: `Connection request sent to ${usernameOrEmail}! ❤️` });
      // Refresh search and contacts
      const updated = await contactService.searchUsers(searchQuery);
      setSearchResults(updated);
      await loadContacts();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Could not send request.',
      });
    }
  };

  const handleAccept = async (contactId: number) => {
    try {
      await contactService.acceptRequest(contactId);
      setStatusMessage({ type: 'success', text: 'Connection accepted! You can now start a room.' });
      await loadContacts();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Could not accept request.',
      });
    }
  };

  const handleReject = async (contactId: number) => {
    try {
      await contactService.rejectRequest(contactId);
      setStatusMessage({ type: 'success', text: 'Request removed.' });
      await loadContacts();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleRemove = async (contactId: number) => {
    if (!window.confirm('Are you sure you want to disconnect this contact?')) return;
    try {
      await contactService.removeContact(contactId);
      setStatusMessage({ type: 'success', text: 'Contact disconnected.' });
      await loadContacts();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleStartSession = async (partnerId: number) => {
    try {
      const room = await roomService.createRoom(partnerId);
      navigate(`/room/${room.uuid_token}`);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Could not start room.',
      });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto relative">
      <FloatingHearts />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          Your Contacts <span className="text-rose-500">❤️</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Connect with the person you want to listen and spend time with.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`mb-6 p-4 rounded-2xl border text-sm font-medium flex items-center justify-between animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Search Bar for Adding Contacts */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-2xl shadow-xl mb-8">
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-rose-400" />
          <span>Find Someone to Connect With</span>
        </h2>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by username (e.g. rohan) or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/60 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold text-sm shadow-lg shadow-rose-500/25 flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </form>

        {/* Search Results Dropdown/Box */}
        {searchResults.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
            <span className="text-xs text-slate-400 font-medium">Search Results:</span>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((u) => (
                <div
                  key={u.id}
                  className="p-3.5 rounded-2xl bg-slate-950/40 border border-white/5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} avatarUrl={u.avatar_url} size="md" status={u.status} />
                    <div>
                      <h4 className="text-sm font-semibold text-white">{u.name}</h4>
                      <p className="text-xs text-slate-400">@{u.username}</p>
                    </div>
                  </div>

                  <div>
                    {u.connection_status === 'ACCEPTED' ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                        Connected ❤️
                      </span>
                    ) : u.connection_status === 'PENDING_SENT' ? (
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold">
                        Request Sent
                      </span>
                    ) : u.connection_status === 'PENDING_RECEIVED' ? (
                      <button
                        onClick={() => u.contact_id && handleAccept(u.contact_id)}
                        className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow"
                      >
                        Accept Request
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(u.username)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-semibold shadow-md shadow-rose-500/25 flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Connect</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs for Contacts View */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-6">
        <button
          onClick={() => setActiveTab('connected')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'connected'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Connected Duo ({contacts.accepted.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('incoming')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'incoming'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Incoming Requests ({contacts.pending_received.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('outgoing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'outgoing'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Sent ({contacts.pending_sent.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
        </div>
      ) : activeTab === 'connected' ? (
        <div className="space-y-4">
          {contacts.accepted.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-white/5">
              <Heart className="w-8 h-8 text-rose-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No Connected Partner Yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Search above to find your partner and start your synchronized Together session!
              </p>
            </div>
          ) : (
            contacts.accepted.map((contact) => {
              const partner = contact.partner!;
              return (
                <div
                  key={contact.id}
                  className="p-5 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={partner.name}
                      avatarUrl={partner.avatar_url}
                      size="lg"
                      status={partner.status}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{partner.name}</h3>
                        <span className="text-[11px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full font-medium">
                          Duo Partner ❤️
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">@{partner.username}</p>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Connected since {new Date(contact.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => handleStartSession(partner.id)}
                      className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold text-xs shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Heart className="w-3.5 h-3.5 fill-white" />
                      <span>Start Room</span>
                    </button>

                    <button
                      onClick={() => handleRemove(contact.id)}
                      title="Disconnect"
                      className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : activeTab === 'incoming' ? (
        <div className="space-y-3">
          {contacts.pending_received.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-white/5 text-slate-400 text-xs">
              No incoming connection requests.
            </div>
          ) : (
            contacts.pending_received.map((contact) => (
              <div
                key={contact.id}
                className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    name={contact.requester.name}
                    avatarUrl={contact.requester.avatar_url}
                    size="md"
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-white">{contact.requester.name}</h4>
                    <p className="text-xs text-slate-400">@{contact.requester.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAccept(contact.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => handleReject(contact.id)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-300 text-xs font-semibold"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.pending_sent.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-white/5 text-slate-400 text-xs">
              No pending sent requests.
            </div>
          ) : (
            contacts.pending_sent.map((contact) => (
              <div
                key={contact.id}
                className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    name={contact.addressee.name}
                    avatarUrl={contact.addressee.avatar_url}
                    size="md"
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-white">{contact.addressee.name}</h4>
                    <p className="text-xs text-slate-400">@{contact.addressee.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full font-medium">
                    Awaiting response
                  </span>
                  <button
                    onClick={() => handleReject(contact.id)}
                    title="Cancel Request"
                    className="text-xs text-slate-500 hover:text-rose-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
