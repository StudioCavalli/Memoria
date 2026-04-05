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
// Helpers – résolution du senior_id
// ---------------------------------------------------------------------------

/**
 * Récupère le senior_id depuis localStorage.
 * Si absent, interroge GET /seniors/ et utilise le premier résultat.
 */
export async function resolveSeniorId(): Promise<string> {
  const stored = localStorage.getItem('memoria_senior_id');
  if (stored) return stored;

  const { data } = await api.get('/seniors/');
  const list = Array.isArray(data) ? data : data.items ?? data.results ?? [];
  if (list.length > 0) {
    const id = list[0].id;
    localStorage.setItem('memoria_senior_id', id);
    return id;
  }
  throw new Error('Aucun senior trouvé.');
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (payload: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    gdpr_consent: boolean;
  }) => api.post('/auth/register', payload),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),

  me: () => api.get('/auth/me'),
};

// ---------------------------------------------------------------------------
// Seniors
// ---------------------------------------------------------------------------
export const seniorsService = {
  list: () => api.get('/seniors/'),

  get: (id: string) => api.get(`/seniors/${id}`),

  create: (data: {
    first_name: string;
    last_name: string;
    birth_date: string;
    birth_place?: string;
  }) => api.post('/seniors/', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/seniors/${id}`, data),
};

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------
export const sessionsService = {
  start: (seniorId: string) =>
    api.post('/sessions/start', { senior_id: seniorId }),

  sendMessage: (sessionId: string, text: string) =>
    api.post(`/sessions/${sessionId}/message`, { text }),

  end: (sessionId: string) => api.post(`/sessions/${sessionId}/end`),

  get: (sessionId: string) => api.get(`/sessions/${sessionId}`),

  /**
   * Raccourci utilisé par le DashboardPage : récupère la dernière session
   * en démarrant une requête sessions/start n'est pas adapté, on utilise
   * GET /sessions/{id} après avoir trouvé l'id.  Comme le backend ne fournit
   * pas de route « latest », on simule via GET /seniors/{id} qui renvoie
   * souvent last_session, ou on renvoie null.
   */
  latest: (seniorId: string) =>
    api.get(`/seniors/${seniorId}`).then((res) => {
      // Le backend renvoie le détail du senior ; on extrait last_session
      const senior = res.data;
      if (senior.last_session) {
        return { data: senior.last_session };
      }
      // Pas de dernière session disponible
      return { data: null };
    }),
};

// ---------------------------------------------------------------------------
// Memories
// ---------------------------------------------------------------------------
export interface MemoryFilters {
  theme?: string;
  search?: string;
  page?: number;
  per_page?: number;
  period?: string;
}

export const memoriesService = {
  list: (seniorId: string, filters?: MemoryFilters) => {
    const params: Record<string, unknown> = { senior_id: seniorId };
    if (filters?.theme) params.theme_id = filters.theme;
    if (filters?.period) params.period = filters.period;
    if (filters?.search) params.search = filters.search;
    // Le backend utilise skip/limit
    const page = filters?.page ?? 1;
    const perPage = filters?.per_page ?? 20;
    params.skip = (page - 1) * perPage;
    params.limit = perPage;
    return api.get('/memories/', { params });
  },

  get: (memoryId: string) => api.get(`/memories/${memoryId}`),

  themes: () => api.get('/memories/themes/'),
};

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------
export const alertsService = {
  list: (seniorId: string, unreadOnly?: boolean) => {
    const params: Record<string, unknown> = { senior_id: seniorId };
    if (unreadOnly) params.unread_only = true;
    return api.get('/alerts/', { params });
  },

  markRead: (_seniorId: string, alertId: string) =>
    api.put(`/alerts/${alertId}/read`),

  /** Compteur d'alertes non lues (récupère la liste et compte) */
  unreadCount: (seniorId: string) =>
    api
      .get('/alerts/', {
        params: { senior_id: seniorId, unread_only: true, limit: 100 },
      })
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : [];
        return { data: { count: items.length } };
      }),
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
  list: (seniorId: string, skip = 0, limit = 20) =>
    api.get('/gazettes/', {
      params: { senior_id: seniorId, skip, limit },
    }),

  get: (gazetteId: string) => api.get(`/gazettes/${gazetteId}`),

  /** Télécharge le PDF — le backend redirige vers l'URL du fichier */
  download: (_seniorId: string, gazetteId: string) =>
    api.get(`/gazettes/${gazetteId}/pdf`, { responseType: 'blob' }),
};

// ---------------------------------------------------------------------------
// GDPR
// ---------------------------------------------------------------------------
export const gdprService = {
  /** Exporte toutes les données de l'utilisateur (JSON) */
  exportData: () => api.get('/gdpr/export'),

  /** Supprime le compte et toutes les données associées */
  deleteAccount: () => api.delete('/gdpr/delete-account'),
};

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------
export const questionsService = {
  next: (seniorId: string, theme?: string) => {
    const params: Record<string, unknown> = { senior_id: seniorId };
    if (theme) params.theme = theme;
    return api.get('/questions/next', { params });
  },
};

// ---------------------------------------------------------------------------
// Settings / profile helpers
// ---------------------------------------------------------------------------
export const settingsService = {
  getProfile: (seniorId: string) => api.get(`/seniors/${seniorId}`),

  updateProfile: (seniorId: string, data: Record<string, unknown>) =>
    api.put(`/seniors/${seniorId}`, data),

  getSchedule: (seniorId: string) =>
    api.get(`/seniors/${seniorId}`).then((res) => ({
      data: res.data.schedule ?? { days: [], time: '10:00', duration_minutes: 30 },
    })),

  updateSchedule: (seniorId: string, data: Record<string, unknown>) =>
    api.put(`/seniors/${seniorId}`, { schedule: data }),

  getNotificationPrefs: () =>
    api.get('/auth/me').then((res) => ({
      data: res.data.notification_preferences ?? {
        email_alerts: true,
        email_gazette: true,
        push_enabled: false,
      },
    })),

  updateNotificationPrefs: (data: Record<string, unknown>) =>
    api.get('/auth/me').then((meRes) => {
      const userId = meRes.data.id;
      // On met à jour via le endpoint utilisateur si disponible,
      // sinon on tente un PUT sur /auth/me
      return api.put('/auth/me', {
        ...meRes.data,
        notification_preferences: data,
        id: userId,
      });
    }),

  getFamilyMembers: (seniorId: string) =>
    api.get(`/seniors/${seniorId}`).then((res) => ({
      data: res.data.family_members ?? [],
    })),
};

export default api;
