import api from './api';
import { Room, Message } from '../types';

export const roomService = {
  async createRoom(partnerId: number): Promise<Room> {
    const res = await api.post<Room>('/rooms', { partner_id: partnerId });
    return res.data;
  },

  async getActiveRoom(): Promise<Room | null> {
    try {
      const res = await api.get<Room>('/rooms/active/current');
      return res.data;
    } catch {
      return null;
    }
  },

  async getRoom(roomUuid: string): Promise<Room> {
    const res = await api.get<Room>(`/rooms/${roomUuid}`);
    return res.data;
  },

  async leaveRoom(roomUuid: string): Promise<void> {
    await api.post(`/rooms/${roomUuid}/leave`);
  },

  async getMessages(roomUuid: string, limit = 50, offset = 0): Promise<Message[]> {
    const res = await api.get<Message[]>(`/rooms/${roomUuid}/messages?limit=${limit}&offset=${offset}`);
    return res.data;
  },
};
