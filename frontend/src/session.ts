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

export function randomNickname(length = 6): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // confusables(I,O) 제외
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

async function createFreshSession(nickname: string): Promise<LocalSession> {
  const user = await api.createUser(nickname);
  const s: LocalSession = {
    userId: user.id, nickname: user.nickname,
    coupleId: null, inviteCode: null,
  };
  save(s);
  return s;
}

export async function ensureUser(defaultNickname?: string): Promise<LocalSession> {
  const existing = load();
  if (existing) {
    // localStorage의 user_id가 서버에 실제 존재하는지 검증 (DB 리셋 대응)
    try {
      await api.getUser(existing.userId);
      return existing;
    } catch {
      localStorage.removeItem('coursepick.session');
      // fall through → 새로 생성
    }
  }
  return createFreshSession(defaultNickname ?? randomNickname());
}

export async function rename(nickname: string): Promise<LocalSession> {
  const s = load();
  if (!s) return createFreshSession(nickname);
  try {
    const user = await api.updateUser(s.userId, nickname);
    const next = { ...s, nickname: user.nickname };
    save(next);
    return next;
  } catch (e) {
    // 404: 서버에 사용자 없음 → 새로 생성
    if (String(e).includes('404')) return createFreshSession(nickname);
    throw e;
  }
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
