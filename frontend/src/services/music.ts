import api from './api';
import { Track, TrackCategory } from '../types';

export const musicService = {
  async getTracks(): Promise<Track[]> {
    const res = await api.get<Track[]>('/music/tracks');
    return res.data;
  },

  async getCategories(): Promise<TrackCategory[]> {
    const res = await api.get<TrackCategory[]>('/music/categories');
    return res.data;
  },

  async searchTracks(query: string): Promise<Track[]> {
    const res = await api.get<Track[]>(`/music/search?q=${encodeURIComponent(query)}`);
    return res.data;
  },

  async getTrack(trackId: string): Promise<Track> {
    const res = await api.get<Track>(`/music/tracks/${trackId}`);
    return res.data;
  },

  async uploadTrack(file: File, title: string, artist: string): Promise<Track> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('category', 'My Uploaded Songs');

    const res = await api.post<Track>('/music/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async addCustomUrl(title: string, artist: string, url: string): Promise<Track> {
    const res = await api.post<Track>('/music/custom-url', {
      title,
      artist,
      url,
      category: 'Web Audio Stream',
    });
    return res.data;
  },
};
