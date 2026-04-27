// types
export type State = 'good' | 'normal' | 'tired';
export type Mood = 'calm' | 'excited' | 'focused';
export type Activity = 'low' | 'high';
export type Budget = 'low' | 'mid' | 'high';
export type TimeOfDay = 'brunch' | 'afternoon' | 'evening' | 'night';
export type PlacePref = 'indoor' | 'outdoor' | 'any';
export type Cuisine = 'korean' | 'western' | 'japanese' | 'asian' | 'any';

export interface Answers {
  state: State;
  mood: Mood;
  activity: Activity;
  budget: Budget;
  time?: TimeOfDay | null;
  place?: PlacePref | null;
  cuisine?: Cuisine | null;
}

export interface CourseStep { step: number; type: string; name: string; }
export interface RecommendResponse { course: CourseStep[]; reason: string; }

export interface User { id: number; nickname: string; created_at: string; }
export interface Couple {
  id: number;
  invite_code: string;
  user_a_id: number;
  user_b_id: number | null;
  started_at: string | null;
}

export interface SessionData {
  id: number;
  code: string;
  mode: 'solo' | 'couple';
  couple_id: number | null;
  a_user_id: number;
  b_user_id: number | null;
  a_answers: Answers;
  b_answers: Answers | null;
  result: RecommendResponse | null;
  ready: boolean;
  created_at: string;
}

export interface DateLog {
  id: number;
  couple_id: number;
  date: string;
  place_name: string;
  course: CourseStep[];
  photo_path: string | null;
  photo_url: string | null;
  a_user_id: number;
  b_user_id: number | null;
  a_rating: number | null;
  b_rating: number | null;
  completed: boolean;
  memo: string | null;
  session_id: number | null;
  created_at: string;
}
export interface TimelineGroup { year: number; month: number; logs: DateLog[]; }

// client
const BASE = (import.meta.env.VITE_API_BASE as string) ?? 'http://localhost:8000';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: isForm ? init?.headers : { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(() => '')}`);
  return res.json() as Promise<T>;
}

const json = <T,>(method: string) => (path: string, body?: unknown) =>
  req<T>(path, { method, body: body !== undefined ? JSON.stringify(body) : undefined });

// endpoints
export const api = {
  // users
  createUser: (nickname: string) => json<User>('POST')('/api/users', { nickname }),
  getUser: (id: number) => req<User>(`/api/users/${id}`),
  updateUser: (id: number, nickname: string) => json<User>('PATCH')(`/api/users/${id}`, { nickname }),

  // couples
  createCouple: (user_a_id: number) => json<Couple>('POST')('/api/couples', { user_a_id }),
  joinCouple: (invite_code: string, user_id: number) =>
    json<Couple>('POST')('/api/couples/join', { invite_code, user_id }),
  getCouple: (id: number) => req<Couple>(`/api/couples/${id}`),

  // sessions
  createSession: (body: {
    mode: 'solo' | 'couple';
    user_id: number;
    couple_id?: number | null;
    answers: Answers;
  }) => json<SessionData>('POST')('/api/sessions', body),
  joinSession: (code: string, body: { user_id: number; answers: Answers }) =>
    json<SessionData>('POST')(`/api/sessions/${code}/join`, body),
  getSession: (code: string) => req<SessionData>(`/api/sessions/${code}`),

  // logs
  listLogs: (params: { couple_id?: number; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.couple_id != null) q.set('couple_id', String(params.couple_id));
    if (params.limit != null) q.set('limit', String(params.limit));
    return req<DateLog[]>(`/api/logs${q.toString() ? `?${q}` : ''}`);
  },
  getLog: (id: number) => req<DateLog>(`/api/logs/${id}`),
  createLog: (form: FormData) => req<DateLog>('/api/logs', { method: 'POST', body: form }),
  patchLog: (id: number, body: Partial<Pick<DateLog, 'place_name' | 'a_rating' | 'b_rating' | 'completed' | 'memo'>>) =>
    json<DateLog>('PATCH')(`/api/logs/${id}`, body),
  deleteLog: (id: number) => json<{ ok: boolean }>('DELETE')(`/api/logs/${id}`),

  getTimeline: (couple_id?: number) =>
    req<TimelineGroup[]>(`/api/timeline${couple_id != null ? `?couple_id=${couple_id}` : ''}`),
};
