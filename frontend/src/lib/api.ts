import type {
  LoginPayload,
  LoginResponse,
  MeResponse,
  ChangePasswordPayload,
  CreateSignalPayload,
  UpdateSignalPayload,
  SignalStats,
  Signal,
  QueueHistory,
  SimulationStatus,
  PaginatedResponse,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

let authToken: string | null = null;

async function fetchWithHandler<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string>) || {}),
  };

  const token =
    authToken || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (
      response.status === 401 &&
      typeof window !== 'undefined' &&
      !url.includes('/api/auth/login') &&
      !url.includes('/api/auth/me')
    ) {
      // Token expired — clear auth state but let ProtectedRoute handle the redirect
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    const errBody = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errBody.error || 'API Error');
  }
  return response.json() as Promise<T>;
}

export const api = {
  // Auth internals
  setToken: (token: string | null) => {
    authToken = token;
  },
  getToken: () => authToken,
  getWsAuthUrl: () => `${API_BASE}`, // We attach the token during socket init

  // Auth
  login: (data: LoginPayload) =>
    fetchWithHandler<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMe: () => fetchWithHandler<MeResponse>('/api/auth/me'),
  changePassword: (data: ChangePasswordPayload) =>
    fetchWithHandler<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Signals
  getSignals: () => fetchWithHandler<PaginatedResponse<Signal>>('/api/signals'),
  createSignal: (data: CreateSignalPayload) =>
    fetchWithHandler<Signal>('/api/signals', { method: 'POST', body: JSON.stringify(data) }),
  updateSignal: (id: number, data: UpdateSignalPayload) =>
    fetchWithHandler<Signal>(`/api/signals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getSignalStats: (id: number) => fetchWithHandler<SignalStats>(`/api/signals/${id}/stats`),
  deleteSignal: (id: number) =>
    fetchWithHandler<{ message: string }>(`/api/signals/${id}`, { method: 'DELETE' }),

  // Simulation
  startSimulation: () =>
    fetchWithHandler<{ message: string; status: SimulationStatus }>('/api/simulation/start', {
      method: 'POST',
    }),
  stopSimulation: () =>
    fetchWithHandler<{ message: string; status: SimulationStatus }>('/api/simulation/stop', {
      method: 'POST',
    }),
  resetSimulation: () =>
    fetchWithHandler<{ message: string; status: SimulationStatus }>('/api/simulation/reset', {
      method: 'POST',
    }),
  getSimStatus: () => fetchWithHandler<SimulationStatus>('/api/simulation/status'),
  setMode: (mode: 'MANUAL' | 'ADAPTIVE') =>
    fetchWithHandler<{ message: string; status: SimulationStatus }>('/api/simulation/mode', {
      method: 'POST',
      body: JSON.stringify({ mode }),
    }),
  setSpeed: (multiplier: number) =>
    fetchWithHandler<{ message: string; status: SimulationStatus }>('/api/simulation/speed', {
      method: 'POST',
      body: JSON.stringify({ multiplier }),
    }),
  setArrivalRate: (lambda: number) =>
    fetchWithHandler<{ message: string }>('/api/simulation/arrival-rate', {
      method: 'POST',
      body: JSON.stringify({ lambda }),
    }),
  setAdaptiveThreshold: (threshold: number) =>
    fetchWithHandler<{ message: string; status: SimulationStatus }>(
      '/api/simulation/adaptive-threshold',
      { method: 'POST', body: JSON.stringify({ threshold }) }
    ),

  // History
  getHistory: (signalId?: number, limit = 100) =>
    fetchWithHandler<PaginatedResponse<QueueHistory>>(
      `/api/history?limit=${limit}${signalId ? `&signal_id=${signalId}` : ''}`
    ),

  // Analytics
  getAnalyticsSummary: () => fetchWithHandler<unknown>('/api/analytics/summary'),
};
