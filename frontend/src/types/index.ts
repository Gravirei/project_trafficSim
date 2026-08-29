export interface Signal {
  id: number;
  name: string;
  current_state: 'GREEN' | 'YELLOW' | 'RED';
  green_duration: number;
  red_duration: number;
  yellow_duration: number;
}

export interface TickPayload {
  tick: number;
  signals: SignalTick[];
  mode: 'MANUAL' | 'ADAPTIVE';
  adaptiveAction?: string | null;
}

export interface SignalTick {
  signalId: number;
  name: string;
  state: 'GREEN' | 'YELLOW' | 'RED';
  timeRemaining: number;
  queueLength: number;
  theoreticalLq: number;
  avgWaitTime: number;
  utilization: number;
  arrivalRate: number;
}

export interface SimulationStatus {
  running: boolean;
  currentTick: number;
  mode: 'MANUAL' | 'ADAPTIVE';
  signalCount: number;
  speedMultiplier: number;
  arrivalRate: number;
  adaptiveThreshold: number;
}

export interface QueueHistory {
  id: number;
  signal_id: number;
  timestamp: string;
  queue_length: number;
  avg_wait_time: number;
  utilization: number;
  arrival_rate: number;
}

// ---------- API payload & response types ----------
// These mirror the shapes returned by the backend REST endpoints. Keep them in
// sync with the Zod schemas in `backend/src/routes/*.ts`.

/** Body for `POST /api/auth/login`. */
export interface LoginPayload {
  username: string;
  email: string;
  password: string;
}

/** Authenticated user, as embedded in the login response and `/api/auth/me`. */
export interface AuthUser {
  id: number;
  username: string;
  role: 'ADMIN' | 'VIEWER';
}

/** Response from `POST /api/auth/login`. */
export interface LoginResponse {
  token: string;
  user: AuthUser;
}

/** Response from `GET /api/auth/me`. */
export interface MeResponse {
  user: AuthUser;
}

/** Body for `POST /api/auth/change-password` (admin-only). */
export interface ChangePasswordPayload {
  targetUserId: number;
  newPassword: string;
}

/** Body for `POST /api/signals`. */
export interface CreateSignalPayload {
  name: string;
  green_duration?: number;
  red_duration?: number;
  yellow_duration?: number;
}

/** Body for `PUT /api/signals/:id`. All fields are optional partials. */
export interface UpdateSignalPayload {
  name?: string;
  green_duration?: number;
  red_duration?: number;
  yellow_duration?: number;
}

/** Response from `GET /api/signals/:id/stats`. */
export interface SignalStats {
  signalId: number;
  name: string;
  state: 'GREEN' | 'YELLOW' | 'RED';
  queueLength: number;
  avgWaitTime: number;
  utilization: number;
  arrivalRate: number;
}

/** Wrapper used by `GET /api/signals` and `GET /api/history`. */
export interface PaginatedResponse<T> {
  data: T[];
  meta?: { limit: number; count: number };
}
