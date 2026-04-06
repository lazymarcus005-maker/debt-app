import Cookies from 'js-cookie';
import axios from 'axios';

const API_URL = 'https://debt.codingholiday.com';//process.env.NEXT_PUBLIC_APP_URL || 'https://debt.codingholiday.com';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    const { token, user } = response.data;
    Cookies.set('auth_token', token, { expires: 1 });
    return { token, user };
  },

  signup: async (email: string, password: string, name: string) => {
    const response = await api.post('/api/auth/signup', { email, password, name });
    const { token, user } = response.data;
    Cookies.set('auth_token', token, { expires: 1 });
    return { token, user };
  },

  logout: () => {
    Cookies.remove('auth_token');
  },

  getToken: () => Cookies.get('auth_token'),
};

export const billsAPI = {
  getAll: async () => {
    const response = await api.get('/api/bills');
    return response.data.bills;
  },

  create: async (billData: any) => {
    const response = await api.post('/api/bills', billData);
    return response.data.bill;
  },
};

export const savingsAPI = {
  getAll: async () => {
    const response = await api.get('/api/savings');
    return response.data.savings;
  },

  getById: async (id: number) => {
    const response = await api.get(`/api/savings/${id}`);
    return response.data;
  },

  create: async (savingData: any) => {
    const response = await api.post('/api/savings', savingData);
    return response.data.saving;
  },

  update: async (id: number, savingData: any) => {
    const response = await api.put(`/api/savings/${id}`, savingData);
    return response.data.saving;
  },

  delete: async (id: number) => {
    await api.delete(`/api/savings/${id}`);
    return true;
  },

  addDeposit: async (id: number, amount: number, note?: string) => {
    const response = await api.post(`/api/savings/${id}/deposit`, {
      amount,
      note
    });
    return response.data;
  },

  updateDeposit: async (savingId: number, depositId: number, amount: number, note?: string) => {
    const response = await api.patch(`/api/savings/${savingId}/desposits/${depositId}`, {
      amount,
      note
    });
    return response.data;
  },

  deleteDeposit: async (savingId: number, depositId: number) => {
    const response = await api.delete(`/api/savings/${savingId}/desposits/${depositId}`);
    return response.data;
  }
};

