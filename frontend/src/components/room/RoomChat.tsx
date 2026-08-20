import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Message, User } from '../../types';
import { Avatar } from '../common/Avatar';

interface RoomChatProps {
  messages: Message[];
  currentUser: User | null;
  partnerUser: User | null;
  partnerTyping: boolean;
  onSendMessage: (content: string) => void;
  onSendReaction: (emoji: string) => void;
  onTyping: (isTyping: boolean) => void;
}

const REACTION_EMOJIS = ['❤️', '😂', '😍', '👍', '🎉', '😭', '🔥', '✨'];

export const RoomChat: React.FC<RoomChatProps> = ({
  messages,
  currentUser,
  partnerUser,
  partnerTyping,
  onSendMessage,
  onSendReaction,
  onTyping,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, partnerTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    onTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText.trim());
    setInputText('');
    onTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  return (
    <div className="flex flex-col h-full rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-xl overflow-hidden">
      {/* Chat Header & Quick Reactions Bar */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-white">Room Messages</span>

        {/* Reaction Emojis Ribbon */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendReaction(emoji)}
              title={`React with ${emoji}`}
              className="p-1.5 rounded-xl hover:bg-white/10 active:scale-125 transition-transform text-lg"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] max-h-[360px] sm:max-h-[400px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-8">
            <span className="text-2xl mb-2">💬</span>
            <p>No messages yet.</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Say hello or react with a heart ❤️
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === currentUser?.id;
            return (
              <div
                key={msg.id || index}
                className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <Avatar
                    name={msg.sender_name || partnerUser?.name || 'Partner'}
                    avatarUrl={msg.sender_avatar || partnerUser?.avatar_url}
                    size="sm"
                  />
                )}

                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-br-none shadow-md shadow-rose-500/20'
                      : 'bg-slate-800 text-slate-100 rounded-bl-none border border-white/5'
                  }`}
                >
                  <p className="break-words">{msg.content}</p>
                  <span
                    className={`block text-[10px] mt-1 text-right font-mono ${
                      isMe ? 'text-rose-100/70' : 'text-slate-400'
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Partner Typing indicator */}
        {partnerTyping && (
          <div className="flex items-center gap-2 text-xs text-rose-300 italic animate-pulse">
            <Avatar
              name={partnerUser?.name || 'Partner'}
              avatarUrl={partnerUser?.avatar_url}
              size="sm"
            />
            <span>{partnerUser?.name || 'Partner'} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-slate-950/40 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Send a sweet message..."
          className="flex-1 bg-slate-800/80 text-white placeholder-slate-400 text-sm px-4 py-2.5 rounded-xl border border-white/5 focus:outline-none focus:border-rose-500/50 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 text-white hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 transition-all shadow-md shadow-rose-500/25"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
