import { api } from './api';

const KEY = 'coursepick.session';

export interface LocalSession {
  userId: number;
  nickname: string;
  coupleId: number | null;
  inviteCode: string | null; // 내가 만든 커플의 코드 (있으면 공유)
}

export function load(): LocalSession | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as LocalSession; } catch { return null; }
}

export function save(s: LocalSession) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export async function ensureUser(defaultNickname = '게스트'): Promise<LocalSession> {
  const existing = load();
  if (existing) return existing;
  const user = await api.createUser(defaultNickname);
  const s: LocalSession = {
    userId: user.id, nickname: user.nickname,
    coupleId: null, inviteCode: null,
  };
  save(s);
  return s;
}

export async function rename(nickname: string): Promise<LocalSession> {
  const s = load();
  if (!s) throw new Error('no session');
  const user = await api.updateUser(s.userId, nickname);
  const next = { ...s, nickname: user.nickname };
  save(next);
  return next;
}

export async function createCoupleRoom(): Promise<LocalSession> {
  const s = load();
  if (!s) throw new Error('no session');
  const couple = await api.createCouple(s.userId);
  const next = { ...s, coupleId: couple.id, inviteCode: couple.invite_code };
  save(next);
  return next;
}

export async function joinCoupleRoom(code: string): Promise<LocalSession> {
  const s = load();
  if (!s) throw new Error('no session');
  const couple = await api.joinCouple(code, s.userId);
  const next = { ...s, coupleId: couple.id, inviteCode: couple.invite_code };
  save(next);
  return next;
}

export function clearCouple(): LocalSession | null {
  const s = load();
  if (!s) return null;
  const next = { ...s, coupleId: null, inviteCode: null };
  save(next);
  return next;
}
