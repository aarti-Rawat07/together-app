import React, { useState, useEffect } from 'react';
import { Play, Music, Search, Check, Upload, Link as LinkIcon, Sparkles } from 'lucide-react';
import { Track, TrackCategory } from '../../types';
import { musicService } from '../../services/music';
import { Modal } from '../common/Modal';

interface TrackQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrackId?: string;
  onSelectTrack: (track: Track) => void;
}

export const TrackQueueModal: React.FC<TrackQueueModalProps> = ({
  isOpen,
  onClose,
  currentTrackId,
  onSelectTrack,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'upload' | 'url'>('catalog');
  const [categories, setCategories] = useState<TrackCategory[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtist, setUploadArtist] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Custom URL Form State
  const [urlTitle, setUrlTitle] = useState('');
  const [urlArtist, setUrlArtist] = useState('');
  const [songUrl, setSongUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadMusic = async () => {
      setIsLoading(true);
      try {
        const [trackList, catList] = await Promise.all([
          musicService.getTracks(),
          musicService.getCategories(),
        ]);
        setTracks(trackList);
        setCategories(catList);
      } catch (err) {
        console.error('Error fetching music library', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMusic();
  }, [isOpen]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim()) {
      setUploadError('Please select an MP3 file and enter a title.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const newTrack = await musicService.uploadTrack(
        uploadFile,
        uploadTitle.trim(),
        uploadArtist.trim() || 'My Upload'
      );
      onSelectTrack(newTrack);
      onClose();
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || 'Failed to upload MP3 song.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songUrl.trim() || !urlTitle.trim()) {
      setUrlError('Please enter a song title and audio URL.');
      return;
    }

    setUrlError(null);
    try {
      const newTrack = await musicService.addCustomUrl(
        urlTitle.trim(),
        urlArtist.trim() || 'Web Artist',
        songUrl.trim()
      );
      onSelectTrack(newTrack);
      onClose();
    } catch (err: any) {
      setUrlError(err.response?.data?.detail || 'Failed to add custom audio URL.');
    }
  };

  const filteredTracks = tracks.filter((t) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      (t.album && t.album.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q));

    const matchesCat =
      selectedCat === 'all' ||
      (t.category && t.category.toLowerCase().replace(/\s+/g, '-') === selectedCat);

    return matchesSearch && matchesCat;
  });

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Music Library & Songs 🎵" maxWidth="max-w-xl">
      <div className="flex flex-col gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'catalog'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Song Catalog</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload MP3 File</span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'url'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Paste Audio Link</span>
          </button>
        </div>

        {/* TAB 1: Catalog */}
        {activeTab === 'catalog' && (
          <>
            {/* Search input with live filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search Hindi songs, Kesariya, Arijit Singh..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950/70 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Categories ribbon tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCat('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  selectedCat === 'all'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                All Tracks ({tracks.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center gap-1 ${
                    selectedCat === cat.id
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {cat.name.includes('Hindi') || cat.name.includes('Bollywood') ? (
                    <Sparkles className="w-3 h-3 text-rose-300" />
                  ) : null}
                  <span>{cat.name} ({cat.tracks.length})</span>
                </button>
              ))}
            </div>

            {/* Track List */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 rounded-full border-2 border-rose-500/20 border-t-rose-500 animate-spin" />
                  <span className="text-xs text-slate-400">Loading songs...</span>
                </div>
              ) : filteredTracks.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  No tracks found matching "{search}".
                </div>
              ) : (
                filteredTracks.map((track) => {
                  const isCurrent = track.id === currentTrackId;
                  return (
                    <div
                      key={track.id}
                      onClick={() => {
                        onSelectTrack(track);
                        onClose();
                      }}
                      className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-rose-500/20 border border-rose-500/40 shadow-md shadow-rose-500/10'
                          : 'hover:bg-white/5 border border-white/5 bg-slate-950/30'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-white/10 relative shadow-inner">
                          {track.cover_url ? (
                            <img
                              src={track.cover_url}
                              alt={track.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-indigo-900 text-white">
                              <Music className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span
                            className={`text-xs sm:text-sm font-bold truncate ${
                              isCurrent ? 'text-rose-400' : 'text-white'
                            }`}
                          >
                            {track.title}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate mt-0.5">
                            {track.artist}
                          </span>
                          {track.album && (
                            <span className="text-[10px] text-rose-300/80 truncate">
                              {track.album} • {track.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatDuration(track.duration)}
                        </span>
                        {isCurrent ? (
                          <span className="p-2 rounded-full bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <button
                            title="Play in Together Room"
                            className="p-2 rounded-full bg-white/5 hover:bg-rose-500 hover:text-white text-slate-300 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* TAB 2: Upload MP3 File */}
        {activeTab === 'upload' && (
          <form onSubmit={handleUploadSubmit} className="space-y-3.5 py-2">
            <p className="text-xs text-slate-300 leading-relaxed">
              Upload any <strong>.mp3 / .wav / .m4a</strong> file from your phone or computer. It will immediately play in sync for both of you in your private room!
            </p>

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
                {uploadError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Audio File (.mp3, .wav, .m4a)
              </label>
              <input
                type="file"
                accept="audio/*"
                required
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadFile(file);
                    if (!uploadTitle) {
                      // Auto populate title from filename
                      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                      setUploadTitle(nameWithoutExt);
                    }
                  }
                }}
                className="w-full text-xs text-slate-300 bg-slate-950/70 border border-white/10 rounded-xl p-2.5 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-rose-500 file:text-white hover:file:bg-rose-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Song Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kesariya"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Singer / Artist
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arijit Singh"
                  value={uploadArtist}
                  onChange={(e) => setUploadArtist(e.target.value)}
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 text-white font-semibold text-xs shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload & Play Song Together</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 3: Paste Audio Link */}
        {activeTab === 'url' && (
          <form onSubmit={handleUrlSubmit} className="space-y-3.5 py-2">
            <p className="text-xs text-slate-300 leading-relaxed">
              Paste a direct <strong>MP3 / audio stream link</strong> from the web to listen together in real time.
            </p>

            {urlError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
                {urlError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Direct MP3 / Audio Stream URL
              </label>
              <input
                type="url"
                required
                placeholder="https://example.com/song.mp3"
                value={songUrl}
                onChange={(e) => setSongUrl(e.target.value)}
                className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Song Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tum Hi Ho"
                  value={urlTitle}
                  onChange={(e) => setUrlTitle(e.target.value)}
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Singer / Artist
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arijit Singh"
                  value={urlArtist}
                  onChange={(e) => setUrlArtist(e.target.value)}
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 text-white font-semibold text-xs shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Stream Song Together</span>
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};
