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
    // 즉시 반환 — 서버 검증은 백그라운드로
    api.getUser(existing.userId).catch((e) => {
      // 네트워크 오류면 무시 (오프라인 OK)
      if (e instanceof NetworkError) return;
      // 404 등 — 사용자 사라짐 → localStorage 제거 (다음 새로고침 때 재생성)
      localStorage.removeItem('coursepick.session');
    });
    return existing;
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

/**
 * 결과까지 성공적으로 나왔을 때 localStorage 에 커플 ID/코드를 commit.
 * 그 전엔 아무 것도 저장하지 않아 Solo Mode 가 유지됨.
 */
export function commitCouple(coupleId: number, inviteCode: string): LocalSession | null {
  const s = load();
  if (!s) return null;
  if (s.coupleId === coupleId) return s; // already committed
  const next = { ...s, coupleId, inviteCode };
  save(next);
  return next;
}

/**
 * 백엔드에 커플을 join 시키되 localStorage 는 건드리지 않는다.
 * 결과 단계에서 commitCouple() 로 따로 커밋.
 */
export async function transientJoinCouple(inviteCode: string, userId: number) {
  return await api.joinCouple(inviteCode, userId);
}

export function clearCouple(): LocalSession | null {
  const s = load();
  if (!s) return null;
  const next = { ...s, coupleId: null, inviteCode: null };
  save(next);
  return next;
}
