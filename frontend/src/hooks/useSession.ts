import { useEffect, useState } from 'react';
import { api, NetworkError } from '../api';
import { load, randomNickname, save, type LocalSession } from '../session';

export function useSession() {
  // 1) localStorage 에서 즉시 로드 (첫 렌더부터 표시)
  const [session, setSession] = useState<LocalSession | null>(() => load());
  const [loading, setLoading] = useState(false);

  // 2) 마운트 시 서버에 검증. 404면 자동 재생성, 네트워크 오류면 그냥 유지.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const cur = load();
        if (cur) {
          try {
            await api.getUser(cur.userId);
            if (!cancelled) setSession(cur);
            return;
          } catch (e) {
            if (e instanceof NetworkError) {
              if (!cancelled) setSession(cur);
              return;
            }
            const msg = String(e);
            if (!msg.includes('404')) {
              if (!cancelled) setSession(cur);
              return;
            }
            // 404 — DB 리셋되었거나 사용자 삭제됨 → 새로 만들기
            localStorage.removeItem('coursepick.session');
          }
        }

        // 새 사용자 생성
        const user = await api.createUser(randomNickname());
        const fresh: LocalSession = {
          userId: user.id,
          nickname: user.nickname,
          coupleId: null,
          inviteCode: null,
        };
        save(fresh);
        if (!cancelled) setSession(fresh);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { session, setSession, loading };
}
