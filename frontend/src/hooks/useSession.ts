import { useEffect, useState } from 'react';
import { ensureUser, load, type LocalSession } from '../session';

export function useSession() {
  // 초기값을 localStorage 에서 동기적으로 로드 → 첫 렌더부터 표시 가능
  const [session, setSession] = useState<LocalSession | null>(() => load());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) return; // 이미 있으면 ensureUser 안 불러도 됨 (검증은 ensureUser 내부에서 background)
    let cancelled = false;
    setLoading(true);
    ensureUser()
      .then((s) => { if (!cancelled) setSession(s); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [session]);

  return { session, setSession, loading };
}
