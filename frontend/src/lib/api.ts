const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

let authToken: string | null = null;

async function fetchWithHandler(url: string, options?: RequestInit) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options?.headers as Record<string, string>) || {}),
    };

    const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined' && !url.includes('/api/auth/login') && !url.includes('/api/auth/me')) {
            // Token expired — clear auth state but let ProtectedRoute handle the redirect
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
        }
        const errBody = await response.json().catch(() => ({}));
        throw new ApiError(response.status, errBody.error || 'API Error');
    }
    return response.json();
}

export const api = {
    // Auth internals
    setToken: (token: string | null) => { authToken = token; },
    getToken: () => authToken,
    getWsAuthUrl: () => `${API_BASE}`, // We attach the token during socket init

    // Auth
    login: (data: any) => fetchWithHandler('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    getMe: () => fetchWithHandler('/api/auth/me'),
    changePassword: (data: any) => fetchWithHandler('/api/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),

    // Signals
    getSignals: () => fetchWithHandler('/api/signals'),
    createSignal: (data: any) => fetchWithHandler('/api/signals', { method: 'POST', body: JSON.stringify(data) }),
    updateSignal: (id: number, data: any) => fetchWithHandler(`/api/signals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getSignalStats: (id: number) => fetchWithHandler(`/api/signals/${id}/stats`),
    deleteSignal: (id: number) => fetchWithHandler(`/api/signals/${id}`, { method: 'DELETE' }),

    // Simulation
    startSimulation: () => fetchWithHandler('/api/simulation/start', { method: 'POST' }),
    stopSimulation: () => fetchWithHandler('/api/simulation/stop', { method: 'POST' }),
    resetSimulation: () => fetchWithHandler('/api/simulation/reset', { method: 'POST' }),
    getSimStatus: () => fetchWithHandler('/api/simulation/status'),
    setMode: (mode: 'MANUAL' | 'ADAPTIVE') => fetchWithHandler('/api/simulation/mode', { method: 'POST', body: JSON.stringify({ mode }) }),
    setSpeed: (multiplier: number) => fetchWithHandler('/api/simulation/speed', { method: 'POST', body: JSON.stringify({ multiplier }) }),
    setArrivalRate: (lambda: number) => fetchWithHandler('/api/simulation/arrival-rate', { method: 'POST', body: JSON.stringify({ lambda }) }),
    setAdaptiveThreshold: (threshold: number) => fetchWithHandler('/api/simulation/adaptive-threshold', { method: 'POST', body: JSON.stringify({ threshold }) }),

    // History
    getHistory: (signalId?: number, limit = 100) => 
        fetchWithHandler(`/api/history?limit=${limit}${signalId ? `&signal_id=${signalId}` : ''}`),

    // Analytics
    getAnalyticsSummary: () => fetchWithHandler('/api/analytics/summary'),
};
