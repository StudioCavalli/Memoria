import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ---------------------------------------------------------------------------
// JWT interceptor
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('memoria_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('memoria_refresh');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          localStorage.setItem('memoria_token', data.access_token);
          localStorage.setItem('memoria_refresh', data.refresh_token);
          error.config.headers.Authorization = `Bearer ${data.access_token}`;
          return api(error.config);
        } catch {
          localStorage.removeItem('memoria_token');
          localStorage.removeItem('memoria_refresh');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('memoria_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),
};

// ---------------------------------------------------------------------------
// Seniors
// ---------------------------------------------------------------------------
export const seniorsService = {
  list: () => api.get('/seniors'),
  get: (id: string) => api.get(`/seniors/${id}`),
  create: (data: Record<string, unknown>) => api.post('/seniors', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/seniors/${id}`, data),
  delete: (id: string) => api.delete(`/seniors/${id}`),
};

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------
export const sessionsService = {
  list: (seniorId: string) =>
    api.get(`/seniors/${seniorId}/sessions`),
  get: (seniorId: string, sessionId: string) =>
    api.get(`/seniors/${seniorId}/sessions/${sessionId}`),
  latest: (seniorId: string) =>
    api.get(`/seniors/${seniorId}/sessions/latest`),
};

// ---------------------------------------------------------------------------
// Memories
// ---------------------------------------------------------------------------
export interface MemoryFilters {
  theme?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export const memoriesService = {
  list: (seniorId: string, filters?: MemoryFilters) =>
    api.get(`/seniors/${seniorId}/memories`, { params: filters }),
  get: (seniorId: string, memoryId: string) =>
    api.get(`/seniors/${seniorId}/memories/${memoryId}`),
};

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------
export const alertsService = {
  list: (seniorId: string, unreadOnly?: boolean) =>
    api.get(`/seniors/${seniorId}/alerts`, {
      params: unreadOnly ? { unread: true } : undefined,
    }),
  markRead: (seniorId: string, alertId: string) =>
    api.patch(`/seniors/${seniorId}/alerts/${alertId}/read`),
  unreadCount: (seniorId: string) =>
    api.get(`/seniors/${seniorId}/alerts/unread-count`),
};

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------
export const metricsService = {
  history: (seniorId: string, days: number = 30) =>
    api.get(`/seniors/${seniorId}/metrics/history`, { params: { days } }),
  summary: (seniorId: string) =>
    api.get(`/seniors/${seniorId}/metrics/summary`),
};

// ---------------------------------------------------------------------------
// Gazettes
// ---------------------------------------------------------------------------
export const gazettesService = {
  list: (seniorId: string) =>
    api.get(`/seniors/${seniorId}/gazettes`),
  download: (seniorId: string, gazetteId: string) =>
    api.get(`/seniors/${seniorId}/gazettes/${gazetteId}/download`, {
      responseType: 'blob',
    }),
};

// ---------------------------------------------------------------------------
// Settings / profile helpers
// ---------------------------------------------------------------------------
export const settingsService = {
  getProfile: (seniorId: string) =>
    api.get(`/seniors/${seniorId}/profile`),
  updateProfile: (seniorId: string, data: Record<string, unknown>) =>
    api.put(`/seniors/${seniorId}/profile`, data),
  getSchedule: (seniorId: string) =>
    api.get(`/seniors/${seniorId}/schedule`),
  updateSchedule: (seniorId: string, data: Record<string, unknown>) =>
    api.put(`/seniors/${seniorId}/schedule`, data),
  getNotificationPrefs: () =>
    api.get('/user/notification-preferences'),
  updateNotificationPrefs: (data: Record<string, unknown>) =>
    api.put('/user/notification-preferences', data),
  getFamilyMembers: (seniorId: string) =>
    api.get(`/seniors/${seniorId}/family`),
};

export default api;
