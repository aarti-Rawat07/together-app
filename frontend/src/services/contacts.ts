import api from './api';
import { Contact, ContactListResponse, UserSearchResult } from '../types';

export const contactService = {
  async getContacts(): Promise<ContactListResponse> {
    const res = await api.get<ContactListResponse>('/contacts');
    return res.data;
  },

  async searchUsers(query: string): Promise<UserSearchResult[]> {
    const res = await api.get<UserSearchResult[]>(`/users/search?q=${encodeURIComponent(query)}`);
    return res.data;
  },

  async sendRequest(usernameOrEmail: string): Promise<Contact> {
    const res = await api.post<Contact>('/contacts/request', {
      addressee_username_or_email: usernameOrEmail,
    });
    return res.data;
  },

  async acceptRequest(contactId: number): Promise<Contact> {
    const res = await api.post<Contact>(`/contacts/${contactId}/accept`);
    return res.data;
  },

  async rejectRequest(contactId: number): Promise<void> {
    await api.post(`/contacts/${contactId}/reject`);
  },

  async removeContact(contactId: number): Promise<void> {
    await api.delete(`/contacts/${contactId}`);
  },
};
