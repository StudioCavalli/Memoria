const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://memoria-production-aeec.up.railway.app/api';

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

async function refreshTokens(): Promise<string | null> {
  const refreshToken = localStorage.getItem('memoria_refresh');
  if (!refreshToken) return null;

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    localStorage.removeItem('memoria_token');
    localStorage.removeItem('memoria_refresh');
    window.location.href = '/login';
    return null;
  }

  const data = await res.json();
  localStorage.setItem('memoria_token', data.access_token);
  localStorage.setItem('memoria_refresh', data.refresh_token);
  return data.access_token;
}

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, unknown>,
  responseType?: 'blob',
): Promise<{ data: T }> {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const token = localStorage.getItem('memoria_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Auto-refresh on 401
  if (res.status === 401) {
    const newToken = await refreshTokens();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url.toString(), {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } else {
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
  }

  if (!res.ok) {
    throw new Error(`API Error ${res.status}: ${res.statusText}`);
  }

  if (responseType === 'blob') {
    return { data: (await res.blob()) as T };
  }

  const text = await res.text();
  return { data: text ? JSON.parse(text) : null };
}

const api = {
  get: <T = unknown>(path: string, opts?: { params?: Record<string, unknown>; responseType?: 'blob' }) =>
    request<T>('GET', path, undefined, opts?.params, opts?.responseType),
  post: <T = unknown>(path: string, body?: unknown) =>
    request<T>('POST', path, body),
  put: <T = unknown>(path: string, body?: unknown) =>
    request<T>('PUT', path, body),
  delete: <T = unknown>(path: string) =>
    request<T>('DELETE', path),
};

// ---------------------------------------------------------------------------
// Helpers – resolution du senior_id
// ---------------------------------------------------------------------------

export async function resolveSeniorId(): Promise<string> {
  const stored = localStorage.getItem('memoria_senior_id');
  if (stored) return stored;

  const { data } = await api.get<unknown[]>('/seniors/');
  const list = Array.isArray(data) ? data : (data as Record<string, unknown[]>).items ?? (data as Record<string, unknown[]>).results ?? [];
  if (list.length > 0) {
    const id = (list[0] as Record<string, unknown>).id as string;
    localStorage.setItem('memoria_senior_id', String(id));
    return String(id);
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

  latest: (seniorId: string) =>
    api.get<Record<string, unknown>>(`/seniors/${seniorId}`).then((res) => {
      const senior = res.data;
      if (senior.last_session) return { data: senior.last_session };
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

  unreadCount: (seniorId: string) =>
    api
      .get('/alerts/', { params: { senior_id: seniorId, unread_only: true, limit: 100 } })
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
    api.get('/gazettes/', { params: { senior_id: seniorId, skip, limit } }),

  get: (gazetteId: string) => api.get(`/gazettes/${gazetteId}`),

  download: (_seniorId: string, gazetteId: string) =>
    api.get(`/gazettes/${gazetteId}/pdf`, { responseType: 'blob' }),
};

// ---------------------------------------------------------------------------
// GDPR
// ---------------------------------------------------------------------------
export const gdprService = {
  exportData: () => api.get('/gdpr/export'),

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
    api.get<Record<string, unknown>>(`/seniors/${seniorId}`).then((res) => ({
      data: res.data.schedule ?? { days: [], time: '10:00', duration_minutes: 30 },
    })),

  updateSchedule: (seniorId: string, data: Record<string, unknown>) =>
    api.put(`/seniors/${seniorId}`, { schedule: data }),

  getNotificationPrefs: () =>
    api.get<Record<string, unknown>>('/auth/me').then((res) => ({
      data: res.data.notification_preferences ?? {
        email_alerts: true,
        email_gazette: true,
        push_enabled: false,
      },
    })),

  updateNotificationPrefs: (data: Record<string, unknown>) =>
    api.get<Record<string, unknown>>('/auth/me').then((meRes) => {
      return api.put('/auth/me', {
        ...meRes.data,
        notification_preferences: data,
      });
    }),

  getFamilyMembers: (seniorId: string) =>
    api.get<Record<string, unknown>>(`/seniors/${seniorId}`).then((res) => ({
      data: res.data.family_members ?? [],
    })),
};

export default api;
