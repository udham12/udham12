import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      AsyncStorage.removeItem('auth_token');
      AsyncStorage.removeItem('user_data');
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
};

// Agent APIs
export const agentAPI = {
  getAvailable: (gender?: string) => api.get('/agents/available', { params: { gender } }),
  toggleAvailability: () => api.put('/agents/toggle-availability'),
  getDashboard: () => api.get('/agents/dashboard'),
};

// Session APIs
export const sessionAPI = {
  start: (data: any) => api.post('/sessions/start', data),
  accept: (sessionId: string) => api.put(`/sessions/accept/${sessionId}`),
  reject: (sessionId: string) => api.put(`/sessions/reject/${sessionId}`),
  end: (sessionId: string, duration: number, amount: number) => 
    api.put(`/sessions/end/${sessionId}`, null, { params: { duration, amount } }),
  getActive: () => api.get('/sessions/active'),
  getHistory: () => api.get('/sessions/history'),
};

// Chat APIs
export const chatAPI = {
  getHistory: (sessionId: string) => api.get(`/chat/history/${sessionId}`),
};

// Mood APIs
export const moodAPI = {
  checkin: (data: any) => api.post('/mood/checkin', data),
  getHistory: () => api.get('/mood/history'),
  getDailyAffirmation: () => api.get('/affirmations/daily'),
};

// Payment APIs
export const paymentAPI = {
  initiate: (data: any) => api.post('/payments/initiate', data),
  verify: (paymentId: string) => api.post(`/payments/verify/${paymentId}`),
};

// Report APIs
export const reportAPI = {
  create: (data: any) => api.post('/reports/create', data),
};