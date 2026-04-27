import { api, NetworkError } from './api';

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
    try {
      await api.getUser(existing.userId);
      return existing;
    } catch (e) {
      // 네트워크 오류면 기존 세션 유지 (백엔드가 잠깐 죽었을 때 앱이 안 죽게)
      if (e instanceof NetworkError) return existing;
      // 404 등 서버가 응답한 오류 → 사용자 사라짐 → 새로 만듦
      localStorage.removeItem('coursepick.session');
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
